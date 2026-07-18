import { NextResponse } from 'next/server'
import { verifyRequest, setStaffPin, hasPermission } from '@/lib/auth'

/**
 * Auth Set PIN API — nastavi PIN za staff member
 *
 * POST /api/auth/set-pin
 * Header: Authorization: Bearer <token>
 * Body: { staffId, pin }
 * Requires: manager role (or self-setup)
 */

export async function POST(request: Request) {
  const { valid, payload, error } = verifyRequest(request)

  if (!valid) {
    return NextResponse.json({ ok: false, error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { staffId, pin } = body

    if (!staffId || !pin) {
      return NextResponse.json({ ok: false, error: 'staffId in pin sta obvezna' }, { status: 400 })
    }

    // Samo manager lahko nastavi PIN drugim, ali pa staff sebi
    const isManager = payload!.role === 'manager'
    const isSelf = payload!.staffId === staffId

    if (!isManager && !isSelf) {
      return NextResponse.json({ ok: false, error: 'Nimate dovoljenja za nastavitev PIN' }, { status: 403 })
    }

    const result = await setStaffPin(staffId, pin)

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      message: 'PIN nastavljen',
    })
  } catch (error) {
    console.error('[auth/set-pin] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
