import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Payment Webhook — Stripe event handler
 *
 * POST /api/payments/webhook
 *
 * Prejema Stripe webhook evente in posodablja Order + Payment statuse.
 * Idempotent (preveri stripeEventId).
 *
 * Podprti eventi:
 * - payment_intent.succeeded → order status=paid + payment status=succeeded
 * - payment_intent.payment_failed → payment status=failed
 * - charge.refunded → payment status=refunded/partially_refunded
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: Request) {
  // Če Stripe ni konfiguriran, simuliraj (demo mode)
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return handleDemoWebhook(request)
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(STRIPE_SECRET_KEY)

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ ok: false, error: 'Manjka stripe-signature header' }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('[payments/webhook] Signature verification failed:', err instanceof Error ? err.message : err)
      return NextResponse.json({ ok: false, error: 'Neveljaven podpis' }, { status: 400 })
    }

    // Idempotency check
    const existing = await db.payment.findFirst({
      where: { stripeEventId: event.id },
    })
    if (existing) {
      return NextResponse.json({ ok: true, message: 'Event already processed', duplicate: true })
    }

    await handleStripeEvent(event)

    return NextResponse.json({ ok: true, received: true, type: event.type })
  } catch (error) {
    console.error('[payments/webhook] Napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ===== Stripe event handler =====
async function handleStripeEvent(event: { id: string; type: string; data: { object: Record<string, unknown> } }) {
  const obj = event.data.object

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = obj as unknown as {
        id: string
        amount: number
        currency: string
        metadata?: Record<string, string>
      }

      const orderId = intent.metadata?.orderId
      const amount = intent.amount / 100 // Stripe je v centih

      // Poišči ali ustvari Payment record
      let payment = await db.payment.findUnique({ where: { paymentRef: intent.id } })

      if (!payment) {
        payment = await db.payment.create({
          data: {
            paymentRef: intent.id,
            orderId: orderId || null,
            orderNumber: intent.metadata?.orderNumber || null,
            amount: Math.round(amount * 100) / 100,
            total: Math.round(amount * 100) / 100,
            currency: intent.currency.toUpperCase(),
            method: 'card',
            status: 'succeeded',
            stripeEventId: event.id,
            customerName: intent.metadata?.customerName || null,
            processedAt: new Date(),
          },
        })
      } else {
        payment = await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'succeeded',
            stripeEventId: event.id,
            processedAt: new Date(),
          },
        })
      }

      // Posodobi Order na paid
      if (orderId) {
        const tip = parseFloat(intent.metadata?.tip || '0')
        await db.order.update({
          where: { id: orderId },
          data: {
            status: 'paid',
            paidAt: new Date(),
            paymentMethod: 'card',
            paymentRef: intent.id,
            tip,
            tipMethod: tip > 0 ? 'card' : null,
          },
        })

        // Sprosti mizo
        const order = await db.order.findUnique({ where: { id: orderId } })
        if (order?.tableId) {
          await db.table.update({ where: { id: order.tableId }, data: { status: 'free' } })
        }

        // Customer loyalty earn (če je customerId v metadata)
        const customerId = intent.metadata?.customerId
        if (customerId) {
          await db.loyaltyTransaction.create({
            data: {
              customerId,
              type: 'earn',
              points: Math.floor(amount),
              reason: `payment ${intent.id}`,
              orderId,
              balanceAfter: 0, // will be updated by customer API
            },
          })
          await db.customer.update({
            where: { id: customerId },
            data: {
              points: { increment: Math.floor(amount) },
              totalVisits: { increment: 1 },
              totalSpent: { increment: Math.round(amount * 100) / 100 },
              lastVisit: new Date(),
            },
          })
        }

        console.log(`[payments/webhook] ✓ Payment succeeded: ${intent.id} | €${amount} | order=${orderId}`)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = obj as unknown as { id: string; last_payment_error?: { message: string } }

      const payment = await db.payment.findUnique({ where: { paymentRef: intent.id } })
      if (payment) {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            stripeEventId: event.id,
            failedAt: new Date(),
          },
        })
      }

      console.log(`[payments/webhook] ✗ Payment failed: ${intent.id} | ${intent.last_payment_error?.message || 'unknown'}`)
      break
    }

    case 'charge.refunded': {
      const charge = obj as unknown as {
        id: string
        amount_refunded: number
        payment_intent: string | null
      }

      const refundAmount = charge.amount_refunded / 100
      const intentId = charge.payment_intent

      if (intentId) {
        const payment = await db.payment.findUnique({ where: { paymentRef: intentId } })
        if (payment) {
          const isFullRefund = refundAmount >= payment.total
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: isFullRefund ? 'refunded' : 'partially_refunded',
              refundAmount: Math.round(refundAmount * 100) / 100,
              refundReason: 'customer_request',
              refundedAt: new Date(),
              stripeChargeId: charge.id,
            },
          })

          // Če je full refund, cancel order
          if (isFullRefund && payment.orderId) {
            await db.order.update({
              where: { id: payment.orderId },
              data: { status: 'canceled' },
            })
          }

          console.log(`[payments/webhook] ↩ Refund: ${intentId} | €${refundAmount} | ${isFullRefund ? 'full' : 'partial'}`)
        }
      }
      break
    }

    default:
      console.log(`[payments/webhook] Neobdelan event: ${event.type}`)
  }
}

// ===== Demo mode (brez Stripe ključev) =====
async function handleDemoWebhook(request: Request) {
  try {
    const body = await request.json()
    const { orderId, amount, tip = 0, method = 'card', customerId, simulate = 'succeeded' } = body

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId je obvezen (demo mode)' }, { status: 400 })
    }

    // Poišči order
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order) return NextResponse.json({ ok: false, error: 'Order ni najden' }, { status: 404 })

    // Simuliraj Stripe payment intent ID
    const demoIntentId = `pi_demo_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    const demoEventId = `evt_demo_${Date.now()}`

    if (simulate === 'succeeded') {
      // Ustvari Payment record
      const payment = await db.payment.create({
        data: {
          paymentRef: demoIntentId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: Math.round(order.subtotal * 100) / 100,
          tax: Math.round(order.tax * 100) / 100,
          tip: parseFloat(tip) || 0,
          total: Math.round((order.total + parseFloat(tip || 0)) * 100) / 100,
          currency: 'EUR',
          method,
          status: 'succeeded',
          stripeEventId: demoEventId,
          customerName: order.serverName,
          processedAt: new Date(),
        },
      })

      // Posodobi Order na paid
      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod: method,
          paymentRef: demoIntentId,
          tip: parseFloat(tip) || 0,
          tipMethod: parseFloat(tip) > 0 ? method : null,
        },
      })

      // Sprosti mizo
      if (order.tableId) {
        await db.table.update({ where: { id: order.tableId }, data: { status: 'free' } })
      }

      // Customer loyalty earn
      if (customerId) {
        const customer = await db.customer.findUnique({ where: { id: customerId } })
        if (customer) {
          const earnPoints = Math.floor(order.total + parseFloat(tip || 0))
          const newPoints = customer.points + earnPoints
          const newTier = newPoints >= 1500 ? 'gold' : newPoints >= 500 ? 'silver' : 'bronze'

          await db.customer.update({
            where: { id: customerId },
            data: {
              points: newPoints,
              totalVisits: { increment: 1 },
              totalSpent: { increment: Math.round((order.total + parseFloat(tip || 0)) * 100) / 100 },
              lastVisit: new Date(),
              tier: newTier,
            },
          })

          await db.loyaltyTransaction.create({
            data: {
              customerId,
              type: 'earn',
              points: earnPoints,
              reason: `order ${order.orderNumber}`,
              orderId: order.id,
              balanceAfter: newPoints,
            },
          })
        }
      }

      console.log(`[payments/webhook DEMO] ✓ Payment succeeded: ${demoIntentId} | €${payment.total} | order=${order.orderNumber} | tip=€${tip}`)

      return NextResponse.json({
        ok: true,
        message: 'Demo payment succeeded',
        payment,
        order: { ...order, status: 'paid', tip: parseFloat(tip) || 0 },
      })
    }

    if (simulate === 'failed') {
      const payment = await db.payment.create({
        data: {
          paymentRef: demoIntentId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.subtotal,
          tax: order.tax,
          total: order.total,
          method,
          status: 'failed',
          stripeEventId: demoEventId,
          failedAt: new Date(),
        },
      })

      console.log(`[payments/webhook DEMO] ✗ Payment failed: ${demoIntentId} | order=${order.orderNumber}`)

      return NextResponse.json({
        ok: true,
        message: 'Demo payment failed',
        payment,
      })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven simulate. Dovoljeni: succeeded, failed' }, { status: 400 })
  } catch (error) {
    console.error('[payments/webhook DEMO] Napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET — webhook status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/payments/webhook',
    configured: Boolean(STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET),
    mode: STRIPE_SECRET_KEY ? 'production' : 'demo',
    events: ['payment_intent.succeeded', 'payment_intent.payment_failed', 'charge.refunded'],
    demoUsage: 'POST { orderId, amount?, tip?, method?, customerId?, simulate: "succeeded"|"failed" }',
  })
}
