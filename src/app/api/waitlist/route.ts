import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Waitlist API — čakalna vrsta management
 *
 * GET   /api/waitlist          — list waiting guests (sorted by position)
 * POST  /api/waitlist          — add guest to waitlist (auto position)
 * PATCH /api/waitlist          — notify (SMS prost) / seat / leave
 */

// GET — list waitlist
export async function GET() {
  try {
    const waitlist = await db.waitlist.findMany({
      where: { status: { in: ['waiting', 'notified'] } },
      include: { table: true },
      orderBy: { position: 'asc' },
    })

    const stats = {
      total: waitlist.length,
      waiting: waitlist.filter(w => w.status === 'waiting').length,
      notified: waitlist.filter(w => w.status === 'notified').length,
      avgWait: waitlist.length > 0
        ? Math.round(waitlist.reduce((s, w) => s + w.estimatedWait, 0) / waitlist.length)
        : 0,
      totalGuests: waitlist.reduce((s, w) => s + w.guests, 0),
    }

    return NextResponse.json({ ok: true, count: waitlist.length, stats, waitlist })
  } catch (error) {
    console.error('[waitlist] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — add to waitlist
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { guestName, phone, guests = 2, notes } = body

    if (!guestName || !phone) {
      return NextResponse.json({ ok: false, error: 'guestName in phone sta obvezna' }, { status: 400 })
    }

    // Auto position = max + 1
    const maxResult = await db.waitlist.aggregate({
      where: { status: { in: ['waiting', 'notified'] } },
      _max: { position: true },
    })
    const position = (maxResult._max?.position || 0) + 1

    // AI estimated wait (based on position)
    const estimatedWait = Math.min(15 + (position - 1) * 8, 60)

    const entry = await db.waitlist.create({
      data: {
        position,
        guestName,
        phone,
        guests: parseInt(guests),
        estimatedWait,
        notes: notes || null,
      },
      include: { table: true },
    })

    console.log(`[waitlist] ✓ ${guestName} dodan na pozicijo #${position} | ${guests} gostov | ~${estimatedWait}min`)

    return NextResponse.json({
      ok: true,
      message: `Dodan na čakalno vrsto (#${position})`,
      entry,
    }, { status: 201 })
  } catch (error) {
    console.error('[waitlist] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — notify (SMS prost) / seat / leave
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, tableId } = body

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })
    }

    const validActions = ['notify', 'seat', 'leave']
    if (!validActions.includes(action)) {
      return NextResponse.json({ ok: false, error: `Neveljaven action. Dovoljeni: ${validActions.join(', ')}` }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (action === 'notify') {
      updateData.status = 'notified'
      updateData.notified = true
      // TODO: send SMS "Miza prosta! Prispeti v 15 minutah."
    }

    if (action === 'seat') {
      updateData.status = 'seated'
      updateData.seatedAt = new Date()
      updateData.tableId = tableId || null
      // Posodobi mizo na occupied
      if (tableId) {
        await db.table.update({ where: { id: tableId }, data: { status: 'occupied' } })
      }
    }

    if (action === 'leave') {
      updateData.status = 'left'
    }

    const entry = await db.waitlist.update({
      where: { id },
      data: updateData,
      include: { table: true },
    })

    // Če je seat/leave, renumber preostale pozicije
    if (action === 'seat' || action === 'leave') {
      const remaining = await db.waitlist.findMany({
        where: { status: { in: ['waiting', 'notified'] } },
        orderBy: { position: 'asc' },
      })
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].position !== i + 1) {
          await db.waitlist.update({
            where: { id: remaining[i].id },
            data: { position: i + 1 },
          })
        }
      }
    }

    console.log(`[waitlist] ✓ Pozicija #${entry.position}: action=${action}`)

    return NextResponse.json({
      ok: true,
      message: `Waitlist ${action} uspešen`,
      entry,
    })
  } catch (error) {
    console.error('[waitlist] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
