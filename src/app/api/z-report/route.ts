import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Z-Report API — dnevno zaključevanje blagajne (FURS)
 *
 * GET   /api/z-report              — list reports (filter by date, status)
 * GET   /api/z-report?id=X         — single report
 * POST  /api/z-report              — generate daily Z-report from paid orders
 * PATCH /api/z-report              — close report (FURS EOR/ZOI)
 */

// VAT rates in Slovenia
const VAT_RATES = [
  { rate: 22, label: 'Splošna stopnja' },
  { rate: 9.5, label: 'Nižja stopnja' },
  { rate: 5, label: 'Posebej nižja stopnja' },
]

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (id) {
      const report = await db.zReport.findUnique({ where: { id } })
      if (!report) return NextResponse.json({ ok: false, error: 'Z-report ni najden' }, { status: 404 })

      const parsed = {
        ...report,
        vatBreakdown: JSON.parse(report.vatBreakdown),
        paymentBreakdown: JSON.parse(report.paymentBreakdown),
      }
      return NextResponse.json({ ok: true, report: parsed })
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.date = { gte: start, lte: end }
    }

    const reports = await db.zReport.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    })

    const parsed = reports.map(r => ({
      ...r,
      vatBreakdown: JSON.parse(r.vatBreakdown),
      paymentBreakdown: JSON.parse(r.paymentBreakdown),
    }))

    return NextResponse.json({ ok: true, count: reports.length, reports: parsed })
  } catch (error) {
    console.error('[z-report] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — generate daily Z-report from paid orders
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, cashier, location } = body

    if (!date) {
      return NextResponse.json({ ok: false, error: 'date je obvezen (YYYY-MM-DD)' }, { status: 400 })
    }

    // Preveri če že obstaja Z-report za ta datum
    const start = new Date(date + 'T00:00:00')
    const end = new Date(date + 'T23:59:59')
    const existing = await db.zReport.findFirst({
      where: { date: { gte: start, lte: end }, status: { in: ['open', 'closed'] } },
    })
    if (existing) {
      return NextResponse.json({
        ok: false,
        error: `Z-report za ${date} že obstaja: ${existing.reportNumber} (status: ${existing.status})`,
      }, { status: 409 })
    }

    // Pridobi vse paid orders za ta dan
    const orders = await db.order.findMany({
      where: {
        status: 'paid',
        paidAt: { gte: start, lte: end },
      },
      include: { items: true },
    })

    // Pridobi canceled orders (returns)
    const canceledOrders = await db.order.findMany({
      where: {
        status: 'canceled',
        updatedAt: { gte: start, lte: end },
      },
    })

    // Izračunaj totals
    let subtotal = 0
    let totalTax = 0
    let totalRevenue = 0

    // VAT breakdown
    const vatMap: Record<number, { base: number; vat: number; total: number }> = {}
    for (const vr of VAT_RATES) {
      vatMap[vr.rate] = { base: 0, vat: 0, total: 0 }
    }

    // Payment breakdown
    const paymentMap: Record<string, { count: number; amount: number }> = {}

    for (const order of orders) {
      subtotal += order.subtotal
      totalTax += order.tax
      totalRevenue += order.total

      // VAT per order item
      for (const item of order.items) {
        const rate = item.taxRate
        if (!vatMap[rate]) vatMap[rate] = { base: 0, vat: 0, total: 0 }
        vatMap[rate].base += item.totalPrice
        vatMap[rate].vat += item.totalPrice * (rate / 100)
        vatMap[rate].total += item.totalPrice * (1 + rate / 100)
      }

      // Payment method
      const method = order.paymentMethod || 'unknown'
      if (!paymentMap[method]) paymentMap[method] = { count: 0, amount: 0 }
      paymentMap[method].count++
      paymentMap[method].amount += order.total
    }

    // Build VAT breakdown array
    const vatBreakdown = Object.entries(vatMap)
      .filter(([, v]) => v.base > 0)
      .map(([rate, v]) => ({
        rate: parseFloat(rate),
        label: VAT_RATES.find(vr => vr.rate === parseFloat(rate))?.label || `${rate}%`,
        base: Math.round(v.base * 100) / 100,
        vat: Math.round(v.vat * 100) / 100,
        total: Math.round(v.total * 100) / 100,
      }))

    // Build payment breakdown array
    const paymentBreakdown = Object.entries(paymentMap).map(([method, v]) => ({
      method,
      label: getPaymentLabel(method),
      count: v.count,
      amount: Math.round(v.amount * 100) / 100,
    }))

    const avgCheck = orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0

    // Generiraj report number
    const count = await db.zReport.count()
    const reportNumber = `ZR-2026-${String(count + 1).padStart(4, '0')}`

    // Ustvari Z-report
    const report = await db.zReport.create({
      data: {
        reportNumber,
        date: start,
        cashier: cashier || null,
        location: location || null,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: orders.length,
        avgCheck,
        subtotal: Math.round(subtotal * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        vatBreakdown: JSON.stringify(vatBreakdown),
        paymentBreakdown: JSON.stringify(paymentBreakdown),
        returns: canceledOrders.length,
        returnsValue: Math.round(canceledOrders.reduce((s, o) => s + o.total, 0) * 100) / 100,
        status: 'open',
      },
    })

    console.log(`[z-report] ✓ ${reportNumber} generiran | ${orders.length} orders | €${totalRevenue.toFixed(2)} | ${vatBreakdown.length} DDV stopenj`)

    const parsed = {
      ...report,
      vatBreakdown,
      paymentBreakdown,
    }

    return NextResponse.json({
      ok: true,
      message: `Z-report ${reportNumber} generiran`,
      report: parsed,
    }, { status: 201 })
  } catch (error) {
    console.error('[z-report] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — close report (FURS EOR/ZOI)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, fursEOR, fursZOI } = body

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })
    }

    if (action === 'close') {
      const report = await db.zReport.update({
        where: { id },
        data: {
          status: 'closed',
          closedAt: new Date(),
          fursEOR: fursEOR || null,
          fursZOI: fursZOI || null,
        },
      })

      console.log(`[z-report] ✓ ${report.reportNumber} zaključen | EOR=${fursEOR || 'n/a'}`)

      return NextResponse.json({
        ok: true,
        message: `Z-report ${report.reportNumber} zaključen (FURS potrjen)`,
        report,
      })
    }

    if (action === 'archive') {
      const report = await db.zReport.update({
        where: { id },
        data: { status: 'archived' },
      })

      return NextResponse.json({
        ok: true,
        message: `Z-report ${report.reportNumber} arhiviran`,
        report,
      })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven action. Dovoljeni: close, archive' }, { status: 400 })
  } catch (error) {
    console.error('[z-report] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
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
