import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Dashboard Stats API — unified "Command Center" KPIs
 *
 * GET /api/dashboard/stats              — danes (default)
 * GET /api/dashboard/stats?range=week   — zadnjih 7 dni
 * GET /api/dashboard/stats?range=month  — zadnjih 30 dni
 *
 * Vrne unified KPIs iz vseh sistemov v 1 klicu:
 * - Sales: revenue, orders, avgCheck, byHour, byChannel, topItems
 * - Tables: occupancy, avgTime, turnover
 * - Staff: active, onShift, laborCost, laborPct
 * - Reservations: today, upcoming, noShow rate
 * - Inventory: lowStock, outOfStock, totalValue
 * - Customers: new, active, tierBreakdown
 * - Payments: byMethod, successRate
 * - System: alerts, pendingTasks, openSessions
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'today'

    const now = new Date()
    let from: Date
    if (range === 'week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (range === 'month') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // ===== PARALLEL QUERIES =====
    const [
      // Sales
      paidOrders, allOrders,
      // Tables
      tables,
      // Staff
      activeStaff, shifts,
      // Reservations
      reservations,
      // Inventory
      inventoryItems,
      // Customers
      customers,
      // Payments
      payments,
      // Tips
      tips,
      // Cash drawer
      cashDrawer,
      // Notifications
      pendingNotifications,
      // Print jobs
      pendingPrintJobs,
      // KDS
      kdsOrders,
    ] = await Promise.all([
      db.order.findMany({ where: { status: 'paid', paidAt: { gte: from, lte: now } }, include: { items: true } }),
      db.order.findMany({ where: { createdAt: { gte: from, lte: now } } }),
      db.table.findMany({ where: { active: true } }),
      db.staff.count({ where: { active: true } }),
      db.shift.findMany({ where: { date: { gte: from, lte: now }, status: { in: ['completed', 'active'] } }, include: { staff: true } }),
      db.reservation.findMany({ where: { date: { gte: from, lte: now } } }),
      db.inventoryItem.findMany({ where: { active: true } }),
      db.customer.findMany({ where: { active: true } }),
      db.payment.findMany({ where: { createdAt: { gte: from, lte: now } } }),
      db.tipDistribution.findMany({ where: { date: { gte: from, lte: now } } }),
      db.cashDrawerSession.findFirst({ where: { status: 'open' }, orderBy: { openedAt: 'desc' } }),
      db.notification.count({ where: { status: 'pending' } }),
      db.printJob.count({ where: { status: 'pending' } }),
      db.order.findMany({ where: { status: { in: ['sent', 'preparing', 'ready'] } }, include: { items: true } }),
    ])

    // ===== SALES =====
    const revenue = paidOrders.reduce((s, o) => s + o.total, 0)
    const tips_total = paidOrders.reduce((s, o) => s + o.tip, 0)
    const avgCheck = paidOrders.length > 0 ? revenue / paidOrders.length : 0

    // Top items
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
    for (const o of paidOrders) {
      for (const i of o.items) {
        if (!itemMap[i.itemName]) itemMap[i.itemName] = { name: i.itemName, qty: 0, revenue: 0 }
        itemMap[i.itemName].qty += i.qty
        itemMap[i.itemName].revenue += i.totalPrice
      }
    }
    const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5)

    // By channel
    const byChannel: Record<string, number> = {}
    for (const o of paidOrders) {
      byChannel[o.channel] = (byChannel[o.channel] || 0) + o.total
    }

    // By hour
    const byHour: number[] = new Array(24).fill(0)
    for (const o of paidOrders) {
      byHour[new Date(o.createdAt).getHours()] += o.total
    }

    // ===== TABLES =====
    const occupiedTables = tables.filter(t => t.status === 'occupied').length
    const freeTables = tables.filter(t => t.status === 'free').length
    const reservedTables = tables.filter(t => t.status === 'reserved').length
    const occupancyRate = tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0

    // ===== STAFF =====
    let totalHours = 0
    let laborCost = 0
    for (const s of shifts) {
      if (s.endTime) {
        const hours = (s.endTime.getTime() - s.startTime.getTime()) / 3600000
        const netHours = Math.max(0, hours - s.breakMinutes / 60)
        totalHours += netHours
        laborCost += netHours * s.staff.hourlyRate
      }
    }
    const laborPct = revenue > 0 ? Math.round((laborCost / revenue) * 10000) / 100 : 0

    // ===== RESERVATIONS =====
    const confirmedRes = reservations.filter(r => r.status === 'confirmed').length
    const seatedRes = reservations.filter(r => r.status === 'seated').length
    const noShowRes = reservations.filter(r => r.status === 'no_show').length
    const totalGuests = reservations.reduce((s, r) => s + r.guests, 0)
    const noShowRate = reservations.length > 0 ? Math.round((noShowRes / reservations.length) * 10000) / 100 : 0

    // ===== INVENTORY =====
    const lowStockItems = inventoryItems.filter(i => i.stock <= i.minStock && i.minStock > 0)
    const outOfStockItems = inventoryItems.filter(i => i.stock <= 0)
    const totalInventoryValue = inventoryItems.reduce((s, i) => s + i.stock * i.purchasePrice, 0)

    // ===== CUSTOMERS =====
    const byTier = {
      bronze: customers.filter(c => c.tier === 'bronze').length,
      silver: customers.filter(c => c.tier === 'silver').length,
      gold: customers.filter(c => c.tier === 'gold').length,
    }
    const totalPoints = customers.reduce((s, c) => s + c.points, 0)

    // ===== PAYMENTS =====
    const succeededPayments = payments.filter(p => p.status === 'succeeded')
    const failedPayments = payments.filter(p => p.status === 'failed')
    const successRate = payments.length > 0 ? Math.round((succeededPayments.length / payments.length) * 10000) / 100 : 0
    const byPaymentMethod: Record<string, { count: number; amount: number }> = {}
    for (const p of succeededPayments) {
      if (!byPaymentMethod[p.method]) byPaymentMethod[p.method] = { count: 0, amount: 0 }
      byPaymentMethod[p.method].count++
      byPaymentMethod[p.method].amount += p.total
    }

    // ===== TIPS =====
    const totalTips = tips.reduce((s, t) => s + t.totalTips, 0)
    const paidTips = tips.filter(t => t.status === 'paid').length
    const pendingTips = tips.filter(t => t.status === 'pending').length

    // ===== KDS =====
    const kdsNew = kdsOrders.flatMap(o => o.items).filter(i => i.status === 'new').length
    const kdsPreparing = kdsOrders.flatMap(o => o.items).filter(i => i.status === 'preparing').length
    const kdsReady = kdsOrders.flatMap(o => o.items).filter(i => i.status === 'ready').length

    // ===== ALERTS =====
    const alerts: { severity: string; message: string }[] = []
    if (outOfStockItems.length > 0) alerts.push({ severity: 'critical', message: `${outOfStockItems.length} artiklov brez zaloge` })
    if (lowStockItems.length > 0) alerts.push({ severity: 'warning', message: `${lowStockItems.length} artiklov z nizko zalogo` })
    if (laborPct > 30) alerts.push({ severity: 'warning', message: `Labor stroški ${laborPct}% (nad 30%)` })
    if (noShowRate > 15) alerts.push({ severity: 'warning', message: `No-show rate ${noShowRate}%` })
    if (pendingNotifications > 0) alerts.push({ severity: 'info', message: `${pendingNotifications} čakajočih obvestil` })
    if (pendingPrintJobs > 0) alerts.push({ severity: 'info', message: `${pendingPrintJobs} čakajočih print jobov` })

    return NextResponse.json({
      ok: true,
      range,
      from: from.toISOString(),
      to: now.toISOString(),
      generatedAt: now.toISOString(),

      sales: {
        revenue: Math.round(revenue * 100) / 100,
        orders: paidOrders.length,
        avgCheck: Math.round(avgCheck * 100) / 100,
        tips: Math.round(tips_total * 100) / 100,
        canceledOrders: allOrders.filter(o => o.status === 'canceled').length,
        topItems,
        byChannel,
        byHour,
      },

      tables: {
        total: tables.length,
        occupied: occupiedTables,
        free: freeTables,
        reserved: reservedTables,
        occupancyRate,
      },

      staff: {
        active: activeStaff,
        onShift: shifts.filter(s => s.status === 'active').length,
        totalHours: Math.round(totalHours * 10) / 10,
        laborCost: Math.round(laborCost * 100) / 100,
        laborPct,
      },

      reservations: {
        total: reservations.length,
        confirmed: confirmedRes,
        seated: seatedRes,
        noShow: noShowRes,
        totalGuests,
        noShowRate,
      },

      inventory: {
        totalItems: inventoryItems.length,
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        totalValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockItems: lowStockItems.slice(0, 5).map(i => ({ name: i.name, stock: i.stock, minStock: i.minStock })),
      },

      customers: {
        total: customers.length,
        byTier,
        totalPoints,
        avgPoints: customers.length > 0 ? Math.round(totalPoints / customers.length) : 0,
      },

      payments: {
        total: payments.length,
        succeeded: succeededPayments.length,
        failed: failedPayments.length,
        successRate,
        byMethod: Object.entries(byPaymentMethod).map(([method, v]) => ({
          method,
          count: v.count,
          amount: Math.round(v.amount * 100) / 100,
        })),
      },

      tips: {
        total: Math.round(totalTips * 100) / 100,
        distributions: tips.length,
        paid: paidTips,
        pending: pendingTips,
      },

      kds: {
        activeOrders: kdsOrders.length,
        newItems: kdsNew,
        preparingItems: kdsPreparing,
        readyItems: kdsReady,
      },

      cashDrawer: cashDrawer ? {
        sessionNumber: cashDrawer.sessionNumber,
        openedBy: cashDrawer.openedBy,
        openedAt: cashDrawer.openedAt.toISOString(),
        expectedCash: cashDrawer.expectedCash,
      } : null,

      alerts,
      pendingTasks: {
        notifications: pendingNotifications,
        printJobs: pendingPrintJobs,
        kdsItems: kdsNew + kdsPreparing + kdsReady,
        pendingTips,
        lowStock: lowStockItems.length,
      },
    })
  } catch (error) {
    console.error('[dashboard/stats] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
