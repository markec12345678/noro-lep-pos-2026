export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || ''
export const IS_STRIPE_CONFIGURED = Boolean(STRIPE_SECRET_KEY && STRIPE_PUBLISHABLE_KEY)

export interface PaymentResult {
  ok: boolean; paymentIntentId: string; clientSecret?: string
  status: 'succeeded' | 'demo' | 'canceled'; amount: number; currency: string
  demo: boolean; message: string
}

export async function createPaymentIntent(amount: number, currency = 'eur'): Promise<PaymentResult> {
  if (!IS_STRIPE_CONFIGURED) {
    const demoId = 'pi_demo_' + Math.random().toString(36).substring(2, 15)
    return { ok: true, paymentIntentId: demoId, clientSecret: demoId + '_secret_demo', status: 'demo', amount, currency, demo: true, message: 'Demo plačilo — dodaj STRIPE_SECRET_KEY za prava plačila.' }
  }
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(STRIPE_SECRET_KEY)
    const intent = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency, automatic_payment_methods: { enabled: true } })
    return { ok: true, paymentIntentId: intent.id, clientSecret: intent.client_secret, status: intent.status as PaymentResult['status'], amount, currency, demo: false, message: 'Payment intent ustvarjen.' }
  } catch (error) {
    return { ok: false, paymentIntentId: '', amount, currency, demo: false, status: 'canceled', message: error instanceof Error ? error.message : 'Stripe error' }
  }
}
