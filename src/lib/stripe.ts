/**
 * Stripe konfiguracija — podpira demo mode (brez realnih ključev)
 *
 * V produkciji dodaj v .env:
 * STRIPE_SECRET_KEY=sk_live_...
 * STRIPE_PUBLISHABLE_KEY=pk_live_...
 * STRIPE_WEBHOOK_SECRET=whsec_...
 *
 * V demo mode simuliramo payment intent brez Stripe API klica.
 */

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || ''
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export const IS_STRIPE_CONFIGURED = Boolean(STRIPE_SECRET_KEY && STRIPE_PUBLISHABLE_KEY)

export interface PaymentResult {
  ok: boolean
  paymentIntentId: string
  clientSecret?: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled' | 'demo'
  amount: number
  currency: string
  demo: boolean
  message: string
}

/**
 * Ustvari Payment Intent (demo ali realen)
 */
export async function createPaymentIntent(amount: number, currency = 'eur'): Promise<PaymentResult> {
  // Demo mode — simuliraj payment intent
  if (!IS_STRIPE_CONFIGURED) {
    const demoId = 'pi_demo_' + Math.random().toString(36).substring(2, 15)
    return {
      ok: true,
      paymentIntentId: demoId,
      clientSecret: demoId + '_secret_demo',
      status: 'demo',
      amount,
      currency,
      demo: true,
      message: 'Demo plačilo — brez realnega Stripe ključa. Dodaj STRIPE_SECRET_KEY za prava plačila.',
    }
  }

  // Production mode — pravi Stripe API klic
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(STRIPE_SECRET_KEY)

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe zahteva cente
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'noro-lep-pos',
      },
    })

    return {
      ok: true,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status as PaymentResult['status'],
      amount,
      currency,
      demo: false,
      message: 'Payment intent ustvarjen.',
    }
  } catch (error) {
    return {
      ok: false,
      paymentIntentId: '',
      amount,
      currency,
      demo: false,
      status: 'canceled',
      message: error instanceof Error ? error.message : 'Stripe error',
    }
  }
}

/**
 * Podprte plačilne metode
 */
export const PAYMENT_METHODS = [
  { id: 'apple_pay', label: 'Apple Pay', icon: '', desc: 'Tap & plačaj z iPhone/Apple Watch' },
  { id: 'google_pay', label: 'Google Pay', icon: 'G', desc: 'Tap & plačaj z Android' },
  { id: 'card', label: 'Kartica', icon: '💳', desc: 'Visa, Mastercard, Maestro' },
  { id: 'contactless', label: 'Contactless', icon: '📱', desc: 'NFC tap-to-pay' },
  { id: 'cash', label: 'Gotovina', icon: '💵', desc: 'Klasično plačilo' },
] as const
