import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendNotification, renderTemplate, TEMPLATES } from '@/lib/notifications'

/**
 * Notifications API — centralni notification sistem
 *
 * GET   /api/notifications              — list (filter by channel, status, template, date)
 * GET   /api/notifications?templates=true — list available templates
 * GET   /api/notifications?stats=true   — notification statistics
 * POST  /api/notifications              — send notification (template or custom)
 * PATCH /api/notifications              — mark as read / retry failed
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const templates = searchParams.get('templates') === 'true'
    const stats = searchParams.get('stats') === 'true'
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const template = searchParams.get('template')
    const entityType = searchParams.get('entityType')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    // List templates
    if (templates) {
      return NextResponse.json({
        ok: true,
        templates: Object.entries(TEMPLATES).map(([name, t]) => ({
          name,
          channel: t.channel,
          subject: t.subject,
          body: t.body,
        })),
      })
    }

    // Stats
    if (stats) {
      const where: Record<string, unknown> = {}
      if (date) {
        const start = new Date(date + 'T00:00:00')
        const end = new Date(date + 'T23:59:59')
        where.createdAt = { gte: start, lte: end }
      }

      const notifications = await db.notification.findMany({ where, take: 1000 })

      const byChannel: Record<string, number> = {}
      const byStatus: Record<string, number> = {}
      const byTemplate: Record<string, number> = {}

      for (const n of notifications) {
        byChannel[n.channel] = (byChannel[n.channel] || 0) + 1
        byStatus[n.status] = (byStatus[n.status] || 0) + 1
        byTemplate[n.template] = (byTemplate[n.template] || 0) + 1
      }

      return NextResponse.json({
        ok: true,
        stats: {
          total: notifications.length,
          sent: byStatus.sent || 0,
          delivered: byStatus.delivered || 0,
          failed: byStatus.failed || 0,
          read: byStatus.read || 0,
          pending: byStatus.pending || 0,
          deliveryRate: notifications.length > 0
            ? Math.round(((byStatus.delivered || 0) / notifications.length) * 10000) / 100
            : 0,
          byChannel,
          byTemplate: Object.entries(byTemplate).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ template: k, count: v })),
        },
      })
    }

    // List
    const where: Record<string, unknown> = {}
    if (channel) where.channel = channel
    if (status) where.status = status
    if (template) where.template = template
    if (entityType) where.entityType = entityType
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.createdAt = { gte: start, lte: end }
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const parsed = notifications.map(n => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }))

    return NextResponse.json({ ok: true, count: notifications.length, notifications: parsed })
  } catch (error) {
    console.error('[notifications] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — send notification
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // ===== TEMPLATE-BASED =====
    if (body.template && body.template !== 'custom') {
      const templateDef = TEMPLATES[body.template]
      if (!templateDef) {
        return NextResponse.json({ ok: false, error: `Neveljaven template. Dovoljeni: ${Object.keys(TEMPLATES).join(', ')}` }, { status: 400 })
      }

      // Render body from template + params
      const renderedBody = renderTemplate(templateDef.body, body.params || {})

      const result = await sendNotification({
        channel: body.channel || templateDef.channel,
        recipient: body.recipient,
        recipientName: body.recipientName,
        template: body.template,
        subject: templateDef.subject ? renderTemplate(templateDef.subject, body.params || {}) : undefined,
        body: renderedBody,
        entityType: body.entityType,
        entityId: body.entityId,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        metadata: body.metadata,
      })

      if (!result.ok) return NextResponse.json(result, { status: 500 })

      console.log(`[notifications] ✓ ${body.template} sent to ${body.recipient} | channel=${body.channel || templateDef.channel}`)

      return NextResponse.json({
        ok: true,
        message: `Notification poslana (${body.template})`,
        notificationId: result.notificationId,
        body: renderedBody,
      }, { status: 201 })
    }

    // ===== CUSTOM =====
    if (body.body) {
      const result = await sendNotification({
        channel: body.channel || 'sms',
        recipient: body.recipient,
        recipientName: body.recipientName,
        template: 'custom',
        subject: body.subject,
        body: body.body,
        entityType: body.entityType,
        entityId: body.entityId,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        metadata: body.metadata,
      })

      if (!result.ok) return NextResponse.json(result, { status: 500 })

      return NextResponse.json({
        ok: true,
        message: 'Notification poslana (custom)',
        notificationId: result.notificationId,
      }, { status: 201 })
    }

    return NextResponse.json({ ok: false, error: 'template ali body je obvezen' }, { status: 400 })
  } catch (error) {
    console.error('[notifications] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — mark as read / retry
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })

    // MARK AS READ
    if (action === 'read') {
      const updated = await db.notification.update({
        where: { id },
        data: { status: 'read', readAt: new Date() },
      })
      return NextResponse.json({ ok: true, message: 'Označeno kot prebrano', notification: updated })
    }

    // RETRY FAILED
    if (action === 'retry') {
      const notification = await db.notification.findUnique({ where: { id } })
      if (!notification) return NextResponse.json({ ok: false, error: 'Notification ni najden' }, { status: 404 })

      if (notification.status !== 'failed') {
        return NextResponse.json({ ok: false, error: 'Samo failed notifications se lahko retry' }, { status: 400 })
      }

      const updated = await db.notification.update({
        where: { id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          attempts: { increment: 1 },
          error: null,
        },
      })

      // Demo: simuliraj delivery
      setTimeout(async () => {
        try {
          await db.notification.update({
            where: { id },
            data: { status: 'delivered', deliveredAt: new Date() },
          })
        } catch {}
      }, 1000)

      return NextResponse.json({ ok: true, message: 'Retry uspešen', notification: updated })
    }

    return NextResponse.json({ ok: false, error: 'Neveljven action. Dovoljeni: read, retry' }, { status: 400 })
  } catch (error) {
    console.error('[notifications] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
