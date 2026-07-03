import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Reservations API — booking management
 *
 * GET    /api/reservations              — list (filter by status, date, phone)
 * GET    /api/reservations?id=X         — single reservation
 * POST   /api/reservations              — create new reservation
 * PATCH  /api/reservations              — update status (confirm/seat/complete/cancel)
 * DELETE /api/reservations?id=X         — cancel reservation
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const date = searchParams.get('date') // YYYY-MM-DD
    const phone = searchParams.get('phone')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (id) {
      const reservation = await db.reservation.findUnique({
        where: { id },
        include: { table: true },
      })
      if (!reservation) return NextResponse.json({ ok: false, error: 'Rezervacija ni najdena' }, { status: 404 })
      return NextResponse.json({ ok: true, reservation })
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (phone) where.phone = { contains: phone }
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.date = { gte: start, lte: end }
    }

    const reservations = await db.reservation.findMany({
      where,
      include: { table: true },
      orderBy: { date: 'asc' },
      take: limit,
    })

    const stats = {
      total: reservations.length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      seated: reservations.filter(r => r.status === 'seated').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      late: reservations.filter(r => r.status === 'late').length,
      totalGuests: reservations.reduce((s, r) => s + r.guests, 0),
    }

    return NextResponse.json({ ok: true, count: reservations.length, stats, reservations })
  } catch (error) {
    console.error('[reservations] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new reservation
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { guestName, phone, email, guests = 2, date, duration = 120, tableId, tableNumber, source = 'phone', notes } = body

    if (!guestName || !phone || !date) {
      return NextResponse.json({ ok: false, error: 'guestName, phone in date so obvezni' }, { status: 400 })
    }

    // Generiraj res number
    const count = await db.reservation.count()
    const resNumber = `RES-2026-${String(count + 1).padStart(4, '0')}`

    const reservation = await db.reservation.create({
      data: {
        resNumber,
        guestName,
        phone,
        email: email || null,
        guests: parseInt(guests),
        date: new Date(date),
        duration: parseInt(duration),
        tableId: tableId || null,
        tableNumber: tableNumber || null,
        source,
        notes: notes || null,
      },
      include: { table: true },
    })

    // Če je dodeljena miza, posodobi status na "reserved"
    if (tableId) {
      await db.table.update({
        where: { id: tableId },
        data: { status: 'reserved' },
      })
    }

    console.log(`[reservations] ✓ Nova rezervacija: ${resNumber} | ${guestName} | ${guests} gostov | ${new Date(date).toLocaleString('sl-SI')}`)

    return NextResponse.json({
      ok: true,
      message: 'Rezervacija ustvarjena',
      reservation,
    }, { status: 201 })
  } catch (error) {
    console.error('[reservations] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update reservation status
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, tableId, notes, reminderSent } = body

    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    const validStatuses = ['confirmed', 'seated', 'completed', 'canceled', 'no_show', 'late']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: `Neveljaven status. Dovoljeni: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (tableId !== undefined) updateData.tableId = tableId
    if (notes) updateData.notes = notes
    if (reminderSent !== undefined) updateData.reminderSent = reminderSent
    if (status === 'seated') updateData.seatedAt = new Date()
    if (status === 'completed') updateData.completedAt = new Date()

    const reservation = await db.reservation.update({
      where: { id },
      data: updateData,
      include: { table: true },
    })

    // Status transitions za mizo
    if (status === 'seated' && reservation.tableId) {
      await db.table.update({ where: { id: reservation.tableId }, data: { status: 'occupied' } })
    }
    if ((status === 'completed' || status === 'canceled' || status === 'no_show') && reservation.tableId) {
      await db.table.update({ where: { id: reservation.tableId }, data: { status: 'free' } })
    }

    console.log(`[reservations] ✓ ${reservation.resNumber} posodobljena: status=${status || 'n/a'}`)

    return NextResponse.json({ ok: true, message: 'Rezervacija posodobljena', reservation })
  } catch (error) {
    console.error('[reservations] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — cancel reservation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    const reservation = await db.reservation.update({
      where: { id },
      data: { status: 'canceled' },
    })

    // Sprosti mizo
    if (reservation.tableId) {
      await db.table.update({ where: { id: reservation.tableId }, data: { status: 'free' } })
    }

    console.log(`[reservations] ✓ ${reservation.resNumber} preklicana`)

    return NextResponse.json({ ok: true, message: 'Rezervacija preklicana', reservation })
  } catch (error) {
    console.error('[reservations] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
