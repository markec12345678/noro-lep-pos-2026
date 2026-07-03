import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Settings Seed — ustvari default nastavitve + business hours
 * POST /api/settings/seed
 */
export async function POST() {
  try {
    const existing = await db.restaurantSettings.findFirst()
    if (existing) {
      return NextResponse.json({
        ok: true,
        message: 'Nastavitve že obstajajo',
        settingsId: existing.id,
      })
    }

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
      include: { businessHours: true },
    })

    console.log(`[settings/seed] ✓ ${settings.name} | ${settings.businessHours.length} dni delovnega časa`)

    return NextResponse.json({
      ok: true,
      message: 'Default nastavitve ustvarjene',
      settings,
    }, { status: 201 })
  } catch (error) {
    console.error('[settings/seed] napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
