import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Promotions API — akcije, popusti, coupon kodi
 *
 * GET    /api/promotions              — list (filter by type, status)
 * GET    /api/promotions?id=X         — single promotion z usages
 * POST   /api/promotions              — create promotion
 * PATCH  /api/promotions              — update (pause/expire/stats)
 * DELETE /api/promotions?id=X         — archive promotion
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const code = searchParams.get('code')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (id) {
      const promo = await db.promotion.findUnique({
        where: { id },
        include: { usages: { orderBy: { createdAt: 'desc' }, take: 20 } },
      })
      if (!promo) return NextResponse.json({ ok: false, error: 'Promocija ni najdena' }, { status: 404 })
      return NextResponse.json({ ok: true, promotion: promo })
    }

    // Lookup by code (for coupon validation)
    if (code) {
      const promo = await db.promotion.findUnique({
        where: { code: code.toUpperCase() },
      })
      if (!promo) return NextResponse.json({ ok: false, error: 'Kupon koda ni veljavna' }, { status: 404 })
      return NextResponse.json({ ok: true, promotion: promo })
    }

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status

    const promotions = await db.promotion.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    })

    const stats = {
      total: promotions.length,
      active: promotions.filter(p => p.status === 'active').length,
      paused: promotions.filter(p => p.status === 'paused').length,
      totalUses: promotions.reduce((s, p) => s + p.uses, 0),
      totalRevenue: Math.round(promotions.reduce((s, p) => s + p.revenue, 0) * 100) / 100,
      totalDiscount: Math.round(promotions.reduce((s, p) => s + p.discountGiven, 0) * 100) / 100,
    }

    return NextResponse.json({ ok: true, count: promotions.length, stats, promotions })
  } catch (error) {
    console.error('[promotions] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create promotion
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name, type, discountType, discountValue = 0,
      scope = 'all', scopeValue,
      startTime, endTime, daysOfWeek,
      code, minOrder = 0, maxUses = 0, perCustomer = 0,
    } = body

    if (!name || !type || !discountType) {
      return NextResponse.json({ ok: false, error: 'name, type in discountType so obvezni' }, { status: 400 })
    }

    const validTypes = ['happy_hour', 'bogo', 'coupon', 'seasonal', 'flash']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ ok: false, error: `Neveljaven type. Dovoljeni: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const validDiscountTypes = ['percentage', 'fixed', 'bogo']
    if (!validDiscountTypes.includes(discountType)) {
      return NextResponse.json({ ok: false, error: `Neveljaven discountType. Dovoljeni: ${validDiscountTypes.join(', ')}` }, { status: 400 })
    }

    // Code unique check
    if (code) {
      const existing = await db.promotion.findUnique({ where: { code: code.toUpperCase() } })
      if (existing) {
        return NextResponse.json({ ok: false, error: 'Kupon koda že obstaja' }, { status: 409 })
      }
    }

    const promo = await db.promotion.create({
      data: {
        name,
        type,
        discountType,
        discountValue: parseFloat(discountValue),
        scope,
        scopeValue: scopeValue || null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
        code: code ? code.toUpperCase() : null,
        minOrder: parseFloat(minOrder),
        maxUses: parseInt(maxUses),
        perCustomer: parseInt(perCustomer),
        status: 'active',
      },
    })

    console.log(`[promotions] ✓ Nova promocija: ${name} | type=${type} discount=${discountType}(${discountValue})`)

    return NextResponse.json({
      ok: true,
      message: 'Promocija ustvarjena',
      promotion: promo,
    }, { status: 201 })
  } catch (error) {
    console.error('[promotions] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update promotion
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    // Pause/activate/expire
    if (action === 'pause' || action === 'activate' || action === 'expire') {
      const statusMap = { pause: 'paused', activate: 'active', expire: 'expired' }
      const promo = await db.promotion.update({
        where: { id },
        data: { status: statusMap[action as keyof typeof statusMap] },
      })
      return NextResponse.json({ ok: true, message: `Promocija ${action}d`, promotion: promo })
    }

    // Update fields
    const updateData: Record<string, unknown> = {}
    const fields = ['name', 'discountValue', 'scope', 'scopeValue', 'minOrder', 'maxUses', 'perCustomer']
    for (const f of fields) {
      if (body[f] !== undefined) {
        updateData[f] = f === 'discountValue' || f === 'minOrder' ? parseFloat(body[f]) : f === 'maxUses' || f === 'perCustomer' ? parseInt(body[f]) : body[f]
      }
    }
    if (body.startTime !== undefined) updateData.startTime = body.startTime ? new Date(body.startTime) : null
    if (body.endTime !== undefined) updateData.endTime = body.endTime ? new Date(body.endTime) : null

    const promo = await db.promotion.update({ where: { id }, data: updateData })
    return NextResponse.json({ ok: true, message: 'Promocija posodobljena', promotion: promo })
  } catch (error) {
    console.error('[promotions] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — archive
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    const promo = await db.promotion.update({
      where: { id },
      data: { status: 'archived' },
    })

    return NextResponse.json({ ok: true, message: 'Promocija arhivirana', promotion: promo })
  } catch (error) {
    console.error('[promotions] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
