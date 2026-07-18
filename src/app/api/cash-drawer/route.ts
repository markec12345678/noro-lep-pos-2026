import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/audit'

/**
 * Cash Drawer API — upravljanje blagajne (gotovina)
 *
 * GET   /api/cash-drawer                — list sessions (filter by status, date)
 * GET   /api/cash-drawer?id=X           — single session
 * GET   /api/cash-drawer?active=true     — trenutno odprta seja
 * POST  /api/cash-drawer                — open new session (z opening float)
 * PATCH /api/cash-drawer                — close / reconcile / adjust / pay-in / pay-out
 *
 * Flow:
 *   1. OPEN: staff odpre sejo z opening float (npr. €100)
 *   2. DURING: cashIn (od plačil) in cashOut (vračila) se auto-pračijo
 *      Manual pay-in/pay-out za ročne transakcije
 *   3. CLOSE: staff prešteje gotovino, vpiše countedCash
 *   4. RECONCILE: sistem izračuna discrepancy (countedCash - expectedCash)
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const active = searchParams.get('active') === 'true'
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Single session
    if (id) {
      const session = await db.cashDrawerSession.findUnique({ where: { id } })
      if (!session) return NextResponse.json({ ok: false, error: 'Seja ni najdena' }, { status: 404 })
      const parsed = {
        ...session,
        denominationBreakdown: session.denominationBreakdown ? JSON.parse(session.denominationBreakdown) : null,
      }
      return NextResponse.json({ ok: true, session: parsed })
    }

    // Active session
    if (active) {
      const session = await db.cashDrawerSession.findFirst({
        where: { status: 'open' },
        orderBy: { openedAt: 'desc' },
      })
      if (!session) return NextResponse.json({ ok: false, error: 'Ni odprte seje' }, { status: 404 })
      return NextResponse.json({ ok: true, session })
    }

    // List
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.openedAt = { gte: start, lte: end }
    }

    const sessions = await db.cashDrawerSession.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      take: limit,
    })

    // Stats
    const openSessions = sessions.filter(s => s.status === 'open')
    const closedSessions = sessions.filter(s => s.status === 'closed' || s.status === 'reconciled')
    const totalDiscrepancy = closedSessions.reduce((s, sess) => s + (sess.discrepancy || 0), 0)
    const totalCashFlow = sessions.reduce((s, sess) => s + sess.cashIn - sess.cashOut, 0)

    const stats = {
      total: sessions.length,
      open: openSessions.length,
      closed: closedSessions.length,
      totalDiscrepancy: Math.round(totalDiscrepancy * 100) / 100,
      totalCashFlow: Math.round(totalCashFlow * 100) / 100,
      avgDiscrepancy: closedSessions.length > 0
        ? Math.round((totalDiscrepancy / closedSessions.length) * 100) / 100
        : 0,
    }

    return NextResponse.json({ ok: true, count: sessions.length, stats, sessions })
  } catch (error) {
    console.error('[cash-drawer] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — open new session
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { openedBy, openedById, openingFloat = 100, notes } = body

    if (!openedBy) {
      return NextResponse.json({ ok: false, error: 'openedBy je obvezen' }, { status: 400 })
    }

    // Preveri če že obstaja odprta seja
    const existingOpen = await db.cashDrawerSession.findFirst({ where: { status: 'open' } })
    if (existingOpen) {
      return NextResponse.json({
        ok: false,
        error: `Že obstaja odprta seja: ${existingOpen.sessionNumber}. Najprej zapri trenutno.`,
      }, { status: 409 })
    }

    // Generate session number
    const count = await db.cashDrawerSession.count()
    const sessionNumber = `CD-2026-${String(count + 1).padStart(4, '0')}`

    const session = await db.cashDrawerSession.create({
      data: {
        sessionNumber,
        openedBy,
        openedById: openedById || null,
        openingFloat: parseFloat(openingFloat),
        expectedCash: parseFloat(openingFloat),
        status: 'open',
        notes: notes || null,
      },
    })

    await auditLog({
      entityType: 'settings',
      entityId: session.id,
      entityName: session.sessionNumber,
      action: 'create',
      performedBy: openedBy,
      staffId: openedById,
      metadata: { type: 'cash_drawer_open', openingFloat },
      severity: 'info',
    })

    console.log(`[cash-drawer] ✓ ${sessionNumber} odprta | float=€${openingFloat} | by=${openedBy}`)

    return NextResponse.json({
      ok: true,
      message: `Blagajna odprta (${sessionNumber})`,
      session,
    }, { status: 201 })
  } catch (error) {
    console.error('[cash-drawer] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — close / reconcile / pay-in / pay-out / adjust
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })
    }

    const session = await db.cashDrawerSession.findUnique({ where: { id } })
    if (!session) return NextResponse.json({ ok: false, error: 'Seja ni najdena' }, { status: 404 })

    // ===== PAY-IN (ročni vplačilo) =====
    if (action === 'pay_in') {
      const { amount, reason, performedBy } = body
      if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: 'amount je obvezen' }, { status: 400 })

      if (session.status !== 'open') {
        return NextResponse.json({ ok: false, error: 'Seja ni odprta' }, { status: 400 })
      }

      const amt = parseFloat(amount)
      const newPayIns = session.payIns + amt
      const newExpected = session.openingFloat + session.cashIn - session.cashOut + newPayIns - session.payOuts

      const updated = await db.cashDrawerSession.update({
        where: { id },
        data: {
          payIns: newPayIns,
          expectedCash: Math.round(newExpected * 100) / 100,
        },
      })

      await auditLog({
        entityType: 'settings',
        entityId: id,
        entityName: session.sessionNumber,
        action: 'update',
        performedBy: performedBy || 'unknown',
        metadata: { type: 'cash_pay_in', amount: amt, reason },
      })

      return NextResponse.json({ ok: true, message: `€${amt} vplačano`, session: updated })
    }

    // ===== PAY-OUT (ročni izplačilo) =====
    if (action === 'pay_out') {
      const { amount, reason, performedBy } = body
      if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: 'amount je obvezen' }, { status: 400 })

      if (session.status !== 'open') {
        return NextResponse.json({ ok: false, error: 'Seja ni odprta' }, { status: 400 })
      }

      const amt = parseFloat(amount)
      const newPayOuts = session.payOuts + amt
      const newExpected = session.openingFloat + session.cashIn - session.cashOut + session.payIns - newPayOuts

      const updated = await db.cashDrawerSession.update({
        where: { id },
        data: {
          payOuts: newPayOuts,
          expectedCash: Math.round(newExpected * 100) / 100,
        },
      })

      await auditLog({
        entityType: 'settings',
        entityId: id,
        entityName: session.sessionNumber,
        action: 'update',
        performedBy: performedBy || 'unknown',
        metadata: { type: 'cash_pay_out', amount: amt, reason },
      })

      return NextResponse.json({ ok: true, message: `€${amt} izplačano`, session: updated })
    }

    // ===== CLOSE (zapri s štetjem) =====
    if (action === 'close') {
      const { countedCash, closedBy, closedById, denominationBreakdown, notes } = body

      if (countedCash === undefined) {
        return NextResponse.json({ ok: false, error: 'countedCash je obvezen pri zaprtju' }, { status: 400 })
      }

      if (session.status !== 'open') {
        return NextResponse.json({ ok: false, error: 'Seja ni odprta' }, { status: 400 })
      }

      const counted = parseFloat(countedCash)
      const discrepancy = Math.round((counted - session.expectedCash) * 100) / 100

      const updated = await db.cashDrawerSession.update({
        where: { id },
        data: {
          countedCash: counted,
          discrepancy,
          closedBy: closedBy || null,
          closedById: closedById || null,
          closedAt: new Date(),
          status: 'closed',
          notes: notes || session.notes,
          denominationBreakdown: denominationBreakdown ? JSON.stringify(denominationBreakdown) : null,
        },
      })

      // Auto-reconcile če je discrepancy 0
      let finalStatus = 'closed'
      if (Math.abs(discrepancy) < 0.01) {
        await db.cashDrawerSession.update({ where: { id }, data: { status: 'reconciled' } })
        finalStatus = 'reconciled'
      }

      await auditLog({
        entityType: 'settings',
        entityId: id,
        entityName: session.sessionNumber,
        action: 'update',
        performedBy: closedBy || 'unknown',
        staffId: closedById,
        changes: {
          status: { before: 'open', after: finalStatus },
          countedCash: { before: null, after: counted },
          discrepancy: { before: null, after: discrepancy },
        },
        metadata: {
          type: 'cash_drawer_close',
          expected: session.expectedCash,
          counted,
          discrepancy,
        },
        severity: Math.abs(discrepancy) > 5 ? 'warning' : 'info',
      })

      console.log(`[cash-drawer] ✓ ${session.sessionNumber} zaprta | expected=€${session.expectedCash} counted=€${counted} discrepancy=€${discrepancy} | ${finalStatus}`)

      return NextResponse.json({
        ok: true,
        message: `Blagajna zaprta (${finalStatus === 'reconciled' ? 'usklajena' : 'z razliko'})`,
        session: { ...updated, status: finalStatus },
        discrepancy,
        reconciled: finalStatus === 'reconciled',
      })
    }

    // ===== RECONCILE (ročno usklajevanje po zaprtju) =====
    if (action === 'reconcile') {
      const { performedBy, notes } = body

      if (session.status !== 'closed') {
        return NextResponse.json({ ok: false, error: 'Seja mora biti zaprta pred usklajevanjem' }, { status: 400 })
      }

      const updated = await db.cashDrawerSession.update({
        where: { id },
        data: {
          status: 'reconciled',
          notes: notes ? `${session.notes || ''}\n[Reconciled] ${notes}`.trim() : session.notes,
        },
      })

      await auditLog({
        entityType: 'settings',
        entityId: id,
        entityName: session.sessionNumber,
        action: 'update',
        performedBy: performedBy || 'unknown',
        changes: { status: { before: 'closed', after: 'reconciled' } },
        severity: 'info',
      })

      return NextResponse.json({ ok: true, message: 'Seja usklajena', session: updated })
    }

    // ===== ADD CASH (auto-track od payment) =====
    if (action === 'add_cash') {
      const { amount } = body
      if (!amount) return NextResponse.json({ ok: false, error: 'amount je obvezen' }, { status: 400 })

      if (session.status !== 'open') return NextResponse.json({ ok: false, error: 'Seja ni odprta' }, { status: 400 })

      const amt = parseFloat(amount)
      const newCashIn = session.cashIn + amt
      const newExpected = session.openingFloat + newCashIn - session.cashOut + session.payIns - session.payOuts

      const updated = await db.cashDrawerSession.update({
        where: { id },
        data: {
          cashIn: newCashIn,
          expectedCash: Math.round(newExpected * 100) / 100,
        },
      })

      return NextResponse.json({ ok: true, session: updated })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven action. Dovoljeni: open, close, reconcile, pay_in, pay_out, add_cash' }, { status: 400 })
  } catch (error) {
    console.error('[cash-drawer] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
