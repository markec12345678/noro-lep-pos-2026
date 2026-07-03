import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Gift Cards API — darilne kartice z balance tracking
 *
 * GET    /api/gift-cards              — list (filter by status, design)
 * GET    /api/gift-cards?id=X         — single card z transactions
 * GET    /api/gift-cards?number=GC-X  — lookup by card number (for redeem)
 * POST   /api/gift-cards              — issue new gift card (purchase)
 * PATCH  /api/gift-cards              — redeem / reload / deliver / cancel
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const number = searchParams.get('number')
    const status = searchParams.get('status')
    const design = searchParams.get('design')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (id) {
      const card = await db.giftCard.findUnique({
        where: { id },
        include: { transactions: { orderBy: { createdAt: 'desc' } } },
      })
      if (!card) return NextResponse.json({ ok: false, error: 'Darilna kartica ni najdena' }, { status: 404 })
      return NextResponse.json({ ok: true, giftCard: card })
    }

    if (number) {
      const card = await db.giftCard.findUnique({
        where: { cardNumber: number.toUpperCase() },
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
      })
      if (!card) return NextResponse.json({ ok: false, error: 'Kartica s to številko ni najdena' }, { status: 404 })
      return NextResponse.json({ ok: true, giftCard: card })
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (design) where.design = design

    const cards = await db.giftCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const stats = {
      total: cards.length,
      active: cards.filter(c => c.status === 'active').length,
      redeemed: cards.filter(c => c.status === 'redeemed').length,
      totalIssued: Math.round(cards.reduce((s, c) => s + c.initialAmount, 0) * 100) / 100,
      totalBalance: Math.round(cards.reduce((s, c) => s + c.balance, 0) * 100) / 100,
      totalRedeemed: Math.round(cards.reduce((s, c) => s + (c.initialAmount - c.balance), 0) * 100) / 100,
      byDesign: cards.reduce((acc, c) => {
        acc[c.design] = (acc[c.design] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return NextResponse.json({ ok: true, count: cards.length, stats, giftCards: cards })
  } catch (error) {
    console.error('[gift-cards] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — issue new gift card
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      design = 'universal', initialAmount,
      buyerName, buyerEmail,
      recipientName, recipientEmail, recipientPhone,
      expiresAt, deliveredVia, purchasePaymentMethod, purchaseOrderId,
    } = body

    if (!initialAmount || initialAmount <= 0) {
      return NextResponse.json({ ok: false, error: 'initialAmount mora biti pozitiven' }, { status: 400 })
    }

    const validDesigns = ['christmas', 'birthday', 'valentine', 'universal']
    if (!validDesigns.includes(design)) {
      return NextResponse.json({ ok: false, error: `Neveljaven design. Dovoljeni: ${validDesigns.join(', ')}` }, { status: 400 })
    }

    // Generate card number
    const count = await db.giftCard.count()
    const cardNumber = `GC-2026-${String(count + 1).padStart(4, '0')}`

    const card = await db.giftCard.create({
      data: {
        cardNumber,
        design,
        initialAmount: parseFloat(initialAmount),
        balance: parseFloat(initialAmount),
        buyerName: buyerName || null,
        buyerEmail: buyerEmail || null,
        recipientName: recipientName || null,
        recipientEmail: recipientEmail || null,
        recipientPhone: recipientPhone || null,
        status: 'active',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        deliveredVia: deliveredVia || null,
        purchasePaymentMethod: purchasePaymentMethod || null,
        purchaseOrderId: purchaseOrderId || null,
      },
    })

    // Create purchase transaction
    await db.giftCardTransaction.create({
      data: {
        giftCardId: card.id,
        type: 'purchase',
        amount: parseFloat(initialAmount),
        balanceAfter: parseFloat(initialAmount),
        orderId: purchaseOrderId || null,
        notes: `Nakup darilne kartice ${cardNumber}`,
      },
    })

    // Auto-deliver if email/SMS specified
    if (deliveredVia && (recipientEmail || recipientPhone)) {
      await db.giftCard.update({
        where: { id: card.id },
        data: { deliveredAt: new Date() },
      })
      // TODO: send email/SMS with QR code
    }

    console.log(`[gift-cards] ✓ ${cardNumber} izdana | €${initialAmount} | design=${design} | delivered=${deliveredVia || 'no'}`)

    return NextResponse.json({
      ok: true,
      message: `Darilna kartica ${cardNumber} izdana`,
      giftCard: card,
    }, { status: 201 })
  } catch (error) {
    console.error('[gift-cards] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — redeem / reload / deliver / cancel
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, cardNumber, action } = body

    if (!id && !cardNumber) return NextResponse.json({ ok: false, error: 'id ali cardNumber je obvezen' }, { status: 400 })
    if (!action) return NextResponse.json({ ok: false, error: 'action je obvezen' }, { status: 400 })

    // Find card
    const where = id ? { id } : { cardNumber: (cardNumber as string).toUpperCase() }
    const card = await db.giftCard.findUnique({ where })
    if (!card) return NextResponse.json({ ok: false, error: 'Kartica ni najdena' }, { status: 404 })

    // ===== REDEEM (uporabi pri plačilu) =====
    if (action === 'redeem') {
      const { amount, orderId } = body
      if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: 'amount je obvezen' }, { status: 400 })

      if (card.status !== 'active') {
        return NextResponse.json({ ok: false, error: `Kartica ni aktivna (status: ${card.status})` }, { status: 400 })
      }

      if (card.expiresAt && new Date() > card.expiresAt) {
        await db.giftCard.update({ where: { id: card.id }, data: { status: 'expired' } })
        return NextResponse.json({ ok: false, error: 'Kartica je potekla' }, { status: 400 })
      }

      const redeemAmount = parseFloat(amount)
      if (card.balance < redeemAmount) {
        return NextResponse.json({
          ok: false,
          error: `Premalo sredstev. Stanje: €${card.balance.toFixed(2)}, zahtevano: €${redeemAmount.toFixed(2)}`,
        }, { status: 400 })
      }

      const newBalance = Math.round((card.balance - redeemAmount) * 100) / 100
      const newStatus = newBalance <= 0 ? 'redeemed' : 'active'

      const updated = await db.giftCard.update({
        where: { id: card.id },
        data: { balance: newBalance, status: newStatus },
      })

      await db.giftCardTransaction.create({
        data: {
          giftCardId: card.id,
          type: 'redeem',
          amount: -redeemAmount,
          balanceAfter: newBalance,
          orderId: orderId || null,
          notes: `Plačilo z darilno kartico ${card.cardNumber}`,
        },
      })

      console.log(`[gift-cards] ✓ ${card.cardNumber} redeem -€${redeemAmount} | balance=€${newBalance} | status=${newStatus}`)

      return NextResponse.json({
        ok: true,
        message: `€${redeemAmount} odbito z darilne kartice`,
        giftCard: updated,
        remainingBalance: newBalance,
      })
    }

    // ===== RELOAD (ponovno napolni) =====
    if (action === 'reload') {
      const { amount } = body
      if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: 'amount je obvezen' }, { status: 400 })

      if (card.status === 'expired' || card.status === 'canceled') {
        return NextResponse.json({ ok: false, error: `Kartica je ${card.status}` }, { status: 400 })
      }

      const reloadAmount = parseFloat(amount)
      const newBalance = Math.round((card.balance + reloadAmount) * 100) / 100

      const updated = await db.giftCard.update({
        where: { id: card.id },
        data: { balance: newBalance, status: 'active' }, // re-activate if was redeemed
      })

      await db.giftCardTransaction.create({
        data: {
          giftCardId: card.id,
          type: 'reload',
          amount: reloadAmount,
          balanceAfter: newBalance,
          notes: `Ponovno polnjenje ${card.cardNumber}`,
        },
      })

      console.log(`[gift-cards] ✓ ${card.cardNumber} reload +€${reloadAmount} | balance=€${newBalance}`)

      return NextResponse.json({
        ok: true,
        message: `€${reloadAmount} dodano na darilno kartico`,
        giftCard: updated,
      })
    }

    // ===== DELIVER (pošlji email/SMS) =====
    if (action === 'deliver') {
      const { via } = body // email | sms
      if (!via) return NextResponse.json({ ok: false, error: 'via je obvezen (email/sms)' }, { status: 400 })

      const updated = await db.giftCard.update({
        where: { id: card.id },
        data: {
          deliveredVia: via,
          deliveredAt: new Date(),
        },
      })

      // TODO: send email/SMS with QR code

      console.log(`[gift-cards] ✓ ${card.cardNumber} dostavljena via ${via}`)

      return NextResponse.json({
        ok: true,
        message: `Darilna kartica dostavljena via ${via}`,
        giftCard: updated,
      })
    }

    // ===== CANCEL =====
    if (action === 'cancel') {
      const updated = await db.giftCard.update({
        where: { id: card.id },
        data: { status: 'canceled' },
      })

      await db.giftCardTransaction.create({
        data: {
          giftCardId: card.id,
          type: 'expire',
          amount: -card.balance,
          balanceAfter: 0,
          notes: 'Kartica preklicana',
        },
      })

      return NextResponse.json({
        ok: true,
        message: 'Darilna kartica preklicana',
        giftCard: updated,
      })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven action. Dovoljeni: redeem, reload, deliver, cancel' }, { status: 400 })
  } catch (error) {
    console.error('[gift-cards] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
