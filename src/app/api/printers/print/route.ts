import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildReceipt, buildKitchenOrder } from '@/lib/receipt-builder'
import { auditLog } from '@/lib/audit'

/**
 * Print API — ustvari print job (receipt ali kitchen order)
 *
 * POST /api/printers/print
 * Body: {
 *   type: "receipt" | "kitchen_order" | "z_report" | "bar_order",
 *   orderId?: string,
 *   printerId?: string,  // specific printer (null = auto-route by station)
 * }
 *
 * Flow:
 *   1. Build ESC/POS content iz order/settings
 *   2. Find printer (auto-route by station for kitchen, receipt printer for receipts)
 *   3. Create PrintJob (status=pending)
 *   4. Return job ID (frontend/mini-service picks up and sends to printer)
 */

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, orderId, printerId, performedBy } = body

    if (!type) return NextResponse.json({ ok: false, error: 'type je obvezen' }, { status: 400 })

    const validTypes = ['receipt', 'kitchen_order', 'z_report', 'bar_order']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ ok: false, error: `Neveljaven type. Dovoljeni: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // ===== RECEIPT =====
    if (type === 'receipt') {
      if (!orderId) return NextResponse.json({ ok: false, error: 'orderId je obvezen za receipt' }, { status: 400 })

      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })
      if (!order) return NextResponse.json({ ok: false, error: 'Order ni najden' }, { status: 404 })

      const settings = await db.restaurantSettings.findFirst()
      if (!settings) return NextResponse.json({ ok: false, error: 'Nastavitve niso najdene' }, { status: 404 })

      // Build receipt content
      const content = buildReceipt({
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        serverName: order.serverName,
        channel: order.channel,
        items: order.items.map(i => ({
          name: i.itemName,
          qty: i.qty,
          price: i.unitPrice,
          total: i.totalPrice,
          taxRate: i.taxRate,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        tip: order.tip,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt?.toISOString(),
      }, {
        name: settings.name,
        address: settings.address,
        city: settings.city,
        postalCode: settings.postalCode,
        taxNumber: settings.taxNumber,
        phone: settings.phone,
        receiptHeader: settings.receiptHeader,
        receiptFooter: settings.receiptFooter,
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
      })

      // Find receipt printer
      let printer = printerId
        ? await db.printer.findUnique({ where: { id: printerId } })
        : await db.printer.findFirst({ where: { station: 'receipt', online: true } })

      // Fallback to any online printer
      if (!printer) {
        printer = await db.printer.findFirst({ where: { online: true } })
      }

      if (!printer) {
        return NextResponse.json({ ok: false, error: 'Ni online tiskalnika' }, { status: 404 })
      }

      // Create print job
      const job = await db.printJob.create({
        data: {
          printerId: printer.id,
          type: 'receipt',
          orderId: order.id,
          orderNumber: order.orderNumber,
          content,
          status: 'pending',
        },
      })

      await auditLog({
        entityType: 'order',
        entityId: order.id,
        entityName: order.orderNumber,
        action: 'print',
        performedBy: performedBy || 'system',
        metadata: { type: 'receipt', printerId: printer.id, jobId: job.id },
      })

      console.log(`[print] ✓ Receipt job ${job.id} | printer=${printer.name} | order=${order.orderNumber}`)

      return NextResponse.json({
        ok: true,
        message: 'Print job ustvarjen (receipt)',
        jobId: job.id,
        printer: { id: printer.id, name: printer.name },
        contentPreview: content.substring(0, 200) + '...',
      })
    }

    // ===== KITCHEN ORDER =====
    if (type === 'kitchen_order') {
      if (!orderId) return NextResponse.json({ ok: false, error: 'orderId je obvezen za kitchen_order' }, { status: 400 })

      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })
      if (!order) return NextResponse.json({ ok: false, error: 'Order ni najden' }, { status: 404 })

      // Detect stations and create separate print jobs per station
      const stationItems: Record<string, { name: string; qty: number; notes?: string }[]> = {}
      for (const item of order.items) {
        const station = detectStation(item.itemName)
        if (!stationItems[station]) stationItems[station] = []
        stationItems[station].push({
          name: item.itemName,
          qty: item.qty,
          notes: item.notes || undefined,
        })
      }

      const jobs: { station: string; jobId: string; printer: string }[] = []

      for (const [station, items] of Object.entries(stationItems)) {
        const content = buildKitchenOrder({
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          serverName: order.serverName,
          items,
          channel: order.channel,
          station,
        })

        // Find station printer
        let printer = await db.printer.findFirst({
          where: { station, online: true },
        })

        // Fallback to kds:all printer
        if (!printer) {
          printer = await db.printer.findFirst({
            where: { station: 'all', online: true },
          })
        }

        // Fallback to any online printer
        if (!printer) {
          printer = await db.printer.findFirst({ where: { online: true } })
        }

        if (!printer) continue

        const job = await db.printJob.create({
          data: {
            printerId: printer.id,
            type: 'kitchen_order',
            orderId: order.id,
            orderNumber: order.orderNumber,
            content,
            status: 'pending',
          },
        })

        jobs.push({ station, jobId: job.id, printer: printer.name })
      }

      await auditLog({
        entityType: 'order',
        entityId: order.id,
        entityName: order.orderNumber,
        action: 'print',
        performedBy: performedBy || 'system',
        metadata: { type: 'kitchen_order', jobs: jobs.length, stations: jobs.map(j => j.station) },
      })

      console.log(`[print] ✓ ${jobs.length} kitchen print jobs | order=${order.orderNumber} | stations: ${jobs.map(j => j.station).join(', ')}`)

      return NextResponse.json({
        ok: true,
        message: `${jobs.length} kitchen print jobs ustvarjenih`,
        jobs,
      })
    }

    return NextResponse.json({ ok: false, error: 'Type še ni implementiran' }, { status: 501 })
  } catch (error) {
    console.error('[print] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Auto-detect station from item name
function detectStation(itemName: string): string {
  const name = itemName.toLowerCase()
  if (name.match(/pivo|vino|spritz|cocktail|limonad|sok|cola|water|kava|espresso|cappuccino|whiskey|vodka|gin|rakija|pijač/)) return 'bar'
  if (name.match(/tort|sladica|tiramisu|panna|cheesecake|ice|sladoled|pudding|creme|chocolate|čokolad/)) return 'dessert'
  if (name.match(/solat|predjed|pršut|brusket|carpaccio|tartar|sushi/)) return 'cold'
  return 'hot'
}
