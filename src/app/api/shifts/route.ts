import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Shifts API — urnik izmen + labor cost tracking
 *
 * GET   /api/shifts              — list shifts (filter by date, staffId, status)
 * POST  /api/shifts              — create new shift (schedule)
 * PATCH /api/shifts              — update shift (start/complete/cancel) + clock in/out
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (staffId) where.staffId = staffId
    if (status) where.status = status
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.date = { gte: start, lte: end }
    }

    const shifts = await db.shift.findMany({
      where,
      include: { staff: true },
      orderBy: { startTime: 'asc' },
      take: limit,
    })

    // Labor cost calculation
    let totalHours = 0
    let laborCost = 0
    for (const shift of shifts) {
      if (shift.endTime) {
        const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
        const netHours = Math.max(0, hours - shift.breakMinutes / 60)
        totalHours += netHours
        laborCost += netHours * shift.staff.hourlyRate
      } else if (shift.status === 'active') {
        const hours = (Date.now() - shift.startTime.getTime()) / (1000 * 60 * 60)
        totalHours += hours
        laborCost += hours * shift.staff.hourlyRate
      }
    }

    const stats = {
      total: shifts.length,
      scheduled: shifts.filter(s => s.status === 'scheduled').length,
      active: shifts.filter(s => s.status === 'active').length,
      completed: shifts.filter(s => s.status === 'completed').length,
      totalHours: Math.round(totalHours * 10) / 10,
      laborCost: Math.round(laborCost * 100) / 100,
    }

    return NextResponse.json({ ok: true, count: shifts.length, stats, shifts })
  } catch (error) {
    console.error('[shifts] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new shift
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staffId, date, startTime, endTime, breakMinutes = 30, station, notes } = body

    if (!staffId || !date || !startTime) {
      return NextResponse.json({ ok: false, error: 'staffId, date in startTime so obvezni' }, { status: 400 })
    }

    // Preveri da staff obstaja
    const staff = await db.staff.findUnique({ where: { id: staffId } })
    if (!staff) return NextResponse.json({ ok: false, error: 'Oseba ni najdena' }, { status: 404 })

    const shift = await db.shift.create({
      data: {
        staffId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        breakMinutes: parseInt(breakMinutes),
        station: station || null,
        notes: notes || null,
        status: 'scheduled',
      },
      include: { staff: true },
    })

    console.log(`[shifts] ✓ Nova izmena: ${staff.firstName} ${staff.lastName} | ${new Date(startTime).toLocaleString('sl-SI')}`)

    return NextResponse.json({
      ok: true,
      message: 'Izmena ustvarjena',
      shift,
    }, { status: 201 })
  } catch (error) {
    console.error('[shifts] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update shift (start/complete/cancel + clock in/out)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, endTime, station, notes } = body

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })
    }

    const validActions = ['start', 'complete', 'cancel', 'update']
    if (!validActions.includes(action)) {
      return NextResponse.json({ ok: false, error: `Neveljaven action. Dovoljeni: ${validActions.join(', ')}` }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (action === 'start') {
      updateData.status = 'active'
    }

    if (action === 'complete') {
      updateData.status = 'completed'
      updateData.endTime = endTime ? new Date(endTime) : new Date()
    }

    if (action === 'cancel') {
      updateData.status = 'canceled'
    }

    if (action === 'update') {
      if (endTime) updateData.endTime = new Date(endTime)
      if (station) updateData.station = station
      if (notes) updateData.notes = notes
    }

    const shift = await db.shift.update({
      where: { id },
      data: updateData,
      include: { staff: true },
    })

    // Ustvari/posodobi attendance record ob start
    if (action === 'start') {
      await db.attendance.create({
        data: {
          staffId: shift.staffId,
          date: shift.date,
          clockIn: shift.startTime,
          status: 'active',
        },
      })
    }

    // Posodobi attendance ob complete
    if (action === 'complete' && shift.endTime) {
      const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
      const netHours = Math.max(0, hours - shift.breakMinutes / 60)

      await db.attendance.updateMany({
        where: { staffId: shift.staffId, date: shift.date, status: 'active' },
        data: {
          clockOut: shift.endTime,
          totalHours: Math.round(netHours * 100) / 100,
          status: 'completed',
        },
      })
    }

    console.log(`[shifts] ✓ ${shift.staff.firstName} ${shift.staff.lastName}: action=${action}`)

    return NextResponse.json({
      ok: true,
      message: `Izmena ${action} uspešen`,
      shift,
    })
  } catch (error) {
    console.error('[shifts] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
