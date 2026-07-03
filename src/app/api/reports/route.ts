import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Reports API — agregacija vseh POS podatkov v business intelligence
 *
 * GET /api/reports                    — daily summary (danes)
 * GET /api/reports?range=week         — weekly summary (zadnjih 7 dni)
 * GET /api/reports?range=month        — monthly summary (zadnjih 30 dni)
 * GET /api/reports?from=X&to=Y        — custom range (ISO dates)
 * GET /api/reports?type=sales         — samo prodaja (top items, channels)
 * GET /api/reports?type=labor         — samo labor (shifts, cost, attendance)
 * GET /api/reports?type=inventory     — samo inventory (valuation, low stock)
 * GET /api/reports?type=tables        — samo tables (utilization, turnover)
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'today' // today | week | month | custom
    const type = searchParams.get('type') || 'all' // all | sales | labor | inventory | tables
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Izračunaj datumski razpon
    const now = new Date()
    let from: Date
    let to: Date = now

    if (range === 'custom' && fromParam && toParam) {
      from = new Date(fromParam)
      to = new Date(toParam)
    } else if (range === 'week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (range === 'month') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      // today
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    const report: Record<string, unknown> = { range, from: from.toISOString(), to: to.toISOString() }

    // ===== SALES REPORT =====
    if (type === 'all' || type === 'sales') {
      const orders = await db.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { in: ['paid', 'served', 'open', 'sent', 'preparing', 'ready'] },
        },
        include: { items: true },
      })

      const paidOrders = orders.filter(o => o.status === 'paid')
      const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0)
      const totalOrders = paidOrders.length
      const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const totalTax = paidOrders.reduce((s, o) => s + o.tax, 0)
      const totalSubtotal = paidOrders.reduce((s, o) => s + o.subtotal, 0)

      // Top items
      const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
      for (const order of paidOrders) {
        for (const item of order.items) {
          if (!itemMap[item.itemName]) {
            itemMap[item.itemName] = { name: item.itemName, qty: 0, revenue: 0 }
          }
          itemMap[item.itemName].qty += item.qty
          itemMap[item.itemName].revenue += item.totalPrice
        }
      }
      const topItems = Object.values(itemMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10)
        .map(i => ({ ...i, revenue: Math.round(i.revenue * 100) / 100 }))

      // Revenue by channel
      const channelMap: Record<string, { count: number; revenue: number }> = {}
      for (const order of paidOrders) {
        if (!channelMap[order.channel]) channelMap[order.channel] = { count: 0, revenue: 0 }
        channelMap[order.channel].count++
        channelMap[order.channel].revenue += order.total
      }
      const channelBreakdown = Object.entries(channelMap).map(([channel, v]) => ({
        channel,
        label: getChannelLabel(channel),
        count: v.count,
        revenue: Math.round(v.revenue * 100) / 100,
      }))

      // Payment methods
      const paymentMap: Record<string, { count: number; amount: number }> = {}
      for (const order of paidOrders) {
        const method = order.paymentMethod || 'unknown'
        if (!paymentMap[method]) paymentMap[method] = { count: 0, amount: 0 }
        paymentMap[method].count++
        paymentMap[method].amount += order.total
      }
      const paymentBreakdown = Object.entries(paymentMap).map(([method, v]) => ({
        method,
        label: getPaymentLabel(method),
        count: v.count,
        amount: Math.round(v.amount * 100) / 100,
      }))

      // Hourly distribution
      const hourlyMap: Record<number, number> = {}
      for (const order of paidOrders) {
        const hour = new Date(order.createdAt).getHours()
        hourlyMap[hour] = (hourlyMap[hour] || 0) + order.total
      }
      const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        revenue: Math.round((hourlyMap[h] || 0) * 100) / 100,
      }))

      report.sales = {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgCheck: Math.round(avgCheck * 100) / 100,
        totalSubtotal: Math.round(totalSubtotal * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        canceledOrders: orders.filter(o => o.status === 'canceled').length,
        topItems,
        channelBreakdown,
        paymentBreakdown,
        hourlyDistribution,
      }
    }

    // ===== LABOR REPORT =====
    if (type === 'all' || type === 'labor') {
      const shifts = await db.shift.findMany({
        where: { date: { gte: from, lte: to } },
        include: { staff: true },
      })

      let totalHours = 0
      let laborCost = 0
      const staffMap: Record<string, { name: string; role: string; hours: number; cost: number; shifts: number }> = {}

      for (const shift of shifts) {
        if (shift.endTime && shift.status === 'completed') {
          const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
          const netHours = Math.max(0, hours - shift.breakMinutes / 60)
          totalHours += netHours
          const cost = netHours * shift.staff.hourlyRate
          laborCost += cost

          const key = shift.staffId
          if (!staffMap[key]) {
            staffMap[key] = { name: `${shift.staff.firstName} ${shift.staff.lastName}`, role: shift.staff.role, hours: 0, cost: 0, shifts: 0 }
          }
          staffMap[key].hours += netHours
          staffMap[key].cost += cost
          staffMap[key].shifts++
        }
      }

      const staffPerformance = Object.values(staffMap)
        .map(s => ({ ...s, hours: Math.round(s.hours * 10) / 10, cost: Math.round(s.cost * 100) / 100 }))
        .sort((a, b) => b.cost - a.cost)

      // Pridobi revenue za labor % calc
      const paidOrders = await db.order.findMany({
        where: { status: 'paid', paidAt: { gte: from, lte: to } },
        select: { total: true },
      })
      const revenue = paidOrders.reduce((s, o) => s + o.total, 0)
      const laborPct = revenue > 0 ? Math.round((laborCost / revenue) * 10000) / 100 : 0

      report.labor = {
        totalShifts: shifts.length,
        completedShifts: shifts.filter(s => s.status === 'completed').length,
        totalHours: Math.round(totalHours * 10) / 10,
        laborCost: Math.round(laborCost * 100) / 100,
        laborPct,
        revenue,
        staffPerformance,
      }
    }

    // ===== INVENTORY REPORT =====
    if (type === 'all' || type === 'inventory') {
      const items = await db.inventoryItem.findMany({
        where: { active: true },
      })

      const totalValue = items.reduce((s, i) => s + (i.stock * i.purchasePrice), 0)
      const lowStockItems = items.filter(i => i.stock <= i.minStock && i.minStock > 0)
      const outOfStockItems = items.filter(i => i.stock <= 0)

      // Inventory transactions v obdobju
      const transactions = await db.inventoryTransaction.findMany({
        where: { createdAt: { gte: from, lte: to } },
      })

      const totalIn = transactions.filter(t => t.direction === 'in').reduce((s, t) => s + t.totalCost, 0)
      const totalOut = transactions.filter(t => t.direction === 'out').reduce((s, t) => s + t.totalCost, 0)

      report.inventory = {
        totalItems: items.length,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems: lowStockItems.slice(0, 10).map(i => ({
          name: i.name,
          stock: i.stock,
          minStock: i.minStock,
          unit: i.unit,
        })),
        transactions: {
          total: transactions.length,
          totalIn: Math.round(totalIn * 100) / 100,
          totalOut: Math.round(totalOut * 100) / 100,
          byType: transactions.reduce((acc, t) => {
            if (!acc[t.type]) acc[t.type] = { count: 0, value: 0 }
            acc[t.type].count++
            acc[t.type].value += t.totalCost
            return acc
          }, {} as Record<string, { count: number; value: number }>),
        },
      }
    }

    // ===== TABLES REPORT =====
    if (type === 'all' || type === 'tables') {
      const tables = await db.table.findMany({
        where: { active: true },
        include: {
          orders: {
            where: { createdAt: { gte: from, lte: to } },
            select: { id: true, total: true, status: true },
          },
        },
      })

      const totalTables = tables.length
      const occupiedTables = tables.filter(t => t.status === 'occupied').length
      const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

      const tableStats = tables.map(t => ({
        number: t.number,
        seats: t.seats,
        status: t.status,
        location: t.location,
        orders: t.orders.length,
        revenue: Math.round(t.orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0) * 100) / 100,
      })).sort((a, b) => b.revenue - a.revenue)

      report.tables = {
        total: totalTables,
        occupied: occupiedTables,
        free: tables.filter(t => t.status === 'free').length,
        reserved: tables.filter(t => t.status === 'reserved').length,
        occupancyRate,
        tableStats: tableStats.slice(0, 10),
      }
    }

    // ===== RESERVATIONS SUMMARY =====
    if (type === 'all') {
      const reservations = await db.reservation.findMany({
        where: { date: { gte: from, lte: to } },
      })

      report.reservations = {
        total: reservations.length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        seated: reservations.filter(r => r.status === 'seated').length,
        completed: reservations.filter(r => r.status === 'completed').length,
        canceled: reservations.filter(r => r.status === 'canceled').length,
        noShow: reservations.filter(r => r.status === 'no_show').length,
        totalGuests: reservations.reduce((s, r) => s + r.guests, 0),
      }
    }

    // ===== Z-REPORTS SUMMARY =====
    if (type === 'all') {
      const zReports = await db.zReport.findMany({
        where: { date: { gte: from, lte: to } },
      })

      report.zReports = {
        total: zReports.length,
        closed: zReports.filter(r => r.status === 'closed').length,
        totalRevenue: Math.round(zReports.reduce((s, r) => s + r.totalRevenue, 0) * 100) / 100,
        totalOrders: zReports.reduce((s, r) => s + r.totalOrders, 0),
      }
    }

    console.log(`[reports] ✓ Generirano: range=${range} type=${type}`)

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      ...report,
    })
  } catch (error) {
    console.error('[reports] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    dine_in: 'V restavraciji',
    takeaway: 'Za prevzem',
    delivery: 'Dostava',
    qr: 'QR naročilo',
  }
  return labels[channel] || channel
}

function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    card: 'Kartica',
    cash: 'Gotovina',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    gift_card: 'Darilna kartica',
    unknown: 'Neznano',
  }
  return labels[method] || method
}
