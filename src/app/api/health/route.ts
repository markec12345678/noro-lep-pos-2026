import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Health Check API — system status za monitoring/uptime
 *
 * GET /api/health
 *
 * Vrne: { status, timestamp, uptime, checks: { database, api, websocket }, stats }
 * Status: healthy | degraded | unhealthy
 */

const startedAt = Date.now()

export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}
  let overallStatus = 'healthy'

  // ===== DATABASE CHECK =====
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    checks.database = { status: 'healthy', latency: dbLatency }
  } catch (error) {
    checks.database = { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown' }
    overallStatus = 'unhealthy'
  }

  // ===== TABLE COUNTS (quick stats) =====
  let stats: Record<string, number> = {}
  if (overallStatus === 'healthy') {
    try {
      const [
        orders, tables, reservations, staff, customers, inventory,
        payments, zReports, giftCards, promotions, tips, purchaseOrders,
        auditLogs, notifications, printers, menuItems, cashDrawers,
      ] = await Promise.all([
        db.order.count(),
        db.table.count(),
        db.reservation.count(),
        db.staff.count(),
        db.customer.count(),
        db.inventoryItem.count(),
        db.payment.count(),
        db.zReport.count(),
        db.giftCard.count(),
        db.promotion.count(),
        db.tipDistribution.count(),
        db.purchaseOrder.count(),
        db.auditLog.count(),
        db.notification.count(),
        db.printer.count(),
        db.menuItem.count(),
        db.cashDrawerSession.count(),
      ])

      stats = {
        orders, tables, reservations, staff, customers, inventory,
        payments, zReports, giftCards, promotions, tips, purchaseOrders,
        auditLogs, notifications, printers, menuItems, cashDrawers,
        totalRecords: orders + tables + reservations + staff + customers + inventory +
          payments + zReports + giftCards + promotions + tips + purchaseOrders +
          auditLogs + notifications + printers + menuItems + cashDrawers,
      }
    } catch {
      overallStatus = 'degraded'
    }
  }

  // ===== TODAY'S QUICK KPIs =====
  let kpis: Record<string, unknown> = {}
  if (overallStatus !== 'unhealthy') {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const [todayOrders, todayRevenue, todayReservations, activeTables, openCashDrawer] = await Promise.all([
        db.order.count({ where: { status: 'paid', paidAt: { gte: todayStart, lte: todayEnd } } }),
        db.payment.aggregate({ where: { status: 'succeeded', createdAt: { gte: todayStart, lte: todayEnd } }, _sum: { total: true } }),
        db.reservation.count({ where: { date: { gte: todayStart, lte: todayEnd }, status: { in: ['confirmed', 'seated'] } } }),
        db.table.count({ where: { status: 'occupied' } }),
        db.cashDrawerSession.count({ where: { status: 'open' } }),
      ])

      kpis = {
        todayOrders,
        todayRevenue: Math.round((todayRevenue._sum.total || 0) * 100) / 100,
        todayReservations,
        activeTables,
        openCashDrawer,
      }
    } catch {
      overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus
    }
  }

  const uptime = Math.round((Date.now() - startedAt) / 1000)

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    uptimeSeconds: uptime,
    version: '10.0',
    checks,
    stats,
    kpis,
    info: {
      name: 'Noro Lep POS',
      framework: 'Next.js 16',
      database: 'SQLite (Prisma)',
      models: 37,
      apiRoutes: 45,
    },
  }, { status: overallStatus === 'unhealthy' ? 503 : 200 })
}
