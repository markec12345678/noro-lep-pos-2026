import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Orders API — core POS order management
 *
 * GET  /api/orders           — list orders (filter by status, table, date)
 * GET  /api/orders?id=X      — single order z items
 * POST /api/orders           — create new order (POS, QR, takeaway)
 * PATCH /api/orders          — update order status (KDS flow), add payment
 */

// GET — list orders or single order
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const tableId = searchParams.get('tableId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Single order z items
    if (id) {
      const order = await db.order.findUnique({
        where: { id },
        include: { items: true, table: true },
      })
      if (!order) return NextResponse.json({ ok: false, error: 'Order ni najden' }, { status: 404 })
      return NextResponse.json({ ok: true, order })
    }

    // List z optional filtri
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (tableId) where.tableId = tableId

    const orders = await db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      ok: true,
      count: orders.length,
      orders,
    })
  } catch (error) {
    console.error('[orders] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new order
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tableId, tableNumber, channel = 'dine_in', items, serverName, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Items so obvezni' }, { status: 400 })
    }

    // Generiraj order number (ORD-YYYY-XXXX)
    const year = new Date().getFullYear()
    const count = await db.order.count()
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(4, '0')}`

    // Izračunaj subtotal, tax, total
    let subtotal = 0
    let tax = 0
    const orderItems = items.map((item: { itemName: string; itemId?: string; qty: number; unitPrice: number; taxRate?: number; notes?: string }) => {
      const qty = item.qty || 1
      const unitPrice = item.unitPrice || 0
      const totalPrice = qty * unitPrice
      const taxRate = item.taxRate || 22
      subtotal += totalPrice
      tax += totalPrice * (taxRate / 100)
      return {
        itemName: item.itemName,
        itemId: item.itemId || null,
        qty,
        unitPrice,
        totalPrice,
        taxRate,
        notes: item.notes || null,
      }
    })

    const total = subtotal + tax

    // Ustvari order z items v transakciji
    const order = await db.order.create({
      data: {
        orderNumber,
        tableId: tableId || null,
        tableNumber: tableNumber || null,
        channel,
        serverName: serverName || null,
        notes: notes || null,
        subtotal,
        tax,
        total,
        items: { create: orderItems },
      },
      include: { items: true },
    })

    // Če je dine_in in ima tableId, posodobi table status na "occupied"
    if (tableId && channel === 'dine_in') {
      await db.table.update({
        where: { id: tableId },
        data: { status: 'occupied' },
      })
    }

    // Samodejno odbij zalogo za vsak order item (inventory transaction)
    for (const item of order.items) {
      // Poišči InventoryItem po itemId ali imenu
      let invItem: { id: string; stock: number; purchasePrice: number; name: string; unit: string } | null = null
      if (item.itemId) {
        invItem = await db.inventoryItem.findUnique({ where: { id: item.itemId } })
      } else {
        invItem = await db.inventoryItem.findFirst({ where: { name: { equals: item.itemName } } })
      }

      if (invItem) {
        const newStock = Math.max(0, invItem.stock - item.qty)
        await db.inventoryItem.update({
          where: { id: invItem.id },
          data: { stock: newStock },
        })

        // Ustvari inventory transaction
        await db.inventoryTransaction.create({
          data: {
            itemId: invItem.id,
            itemName: item.itemName,
            type: 'order',
            direction: 'out',
            quantity: item.qty,
            unit: invItem.unit,
            unitCost: invItem.purchasePrice,
            totalCost: Math.round(item.qty * invItem.purchasePrice * 100) / 100,
            reason: `order ${orderNumber}`,
            orderId: order.id,
            staffName: serverName || null,
            balanceAfter: newStock,
          },
        })
      }
    }

    console.log(`[orders] ✓ Nov order: ${orderNumber} | €${total.toFixed(2)} | ${items.length} artiklov | stock odbit`)

    return NextResponse.json({
      ok: true,
      message: 'Order ustvarjen',
      order,
    }, { status: 201 })
  } catch (error) {
    console.error('[orders] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update order status (KDS flow, payment)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, paymentMethod, paymentRef, itemStatuses, tip, tipMethod } = body

    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    // Validiraj status
    const validStatuses = ['open', 'sent', 'preparing', 'ready', 'served', 'paid', 'canceled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: `Neveljaven status. Dovoljeni: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    // Pripravi update data
    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (paymentMethod) updateData.paymentMethod = paymentMethod
    if (paymentRef) updateData.paymentRef = paymentRef
    if (tip !== undefined) updateData.tip = parseFloat(tip) || 0
    if (tipMethod !== undefined) updateData.tipMethod = tipMethod || null
    if (status === 'paid') updateData.paidAt = new Date()

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    })

    // Če je paid, sprosti mizo
    if (status === 'paid' && order.tableId) {
      await db.table.update({
        where: { id: order.tableId },
        data: { status: 'free' },
      })
    }

    // Posodobi individual item statuse (KDS flow)
    if (itemStatuses && Array.isArray(itemStatuses)) {
      for (const itemUpdate of itemStatuses) {
        if (itemUpdate.id && itemUpdate.status) {
          await db.orderItem.update({
            where: { id: itemUpdate.id },
            data: { status: itemUpdate.status },
          })
        }
      }
    }

    console.log(`[orders] ✓ Order ${order.orderNumber} posodobljen: status=${status || 'n/a'}`)

    return NextResponse.json({
      ok: true,
      message: 'Order posodobljen',
      order,
    })
  } catch (error) {
    console.error('[orders] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
