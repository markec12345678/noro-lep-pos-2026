import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/audit'

/**
 * Suppliers API — CRUD za dobavitelje
 *
 * GET    /api/suppliers              — list (filter by active, search)
 * GET    /api/suppliers?id=X         — single supplier
 * POST   /api/suppliers              — create supplier
 * PATCH  /api/suppliers              — update supplier
 * DELETE /api/suppliers?id=X         — delete supplier
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const active = searchParams.get('active')
    const search = searchParams.get('search')

    if (id) {
      const supplier = await db.supplier.findUnique({ where: { id } })
      if (!supplier) return NextResponse.json({ ok: false, error: 'Dobavitelj ni najden' }, { status: 404 })
      return NextResponse.json({ ok: true, supplier })
    }

    const where: Record<string, unknown> = {}
    if (active !== null) where.active = active !== 'false'
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ ok: true, count: suppliers.length, suppliers })
  } catch (error) {
    console.error('[suppliers] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, address, contactPerson, notes, paymentTerms, leadTimeDays } = body

    if (!name) return NextResponse.json({ ok: false, error: 'name je obvezen' }, { status: 400 })

    // Email unique check
    if (email) {
      const existing = await db.supplier.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ ok: false, error: 'Dobavitelj s tem emailom že obstaja' }, { status: 409 })
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        contactPerson: body.contactPerson || null,
        notes: body.notes || null,
      },
    })

    await auditLog({
      entityType: 'inventory',
      entityId: supplier.id,
      entityName: supplier.name,
      action: 'create',
      performedBy: 'system',
      metadata: { type: 'supplier', name, email, phone },
    })

    console.log(`[suppliers] ✓ Nov dobavitelj: ${name}`)

    return NextResponse.json({ ok: true, message: 'Dobavitelj dodan', supplier }, { status: 201 })
  } catch (error) {
    console.error('[suppliers] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, email, phone, address } = body

    if (!id) return NextResponse.json({ ok: false, error: 'id je obvezen' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (email !== undefined) updateData.email = email || null
    if (phone !== undefined) updateData.phone = phone || null
    if (address !== undefined) updateData.address = address || null

    const supplier = await db.supplier.update({ where: { id }, data: updateData })

    return NextResponse.json({ ok: true, message: 'Dobavitelj posodobljen', supplier })
  } catch (error) {
    console.error('[suppliers] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'id je obvezen' }, { status: 400 })

    const supplier = await db.supplier.delete({ where: { id } })

    await auditLog({
      entityType: 'inventory',
      entityId: id,
      entityName: supplier.name,
      action: 'delete',
      severity: 'warning',
    })

    return NextResponse.json({ ok: true, message: `Dobavitelj ${supplier.name} izbrisan` })
  } catch (error) {
    console.error('[suppliers] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
