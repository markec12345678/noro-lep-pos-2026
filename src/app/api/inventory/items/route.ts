import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/inventory/items
 * Vrne vse artikle (alias za /api/inventory/list, brez statistike)
 *
 * Query params:
 * - category, subcategory, search, active, lowStock
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const search = searchParams.get('search')
    const active = searchParams.get('active')
    const lowStock = searchParams.get('lowStock') === 'true'

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (subcategory) where.subcategory = subcategory
    if (search) where.name = { contains: search }
    if (active !== null && active !== undefined) where.active = active === 'true'
    if (lowStock) where.stock = { lte: 0 }

    const items = await db.inventoryItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      take: 500,
    })

    return NextResponse.json({ items, total: items.length })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * POST /api/inventory/items
 * Ročni vnos novega artikla (za artikle ki jih ni v seed bazi)
 *
 * Body:
 * {
 *   "name": "Trški pršut (posebna cena)",
 *   "category": "Predjedi",
 *   "subcategory": "Suho meso", (optional)
 *   "unit": "kg",
 *   "purchasePrice": 28.0,
 *   "salePrice": 9.0, (optional)
 *   "stock": 5, (optional, default 0)
 *   "minStock": 2,
 *   "supplier": "Jata Emona", (optional)
 *   "barcode": "1234567890", (optional)
 *   "description": "Posebna kvaliteta" (optional)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validacija obveznih polj
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Ime artikla je obvezno',
      }, { status: 400 })
    }

    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Kategorija je obvezna',
      }, { status: 400 })
    }

    // Preveri ali artikel že obstaja (po imenu)
    const existing = await db.inventoryItem.findFirst({
      where: { name: { equals: body.name.trim() } },
    })

    if (existing) {
      return NextResponse.json({
        ok: false,
        error: `Artikel "${body.name}" že obstaja (ID: ${existing.id})`,
        existingItem: existing,
      }, { status: 409 })
    }

    // Ustvari nov artikel
    const newItem = await db.inventoryItem.create({
      data: {
        name: body.name.trim(),
        category: body.category.trim(),
        subcategory: body.subcategory?.trim() || null,
        unit: body.unit || 'kos',
        purchasePrice: Number(body.purchasePrice) || 0,
        salePrice: body.salePrice != null ? Number(body.salePrice) : null,
        stock: Number(body.stock) || 0,
        minStock: Number(body.minStock) || 0,
        maxStock: body.maxStock != null ? Number(body.maxStock) : null,
        supplier: body.supplier?.trim() || null,
        barcode: body.barcode?.trim() || null,
        description: body.description?.trim() || null,
        active: body.active !== false,
      },
    })

    return NextResponse.json({
      ok: true,
      message: `Artikel "${newItem.name}" uspešno dodan.`,
      item: newItem,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
