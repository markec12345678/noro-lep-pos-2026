import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Staff API — osebje management
 *
 * GET    /api/staff              — list staff (filter by role, active)
 * GET    /api/staff?id=X         — single staff z shifts
 * POST   /api/staff              — create new staff member
 * PATCH  /api/staff              — update staff (role, rate, active)
 * DELETE /api/staff?id=X         — deactivate (soft delete)
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const role = searchParams.get('role')
    const active = searchParams.get('active')

    if (id) {
      const staff = await db.staff.findUnique({
        where: { id },
        include: {
          shifts: { orderBy: { date: 'desc' }, take: 10 },
          attendance: { orderBy: { date: 'desc' }, take: 10 },
        },
      })
      if (!staff) return NextResponse.json({ ok: false, error: 'Oseba ni najdena' }, { status: 404 })
      return NextResponse.json({ ok: true, staff })
    }

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (active !== null) where.active = active !== 'false'

    const staffList = await db.staff.findMany({
      where,
      include: {
        _count: { select: { shifts: true, attendance: true } },
      },
      orderBy: [{ active: 'desc' }, { firstName: 'asc' }],
    })

    const stats = {
      total: staffList.length,
      active: staffList.filter(s => s.active).length,
      byRole: staffList.reduce((acc, s) => {
        acc[s.role] = (acc[s.role] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      avgRate: staffList.length > 0
        ? Math.round(staffList.reduce((s, st) => s + st.hourlyRate, 0) / staffList.length * 100) / 100
        : 0,
    }

    return NextResponse.json({ ok: true, count: staffList.length, stats, staff: staffList })
  } catch (error) {
    console.error('[staff] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new staff
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, role = 'server', hourlyRate = 9.50 } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ ok: false, error: 'firstName in lastName sta obvezna' }, { status: 400 })
    }

    // Email unique check
    if (email) {
      const existing = await db.staff.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ ok: false, error: 'Oseba s tem emailom že obstaja' }, { status: 409 })
      }
    }

    const staff = await db.staff.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        role,
        hourlyRate: parseFloat(hourlyRate),
      },
    })

    console.log(`[staff] ✓ Nova oseba: ${firstName} ${lastName} (${role}, €${hourlyRate}/h)`)

    return NextResponse.json({
      ok: true,
      message: 'Oseba dodana',
      staff,
    }, { status: 201 })
  } catch (error) {
    console.error('[staff] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update staff
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, firstName, lastName, email, phone, role, hourlyRate, active } = body

    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role) updateData.role = role
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate)
    if (active !== undefined) updateData.active = active

    const staff = await db.staff.update({
      where: { id },
      data: updateData,
    })

    console.log(`[staff] ✓ ${staff.firstName} ${staff.lastName} posodobljen`)

    return NextResponse.json({ ok: true, message: 'Oseba posodobljena', staff })
  } catch (error) {
    console.error('[staff] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — soft delete (deactivate)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    const staff = await db.staff.update({
      where: { id },
      data: { active: false },
    })

    console.log(`[staff] ✓ ${staff.firstName} ${staff.lastName} deaktiviran`)

    return NextResponse.json({ ok: true, message: 'Oseba deaktivirana', staff })
  } catch (error) {
    console.error('[staff] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
