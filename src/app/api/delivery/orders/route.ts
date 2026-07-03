import { NextResponse } from 'next/server'
import { generateInitialOrders, generateDeliveryOrder, calculateDeliveryStats, type DeliveryOrder } from '@/lib/delivery'
let ordersStore: DeliveryOrder[] = generateInitialOrders(5)
export async function GET() { return NextResponse.json({ orders: ordersStore.sort((a, b) => b.receivedAt - a.receivedAt), stats: calculateDeliveryStats(ordersStore), platforms: ['wolt', 'uber_eats', 'glovo', 'lastmin', 'qr_direct'] }) }
export async function POST(request: Request) {
  try { const body = await request.json()
    if (body.action === 'new') { const o = generateDeliveryOrder(); ordersStore = [o, ...ordersStore].slice(0, 50); return NextResponse.json({ ok: true, message: `Novo naročilo iz ${o.platformLabel}!`, order: o, stats: calculateDeliveryStats(ordersStore) }) }
    if (body.action === 'status' && body.orderId) { const o = ordersStore.find(o => o.id === body.orderId); if (!o) return NextResponse.json({ ok: false, error: 'Ni najdeno' }, { status: 404 }); o.status = body.status; return NextResponse.json({ ok: true, order: o, stats: calculateDeliveryStats(ordersStore) }) }
    if (body.action === 'auto_accept') { let c = 0; ordersStore.forEach(o => { if (o.status === 'new') { o.status = 'accepted'; c++ } }); return NextResponse.json({ ok: true, accepted: c, stats: calculateDeliveryStats(ordersStore) }) }
    return NextResponse.json({ ok: false, error: 'Neznana akcija' }, { status: 400 })
  } catch { return NextResponse.json({ ok: false, error: 'Error' }, { status: 500 }) }
}
