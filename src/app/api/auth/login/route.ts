import { NextResponse } from 'next/server'
import { loginWithPin } from '@/lib/auth'

/**
 * Auth Login API — PIN-based login za restaurant POS
 *
 * POST /api/auth/login
 * Body: { pin: "1234", device?: "POS-iPad" }
 * Returns: { ok, token, staff: { id, name, role, permissions } }
 */

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pin, device } = body

    if (!pin) {
      return NextResponse.json({ ok: false, error: 'PIN je obvezen' }, { status: 400 })
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ ok: false, error: 'PIN mora biti 4 številke' }, { status: 400 })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await loginWithPin(pin, device, ipAddress, userAgent)

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Prijava uspešna',
      token: result.token,
      staff: result.staff,
    })
  } catch (error) {
    console.error('[auth/login] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
