import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Menu API — meni management (kategorije, artikli, modifierji)
 *
 * GET    /api/menu                    — list categories z items + modifiers
 * GET    /api/menu?id=X               — single item z modifiers
 * GET    /api/menu?category=slug      — items za določeno kategorijo
 * POST   /api/menu                    — create category ali item (glej type)
 * PATCH  /api/menu                    — update item/category
 * DELETE /api/menu?id=X&type=item     — delete item/category
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

    // Single item z modifiers
    if (id) {
      const item = await db.menuItem.findUnique({
        where: { id },
        include: { category: true, modifiers: { orderBy: { sortOrder: 'asc' } } },
      })
      if (!item) return NextResponse.json({ ok: false, error: 'Artikel ni najden' }, { status: 404 })

      const parsed = {
        ...item,
        allergens: item.allergens ? JSON.parse(item.allergens) : [],
        modifiers: item.modifiers.map(m => ({ ...m, options: JSON.parse(m.options) })),
      }
      return NextResponse.json({ ok: true, item: parsed })
    }

    // Items za določeno kategorijo
    if (category) {
      const items = await db.menuItem.findMany({
        where: { category: { slug: category }, active: true },
        include: { modifiers: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      })
      const parsed = items.map(i => ({
        ...i,
        allergens: i.allergens ? JSON.parse(i.allergens) : [],
        modifiers: i.modifiers.map(m => ({ ...m, options: JSON.parse(m.options) })),
      }))
      return NextResponse.json({ ok: true, count: parsed.length, items: parsed })
    }

    // Vse kategorije z items
    const categories = await db.menuCategory.findMany({
      where: { active: true },
      include: {
        items: {
          where: { active: true },
          include: { modifiers: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const parsed = categories.map(c => ({
      ...c,
      items: c.items.map(i => ({
        ...i,
        allergens: i.allergens ? JSON.parse(i.allergens) : [],
        modifiers: i.modifiers.map(m => ({ ...m, options: JSON.parse(m.options) })),
      })),
    }))

    const stats = {
      categories: parsed.length,
      items: parsed.reduce((s, c) => s + c.items.length, 0),
      popular: parsed.reduce((s, c) => s + c.items.filter(i => i.popular).length, 0),
      vegan: parsed.reduce((s, c) => s + c.items.filter(i => i.vegan).length, 0),
      vegetarian: parsed.reduce((s, c) => s + c.items.filter(i => i.vegetarian).length, 0),
      avgPrice: parsed.length > 0
        ? Math.round(parsed.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.price, 0), 0) / Math.max(1, parsed.reduce((s, c) => s + c.items.length, 0)) * 100) / 100
        : 0,
    }

    return NextResponse.json({ ok: true, stats, categories: parsed })
  } catch (error) {
    console.error('[menu] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create category ali item
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type } = body // "category" | "item"

    // ===== CREATE CATEGORY =====
    if (type === 'category') {
      const { name, slug, icon, color, sortOrder = 0 } = body
      if (!name || !slug) return NextResponse.json({ ok: false, error: 'name in slug sta obvezna' }, { status: 400 })

      const existing = await db.menuCategory.findUnique({ where: { slug } })
      if (existing) return NextResponse.json({ ok: false, error: 'Kategorija s tem slugom že obstaja' }, { status: 409 })

      const category = await db.menuCategory.create({
        data: { name, slug, icon: icon || null, color: color || null, sortOrder: parseInt(sortOrder) },
      })

      console.log(`[menu] ✓ Nova kategorija: ${name} (${slug})`)
      return NextResponse.json({ ok: true, message: 'Kategorija ustvarjena', category }, { status: 201 })
    }

    // ===== CREATE ITEM =====
    if (type === 'item') {
      const {
        categoryId, name, description, price, taxRate = 22,
        imageUrl, emoji, vegan = false, vegetarian = false, spicy = false, glutenFree = false,
        allergens = [], inventoryItemId, popular = false, sortOrder = 0,
        modifiers = [],
      } = body

      if (!categoryId || !name || price === undefined) {
        return NextResponse.json({ ok: false, error: 'categoryId, name in price so obvezni' }, { status: 400 })
      }

      const item = await db.menuItem.create({
        data: {
          categoryId,
          name,
          description: description || null,
          price: parseFloat(price),
          taxRate: parseFloat(taxRate),
          imageUrl: imageUrl || null,
          emoji: emoji || null,
          vegan: Boolean(vegan),
          vegetarian: Boolean(vegetarian),
          spicy: Boolean(spicy),
          glutenFree: Boolean(glutenFree),
          allergens: allergens.length > 0 ? JSON.stringify(allergens) : null,
          inventoryItemId: inventoryItemId || null,
          popular: Boolean(popular),
          sortOrder: parseInt(sortOrder),
          modifiers: {
            create: modifiers.map((m: { name: string; type: string; required?: boolean; sortOrder?: number; options: unknown }) => ({
              name: m.name,
              type: m.type,
              required: m.required || false,
              sortOrder: m.sortOrder || 0,
              options: JSON.stringify(m.options),
            })),
          },
        },
        include: { category: true, modifiers: true },
      })

      const parsed = {
        ...item,
        allergens: item.allergens ? JSON.parse(item.allergens) : [],
        modifiers: item.modifiers.map(m => ({ ...m, options: JSON.parse(m.options) })),
      }

      console.log(`[menu] ✓ Nov artikel: ${name} | €${price} | ${allergens.length} alergenov | ${modifiers.length} modifierjev`)

      return NextResponse.json({ ok: true, message: 'Artikel ustvarjen', item: parsed }, { status: 201 })
    }

    return NextResponse.json({ ok: false, error: 'type je obvezen (category | item)' }, { status: 400 })
  } catch (error) {
    console.error('[menu] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update item/category
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, type } = body // type: "item" | "category"

    if (!id || !type) return NextResponse.json({ ok: false, error: 'id in type sta obvezna' }, { status: 400 })

    if (type === 'category') {
      const updateData: Record<string, unknown> = {}
      if (body.name) updateData.name = body.name
      if (body.icon !== undefined) updateData.icon = body.icon
      if (body.color !== undefined) updateData.color = body.color
      if (body.sortOrder !== undefined) updateData.sortOrder = parseInt(body.sortOrder)
      if (body.active !== undefined) updateData.active = Boolean(body.active)

      const category = await db.menuCategory.update({ where: { id }, data: updateData })
      return NextResponse.json({ ok: true, message: 'Kategorija posodobljena', category })
    }

    if (type === 'item') {
      const updateData: Record<string, unknown> = {}
      const fields = ['name', 'description', 'price', 'taxRate', 'imageUrl', 'emoji', 'popular', 'sortOrder', 'active']
      for (const f of fields) {
        if (body[f] !== undefined) {
          updateData[f] = (f === 'price' || f === 'taxRate') ? parseFloat(body[f]) : (f === 'sortOrder') ? parseInt(body[f]) : body[f]
        }
      }
      if (body.vegan !== undefined) updateData.vegan = Boolean(body.vegan)
      if (body.vegetarian !== undefined) updateData.vegetarian = Boolean(body.vegetarian)
      if (body.spicy !== undefined) updateData.spicy = Boolean(body.spicy)
      if (body.glutenFree !== undefined) updateData.glutenFree = Boolean(body.glutenFree)
      if (body.allergens !== undefined) updateData.allergens = body.allergens ? JSON.stringify(body.allergens) : null
      if (body.inventoryItemId !== undefined) updateData.inventoryItemId = body.inventoryItemId || null

      const item = await db.menuItem.update({ where: { id }, data: updateData, include: { modifiers: true } })

      const parsed = {
        ...item,
        allergens: item.allergens ? JSON.parse(item.allergens) : [],
        modifiers: item.modifiers.map(m => ({ ...m, options: JSON.parse(m.options) })),
      }

      return NextResponse.json({ ok: true, message: 'Artikel posodobljen', item: parsed })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven type' }, { status: 400 })
  } catch (error) {
    console.error('[menu] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — delete item/category (soft delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') // "item" | "category"

    if (!id || !type) return NextResponse.json({ ok: false, error: 'id in type sta obvezna' }, { status: 400 })

    if (type === 'item') {
      const item = await db.menuItem.update({ where: { id }, data: { active: false } })
      return NextResponse.json({ ok: true, message: 'Artikel deaktiviran', item })
    }

    if (type === 'category') {
      const category = await db.menuCategory.update({ where: { id }, data: { active: false } })
      return NextResponse.json({ ok: true, message: 'Kategorija deaktivirana', category })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven type' }, { status: 400 })
  } catch (error) {
    console.error('[menu] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
