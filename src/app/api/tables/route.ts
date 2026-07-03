import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Tables API — table management (floor plan, status)
 *
 * GET   /api/tables          — list all tables z active orders
 * PATCH /api/tables          — update table status (free/occupied/reserved/payment)
 * POST  /api/tables          — create new table (admin)
 */

// GET — list all tables
export async function GET() {
  try {
    const tables = await db.table.findMany({
      where: { active: true },
      include: {
        orders: {
          where: { status: { in: ['open', 'sent', 'preparing', 'ready', 'served'] } },
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
        },
      },
      orderBy: { number: 'asc' },
    })

    const stats = {
      total: tables.length,
      free: tables.filter(t => t.status === 'free').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      payment: tables.filter(t => t.status === 'payment').length,
    }

    return NextResponse.json({
      ok: true,
      count: tables.length,
      stats,
      tables,
    })
  } catch (error) {
    console.error('[tables] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update table status
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, number, status, location } = body

    if (!id && !number) {
      return NextResponse.json({ ok: false, error: 'ID ali number je obvezen' }, { status: 400 })
    }

    const validStatuses = ['free', 'occupied', 'reserved', 'payment']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: `Neveljaven status. Dovoljeni: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const where = id ? { id } : { number: parseInt(number) }
    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (location) updateData.location = location

    const table = await db.table.update({
      where,
      data: updateData,
    })

    console.log(`[tables] ✓ Miza ${table.number} posodobljena: status=${status || 'n/a'}`)

    return NextResponse.json({
      ok: true,
      message: 'Miza posodobljena',
      table,
    })
  } catch (error) {
    console.error('[tables] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new table
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { number, seats = 4, location } = body

    if (!number) {
      return NextResponse.json({ ok: false, error: 'Številka mize je obvezna' }, { status: 400 })
    }

    const existing = await db.table.findUnique({ where: { number: parseInt(number) } })
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Miza s to številko že obstaja' }, { status: 409 })
    }

    const table = await db.table.create({
      data: {
        number: parseInt(number),
        seats: parseInt(seats),
        location: location || null,
      },
    })

    console.log(`[tables] ✓ Nova miza: Miza ${table.number} (${table.seats} sedežev)`)

    return NextResponse.json({
      ok: true,
      message: 'Miza ustvarjena',
      table,
    }, { status: 201 })
  } catch (error) {
    console.error('[tables] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
