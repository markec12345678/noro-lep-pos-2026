import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Inventory Transactions API — sledenje stock movements
 *
 * GET   /api/inventory/transactions   — list transactions (filter by type, itemId, date)
 * POST  /api/inventory/transactions   — create transaction (auto update stock)
 *
 * Tipi transakcij:
 * - order: poraba ob order (direction=out)
 * - delivery: dobava (direction=in)
 * - waste: odpad (direction=out)
 * - adjustment: popravitev inventure (direction=in ali out)
 * - transfer: premik med lokacijami (direction=out)
 * - return: vračilo (direction=in)
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const direction = searchParams.get('direction')
    const itemId = searchParams.get('itemId')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (direction) where.direction = direction
    if (itemId) where.itemId = itemId
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.createdAt = { gte: start, lte: end }
    }

    const transactions = await db.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Stats
    const totalIn = transactions
      .filter(t => t.direction === 'in')
      .reduce((s, t) => s + t.totalCost, 0)
    const totalOut = transactions
      .filter(t => t.direction === 'out')
      .reduce((s, t) => s + t.totalCost, 0)

    const byType = transactions.reduce((acc, t) => {
      if (!acc[t.type]) acc[t.type] = { count: 0, value: 0 }
      acc[t.type].count++
      acc[t.type].value += t.totalCost
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    return NextResponse.json({
      ok: true,
      count: transactions.length,
      stats: {
        totalIn: Math.round(totalIn * 100) / 100,
        totalOut: Math.round(totalOut * 100) / 100,
        net: Math.round((totalIn - totalOut) * 100) / 100,
        byType,
      },
      transactions,
    })
  } catch (error) {
    console.error('[inventory/transactions] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create transaction (auto update stock)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemId, itemName, type, direction, quantity, unit = 'kos', unitCost = 0, reason, orderId, staffId, staffName } = body

    if (!itemName || !type || !direction || !quantity) {
      return NextResponse.json({
        ok: false,
        error: 'itemName, type, direction in quantity so obvezni',
      }, { status: 400 })
    }

    const validTypes = ['order', 'delivery', 'waste', 'adjustment', 'transfer', 'return']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        ok: false,
        error: `Neveljaven type. Dovoljeni: ${validTypes.join(', ')}`,
      }, { status: 400 })
    }

    const validDirections = ['in', 'out']
    if (!validDirections.includes(direction)) {
      return NextResponse.json({
        ok: false,
        error: `Neveljaven direction. Dovoljeni: ${validDirections.join(', ')}`,
      }, { status: 400 })
    }

    const qty = parseFloat(quantity)
    const cost = parseFloat(unitCost)
    const totalCost = qty * cost

    // Pridobi trenutno stanje zaloge (če je itemId podan)
    let balanceAfter = 0
    if (itemId) {
      const item = await db.inventoryItem.findUnique({ where: { id: itemId } })
      if (item) {
        const change = direction === 'in' ? qty : -qty
        const newStock = Math.max(0, item.stock + change)

        // Posodobi stock na InventoryItem
        await db.inventoryItem.update({
          where: { id: itemId },
          data: { stock: newStock },
        })

        balanceAfter = newStock
      }
    }

    // Ustvari transakcijo
    const transaction = await db.inventoryTransaction.create({
      data: {
        itemId: itemId || null,
        itemName,
        type,
        direction,
        quantity: qty,
        unit,
        unitCost: cost,
        totalCost: Math.round(totalCost * 100) / 100,
        reason: reason || null,
        orderId: orderId || null,
        staffId: staffId || null,
        staffName: staffName || null,
        balanceAfter: Math.round(balanceAfter * 100) / 100,
      },
    })

    console.log(`[inventory/transactions] ✓ ${type} ${direction} ${qty}${unit} ${itemName} | €${totalCost.toFixed(2)} | balance=${balanceAfter}`)

    return NextResponse.json({
      ok: true,
      message: 'Transakcija ustvarjena',
      transaction,
      stockAfter: balanceAfter,
    }, { status: 201 })
  } catch (error) {
    console.error('[inventory/transactions] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
