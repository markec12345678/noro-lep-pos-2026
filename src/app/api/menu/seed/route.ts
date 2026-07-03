import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Menu Seed — ustvari kategorije + artikle za demo
 * POST /api/menu/seed
 */
export async function POST() {
  try {
    const existing = await db.menuCategory.count()
    if (existing > 0) {
      return NextResponse.json({ ok: true, message: `Meni že obstaja (${existing} kategorij).`, count: existing })
    }

    // Kategorije
    const categories = await db.menuCategory.createMany({
      data: [
        { name: 'Predjedi', slug: 'predjedi', icon: '🥗', color: 'bg-amber-500', sortOrder: 1 },
        { name: 'Glavne jedi', slug: 'glavne', icon: '🍖', color: 'bg-emerald-500', sortOrder: 2 },
        { name: 'Pice', slug: 'pice', icon: '🍕', color: 'bg-rose-500', sortOrder: 3 },
        { name: 'Sladice', slug: 'sladice', icon: '🍰', color: 'bg-purple-500', sortOrder: 4 },
        { name: 'Pijače', slug: 'pijace', icon: '🍹', color: 'bg-cyan-500', sortOrder: 5 },
      ],
    })

    const cats = await db.menuCategory.findMany()
    const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]))

    // Artikli
    const items = [
      // Predjedi
      { catSlug: 'predjedi', name: 'Trški pršut', price: 8.50, taxRate: 22, emoji: '🥓', popular: true, allergens: [], description: 'Pršut z melono in rožmarinom' },
      { catSlug: 'predjedi', name: 'Brusketa s paradižnikom', price: 5.50, taxRate: 9.5, emoji: '🍞', allergens: ['G'], description: 'Bela kruh, paradižnik, bazilika, oljčno olje' },
      { catSlug: 'predjedi', name: 'Kozice na žaru', price: 12.00, taxRate: 22, emoji: '🦐', allergens: ['R'], description: 'Tigrove kozice, limona, česen' },

      // Glavne
      { catSlug: 'glavne', name: 'Čevapi s kajmakom', price: 14.50, taxRate: 22, emoji: '🍖', popular: true, allergens: ['G', 'M'], description: 'Čevapi, kajmak, čebula, kruh' },
      { catSlug: 'glavne', name: 'Burger Noro Lep', price: 15.00, taxRate: 22, emoji: '🍔', allergens: ['G', 'M', 'SE'], description: '180g goveji burger, sir, pomfrit' },
      { catSlug: 'glavne', name: 'Rižota s morskimi sadeži', price: 16.00, taxRate: 22, emoji: '🍚', popular: true, allergens: ['M', 'R', 'F', 'ME'], description: 'Rižota s kozicami, školjkami' },
      { catSlug: 'glavne', name: 'Teleči ražnjiči', price: 18.00, taxRate: 22, emoji: '🍢', allergens: [], description: 'Telečje meso, zelenjava, ajvar' },

      // Pice
      { catSlug: 'pice', name: 'Pizza Margherita', price: 11.00, taxRate: 9.5, emoji: '🍕', popular: true, allergens: ['G', 'M'], vegetarian: true, description: 'Paradižnik, mozzarella, bazilika' },
      { catSlug: 'pice', name: 'Pizza Quattro Formaggi', price: 13.50, taxRate: 9.5, emoji: '🍕', allergens: ['G', 'M'], vegetarian: true, description: 'Štiri vrste sira' },

      // Sladice
      { catSlug: 'sladice', name: 'Tiramisu', price: 5.50, taxRate: 9.5, emoji: '🍰', popular: true, allergens: ['G', 'M', 'J'], vegetarian: true, description: 'Klasični italijanski tiramisu' },
      { catSlug: 'sladice', name: 'Panna Cotta', price: 4.50, taxRate: 9.5, emoji: '🍮', allergens: ['M'], vegetarian: true, description: 'Krema z jagodnim prelivom' },

      // Pijače
      { catSlug: 'pijace', name: 'Coca Cola 0.5L', price: 3.20, taxRate: 22, emoji: '🥤', allergens: [], description: 'Hladna pijača' },
      { catSlug: 'pijace', name: 'Aperol Spritz', price: 6.50, taxRate: 22, emoji: '🍹', popular: true, allergens: [], description: 'Aperol, prosecco, soda' },
      { catSlug: 'pijace', name: 'Limonada', price: 3.50, taxRate: 22, emoji: '🍋', allergens: [], vegan: true, description: 'Domaca limonada z meto' },
      { catSlug: 'pijace', name: 'Laški pivo 0.5L', price: 3.80, taxRate: 22, emoji: '🍺', allergens: ['G'], vegan: true, description: 'Točeno pivo' },
    ]

    let itemSort = 0
    for (const item of items) {
      const categoryId = catMap[item.catSlug]
      if (!categoryId) continue
      itemSort++

      const modifiers = item.catSlug === 'pice'
        ? [{
            name: 'Velikost',
            type: 'single',
            required: true,
            sortOrder: 0,
            options: [
              { name: 'Standardna (32cm)', price: 0, default: true },
              { name: 'Velika (45cm)', price: 4, default: false },
            ],
          }, {
            name: 'Dodatki',
            type: 'multiple',
            required: false,
            sortOrder: 1,
            options: [
              { name: 'Šunka', price: 2, default: false },
              { name: 'Gobe', price: 1.5, default: false },
              { name: 'Oljke', price: 1.5, default: false },
              { name: 'Sir dodaten', price: 2, default: false },
            ],
          }]
        : item.catSlug === 'glavne' && item.name === 'Burger Noro Lep'
        ? [{
            name: 'Pečenost',
            type: 'single',
            required: true,
            sortOrder: 0,
            options: [
              { name: 'Medium', price: 0, default: true },
              { name: 'Well done', price: 0, default: false },
            ],
          }, {
            name: 'Dodatki',
            type: 'multiple',
            required: false,
            sortOrder: 1,
            options: [
              { name: 'Sir cheddar', price: 1.5, default: false },
              { name: 'Bacon', price: 2, default: false },
              { name: 'Jajce', price: 1, default: false },
            ],
          }]
        : []

      await db.menuItem.create({
        data: {
          categoryId,
          name: item.name,
          description: item.description || null,
          price: item.price,
          taxRate: item.taxRate,
          emoji: item.emoji || null,
          vegan: item.vegan || false,
          vegetarian: item.vegetarian || false,
          spicy: false,
          glutenFree: false,
          allergens: item.allergens && item.allergens.length > 0 ? JSON.stringify(item.allergens) : null,
          popular: item.popular || false,
          sortOrder: itemSort,
          modifiers: {
            create: modifiers,
          },
        },
      })
    }

    const finalCount = await db.menuItem.count()
    const catCount = await db.menuCategory.count()
    const modCount = await db.menuItemModifier.count()

    console.log(`[menu/seed] ✓ ${catCount} kategorij, ${finalCount} artiklov, ${modCount} modifierjev`)

    return NextResponse.json({
      ok: true,
      message: `Meni ustvarjen: ${catCount} kategorij, ${finalCount} artiklov, ${modCount} modifierjev`,
      stats: { categories: catCount, items: finalCount, modifiers: modCount },
    }, { status: 201 })
  } catch (error) {
    console.error('[menu/seed] napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
