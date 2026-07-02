import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/inventory/delivery
 * Vnese dobavnico — poveča zalogo za izbrane artikle
 *
 * Body:
 * {
 *   "deliveries": [
 *     { "itemName": "Pizza Margherita", "quantity": 20 },
 *     { "itemId": "cuid", "quantity": 5 }
 *   ],
 *   "supplier": "Hofer Cash & Carry" (optional)
 * }
 *
 * Uporabnik vnese samo količine — artikel že obstaja v bazi.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deliveries } = body as {
      deliveries: Array<{ itemId?: string; itemName?: string; quantity: number }>
    }

    if (!deliveries || !Array.isArray(deliveries) || deliveries.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Manjka deliveries array',
      }, { status: 400 })
    }

    const results: Array<{ name: string; added: number; newStock: number; ok: boolean }> = []

    for (const delivery of deliveries) {
      if (!delivery.itemId && !delivery.itemName) {
        results.push({ name: 'unknown', added: 0, newStock: 0, ok: false })
        continue
      }

      // Poišči artikel
      const where = delivery.itemId
        ? { id: delivery.itemId }
        : { name: delivery.itemName }

      const item = await db.inventoryItem.findFirst({ where })

      if (!item) {
        results.push({
          name: delivery.itemName || delivery.itemId || 'unknown',
          added: 0,
          newStock: 0,
          ok: false,
        })
        continue
      }

      // Povečaj zalogo
      const updated = await db.inventoryItem.update({
        where: { id: item.id },
        data: { stock: item.stock + delivery.quantity },
      })

      results.push({
        name: updated.name,
        added: delivery.quantity,
        newStock: updated.stock,
        ok: true,
      })
    }

    const successCount = results.filter(r => r.ok).length
    const failCount = results.length - successCount

    return NextResponse.json({
      ok: successCount > 0,
      message: `Dobavnica obdelana: ${successCount} uspešnih, ${failCount} neuspešnih`,
      results,
      successCount,
      failCount,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
