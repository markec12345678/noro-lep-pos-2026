import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Audit Log API — sledenje vseh sprememb (FURS compliance + security)
 *
 * GET /api/audit                    — list logs (filter by entityType, action, severity, date, performedBy)
 * GET /api/audit?stats=true         — audit statistics (by entity, action, severity, top users)
 * GET /api/audit?entityType=order&id=X — audit trail za specifično entiteto
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('id')
    const action = searchParams.get('action')
    const severity = searchParams.get('severity')
    const performedBy = searchParams.get('performedBy')
    const date = searchParams.get('date')
    const stats = searchParams.get('stats') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    // ===== STATS MODE =====
    if (stats) {
      const where: Record<string, unknown> = {}
      if (entityType) where.entityType = entityType
      if (date) {
        const start = new Date(date + 'T00:00:00')
        const end = new Date(date + 'T23:59:59')
        where.createdAt = { gte: start, lte: end }
      }

      const logs = await db.auditLog.findMany({ where, take: 1000 })

      const byEntity: Record<string, number> = {}
      const byAction: Record<string, number> = {}
      const bySeverity: Record<string, number> = {}
      const byUser: Record<string, number> = {}

      for (const log of logs) {
        byEntity[log.entityType] = (byEntity[log.entityType] || 0) + 1
        byAction[log.action] = (byAction[log.action] || 0) + 1
        bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1
        if (log.performedBy) {
          byUser[log.performedBy] = (byUser[log.performedBy] || 0) + 1
        }
      }

      return NextResponse.json({
        ok: true,
        stats: {
          total: logs.length,
          byEntity: Object.entries(byEntity).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ entity: k, count: v })),
          byAction: Object.entries(byAction).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ action: k, count: v })),
          bySeverity,
          topUsers: Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => ({ user: k, count: v })),
          critical: logs.filter(l => l.severity === 'critical').length,
          warnings: logs.filter(l => l.severity === 'warning').length,
        },
      })
    }

    // ===== ENTITY TRAIL (single entity) =====
    if (entityType && entityId) {
      const logs = await db.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      const parsed = logs.map(l => ({
        ...l,
        changes: l.changes ? JSON.parse(l.changes) : null,
        metadata: l.metadata ? JSON.parse(l.metadata) : null,
      }))

      return NextResponse.json({
        ok: true,
        entityType,
        entityId,
        count: parsed.length,
        trail: parsed,
      })
    }

    // ===== LIST MODE =====
    const where: Record<string, unknown> = {}
    if (entityType) where.entityType = entityType
    if (action) where.action = action
    if (severity) where.severity = severity
    if (performedBy) where.performedBy = { contains: performedBy }
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.createdAt = { gte: start, lte: end }
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const parsed = logs.map(l => ({
      ...l,
      changes: l.changes ? JSON.parse(l.changes) : null,
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
    }))

    return NextResponse.json({
      ok: true,
      count: parsed.length,
      logs: parsed,
    })
  } catch (error) {
    console.error('[audit] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — manual audit entry (za external integrations)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entityType, entityId, entityName, action, performedBy, staffId, changes, metadata, severity = 'info' } = body

    if (!entityType || !action) {
      return NextResponse.json({ ok: false, error: 'entityType in action sta obvezna' }, { status: 400 })
    }

    const log = await db.auditLog.create({
      data: {
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        action,
        performedBy: performedBy || null,
        staffId: staffId || null,
        changes: changes ? JSON.stringify(changes) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        severity,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Audit entry ustvarjen',
      log,
    }, { status: 201 })
  } catch (error) {
    console.error('[audit] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
