import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Lead Capture API — shrani email iz brezplačnega vodiča (lead magnet)
 *
 * POST /api/leads
 * Body: { email, name?, restaurant?, consent, guide? }
 *
 * - Validacija email formata
 * - Unique constraint (ne duplikati)
 * - GDPR: consent required
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, restaurant, consent = true, guide = 'pos_vodnik_2026' } = body

    // Validacija
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'Email je obvezen' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: 'Neveljaven email format' }, { status: 400 })
    }

    if (!consent) {
      return NextResponse.json({ ok: false, error: 'Privolitev je obvezna (GDPR)' }, { status: 400 })
    }

    // Shranjevanje (upsert — če že obstaja, ne duplikata)
    const lead = await db.leadCapture.upsert({
      where: { email },
      update: {
        name: name || undefined,
        restaurant: restaurant || undefined,
        consent: true,
        guide,
      },
      create: {
        email,
        name: name || null,
        restaurant: restaurant || null,
        consent: true,
        source: 'landing_lead_magnet',
        guide,
      },
      select: { id: true, email: true, createdAt: true },
    })

    console.log(`[leads] ✓ Nov lead: ${email} (${restaurant || 'brez restavracije'})`)

    return NextResponse.json({
      ok: true,
      message: 'Vodič je na poti! Preveri svoj email.',
      leadId: lead.id,
    })
  } catch (error) {
    console.error('[leads] Napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET za statistiko (admin)
export async function GET() {
  try {
    const count = await db.leadCapture.count()
    const today = await db.leadCapture.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })
    return NextResponse.json({
      ok: true,
      total: count,
      today,
      guide: 'pos_vodnik_2026',
    })
  } catch (error) {
    console.error('[leads] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'DB error' }, { status: 500 })
  }
}
