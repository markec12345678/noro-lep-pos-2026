import { NextResponse } from 'next/server'
import { verifyRequest, logout } from '@/lib/auth'

/**
 * Auth Logout API — odjava
 *
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 */

export async function POST(request: Request) {
  const { valid, error } = verifyRequest(request)

  if (!valid) {
    return NextResponse.json({ ok: false, error }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || ''

  const result = await logout(token)

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 })
  }

  return NextResponse.json({ ok: true, message: 'Odjava uspešna' })
}
