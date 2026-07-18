import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/audit'

/**
 * Data Export API — CSV izvoz za računovodstvo, FURS, analitiko
 *
 * GET /api/export?type=orders&from=2026-01-01&to=2026-12-31
 * GET /api/export?type=z_reports&date=2026-07-03
 * GET /api/export?type=inventory
 * GET /api/export?type=customers
 * GET /api/export?type=staff_shifts&from=2026-07-01&to=2026-07-31
 * GET /api/export?type=payments&from=2026-07-01&to=2026-07-31
 * GET /api/export?type=tips&date=2026-07-03
 * GET /api/export?type=audit&from=2026-07-01&to=2026-07-31
 * GET /api/export?type=purchase_orders&status=received
 *
 * Returns: CSV file download (text/csv)
 */

function toCSV(rows: Record<string, unknown>[], headers?: string[]): string {
  if (rows.length === 0) return ''

  const cols = headers || Object.keys(rows[0])
  const headerRow = cols.join(';')

  const dataRows = rows.map(row =>
    cols.map(col => {
      const val = row[col]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
      if (val instanceof Date) return val.toISOString()
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
      return String(val)
    }).join(';')
  )

  return [headerRow, ...dataRows].join('\n')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    if (!type) {
      return NextResponse.json({
        ok: true,
        availableTypes: [
          'orders — vsi računi (FURS)',
          'z_reports — dnevni zaključki',
          'inventory — stanje zalog',
          'customers — CRM baza gostov',
          'staff_shifts — urnik in ure',
          'payments — zgodovina plačil',
          'tips — distribucija napojnin',
          'audit — dnevnik sprememb',
          'purchase_orders — nabavni nalogi',
          'reservations — rezervacije',
          'gift_cards — darilne kartice',
        ],
      })
    }

    let csv = ''
    let filename = ''

    // ===== ORDERS =====
    if (type === 'orders') {
      const where: Record<string, unknown> = {}
      if (from && to) {
        where.createdAt = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
      }
      if (status) where.status = status

      const orders = await db.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      })

      const rows = orders.flatMap(o =>
        o.items.map(i => ({
          orderNumber: o.orderNumber,
          date: o.createdAt.toISOString().split('T')[0],
          time: o.createdAt.toISOString().split('T')[1].split('.')[0],
          tableNumber: o.tableNumber || '',
          channel: o.channel,
          status: o.status,
          serverName: o.serverName || '',
          itemName: i.itemName,
          qty: i.qty,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          taxRate: i.taxRate,
          orderSubtotal: o.subtotal,
          orderTax: o.tax,
          orderTip: o.tip,
          orderTotal: o.total,
          paymentMethod: o.paymentMethod || '',
        }))
      )

      csv = toCSV(rows)
      filename = `orders_${from || 'all'}_${to || ''}.csv`
    }

    // ===== Z-REPORTS =====
    if (type === 'z_reports') {
      const where: Record<string, unknown> = {}
      if (date) {
        where.date = { gte: new Date(date + 'T00:00:00'), lte: new Date(date + 'T23:59:59') }
      }

      const reports = await db.zReport.findMany({ where, orderBy: { date: 'asc' } })

      const rows = reports.map(r => ({
        reportNumber: r.reportNumber,
        date: r.date.toISOString().split('T')[0],
        cashier: r.cashier || '',
        totalRevenue: r.totalRevenue,
        totalOrders: r.totalOrders,
        avgCheck: r.avgCheck,
        subtotal: r.subtotal,
        totalTax: r.totalTax,
        vatBreakdown: r.vatBreakdown,
        paymentBreakdown: r.paymentBreakdown,
        returns: r.returns,
        returnsValue: r.returnsValue,
        status: r.status,
        fursEOR: r.fursEOR || '',
        fursZOI: r.fursZOI || '',
      }))

      csv = toCSV(rows)
      filename = `z_reports_${date || 'all'}.csv`
    }

    // ===== INVENTORY =====
    if (type === 'inventory') {
      const items = await db.inventoryItem.findMany({ orderBy: { category: 'asc' } })

      const rows = items.map(i => ({
        name: i.name,
        category: i.category,
        subcategory: i.subcategory || '',
        unit: i.unit,
        stock: i.stock,
        minStock: i.minStock,
        maxStock: i.maxStock || '',
        purchasePrice: i.purchasePrice,
        salePrice: i.salePrice || '',
        stockValue: Math.round(i.stock * i.purchasePrice * 100) / 100,
        supplier: i.supplier || '',
        barcode: i.barcode || '',
        active: i.active,
        lowStock: i.stock <= i.minStock ? 'DA' : 'NE',
      }))

      csv = toCSV(rows)
      filename = 'inventory.csv'
    }

    // ===== CUSTOMERS =====
    if (type === 'customers') {
      const customers = await db.customer.findMany({ orderBy: { totalSpent: 'desc' } })

      const rows = customers.map(c => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email || '',
        phone: c.phone || '',
        tier: c.tier,
        points: c.points,
        totalVisits: c.totalVisits,
        totalSpent: c.totalSpent,
        favoriteItem: c.favoriteItem || '',
        vegan: c.vegan ? 'DA' : 'NE',
        vegetarian: c.vegetarian ? 'DA' : 'NE',
        lastVisit: c.lastVisit ? c.lastVisit.toISOString().split('T')[0] : '',
        consent: c.consent ? 'DA' : 'NE',
        active: c.active ? 'DA' : 'NE',
      }))

      csv = toCSV(rows)
      filename = 'customers.csv'
    }

    // ===== STAFF SHIFTS =====
    if (type === 'staff_shifts') {
      const where: Record<string, unknown> = {}
      if (from && to) {
        where.date = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
      }

      const shifts = await db.shift.findMany({
        where,
        include: { staff: true },
        orderBy: { date: 'asc' },
      })

      const rows = shifts.map(s => ({
        staffName: `${s.staff.firstName} ${s.staff.lastName}`,
        role: s.staff.role,
        date: s.date.toISOString().split('T')[0],
        startTime: s.startTime.toISOString().split('T')[1].split('.')[0],
        endTime: s.endTime ? s.endTime.toISOString().split('T')[1].split('.')[0] : '',
        breakMinutes: s.breakMinutes,
        station: s.station || '',
        status: s.status,
        hourlyRate: s.staff.hourlyRate,
        hours: s.endTime ? Math.round((s.endTime.getTime() - s.startTime.getTime()) / 3600000 * 10) / 10 : 0,
        laborCost: s.endTime ? Math.round((s.endTime.getTime() - s.startTime.getTime()) / 3600000 * s.staff.hourlyRate * 100) / 100 : 0,
      }))

      csv = toCSV(rows)
      filename = `staff_shifts_${from || 'all'}_${to || ''}.csv`
    }

    // ===== PAYMENTS =====
    if (type === 'payments') {
      const where: Record<string, unknown> = {}
      if (from && to) {
        where.createdAt = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
      }

      const payments = await db.payment.findMany({ where, orderBy: { createdAt: 'asc' } })

      const rows = payments.map(p => ({
        paymentRef: p.paymentRef || '',
        orderNumber: p.orderNumber || '',
        date: p.createdAt.toISOString().split('T')[0],
        time: p.createdAt.toISOString().split('T')[1].split('.')[0],
        amount: p.amount,
        tax: p.tax,
        tip: p.tip,
        total: p.total,
        method: p.method,
        status: p.status,
        customerName: p.customerName || '',
        refundAmount: p.refundAmount,
        processedAt: p.processedAt ? p.processedAt.toISOString().split('T')[0] : '',
      }))

      csv = toCSV(rows)
      filename = `payments_${from || 'all'}_${to || ''}.csv`
    }

    // ===== TIPS =====
    if (type === 'tips') {
      const where: Record<string, unknown> = {}
      if (date) {
        where.date = { gte: new Date(date + 'T00:00:00'), lte: new Date(date + 'T23:59:59') }
      }

      const tips = await db.tipDistribution.findMany({ where, orderBy: { date: 'asc' } })

      const rows = tips.map(t => ({
        date: t.date.toISOString().split('T')[0],
        staffName: t.staffName,
        role: t.role,
        tipsFromOrders: t.tipsFromOrders,
        tipsFromPool: t.tipsFromPool,
        totalTips: t.totalTips,
        poolType: t.poolType,
        poolShare: t.poolShare,
        hoursWorked: t.hoursWorked,
        status: t.status,
        approvedBy: t.approvedBy || '',
        paidAt: t.paidAt ? t.paidAt.toISOString().split('T')[0] : '',
      }))

      csv = toCSV(rows)
      filename = `tips_${date || 'all'}.csv`
    }

    // ===== AUDIT LOG =====
    if (type === 'audit') {
      const where: Record<string, unknown> = {}
      if (from && to) {
        where.createdAt = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
      }

      const logs = await db.auditLog.findMany({ where, orderBy: { createdAt: 'asc' }, take: 5000 })

      const rows = logs.map(l => ({
        date: l.createdAt.toISOString().split('T')[0],
        time: l.createdAt.toISOString().split('T')[1].split('.')[0],
        entityType: l.entityType,
        entityId: l.entityId || '',
        entityName: l.entityName || '',
        action: l.action,
        performedBy: l.performedBy || '',
        severity: l.severity,
        changes: l.changes || '',
        metadata: l.metadata || '',
      }))

      csv = toCSV(rows)
      filename = `audit_${from || 'all'}_${to || ''}.csv`
    }

    // ===== PURCHASE ORDERS =====
    if (type === 'purchase_orders') {
      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (from && to) {
        where.createdAt = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
      }

      const pos = await db.purchaseOrder.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      })

      const rows = pos.flatMap(po =>
        po.items.map(i => ({
          poNumber: po.poNumber,
          supplierName: po.supplierName,
          status: po.status,
          date: po.createdAt.toISOString().split('T')[0],
          expectedDate: po.expectedDate ? po.expectedDate.toISOString().split('T')[0] : '',
          receivedDate: po.receivedDate ? po.receivedDate.toISOString().split('T')[0] : '',
          orderedBy: po.orderedBy || '',
          invoiceNumber: po.invoiceNumber || '',
          itemName: i.itemName,
          orderedQty: i.orderedQty,
          receivedQty: i.receivedQty,
          unit: i.unit,
          unitCost: i.unitCost,
          totalCost: i.totalCost,
          itemStatus: i.status,
          poTotalCost: po.totalCost,
        }))
      )

      csv = toCSV(rows)
      filename = `purchase_orders_${from || 'all'}_${to || ''}.csv`
    }

    // ===== RESERVATIONS =====
    if (type === 'reservations') {
      const where: Record<string, unknown> = {}
      if (from && to) {
        where.date = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
      }

      const reservations = await db.reservation.findMany({ where, orderBy: { date: 'asc' } })

      const rows = reservations.map(r => ({
        resNumber: r.resNumber,
        guestName: r.guestName,
        phone: r.phone,
        email: r.email || '',
        guests: r.guests,
        date: r.date.toISOString().split('T')[0],
        time: r.date.toISOString().split('T')[1].split('.')[0],
        tableNumber: r.tableNumber || '',
        status: r.status,
        source: r.source,
        notes: r.notes || '',
        reminderSent: r.reminderSent ? 'DA' : 'NE',
      }))

      csv = toCSV(rows)
      filename = `reservations_${from || 'all'}_${to || ''}.csv`
    }

    // ===== GIFT CARDS =====
    if (type === 'gift_cards') {
      const cards = await db.giftCard.findMany({ orderBy: { createdAt: 'desc' } })

      const rows = cards.map(c => ({
        cardNumber: c.cardNumber,
        design: c.design,
        buyerName: c.buyerName || '',
        recipientName: c.recipientName || '',
        recipientEmail: c.recipientEmail || '',
        initialAmount: c.initialAmount,
        balance: c.balance,
        spent: Math.round((c.initialAmount - c.balance) * 100) / 100,
        status: c.status,
        purchasedAt: c.purchasedAt.toISOString().split('T')[0],
        expiresAt: c.expiresAt ? c.expiresAt.toISOString().split('T')[0] : '',
        deliveredVia: c.deliveredVia || '',
      }))

      csv = toCSV(rows)
      filename = 'gift_cards.csv'
    }

    if (!csv) {
      return NextResponse.json({ ok: false, error: `Neznan type: ${type}. Uporabljeno: orders, z_reports, inventory, customers, staff_shifts, payments, tips, audit, purchase_orders, reservations, gift_cards` }, { status: 400 })
    }

    // Audit log the export
    await auditLog({
      entityType: 'settings',
      action: 'export',
      performedBy: 'system',
      metadata: { type, filename, rows: csv.split('\n').length - 1, from, to, date, status },
    })

    console.log(`[export] ✓ ${type} → ${filename} | ${csv.split('\n').length - 1} rows`)

    // Return CSV file
    return new NextResponse('\ufeff' + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[export] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
