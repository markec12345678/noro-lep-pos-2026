import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/audit'

/**
 * Purchase Orders API — naročanje dobav pri dobaviteljih
 *
 * GET   /api/purchase-orders              — list POs (filter by status, supplier, date)
 * GET   /api/purchase-orders?id=X         — single PO z items
 * POST  /api/purchase-orders              — create new PO (draft)
 * PATCH /api/purchase-orders              — send / receive / complete / cancel
 *
 * Flow:
 *   1. CREATE: staff ustvari PO (draft) z items in količinami
 *   2. SEND: PO se pošlje dobavitelju (status: draft → sent)
 *   3. RECEIVE: dobava prispe, staff prejema item po item (auto stock update!)
 *      vsak prejet item → InventoryTransaction (delivery IN) + stock update
 *   4. COMPLETE: ko so vsi items prejeti → status: received
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (id) {
      const po = await db.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!po) return NextResponse.json({ ok: false, error: 'Nabavni nalog ni najden' }, { status: 404 })
      return NextResponse.json({ ok: true, purchaseOrder: po })
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    const pos = await db.purchaseOrder.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const stats = {
      total: pos.length,
      draft: pos.filter(p => p.status === 'draft').length,
      sent: pos.filter(p => p.status === 'sent').length,
      partial: pos.filter(p => p.status === 'partial').length,
      received: pos.filter(p => p.status === 'received').length,
      canceled: pos.filter(p => p.status === 'canceled').length,
      totalCost: Math.round(pos.reduce((s, p) => s + p.totalCost, 0) * 100) / 100,
      pendingCost: Math.round(pos.filter(p => p.status === 'sent' || p.status === 'partial').reduce((s, p) => s + p.totalCost, 0) * 100) / 100,
    }

    return NextResponse.json({ ok: true, count: pos.length, stats, purchaseOrders: pos })
  } catch (error) {
    console.error('[purchase-orders] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new PO
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { supplierId, supplierName, expectedDate, orderedBy, notes, items } = body

    if (!supplierName) return NextResponse.json({ ok: false, error: 'supplierName je obvezen' }, { status: 400 })
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'items so obvezni' }, { status: 400 })
    }

    // Generate PO number
    const count = await db.purchaseOrder.count()
    const poNumber = `PO-2026-${String(count + 1).padStart(4, '0')}`

    // Calculate totals
    let totalCost = 0
    const poItems = items.map((item: { inventoryItemId?: string; itemName: string; orderedQty: number; unit?: string; unitCost: number; notes?: string }) => {
      const qty = parseFloat(item.orderedQty)
      const cost = parseFloat(item.unitCost)
      const itemTotal = qty * cost
      totalCost += itemTotal
      return {
        inventoryItemId: item.inventoryItemId || null,
        itemName: item.itemName,
        orderedQty: qty,
        unit: item.unit || 'kos',
        unitCost: cost,
        totalCost: Math.round(itemTotal * 100) / 100,
        notes: item.notes || null,
        status: 'pending',
      }
    })

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplierId || null,
        supplierName,
        status: 'draft',
        totalItems: poItems.length,
        totalCost: Math.round(totalCost * 100) / 100,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        orderedBy: orderedBy || null,
        notes: notes || null,
        items: { create: poItems },
      },
      include: { items: true },
    })

    await auditLog({
      entityType: 'inventory',
      entityId: po.id,
      entityName: po.poNumber,
      action: 'create',
      performedBy: orderedBy || 'unknown',
      metadata: { type: 'purchase_order', supplier: supplierName, totalCost, items: poItems.length },
    })

    console.log(`[purchase-orders] ✓ ${poNumber} ustvarjen | ${supplierName} | ${poItems.length} artiklov | €${totalCost.toFixed(2)}`)

    return NextResponse.json({
      ok: true,
      message: `Nabavni nalog ${poNumber} ustvarjen`,
      purchaseOrder: po,
    }, { status: 201 })
  } catch (error) {
    console.error('[purchase-orders] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — send / receive / complete / cancel
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, performedBy } = body

    if (!id || !action) return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })

    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!po) return NextResponse.json({ ok: false, error: 'Nabavni nalog ni najden' }, { status: 404 })

    // ===== SEND (draft → sent) =====
    if (action === 'send') {
      if (po.status !== 'draft') return NextResponse.json({ ok: false, error: 'PO mora biti v statusu draft' }, { status: 400 })

      const updated = await db.purchaseOrder.update({
        where: { id },
        data: { status: 'sent' },
      })

      await auditLog({
        entityType: 'inventory',
        entityId: id,
        entityName: po.poNumber,
        action: 'update',
        performedBy: performedBy || 'unknown',
        changes: { status: { before: 'draft', after: 'sent' } },
      })

      return NextResponse.json({ ok: true, message: `${po.poNumber} poslan dobavitelju`, purchaseOrder: updated })
    }

    // ===== RECEIVE ITEM (partial receive) =====
    if (action === 'receive_item') {
      const { itemId, receivedQty } = body
      if (!itemId || receivedQty === undefined) return NextResponse.json({ ok: false, error: 'itemId in receivedQty sta obvezna' }, { status: 400 })

      const poItem = po.items.find(i => i.id === itemId)
      if (!poItem) return NextResponse.json({ ok: false, error: 'Item ni najden v PO' }, { status: 404 })

      const qty = parseFloat(receivedQty)
      const newReceivedQty = poItem.receivedQty + qty

      // Determine item status
      let itemStatus = 'partial'
      if (newReceivedQty >= poItem.orderedQty) itemStatus = 'received'

      // Update PO item
      await db.purchaseOrderItem.update({
        where: { id: itemId },
        data: {
          receivedQty: newReceivedQty,
          status: itemStatus,
        },
      })

      // AUTO: Create InventoryTransaction (delivery IN) + update stock
      if (poItem.inventoryItemId) {
        const invItem = await db.inventoryItem.findUnique({ where: { id: poItem.inventoryItemId } })
        if (invItem) {
          const newStock = invItem.stock + qty
          await db.inventoryItem.update({
            where: { id: invItem.id },
            data: { stock: newStock },
          })

          await db.inventoryTransaction.create({
            data: {
              itemId: invItem.id,
              itemName: poItem.itemName,
              type: 'delivery',
              direction: 'in',
              quantity: qty,
              unit: poItem.unit,
              unitCost: poItem.unitCost,
              totalCost: Math.round(qty * poItem.unitCost * 100) / 100,
              reason: `PO ${po.poNumber}`,
              staffName: performedBy || null,
              balanceAfter: newStock,
            },
          })

          console.log(`[purchase-orders] ✓ Stock update: ${poItem.itemName} +${qty} → ${newStock} ${poItem.unit}`)
        }
      } else {
        // No inventory link — create transaction z itemName only
        await db.inventoryTransaction.create({
          data: {
            itemName: poItem.itemName,
            type: 'delivery',
            direction: 'in',
            quantity: qty,
            unit: poItem.unit,
            unitCost: poItem.unitCost,
            totalCost: Math.round(qty * poItem.unitCost * 100) / 100,
            reason: `PO ${po.poNumber}`,
            staffName: performedBy || null,
            balanceAfter: 0,
          },
        })
      }

      // Check if all items are received → update PO status
      const allItems = await db.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } })
      const allReceived = allItems.every(i => i.status === 'received')
      const anyReceived = allItems.some(i => i.status === 'received' || i.status === 'partial')

      const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : 'sent'
      const updated = await db.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          receivedDate: allReceived ? new Date() : po.receivedDate,
        },
      })

      await auditLog({
        entityType: 'inventory',
        entityId: id,
        entityName: po.poNumber,
        action: 'update',
        performedBy: performedBy || 'unknown',
        metadata: {
          type: 'po_receive_item',
          itemId,
          itemName: poItem.itemName,
          receivedQty: qty,
          totalReceived: newReceivedQty,
          ordered: poItem.orderedQty,
          itemStatus,
        },
      })

      console.log(`[purchase-orders] ✓ ${po.poNumber} received: ${poItem.itemName} ${qty}/${poItem.orderedQty} | PO status=${newStatus}`)

      return NextResponse.json({
        ok: true,
        message: `${qty}x ${poItem.itemName} prejeto`,
        purchaseOrder: updated,
        itemStatus,
        allReceived,
      })
    }

    // ===== RECEIVE ALL (mark all as received) =====
    if (action === 'receive_all') {
      for (const item of po.items) {
        if (item.status === 'received') continue

        const remaining = item.orderedQty - item.receivedQty
        if (remaining <= 0) continue

        // Update item
        await db.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQty: item.orderedQty,
            status: 'received',
          },
        })

        // Auto stock update
        if (item.inventoryItemId) {
          const invItem = await db.inventoryItem.findUnique({ where: { id: item.inventoryItemId } })
          if (invItem) {
            const newStock = invItem.stock + remaining
            await db.inventoryItem.update({
              where: { id: invItem.id },
              data: { stock: newStock },
            })

            await db.inventoryTransaction.create({
              data: {
                itemId: invItem.id,
                itemName: item.itemName,
                type: 'delivery',
                direction: 'in',
                quantity: remaining,
                unit: item.unit,
                unitCost: item.unitCost,
                totalCost: Math.round(remaining * item.unitCost * 100) / 100,
                reason: `PO ${po.poNumber} (receive all)`,
                staffName: performedBy || null,
                balanceAfter: newStock,
              },
            })
          }
        }
      }

      const updated = await db.purchaseOrder.update({
        where: { id },
        data: {
          status: 'received',
          receivedDate: new Date(),
          receivedBy: performedBy || po.receivedBy,
        },
        include: { items: true },
      })

      await auditLog({
        entityType: 'inventory',
        entityId: id,
        entityName: po.poNumber,
        action: 'update',
        performedBy: performedBy || 'unknown',
        changes: { status: { before: po.status, after: 'received' } },
      })

      console.log(`[purchase-orders] ✓ ${po.poNumber} receive_all → received`)

      return NextResponse.json({
        ok: true,
        message: `${po.poNumber} vse prejeto`,
        purchaseOrder: updated,
      })
    }

    // ===== CANCEL =====
    if (action === 'cancel') {
      const updated = await db.purchaseOrder.update({
        where: { id },
        data: { status: 'canceled' },
      })

      await auditLog({
        entityType: 'inventory',
        entityId: id,
        entityName: po.poNumber,
        action: 'update',
        performedBy: performedBy || 'unknown',
        changes: { status: { before: po.status, after: 'canceled' } },
        severity: 'warning',
      })

      return NextResponse.json({ ok: true, message: `${po.poNumber} preklican`, purchaseOrder: updated })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven action. Dovoljeni: send, receive_item, receive_all, cancel' }, { status: 400 })
  } catch (error) {
    console.error('[purchase-orders] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
