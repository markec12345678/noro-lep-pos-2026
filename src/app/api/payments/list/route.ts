import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Payment List API — zgodovina plačil z filtri
 *
 * GET /api/payments/list              — list payments (filter by status, method, date)
 * GET /api/payments/list?id=X         — single payment
 * GET /api/payments/list?orderId=X    — payments za določen order
 *
 * Vrača tudi stats: total, byMethod, byStatus, success rate
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Single payment
    if (id) {
      const payment = await db.payment.findUnique({ where: { id } })
      if (!payment) return NextResponse.json({ ok: false, error: 'Plačilo ni najdeno' }, { status: 404 })
      return NextResponse.json({ ok: true, payment })
    }

    // Build where
    const where: Record<string, unknown> = {}
    if (orderId) where.orderId = orderId
    if (status) where.status = status
    if (method) where.method = method
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.createdAt = { gte: start, lte: end }
    }

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Stats
    const succeeded = payments.filter(p => p.status === 'succeeded')
    const failed = payments.filter(p => p.status === 'failed')
    const refunded = payments.filter(p => p.status === 'refunded' || p.status === 'partially_refunded')

    const totalAmount = succeeded.reduce((s, p) => s + p.total, 0)
    const totalTips = succeeded.reduce((s, p) => s + p.tip, 0)
    const refundAmount = refunded.reduce((s, p) => s + p.refundAmount, 0)

    const byMethod: Record<string, { count: number; amount: number }> = {}
    for (const p of succeeded) {
      if (!byMethod[p.method]) byMethod[p.method] = { count: 0, amount: 0 }
      byMethod[p.method].count++
      byMethod[p.method].amount += p.total
    }

    const byStatus: Record<string, number> = {}
    for (const p of payments) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1
    }

    const stats = {
      total: payments.length,
      succeeded: succeeded.length,
      failed: failed.length,
      refunded: refunded.length,
      successRate: payments.length > 0
        ? Math.round((succeeded.length / payments.length) * 10000) / 100
        : 0,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalTips: Math.round(totalTips * 100) / 100,
      refundAmount: Math.round(refundAmount * 100) / 100,
      byMethod: Object.entries(byMethod).map(([m, v]) => ({
        method: m,
        label: getMethodLabel(m),
        count: v.count,
        amount: Math.round(v.amount * 100) / 100,
      })),
      byStatus,
    }

    return NextResponse.json({
      ok: true,
      count: payments.length,
      stats,
      payments,
    })
  } catch (error) {
    console.error('[payments/list] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    card: 'Kartica',
    cash: 'Gotovina',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    gift_card: 'Darilna kartica',
    split: 'Delitev',
  }
  return labels[method] || method
}
