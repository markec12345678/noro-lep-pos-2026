import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Settings API — restavracijske nastavitve + delovni čas
 *
 * GET   /api/settings              — pridobi vse nastavitve z business hours
 * PATCH /api/settings              — posodobi nastavitve
 * PATCH /api/settings?hours=true   — posodobi business hours
 */

// GET
export async function GET() {
  try {
    let settings = await db.restaurantSettings.findFirst({
      include: { businessHours: { orderBy: { dayOfWeek: 'asc' } } },
    })

    // Auto-seed če ne obstaja
    if (!settings) {
      await seedSettings()
      settings = await db.restaurantSettings.findFirst({
        include: { businessHours: { orderBy: { dayOfWeek: 'asc' } } },
      })
    }

    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    console.error('[settings] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const updateHours = searchParams.get('hours') === 'true'
    const body = await request.json()

    let settings = await db.restaurantSettings.findFirst()
    if (!settings) {
      await seedSettings()
      settings = await db.restaurantSettings.findFirst()
    }
    if (!settings) return NextResponse.json({ ok: false, error: 'Settings ni najden' }, { status: 404 })

    // ===== UPDATE BUSINESS HOURS =====
    if (updateHours) {
      const { hours } = body
      if (!Array.isArray(hours)) {
        return NextResponse.json({ ok: false, error: 'hours mora biti array' }, { status: 400 })
      }

      for (const h of hours) {
        if (h.id) {
          await db.businessHours.update({
            where: { id: h.id },
            data: {
              isOpen: h.isOpen,
              openTime: h.openTime || null,
              closeTime: h.closeTime || null,
              breakStart: h.breakStart || null,
              breakEnd: h.breakEnd || null,
              notes: h.notes || null,
            },
          })
        }
      }

      const updated = await db.restaurantSettings.findFirst({
        include: { businessHours: { orderBy: { dayOfWeek: 'asc' } } },
      })

      return NextResponse.json({ ok: true, message: 'Delovni čas posodobljen', settings: updated })
    }

    // ===== UPDATE SETTINGS =====
    const updateData: Record<string, unknown> = {}
    const stringFields = ['name', 'legalName', 'taxNumber', 'address', 'city', 'postalCode', 'country', 'phone', 'email', 'website', 'fursEnvironment', 'fursCertPath', 'currency', 'currencySymbol', 'receiptHeader', 'receiptFooter', 'timezone', 'locale']
    const floatFields = ['vatStandard', 'vatReduced', 'vatSpecial', 'defaultTaxRate', 'lowStockThreshold', 'tipDefaultPct']
    const boolFields = ['receiptQrCode', 'autoPrintReceipt', 'autoSendToFurs', 'tipEnabled', 'active']

    for (const f of stringFields) {
      if (body[f] !== undefined) updateData[f] = body[f]
    }
    for (const f of floatFields) {
      if (body[f] !== undefined) updateData[f] = parseFloat(body[f])
    }
    for (const f of boolFields) {
      if (body[f] !== undefined) updateData[f] = Boolean(body[f])
    }

    const updated = await db.restaurantSettings.update({
      where: { id: settings.id },
      data: updateData,
      include: { businessHours: { orderBy: { dayOfWeek: 'asc' } } },
    })

    console.log(`[settings] ✓ Posodobljeno: ${Object.keys(updateData).join(', ')}`)

    return NextResponse.json({ ok: true, message: 'Nastavitve posodobljene', settings: updated })
  } catch (error) {
    console.error('[settings] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Seed default settings + business hours
async function seedSettings() {
  const settings = await db.restaurantSettings.create({
    data: {
      name: 'Gostilna Pri Lovru',
      legalName: 'Gostilna Pri Lovru d.o.o.',
      taxNumber: '12345678',
      address: 'Trubarjeva cesta 12',
      city: 'Ljubljana',
      postalCode: '1000',
      country: 'Slovenija',
      phone: '+386 1 234 5678',
      email: 'info@prilovru.si',
      website: 'www.prilovru.si',
      fursEnvironment: 'test',
      currency: 'EUR',
      currencySymbol: '€',
      vatStandard: 22,
      vatReduced: 9.5,
      vatSpecial: 5,
      receiptHeader: 'Gostilna Pri Lovru\nTrubarjeva cesta 12, 1000 Ljubljana\nDavčna št.: 12345678\nHvala za obisk!',
      receiptFooter: 'Pridite znova! 🍽️\nwww.prilovru.si',
      receiptQrCode: true,
      timezone: 'Europe/Ljubljana',
      locale: 'sl-SI',
      defaultTaxRate: 22,
      autoPrintReceipt: true,
      autoSendToFurs: true,
      lowStockThreshold: 10,
      tipEnabled: true,
      tipDefaultPct: 10,
      businessHours: {
        create: [
          { dayOfWeek: 0, dayName: 'Nedelja', isOpen: true, openTime: '11:00', closeTime: '22:00' },
          { dayOfWeek: 1, dayName: 'Ponedeljek', isOpen: false, notes: 'Zaprt' },
          { dayOfWeek: 2, dayName: 'Torek', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { dayOfWeek: 3, dayName: 'Sreda', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { dayOfWeek: 4, dayName: 'Četrtek', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { dayOfWeek: 5, dayName: 'Petek', isOpen: true, openTime: '08:00', closeTime: '23:00' },
          { dayOfWeek: 6, dayName: 'Sobota', isOpen: true, openTime: '08:00', closeTime: '23:00' },
        ],
      },
    },
  })

  console.log(`[settings] ✓ Default settings seeded: ${settings.name}`)
}
