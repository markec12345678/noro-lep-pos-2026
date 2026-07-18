import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Auth Me API — pridobi trenutno prijavljenega uporabnika
 *
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Returns: { ok, staff: { id, name, role, permissions, lastLogin } }
 */

export async function GET(request: Request) {
  const { valid, payload, error } = verifyRequest(request)

  if (!valid) {
    return NextResponse.json({ ok: false, error }, { status: 401 })
  }

  try {
    const staff = await db.staff.findUnique({
      where: { id: payload!.staffId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        hourlyRate: true,
        lastLogin: true,
        active: true,
      },
    })

    if (!staff || !staff.active) {
      return NextResponse.json({ ok: false, error: 'Oseba ni najdena ali nedejavna' }, { status: 404 })
    }

    // Get active session
    const session = await db.sessionLog.findFirst({
      where: { staffId: staff.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      ok: true,
      staff: {
        ...staff,
        name: `${staff.firstName} ${staff.lastName}`,
        permissions: payload!.permissions,
      },
      session: session ? {
        device: session.device,
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      } : null,
    })
  } catch (error) {
    console.error('[auth/me] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
