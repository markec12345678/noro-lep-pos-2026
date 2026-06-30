import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/inventory/items/[id]
 * Vrne en artikel po ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.inventoryItem.findUnique({ where: { id } })

    if (!item) {
      return NextResponse.json({
        ok: false,
        error: 'Artikel ni najden',
      }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * PUT /api/inventory/items/[id]
 * Posodobi artikel (celoten ali delni update)
 *
 * Body (katerokoli polje):
 * {
 *   "name": "Novo ime",
 *   "price": 15.0,
 *   "stock": 10,
 *   "minStock": 3,
 *   ...
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Preveri ali artikel obstaja
    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({
        ok: false,
        error: 'Artikel ni najden',
      }, { status: 404 })
    }

    // Pripravi podatke za posodobitev (samo dovoljena polja)
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'category', 'subcategory', 'unit', 'purchasePrice', 'salePrice',
      'stock', 'minStock', 'maxStock', 'supplier', 'barcode', 'description', 'active',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'name' || field === 'category' || field === 'subcategory' ||
            field === 'unit' || field === 'supplier' || field === 'barcode' ||
            field === 'description') {
          updateData[field] = typeof body[field] === 'string' ? body[field].trim() : body[field]
        } else if (field === 'active') {
          updateData[field] = Boolean(body[field])
        } else if (field === 'purchasePrice' || field === 'salePrice' ||
                   field === 'stock' || field === 'minStock' || field === 'maxStock') {
          updateData[field] = body[field] === null ? null : Number(body[field])
        }
      }
    }

    // Če spreminjamo ime, preveri da ni duplikat
    if (updateData.name && updateData.name !== existing.name) {
      const duplicate = await db.inventoryItem.findFirst({
        where: { name: updateData.name as string, NOT: { id } },
      })
      if (duplicate) {
        return NextResponse.json({
          ok: false,
          error: `Artikel z imenom "${updateData.name}" že obstaja`,
        }, { status: 409 })
      }
    }

    const updated = await db.inventoryItem.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ok: true,
      message: `Artikel "${updated.name}" uspešno posodobljen.`,
      item: updated,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * DELETE /api/inventory/items/[id]
 * Izbriše artikel (soft delete — nastavi active=false)
 * ali hard delete (če ?hard=true)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({
        ok: false,
        error: 'Artikel ni najden',
      }, { status: 404 })
    }

    if (hard) {
      // Hard delete — trajno izbriši
      await db.inventoryItem.delete({ where: { id } })
      return NextResponse.json({
        ok: true,
        message: `Artikel "${existing.name}" trajno izbrisan.`,
        deleted: true,
      })
    } else {
      // Soft delete — nastavi active=false
      const updated = await db.inventoryItem.update({
        where: { id },
        data: { active: false },
      })
      return NextResponse.json({
        ok: true,
        message: `Artikel "${existing.name}" deaktiviran (active=false). Uporabi ?hard=true za trajen izbris.`,
        item: updated,
      })
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
