import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SEED_ITEMS, SEED_SUPPLIERS } from '@/lib/seed-data'

/**
 * POST /api/inventory/seed
 * Inicializira zalogo s ~200 slovenskimi artikli (stock=0)
 * Uporabnik nato samo vnese dobavnice (količine)
 */
export async function POST(request: Request) {
  try {
    const { force } = await request.json().catch(() => ({ force: false }))

    // Preveri ali že imamo artikle
    const existingCount = await db.inventoryItem.count()

    if (existingCount > 0 && !force) {
      return NextResponse.json({
        ok: false,
        message: `Inventar že vsebuje ${existingCount} artiklov. Uporabi force: true za ponovno inicializacijo.`,
        existingCount,
      }, { status: 409 })
    }

    // Če force, izbriši obstoječe
    if (force && existingCount > 0) {
      await db.inventoryItem.deleteMany({})
    }

    // Ustvari dobavitelje (če še ne obstajajo)
    for (const supplier of SEED_SUPPLIERS) {
      const exists = await db.supplier.findFirst({ where: { name: supplier.name } })
      if (!exists) {
        await db.supplier.create({ data: supplier })
      }
    }

    // Ustvari artikle (stock=0, minStock nastavljen)
    const created = await db.inventoryItem.createMany({
      data: SEED_ITEMS.map(item => ({
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || null,
        unit: item.unit,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice || null,
        stock: 0, // Zaloga = 0, uporabnik vnese dobavnice
        minStock: item.minStock,
        supplier: item.supplier || null,
        description: item.description || null,
        active: true,
      })),
    })

    // Statistika
    const totalItems = await db.inventoryItem.count()
    const byCategory: Record<string, number> = {}
    const allItems = await db.inventoryItem.findMany({ select: { category: true } })
    for (const item of allItems) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1
    }

    return NextResponse.json({
      ok: true,
      message: `Uspešno dodanih ${created.count} artiklov z zalogo 0.`,
      totalItems,
      byCategory,
      suppliersCreated: SEED_SUPPLIERS.length,
      note: 'Vsi artikli imajo zalogo 0. Uporabnik vnese samo dobavnice (količine) preko /api/inventory/delivery.',
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET /api/inventory/seed
 * Vrne statistiko seed podatkov (brez dejanskega seed-anja)
 */
export async function GET() {
  const stats: Record<string, number> = {}
  for (const item of SEED_ITEMS) {
    stats[item.category] = (stats[item.category] || 0) + 1
  }

  return NextResponse.json({
    totalItems: SEED_ITEMS.length,
    totalSuppliers: SEED_SUPPLIERS.length,
    byCategory: stats,
    description: 'Slovenski restavracijski inventar — ~200 artiklov v 19 kategorijah. Vsi z zalogo 0.',
    categories: Object.keys(stats),
    note: 'POST na /api/inventory/seed za inicializacijo. Vsi artikli bodo imeli stock=0.',
  })
}
