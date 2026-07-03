import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Seed tables — ustvari 12 miz za demo
 * POST /api/tables/seed
 */
export async function POST() {
  try {
    // Preveri če že obstajajo
    const existing = await db.table.count()
    if (existing > 0) {
      return NextResponse.json({
        ok: true,
        message: `Že obstaja ${existing} miz. Uporabi PATCH za posodobitev.`,
        count: existing,
      })
    }

    // Ustvari 12 miz
    const tablesData = [
      { number: 1, seats: 6, location: 'Notranjost' },
      { number: 2, seats: 2, location: 'Notranjost' },
      { number: 3, seats: 4, location: 'Notranjost' },
      { number: 4, seats: 4, location: 'Notranjost' },
      { number: 5, seats: 4, location: 'Notranjost' },
      { number: 6, seats: 2, location: 'Notranjost' },
      { number: 7, seats: 2, location: 'Terasa' },
      { number: 8, seats: 6, location: 'Terasa' },
      { number: 9, seats: 2, location: 'Terasa' },
      { number: 10, seats: 4, location: 'Terasa' },
      { number: 11, seats: 8, location: 'VIP' },
      { number: 12, seats: 2, location: 'Bar' },
    ]

    const created = await db.table.createMany({
      data: tablesData,
    })

    console.log(`[tables/seed] ✓ Ustvarjenih ${created.count} miz`)

    return NextResponse.json({
      ok: true,
      message: `Ustvarjenih ${created.count} miz`,
      count: created.count,
      tables: tablesData,
    }, { status: 201 })
  } catch (error) {
    console.error('[tables/seed] napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
