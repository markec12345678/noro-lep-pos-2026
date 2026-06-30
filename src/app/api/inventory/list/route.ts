import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/inventory/list
 * Vrne vse artikle v inventarju (z opcijskimi filtri)
 *
 * Query params:
 * - category: filter po kategoriji
 * - search: iskanje po imenu
 * - lowStock: true = samo artikli z nizko zalogo
 * - active: true/false
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'
    const active = searchParams.get('active')

    const where: Record<string, unknown> = {}

    if (category) where.category = category
    if (search) where.name = { contains: search }
    if (active !== null && active !== undefined) where.active = active === 'true'
    if (lowStock) {
      where.stock = { lte: 0 }
    }

    const items = await db.inventoryItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      take: 500, // Limit za safety
    })

    // Statistika
    const total = await db.inventoryItem.count({ where })
    const lowStockCount = await db.inventoryItem.count({
      where: { stock: { lte: 0 }, active: true },
    })
    const totalValue = items.reduce((sum, item) => sum + (item.stock * item.purchasePrice), 0)

    // By category
    const byCategory: Record<string, number> = {}
    for (const item of items) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1
    }

    return NextResponse.json({
      items,
      total,
      lowStockCount,
      totalValue: totalValue.toFixed(2),
      byCategory,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
