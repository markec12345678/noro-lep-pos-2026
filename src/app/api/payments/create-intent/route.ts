import { NextResponse } from 'next/server'
import { createPaymentIntent, IS_STRIPE_CONFIGURED } from '@/lib/stripe'

/**
 * POST /api/payments/create-intent
 * Ustvari Payment Intent za Stripe (ali demo mode)
 *
 * Body:
 * { "amount": 42.50, "currency": "eur", "orderId": "K-014" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, currency = 'eur', orderId } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({
        ok: false,
        error: 'Znesek mora biti večji od 0',
      }, { status: 400 })
    }

    const result = await createPaymentIntent(amount, currency)

    return NextResponse.json({
      ...result,
      orderId: orderId || null,
      stripeConfigured: IS_STRIPE_CONFIGURED,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET /api/payments/create-intent
 * Vrne stanje Stripe konfiguracije + podprte metode
 */
export async function GET() {
  return NextResponse.json({
    stripeConfigured: IS_STRIPE_CONFIGURED,
    mode: IS_STRIPE_CONFIGURED ? 'production' : 'demo',
    currency: 'eur',
    methods: [
      { id: 'apple_pay', label: 'Apple Pay', available: IS_STRIPE_CONFIGURED },
      { id: 'google_pay', label: 'Google Pay', available: IS_STRIPE_CONFIGURED },
      { id: 'card', label: 'Kartica', available: IS_STRIPE_CONFIGURED },
      { id: 'contactless', label: 'Contactless (NFC)', available: IS_STRIPE_CONFIGURED },
      { id: 'cash', label: 'Gotovina', available: true },
    ],
    message: IS_STRIPE_CONFIGURED
      ? 'Stripe konfiguriran — prava plačila aktivna.'
      : 'Demo mode — dodaj STRIPE_SECRET_KEY in STRIPE_PUBLISHABLE_KEY v .env za prava plačila.',
  })
}
