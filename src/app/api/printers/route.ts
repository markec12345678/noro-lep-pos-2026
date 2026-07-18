import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildReceipt, buildKitchenOrder } from '@/lib/receipt-builder'
import { auditLog } from '@/lib/audit'

/**
 * Printers API — upravljanje tiskalnikov + print jobs
 *
 * GET   /api/printers              — list printers + stats
 * GET   /api/printers?id=X         — single printer z print jobs
 * POST  /api/printers              — add new printer
 * PATCH /api/printers              — update printer (online/offline, settings)
 * DELETE /api/printers?id=X        — remove printer
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const printer = await db.printer.findUnique({
        where: { id },
        include: { printJobs: { orderBy: { createdAt: 'desc' }, take: 20 } },
      })
      if (!printer) return NextResponse.json({ ok: false, error: 'Tiskalnik ni najden' }, { status: 404 })
      return NextResponse.json({ ok: true, printer })
    }

    const printers = await db.printer.findMany({
      include: { _count: { select: { printJobs: true } } },
      orderBy: [{ online: 'desc' }, { name: 'asc' }],
    })

    const stats = {
      total: printers.length,
      online: printers.filter(p => p.online).length,
      offline: printers.filter(p => !p.online).length,
      byStation: printers.reduce((acc, p) => {
        const s = p.station || 'unassigned'
        acc[s] = (acc[s] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return NextResponse.json({ ok: true, count: printers.length, stats, printers })
  } catch (error) {
    console.error('[printers] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — add printer
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type = 'esc_pos', connection = 'network', ipAddress, port = 9100, width = 80, encoding = 'cp852', autoPrint = true, station } = body

    if (!name) return NextResponse.json({ ok: false, error: 'name je obvezen' }, { status: 400 })

    const printer = await db.printer.create({
      data: {
        name,
        type,
        connection,
        ipAddress: ipAddress || null,
        port: parseInt(port),
        width: parseInt(width),
        encoding,
        autoPrint: Boolean(autoPrint),
        station: station || null,
        online: true,
        lastSeen: new Date(),
      },
    })

    console.log(`[printers] ✓ Nov tiskalnik: ${name} | ${connection} ${ipAddress || ''}:${port} | station=${station || 'all'}`)

    return NextResponse.json({ ok: true, message: 'Tiskalnik dodan', printer }, { status: 201 })
  } catch (error) {
    console.error('[printers] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update printer
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, ipAddress, port, width, autoPrint, station, online } = body

    if (!id) return NextResponse.json({ ok: false, error: 'id je obvezen' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress
    if (port !== undefined) updateData.port = parseInt(port)
    if (width !== undefined) updateData.width = parseInt(width)
    if (autoPrint !== undefined) updateData.autoPrint = Boolean(autoPrint)
    if (station !== undefined) updateData.station = station
    if (online !== undefined) {
      updateData.online = Boolean(online)
      updateData.lastSeen = online ? new Date() : null
    }

    const printer = await db.printer.update({ where: { id }, data: updateData })

    return NextResponse.json({ ok: true, message: 'Tiskalnik posodobljen', printer })
  } catch (error) {
    console.error('[printers] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'id je obvezen' }, { status: 400 })

    await db.printer.delete({ where: { id } })
    return NextResponse.json({ ok: true, message: 'Tiskalnik odstranjen' })
  } catch (error) {
    console.error('[printers] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
