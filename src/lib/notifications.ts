import { db } from '@/lib/db'

/**
 * Notification Helper — pošiljanje SMS/email/push/in-app
 *
 * Templates (Slovenian):
 *   - reservation_reminder: "Spoštovani {name}, spominjamo vas na rezervacijo danes ob {time}. Miza {table}. Vprašanja? {phone}"
 *   - waitlist_ready: "Miza je prosta! Prosimo pridite v {minutes} minutah. {restaurant}"
 *   - loyalty_tier_upgrade: "Čestitamo {name}! Sedaj ste {tier} član! Uživajte v {perk}."
 *   - reactivation: "Pogrešamo vas {name}! 15% popust v naslednjih 7 dneh. Koda: {code}"
 *   - birthday: "Vse najboljše {name}! 🎂 Brezplačna sladica ob vašem obisku."
 *   - order_ready: "Vaše naročilo {orderNumber} je pripravljeno za prevzem."
 *   - low_stock_alert: "NIZKA ZALOGA: {itemName} — ostalo samo {qty} {unit}. Min: {minStock}."
 *   - daily_summary: "Dnevni povzetek: {revenue} promet, {orders} naročil, {guests} gostov."
 *   - custom: poljubno sporočilo
 */

export interface NotificationParams {
  channel: 'sms' | 'email' | 'push' | 'in_app'
  recipient: string
  recipientName?: string
  template: string
  subject?: string
  body: string
  entityType?: string
  entityId?: string
  scheduledFor?: Date
  metadata?: Record<string, unknown>
}

// Pošlji notification (ustvari v DB, demo mode ne pošlje pravega SMS-a)
export async function sendNotification(params: NotificationParams): Promise<{ ok: boolean; notificationId?: string; error?: string }> {
  try {
    const notification = await db.notification.create({
      data: {
        channel: params.channel,
        recipient: params.recipient,
        recipientName: params.recipientName || null,
        template: params.template,
        subject: params.subject || null,
        body: params.body,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        status: 'sent', // Demo: takoj "sent". Production: "pending" → SMS gateway
        sentAt: new Date(),
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        scheduledFor: params.scheduledFor || null,
      },
    })

    // Demo mode: simuliraj delivery po 1 sekundi
    setTimeout(async () => {
      try {
        await db.notification.update({
          where: { id: notification.id },
          data: { status: 'delivered', deliveredAt: new Date() },
        })
      } catch {}
    }, 1000)

    return { ok: true, notificationId: notification.id }
  } catch (error) {
    console.error('[notifications] sendNotification napaka:', error instanceof Error ? error.message : error)
    return { ok: false, error: 'Failed to create notification' }
  }
}

// Template renderer — zamenjaj {placeholders} z vrednostmi
export function renderTemplate(template: string, params: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}

// Template definitions
export const TEMPLATES: Record<string, { channel: string; subject?: string; body: string }> = {
  reservation_reminder: {
    channel: 'sms',
    body: 'Spoštovani {name}, spominjamo vas na rezervacijo danes ob {time}. Miza {table}. Vprašanja? Pokličite {phone}.',
  },
  waitlist_ready: {
    channel: 'sms',
    body: 'Miza je prosta! Prosimo pridite v {minutes} minutah. {restaurant}',
  },
  loyalty_tier_upgrade: {
    channel: 'sms',
    body: 'Čestitamo {name}! Sedaj ste {tier} član! Uživajte v {perk}.',
  },
  reactivation: {
    channel: 'sms',
    body: 'Pogrešamo vas {name}! 15% popust v naslednjih 7 dneh. Koda: {code}',
  },
  birthday: {
    channel: 'sms',
    body: 'Vse najboljše {name}! 🎂 Brezplačna sladica ob vašem obisku.',
  },
  order_ready: {
    channel: 'sms',
    body: 'Vaše naročilo {orderNumber} je pripravljeno za prevzem.',
  },
  low_stock_alert: {
    channel: 'in_app',
    body: 'NIZKA ZALOGA: {itemName} — ostalo samo {qty} {unit}. Minimum: {minStock}.',
  },
  daily_summary: {
    channel: 'email',
    subject: 'Dnevni povzetek {date}',
    body: 'Dnevni povzetek:\nPromet: {revenue}\nNaročil: {orders}\nGostov: {guests}\nTipi: {tips}',
  },
  custom: {
    channel: 'sms',
    body: '{message}',
  },
}
