import { NextResponse } from 'next/server'
import { createPaymentIntent, IS_STRIPE_CONFIGURED } from '@/lib/stripe'
export async function POST(request: Request) {
  try { const { amount, currency = 'eur' } = await request.json()
    if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: 'Znesek mora biti > 0' }, { status: 400 })
    const result = await createPaymentIntent(amount, currency)
    return NextResponse.json({ ...result, stripeConfigured: IS_STRIPE_CONFIGURED })
  } catch (e) { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
}
export async function GET() {
  return NextResponse.json({ stripeConfigured: IS_STRIPE_CONFIGURED, mode: IS_STRIPE_CONFIGURED ? 'production' : 'demo', methods: [{ id: 'apple_pay', label: 'Apple Pay' }, { id: 'google_pay', label: 'Google Pay' }, { id: 'card', label: 'Kartica' }, { id: 'contactless', label: 'NFC' }, { id: 'cash', label: 'Gotovina' }] })
}
