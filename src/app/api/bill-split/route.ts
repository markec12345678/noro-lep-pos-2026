import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Bill Split API — delitev računa med goste
 *
 * GET   /api/bill-split                — list splits (filter by orderId, status)
 * GET   /api/bill-split?id=X           — single split z shares
 * POST  /api/bill-split                — create bill split
 *   Body: { orderId, splitType, guestCount, customAmounts?, itemAssignments? }
 *   splitType: "equal" | "items" | "custom"
 * PATCH /api/bill-split                — mark share as paid
 *   Body: { shareId, paymentMethod }
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    if (id) {
      const split = await db.billSplit.findUnique({
        where: { id },
        include: { shares: true },
      })
      if (!split) return NextResponse.json({ ok: false, error: 'Bill split ni najden' }, { status: 404 })

      const parsed = {
        ...split,
        shares: split.shares.map(s => ({ ...s, items: JSON.parse(s.items) })),
      }
      return NextResponse.json({ ok: true, split: parsed })
    }

    const where: Record<string, unknown> = {}
    if (orderId) where.orderId = orderId
    if (status) where.status = status

    const splits = await db.billSplit.findMany({
      where,
      include: { shares: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ ok: true, count: splits.length, splits })
  } catch (error) {
    console.error('[bill-split] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create bill split
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, splitType, guestCount, customAmounts, itemAssignments } = body

    if (!orderId || !splitType || !guestCount) {
      return NextResponse.json({ ok: false, error: 'orderId, splitType in guestCount so obvezni' }, { status: 400 })
    }

    const validTypes = ['equal', 'items', 'custom']
    if (!validTypes.includes(splitType)) {
      return NextResponse.json({ ok: false, error: `Neveljaven splitType. Dovoljeni: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Pridobi order z items
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ ok: false, error: 'Order ni najden' }, { status: 404 })

    const totalAmount = order.total
    const count = await db.billSplit.count()
    const splitNumber = `BS-2026-${String(count + 1).padStart(4, '0')}`

    // Generiraj shares glede na splitType
    let shares: { guestLabel: string; amount: number; items: string }[] = []

    if (splitType === 'equal') {
      // Enakomerna delitev
      const perGuest = Math.round((totalAmount / guestCount) * 100) / 100
      const remainder = Math.round((totalAmount - perGuest * guestCount) * 100) / 100

      for (let i = 0; i < guestCount; i++) {
        const amount = i === 0 ? perGuest + remainder : perGuest // prvi gost dobi ostanek (zaokroževanje)
        shares.push({
          guestLabel: `Gost ${i + 1}`,
          amount: Math.round(amount * 100) / 100,
          items: JSON.stringify([]),
        })
      }
    }

    if (splitType === 'custom') {
      // Custom zneski (customAmounts = [15.50, 20.00, ...])
      if (!customAmounts || !Array.isArray(customAmounts) || customAmounts.length !== guestCount) {
        return NextResponse.json({ ok: false, error: 'customAmounts mora biti array z guestCount elementi' }, { status: 400 })
      }

      const sum = customAmounts.reduce((s: number, a: number) => s + a, 0)
      if (Math.abs(sum - totalAmount) > 0.01) {
        return NextResponse.json({
          ok: false,
          error: `Vsota customAmounts (€${sum.toFixed(2)}) se ne ujema z total (€${totalAmount.toFixed(2)})`,
        }, { status: 400 })
      }

      for (let i = 0; i < guestCount; i++) {
        shares.push({
          guestLabel: `Gost ${i + 1}`,
          amount: Math.round(customAmounts[i] * 100) / 100,
          items: JSON.stringify([]),
        })
      }
    }

    if (splitType === 'items') {
      // Item-based delitev (itemAssignments = { "itemId": guestIndex, ... })
      if (!itemAssignments || typeof itemAssignments !== 'object') {
        return NextResponse.json({ ok: false, error: 'itemAssignments je obvezen za items split type' }, { status: 400 })
      }

      // Inicializiraj guest totals
      const guestTotals: number[] = new Array(guestCount).fill(0)
      const guestItems: { itemId: string; itemName: string; qty: number; price: number }[][] = new Array(guestCount).fill(null).map(() => [])

      for (const item of order.items) {
        const guestIdx = itemAssignments[item.id]
        if (guestIdx === undefined || guestIdx === null) continue
        const idx = parseInt(guestIdx)
        if (idx < 0 || idx >= guestCount) continue

        guestTotals[idx] += item.totalPrice
        guestItems[idx].push({
          itemId: item.id,
          itemName: item.itemName,
          qty: item.qty,
          price: item.totalPrice,
        })
      }

      for (let i = 0; i < guestCount; i++) {
        shares.push({
          guestLabel: `Gost ${i + 1}`,
          amount: Math.round(guestTotals[i] * 100) / 100,
          items: JSON.stringify(guestItems[i]),
        })
      }
    }

    // Ustvari bill split z shares
    const split = await db.billSplit.create({
      data: {
        splitNumber,
        orderId,
        totalAmount,
        guestCount,
        splitType,
        status: 'open',
        shares: {
          create: shares,
        },
      },
      include: { shares: true },
    })

    // Preveri če so vse shares plačane
    const allPaid = split.shares.every(s => s.paymentStatus === 'paid')
    const anyPaid = split.shares.some(s => s.paymentStatus === 'paid')

    if (allPaid) {
      await db.billSplit.update({ where: { id: split.id }, data: { status: 'completed' } })
    } else if (anyPaid) {
      await db.billSplit.update({ where: { id: split.id }, data: { status: 'partial' } })
    }

    const parsed = {
      ...split,
      shares: split.shares.map(s => ({ ...s, items: JSON.parse(s.items) })),
    }

    console.log(`[bill-split] ✓ ${splitNumber} | ${splitType} | ${guestCount} gostov | €${totalAmount.toFixed(2)}`)

    return NextResponse.json({
      ok: true,
      message: `Bill split ${splitNumber} ustvarjen`,
      split: parsed,
    }, { status: 201 })
  } catch (error) {
    console.error('[bill-split] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — mark share as paid
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { shareId, paymentMethod } = body

    if (!shareId) return NextResponse.json({ ok: false, error: 'shareId je obvezen' }, { status: 400 })

    const share = await db.billSplitShare.update({
      where: { id: shareId },
      data: {
        paymentStatus: 'paid',
        paymentMethod: paymentMethod || null,
        paidAt: new Date(),
      },
    })

    // Preveri status splita
    const allShares = await db.billSplitShare.findMany({ where: { splitId: share.splitId } })
    const allPaid = allShares.every(s => s.paymentStatus === 'paid')
    const anyPaid = allShares.some(s => s.paymentStatus === 'paid')

    const newStatus = allPaid ? 'completed' : anyPaid ? 'partial' : 'open'
    await db.billSplit.update({
      where: { id: share.splitId },
      data: { status: newStatus },
    })

    // Če so vse shares plačane, označi order kot paid
    if (allPaid) {
      const split = await db.billSplit.findUnique({ where: { id: share.splitId } })
      if (split) {
        await db.order.update({
          where: { id: split.orderId },
          data: { status: 'paid', paidAt: new Date(), paymentMethod: 'split' },
        })

        // Sprosti mizo
        const order = await db.order.findUnique({ where: { id: split.orderId } })
        if (order?.tableId) {
          await db.table.update({ where: { id: order.tableId }, data: { status: 'free' } })
        }
      }
    }

    console.log(`[bill-split] ✓ Share ${shareId} plačan | paymentMethod=${paymentMethod || 'n/a'} | split status=${newStatus}`)

    return NextResponse.json({
      ok: true,
      message: 'Share plačan',
      share,
      splitStatus: newStatus,
    })
  } catch (error) {
    console.error('[bill-split] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
