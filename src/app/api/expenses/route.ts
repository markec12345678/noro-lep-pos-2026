import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/audit'

/**
 * Expenses API — sledenje stroškov (P&L)
 *
 * GET    /api/expenses              — list (filter by category, status, date)
 * GET    /api/expenses?id=X         — single expense
 * GET    /api/expenses?stats=true   — expense statistics
 * POST   /api/expenses              — create expense
 * PATCH  /api/expenses              — approve / pay / reject / update
 * DELETE /api/expenses?id=X         — delete expense
 *
 * P&L endpoint: /api/expenses/pnl
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const recurring = searchParams.get('recurring') === 'true'
    const stats = searchParams.get('stats') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Single expense
    if (id) {
      const expense = await db.expense.findUnique({
        where: { id },
        include: { category: true },
      })
      if (!expense) return NextResponse.json({ ok: false, error: 'Strošek ni najden' }, { status: 404 })
      return NextResponse.json({ ok: true, expense })
    }

    // Build where
    const where: Record<string, unknown> = {}
    if (categoryId) where.categoryId = categoryId
    if (status) where.status = status
    if (recurring) where.isRecurring = true
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.expenseDate = { gte: start, lte: end }
    } else if (from && to) {
      where.expenseDate = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
    }

    // Stats mode
    if (stats) {
      const expenses = await db.expense.findMany({ where, include: { category: true } })

      const byCategory: Record<string, { name: string; count: number; amount: number; total: number }> = {}
      const byStatus: Record<string, number> = {}
      let totalAmount = 0
      let totalVat = 0
      let totalTotal = 0

      for (const e of expenses) {
        const catName = e.categoryName
        if (!byCategory[catName]) byCategory[catName] = { name: catName, count: 0, amount: 0, total: 0 }
        byCategory[catName].count++
        byCategory[catName].amount += e.amount
        byCategory[catName].total += e.totalAmount
        totalAmount += e.amount
        totalVat += e.vatAmount
        totalTotal += e.totalAmount
        byStatus[e.status] = (byStatus[e.status] || 0) + 1
      }

      const recurring = expenses.filter(e => e.isRecurring)

      return NextResponse.json({
        ok: true,
        stats: {
          total: expenses.length,
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalVat: Math.round(totalVat * 100) / 100,
          totalTotal: Math.round(totalTotal * 100) / 100,
          pending: byStatus.pending || 0,
          approved: byStatus.approved || 0,
          paid: byStatus.paid || 0,
          rejected: byStatus.rejected || 0,
          recurring: recurring.length,
          recurringTotal: Math.round(recurring.reduce((s, e) => s + e.totalAmount, 0) * 100) / 100,
          byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
        },
      })
    }

    // List
    const expenses = await db.expense.findMany({
      where,
      include: { category: true },
      orderBy: { expenseDate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ ok: true, count: expenses.length, expenses })
  } catch (error) {
    console.error('[expenses] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create expense
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      categoryId, amount, vatRate = 22, description,
      supplierName, invoiceNumber, expenseDate,
      isRecurring = false, recurringType, recurringDay,
      createdBy, createdById, paymentMethod, notes,
    } = body

    if (!categoryId || !amount || !description || !expenseDate) {
      return NextResponse.json({ ok: false, error: 'categoryId, amount, description in expenseDate so obvezni' }, { status: 400 })
    }

    // Get category
    const category = await db.expenseCategory.findUnique({ where: { id: categoryId } })
    if (!category) return NextResponse.json({ ok: false, error: 'Kategorija ni najdena' }, { status: 404 })

    // Calculate amounts
    const amt = parseFloat(amount)
    const rate = parseFloat(vatRate)
    const vatAmt = Math.round(amt * (rate / 100) * 100) / 100
    const totalAmt = Math.round((amt + vatAmt) * 100) / 100

    // Generate expense number
    const count = await db.expense.count()
    const expenseNumber = `EXP-2026-${String(count + 1).padStart(4, '0')}`

    const expense = await db.expense.create({
      data: {
        expenseNumber,
        categoryId,
        categoryName: category.name,
        amount: amt,
        vatAmount: vatAmt,
        totalAmount: totalAmt,
        vatRate: rate,
        description,
        supplierName: supplierName || null,
        invoiceNumber: invoiceNumber || null,
        expenseDate: new Date(expenseDate),
        isRecurring: Boolean(isRecurring),
        recurringType: recurringType || null,
        recurringDay: recurringDay ? parseInt(recurringDay) : null,
        createdBy: createdBy || null,
        createdById: createdById || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        status: 'pending',
      },
      include: { category: true },
    })

    await auditLog({
      entityType: 'settings',
      entityId: expense.id,
      entityName: expense.expenseNumber,
      action: 'create',
      performedBy: createdBy || 'unknown',
      metadata: { type: 'expense', category: category.name, amount: amt, total: totalAmt },
    })

    console.log(`[expenses] ✓ ${expenseNumber} | ${category.name} | €${amt} + €${vatAmt} DDV = €${totalAmt}`)

    return NextResponse.json({
      ok: true,
      message: `Strošek ${expenseNumber} ustvarjen`,
      expense,
    }, { status: 201 })
  } catch (error) {
    console.error('[expenses] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — approve / pay / reject / update
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, approvedBy, paidAt, paymentRef, paymentMethod } = body

    if (!id || !action) return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })

    const expense = await db.expense.findUnique({ where: { id } })
    if (!expense) return NextResponse.json({ ok: false, error: 'Strošek ni najden' }, { status: 404 })

    const updateData: Record<string, unknown> = {}

    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.approvedBy = approvedBy || null
      updateData.approvedAt = new Date()
    } else if (action === 'pay') {
      updateData.status = 'paid'
      updateData.paidAt = paidAt ? new Date(paidAt) : new Date()
      if (paymentRef) updateData.paymentRef = paymentRef
      if (paymentMethod) updateData.paymentMethod = paymentMethod
    } else if (action === 'reject') {
      updateData.status = 'rejected'
    } else if (action === 'update') {
      const fields = ['amount', 'vatRate', 'description', 'supplierName', 'invoiceNumber', 'notes']
      for (const f of fields) {
        if (body[f] !== undefined) updateData[f] = f === 'amount' || f === 'vatRate' ? parseFloat(body[f]) : body[f]
      }
      // Recalculate if amount changed
      if (body.amount !== undefined) {
        const amt = parseFloat(body.amount)
        const rate = body.vatRate ? parseFloat(body.vatRate) : expense.vatRate
        updateData.vatAmount = Math.round(amt * (rate / 100) * 100) / 100
        updateData.totalAmount = Math.round((amt + (updateData.vatAmount as number)) * 100) / 100
        updateData.vatRate = rate
      }
    } else {
      return NextResponse.json({ ok: false, error: 'Neveljaven action. Dovoljeni: approve, pay, reject, update' }, { status: 400 })
    }

    const updated = await db.expense.update({ where: { id }, data: updateData, include: { category: true } })

    await auditLog({
      entityType: 'settings',
      entityId: id,
      entityName: expense.expenseNumber,
      action: 'update',
      performedBy: approvedBy || 'unknown',
      changes: { status: { before: expense.status, after: updateData.status || expense.status } },
      metadata: { type: 'expense', action },
    })

    console.log(`[expenses] ✓ ${expense.expenseNumber} ${action} | status=${updated.status}`)

    return NextResponse.json({ ok: true, message: `Strošek ${action}d`, expense: updated })
  } catch (error) {
    console.error('[expenses] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'id je obvezen' }, { status: 400 })

    const expense = await db.expense.delete({ where: { id } })

    await auditLog({
      entityType: 'settings',
      entityId: id,
      entityName: expense.expenseNumber,
      action: 'delete',
      metadata: { type: 'expense', amount: expense.amount },
      severity: 'warning',
    })

    return NextResponse.json({ ok: true, message: `Strošek ${expense.expenseNumber} izbrisan` })
  } catch (error) {
    console.error('[expenses] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
