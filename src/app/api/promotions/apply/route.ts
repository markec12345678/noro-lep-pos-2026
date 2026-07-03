import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Promotions Apply API — izračunaj popust za items
 *
 * POST /api/promotions/apply
 * Body: {
 *   items: [{ itemName, qty, unitPrice, category }],
 *   code?: "NOVO10",           // coupon koda (opcijsko)
 *   customerId?: "xxx",        // za per-customer limit
 *   channel?: "dine_in",       // za happy hour
 *   orderTime?: "2026-07-03T17:30:00"  // za časovne akcije
 * }
 *
 * Returns: {
 *   originalTotal, discountAmount, finalTotal,
 *   appliedPromotions: [{ promotion, discountAmount, itemsAffected }]
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items = [], code, customerId, channel = 'dine_in', orderTime } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'items so obvezni' }, { status: 400 })
    }

    const now = orderTime ? new Date(orderTime) : new Date()

    // Izračunaj original total
    const originalTotal = items.reduce((s: number, i: { qty: number; unitPrice: number }) => s + i.qty * i.unitPrice, 0)

    // Pridobi vse aktivne promocije
    const where: Record<string, unknown> = { status: 'active' }
    if (code) {
      where.code = code.toUpperCase()
    }

    const promotions = await db.promotion.findMany({ where })

    // Filter: veljavnost (čas, dnevi, minOrder, maxUses)
    const validPromotions = promotions.filter(p => {
      // Časovna veljavnost
      if (p.startTime && now < p.startTime) return false
      if (p.endTime && now > p.endTime) return false

      // Dnevi v tednu
      if (p.daysOfWeek) {
        const days = JSON.parse(p.daysOfWeek) as number[]
        const today = now.getDay() === 0 ? 7 : now.getDay() // 0=ned → 7
        if (!days.includes(today)) return false
      }

      // Min order
      if (p.minOrder > 0 && originalTotal < p.minOrder) return false

      // Max uses
      if (p.maxUses > 0 && p.uses >= p.maxUses) return false

      return true
    })

    const appliedPromotions: { promotion: { id: string; name: string; type: string; discountType: string; discountValue: number }; discountAmount: number; itemsAffected: string[] }[] = []
    let totalDiscount = 0

    for (const promo of validPromotions) {
      let discountAmount = 0
      const itemsAffected: string[] = []

      if (promo.discountType === 'percentage') {
        // Odstotek popusta na vse ali na določeno kategorijo
        for (const item of items) {
          const itemTotal = item.qty * item.unitPrice
          const matches = promo.scope === 'all' || (promo.scope === 'category' && item.category === promo.scopeValue)
          if (matches) {
            discountAmount += itemTotal * (promo.discountValue / 100)
            itemsAffected.push(`${item.qty}x ${item.itemName}`)
          }
        }
      }

      if (promo.discountType === 'fixed') {
        // Fiksen znesek popusta (npr. €10)
        if (originalTotal >= promo.minOrder) {
          discountAmount = Math.min(promo.discountValue, originalTotal)
          itemsAffected.push(' celotni račun')
        }
      }

      if (promo.discountType === 'bogo') {
        // Buy 1 Get 1 — vsak 2. enak artikel brezplačno
        const itemGroups: Record<string, { itemName: string; qty: number; unitPrice: number }> = {}
        for (const item of items) {
          if (promo.scope === 'all' || (promo.scope === 'item' && item.itemName === promo.scopeValue)) {
            if (!itemGroups[item.itemName]) itemGroups[item.itemName] = { itemName: item.itemName, qty: 0, unitPrice: item.unitPrice }
            itemGroups[item.itemName].qty += item.qty
          }
        }
        for (const group of Object.values(itemGroups)) {
          const freeItems = Math.floor(group.qty / 2)
          if (freeItems > 0) {
            discountAmount += freeItems * group.unitPrice
            itemsAffected.push(`${freeItems}x ${group.itemName} brezplačno`)
          }
        }
      }

      if (discountAmount > 0) {
        appliedPromotions.push({
          promotion: {
            id: promo.id,
            name: promo.name,
            type: promo.type,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
          },
          discountAmount: Math.round(discountAmount * 100) / 100,
          itemsAffected,
        })
        totalDiscount += discountAmount
      }
    }

    totalDiscount = Math.min(totalDiscount, originalTotal) // ne more biti večji od total
    const finalTotal = Math.round((originalTotal - totalDiscount) * 100) / 100

    console.log(`[promotions/apply] ✓ original=€${originalTotal.toFixed(2)} discount=€${totalDiscount.toFixed(2)} final=€${finalTotal.toFixed(2)} | ${appliedPromotions.length} promocij uporabljenih`)

    return NextResponse.json({
      ok: true,
      originalTotal: Math.round(originalTotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      finalTotal,
      appliedPromotions,
    })
  } catch (error) {
    console.error('[promotions/apply] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
