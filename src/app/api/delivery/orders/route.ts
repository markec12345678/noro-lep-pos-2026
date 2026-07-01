import { NextResponse } from 'next/server'
import { generateInitialOrders, generateDeliveryOrder, calculateDeliveryStats, type DeliveryOrder } from '@/lib/delivery'

/**
 * In-memory storage (demo only — v produkciji: Redis/DB)
 */
let ordersStore: DeliveryOrder[] = generateInitialOrders(5)

/**
 * GET /api/delivery/orders
 * Vrne vsa dostavna naročila + statistiko
 *
 * Query: ?status=new|preparing|ready|delivered
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let orders = ordersStore
  if (status) {
    orders = orders.filter(o => o.status === status)
  }

  const stats = calculateDeliveryStats(ordersStore)

  return NextResponse.json({
    orders: orders.sort((a, b) => b.receivedAt - a.receivedAt),
    stats,
    platforms: ['wolt', 'uber_eats', 'glovo', 'lastmin', 'qr_direct'],
    note: 'Demo mode — naročila so simulirana. V produkciji: poveži z Wolt Partner API + Uber Eats API.',
  })
}

/**
 * POST /api/delivery/orders
 * Ustvari novo dostavno naročilo (simulirano iz platforme)
 * ali spremeni status obstoječega
 *
 * Body:
 * { "action": "new" } — generiraj novo naključno naročilo
 * { "action": "status", "orderId": "DEL-xxx", "status": "accepted" } — spremeni status
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.action === 'new') {
      // Generiraj novo naročilo iz "platforme"
      const newOrder = generateDeliveryOrder()
      ordersStore = [newOrder, ...ordersStore].slice(0, 50) // max 50

      const stats = calculateDeliveryStats(ordersStore)
      return NextResponse.json({
        ok: true,
        message: `Novo naročilo iz ${newOrder.platformLabel}!`,
        order: newOrder,
        stats,
      })
    }

    if (body.action === 'status' && body.orderId) {
      const order = ordersStore.find(o => o.id === body.orderId)
      if (!order) {
        return NextResponse.json({ ok: false, error: 'Naročilo ni najdeno' }, { status: 404 })
      }

      order.status = body.status

      const stats = calculateDeliveryStats(ordersStore)
      return NextResponse.json({
        ok: true,
        message: `Naročilo ${order.id} → ${body.status}`,
        order,
        stats,
      })
    }

    if (body.action === 'auto_accept') {
      // Samodejno sprejmi vsa nova naročila
      let accepted = 0
      ordersStore.forEach(o => {
        if (o.status === 'new') {
          o.status = 'accepted'
          accepted++
        }
      })

      const stats = calculateDeliveryStats(ordersStore)
      return NextResponse.json({
        ok: true,
        message: `Samodejno sprejetih ${accepted} naročil`,
        accepted,
        stats,
      })
    }

    return NextResponse.json({ ok: false, error: 'Neznana akcija' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
