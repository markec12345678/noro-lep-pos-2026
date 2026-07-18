import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Printers Seed — ustvari 3 demo printerje
 * POST /api/printers/seed
 */
export async function POST() {
  try {
    const existing = await db.printer.count()
    if (existing > 0) {
      return NextResponse.json({ ok: true, message: `Že obstaja ${existing} tiskalnikov.`, count: existing })
    }

    const printers = [
      { name: 'Blagajna (Receipt)', station: 'receipt', ipAddress: '192.168.1.100', port: 9100, width: 80 },
      { name: 'Kuhinja (Hot)', station: 'hot', ipAddress: '192.168.1.101', port: 9100, width: 80 },
      { name: 'Bar', station: 'bar', ipAddress: '192.168.1.102', port: 9100, width: 58 },
    ]

    const created = await db.printer.createMany({
      data: printers.map(p => ({
        ...p,
        type: 'esc_pos',
        connection: 'network',
        encoding: 'cp852',
        autoPrint: true,
        online: true,
        lastSeen: new Date(),
      })),
    })

    console.log(`[printers/seed] ✓ ${created.count} tiskalnikov ustvarjenih`)

    return NextResponse.json({
      ok: true,
      message: `${created.count} tiskalnikov ustvarjenih`,
      count: created.count,
      printers,
    }, { status: 201 })
  } catch (error) {
    console.error('[printers/seed] napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
