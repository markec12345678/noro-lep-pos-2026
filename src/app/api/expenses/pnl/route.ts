import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * P&L (Profit & Loss) API — celovit finančni izpavek
 *
 * GET /api/expenses/pnl              — trenutni mesec
 * GET /api/expenses/pnl?month=7&year=2026 — specifičen mesec
 * GET /api/expenses/pnl?from=2026-01-01&to=2026-12-31 — custom range
 *
 * Vrne:
 * - Revenue (od Orders/Payments)
 * - COGS (od InventoryTransactions + PurchaseOrders)
 * - Gross Profit (Revenue - COGS)
 * - Operating Expenses (od Expenses, razvrščene po kategorijah)
 * - Labor Cost (od Shifts)
 * - Net Profit (Gross Profit - OpEx - Labor)
 * - Margins (%)
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Date range
    let from: Date
    let to: Date
    const now = new Date()

    if (fromParam && toParam) {
      from = new Date(fromParam)
      to = new Date(toParam + 'T23:59:59')
    } else if (month && year) {
      from = new Date(parseInt(year), parseInt(month) - 1, 1)
      to = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
    } else {
      // Current month
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = now
    }

    // ===== REVENUE (od paid orders) =====
    const paidOrders = await db.order.findMany({
      where: { status: 'paid', paidAt: { gte: from, lte: to } },
      select: { subtotal: true, tax: true, tip: true, total: true, channel: true },
    })

    const revenue = paidOrders.reduce((s, o) => s + o.subtotal, 0)
    const revenueTax = paidOrders.reduce((s, o) => s + o.tax, 0)
    const tips = paidOrders.reduce((s, o) => s + o.tip, 0)
    const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0)

    // By channel
    const revenueByChannel: Record<string, number> = {}
    for (const o of paidOrders) {
      revenueByChannel[o.channel] = (revenueByChannel[o.channel] || 0) + o.subtotal
    }

    // ===== COGS (Cost of Goods Sold — od inventory transactions OUT) =====
    const inventoryOut = await db.inventoryTransaction.findMany({
      where: {
        direction: 'out',
        createdAt: { gte: from, lte: to },
        type: { in: ['order', 'waste', 'adjustment'] },
      },
      select: { totalCost: true, type: true },
    })

    const cogs = inventoryOut.filter(t => t.type === 'order').reduce((s, t) => s + t.totalCost, 0)
    const waste = inventoryOut.filter(t => t.type === 'waste').reduce((s, t) => s + t.totalCost, 0)
    const adjustments = inventoryOut.filter(t => t.type === 'adjustment').reduce((s, t) => s + t.totalCost, 0)
    const totalCogs = cogs + waste + adjustments

    // ===== GROSS PROFIT =====
    const grossProfit = revenue - totalCogs
    const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0

    // ===== LABOR COST (od shifts) =====
    const shifts = await db.shift.findMany({
      where: { date: { gte: from, lte: to }, status: { in: ['completed', 'active'] } },
      include: { staff: true },
    })

    let laborCost = 0
    let laborHours = 0
    for (const s of shifts) {
      const endTime = s.endTime || now
      const hours = (endTime.getTime() - s.startTime.getTime()) / 3600000
      const netHours = Math.max(0, hours - s.breakMinutes / 60)
      laborCost += netHours * s.staff.hourlyRate
      laborHours += netHours
    }

    // ===== OPERATING EXPENSES (od Expense model) =====
    const expenses = await db.expense.findMany({
      where: { expenseDate: { gte: from, lte: to }, status: { in: ['approved', 'paid'] } },
      include: { category: true },
    })

    const expensesByCategory: Record<string, { name: string; type: string; amount: number; total: number; count: number }> = {}
    let totalExpenses = 0
    let totalExpensesVat = 0

    for (const e of expenses) {
      const catName = e.categoryName
      if (!expensesByCategory[catName]) {
        expensesByCategory[catName] = {
          name: catName,
          type: e.category.type,
          amount: 0,
          total: 0,
          count: 0,
        }
      }
      expensesByCategory[catName].amount += e.amount
      expensesByCategory[catName].total += e.totalAmount
      expensesByCategory[catName].count++
      totalExpenses += e.amount
      totalExpensesVat += e.vatAmount
    }

    // ===== DELIVERY COMMISSIONS (od delivery orders) =====
    let deliveryCommissions = 0
    try {
      const deliveryStats = await db.order.aggregate({
        where: { channel: 'delivery', status: 'paid', paidAt: { gte: from, lte: to } },
        _sum: { total: true },
      })
      // Estimate 15% commission
      deliveryCommissions = Math.round((deliveryStats._sum.total || 0) * 0.15 * 100) / 100
    } catch {}

    // ===== PAYMENT FEES (estimate 1.5% card + 0.5% cash handling) =====
    const cardPayments = await db.payment.aggregate({
      where: { method: 'card', status: 'succeeded', createdAt: { gte: from, lte: to } },
      _sum: { total: true },
    })
    const paymentFees = Math.round((cardPayments._sum.total || 0) * 0.015 * 100) / 100

    // ===== TOTAL OPERATING COSTS =====
    const totalOpEx = totalExpenses + deliveryCommissions + paymentFees

    // ===== NET PROFIT =====
    const netProfit = grossProfit - laborCost - totalOpEx
    const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 10000) / 100 : 0
    const laborPct = revenue > 0 ? Math.round((laborCost / revenue) * 10000) / 100 : 0
    const opExPct = revenue > 0 ? Math.round((totalOpEx / revenue) * 10000) / 100 : 0

    // ===== PRIME COST (COGS + Labor) =====
    const primeCost = totalCogs + laborCost
    const primeCostPct = revenue > 0 ? Math.round((primeCost / revenue) * 10000) / 100 : 0

    return NextResponse.json({
      ok: true,
      period: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
      generatedAt: now.toISOString(),

      // ===== REVENUE =====
      revenue: {
        netRevenue: Math.round(revenue * 100) / 100,
        vat: Math.round(revenueTax * 100) / 100,
        tips: Math.round(tips * 100) / 100,
        totalWithVat: Math.round(totalRevenue * 100) / 100,
        orders: paidOrders.length,
        byChannel: Object.entries(revenueByChannel).map(([ch, amt]) => ({
          channel: ch,
          amount: Math.round(amt * 100) / 100,
        })),
      },

      // ===== COGS =====
      cogs: {
        foodCost: Math.round(cogs * 100) / 100,
        waste: Math.round(waste * 100) / 100,
        adjustments: Math.round(adjustments * 100) / 100,
        total: Math.round(totalCogs * 100) / 100,
        cogsPercentage: revenue > 0 ? Math.round((totalCogs / revenue) * 10000) / 100 : 0,
      },

      // ===== GROSS PROFIT =====
      grossProfit: {
        amount: Math.round(grossProfit * 100) / 100,
        margin: grossMargin,
      },

      // ===== LABOR =====
      labor: {
        cost: Math.round(laborCost * 100) / 100,
        hours: Math.round(laborHours * 10) / 10,
        percentage: laborPct,
        staffCount: shifts.length,
      },

      // ===== OPERATING EXPENSES =====
      operatingExpenses: {
        total: Math.round(totalExpenses * 100) / 100,
        vat: Math.round(totalExpensesVat * 100) / 100,
        totalWithVat: Math.round((totalExpenses + totalExpensesVat) * 100) / 100,
        count: expenses.length,
        byCategory: Object.values(expensesByCategory)
          .map(c => ({ ...c, amount: Math.round(c.amount * 100) / 100, total: Math.round(c.total * 100) / 100 }))
          .sort((a, b) => b.total - a.total),
        deliveryCommissions,
        paymentFees,
        totalOpEx: Math.round(totalOpEx * 100) / 100,
        opExPercentage: opExPct,
      },

      // ===== PRIME COST =====
      primeCost: {
        amount: Math.round(primeCost * 100) / 100,
        percentage: primeCostPct,
        // Industry benchmark: 55-60% is healthy
        benchmark: primeCostPct <= 60 ? 'healthy' : primeCostPct <= 65 ? 'warning' : 'critical',
      },

      // ===== NET PROFIT =====
      netProfit: {
        amount: Math.round(netProfit * 100) / 100,
        margin: netMargin,
        // Industry benchmark: 10-15% is good for restaurants
        benchmark: netMargin >= 15 ? 'excellent' : netMargin >= 10 ? 'good' : netMargin >= 5 ? 'fair' : 'poor',
      },

      // ===== SUMMARY =====
      summary: {
        revenue: Math.round(revenue * 100) / 100,
        cogs: Math.round(totalCogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        labor: Math.round(laborCost * 100) / 100,
        opex: Math.round(totalOpEx * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        grossMargin,
        netMargin,
        laborPct,
        primeCostPct,
      },
    })
  } catch (error) {
    console.error('[expenses/pnl] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
