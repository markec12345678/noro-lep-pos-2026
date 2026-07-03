import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * KDS API — Kitchen Display System
 *
 * GET   /api/kds                — KDS board (active orders z items za kuhinjo)
 * GET   /api/kds?station=hot    — samo za določeno postajo
 * PATCH /api/kds                — update item status (new → preparing → ready → served)
 *
 * KDS flow:
 *   1. POS ustvari order → KDS dobi "new_order" event (socket.io)
 *   2. Kuhar klikne "Start" → item status: new → preparing
 *   3. Kuhar klikne "Done" → item status: preparing → ready
 *   4. Natakar klika "Served" → item status: ready → served
 *   5. Ko vsi items served → order status: served → paid
 */

// GET — KDS board
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const station = searchParams.get('station') // hot | cold | bar | dessert
    const limit = parseInt(searchParams.get('limit') || '20')

    // Pridobi vse active orders z items ki še niso served
    const orders = await db.order.findMany({
      where: {
        status: { in: ['sent', 'preparing', 'ready'] },
      },
      include: {
        items: {
          where: {
            status: { in: ['new', 'preparing', 'ready'] },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    // Filter by station (če je podan)
    let filteredOrders = orders
    if (station) {
      filteredOrders = orders
        .map(o => ({
          ...o,
          items: o.items.filter(i => {
            // Auto-detect station from item name
            const detectedStation = detectStation(i.itemName)
            return detectedStation === station
          }),
        }))
        .filter(o => o.items.length > 0)
    }

    // Group by status
    const board = {
      new: filteredOrders.filter(o => o.items.some(i => i.status === 'new')),
      preparing: filteredOrders.filter(o => o.items.some(i => i.status === 'preparing') && !o.items.some(i => i.status === 'new')),
      ready: filteredOrders.filter(o => o.items.every(i => i.status === 'ready')),
    }

    // Stats
    const allItems = filteredOrders.flatMap(o => o.items)
    const stats = {
      totalOrders: filteredOrders.length,
      totalItems: allItems.length,
      new: allItems.filter(i => i.status === 'new').length,
      preparing: allItems.filter(i => i.status === 'preparing').length,
      ready: allItems.filter(i => i.status === 'ready').length,
      avgWaitTime: filteredOrders.length > 0
        ? Math.round((Date.now() - Math.min(...filteredOrders.map(o => o.createdAt.getTime())) / filteredOrders.length) / 1000 / 60 * 10) / 10
        : 0,
      longestWaiting: filteredOrders.length > 0
        ? Math.round((Date.now() - Math.min(...filteredOrders.map(o => o.createdAt.getTime()))) / 1000 / 60)
        : 0,
      byStation: {
        hot: allItems.filter(i => detectStation(i.itemName) === 'hot').length,
        cold: allItems.filter(i => detectStation(i.itemName) === 'cold').length,
        bar: allItems.filter(i => detectStation(i.itemName) === 'bar').length,
        dessert: allItems.filter(i => detectStation(i.itemName) === 'dessert').length,
      },
    }

    return NextResponse.json({
      ok: true,
      station: station || 'all',
      stats,
      board,
    })
  } catch (error) {
    console.error('[kds] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update item status (KDS action)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { itemId, action, staffName } = body

    if (!itemId || !action) {
      return NextResponse.json({ ok: false, error: 'itemId in action sta obvezna' }, { status: 400 })
    }

    const validActions = ['start', 'done', 'serve', 'cancel', 'recall']
    if (!validActions.includes(action)) {
      return NextResponse.json({ ok: false, error: `Neveljaven action. Dovoljeni: ${validActions.join(', ')}` }, { status: 400 })
    }

    // Map actions to statuses
    const statusMap: Record<string, string> = {
      start: 'preparing',
      done: 'ready',
      serve: 'served',
      cancel: 'canceled',
      recall: 'new',
    }

    const newStatus = statusMap[action]

    // Update item
    const item = await db.orderItem.update({
      where: { id: itemId },
      data: { status: newStatus },
    })

    // Check if all items in order are served → update order status
    const allItems = await db.orderItem.findMany({ where: { orderId: item.orderId } })
    const allServed = allItems.every(i => i.status === 'served')
    const anyPreparing = allItems.some(i => i.status === 'preparing')
    const anyNew = allItems.some(i => i.status === 'new')
    const anyReady = allItems.some(i => i.status === 'ready')

    let orderStatus = 'sent'
    if (allServed) orderStatus = 'served'
    else if (anyPreparing) orderStatus = 'preparing'
    else if (anyReady) orderStatus = 'ready'
    else if (anyNew) orderStatus = 'sent'

    const order = await db.order.update({
      where: { id: item.orderId },
      data: { status: orderStatus },
    })

    console.log(`[kds] ✓ Item ${itemId} → ${newStatus} | order=${order.orderNumber} → ${orderStatus} | by=${staffName || 'unknown'}`)

    // TODO: emit socket.io event to pos-realtime service
    // (would need HTTP call to socket service or shared Redis)
    // For now, frontend can poll or use socket.io directly

    return NextResponse.json({
      ok: true,
      message: `Item ${action}d`,
      item: { ...item, status: newStatus },
      order: { ...order, status: orderStatus },
      allServed,
    })
  } catch (error) {
    console.error('[kds] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Auto-detect kitchen station from item name
function detectStation(itemName: string): string {
  const name = itemName.toLowerCase()
  // Bar (pijače)
  if (name.match(/pivo|vino|spritz|cocktail|limonad|sok|cola|water|kava|espresso|cappuccino|whiskey|vodka|gin|rakija|pijač/)) return 'bar'
  // Dessert
  if (name.match(/tort|sladica|tiramisu|panna|cheesecake|ice|sladoled|pudding|creme|chocolate|čokolad/)) return 'dessert'
  // Cold (predjedi, solate)
  if (name.match(/solat|predjed|pršut|brusket|carpaccio|tartar|sushi/)) return 'cold'
  // Default: hot (glavne jedi, pice, burgerji)
  return 'hot'
}
