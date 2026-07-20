import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/audit'

/**
 * Recipes API — recipe costing in food cost per menu item
 *
 * GET    /api/recipes              — list recipes z ingredients + cost
 * GET    /api/recipes?id=X         — single recipe z ingredients
 * GET    /api/recipes?menuItemId=X — recipe za specifičen menu item
 * POST   /api/recipes              — create recipe z ingredients (auto cost calc)
 * PATCH  /api/recipes              — update recipe / ingredients
 * DELETE /api/recipes?id=X         — delete recipe z ingredients
 *
 * Auto-calculation:
 *   foodCost = sum(ingredient.totalCost * wasteFactor)
 *   costPerServing = foodCost / yieldQty
 *   margin = menuItem.price - costPerServing
 *   marginPct = (margin / menuItem.price) * 100
 *
 * Cost endpoint: /api/recipes/cost?menuItemId=X — hitri cost lookup
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const menuItemId = searchParams.get('menuItemId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (id) {
      const recipe = await db.recipe.findUnique({
        where: { id },
        include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
      })
      if (!recipe) return NextResponse.json({ ok: false, error: 'Recept ni najden' }, { status: 404 })
      return NextResponse.json({ ok: true, recipe })
    }

    if (menuItemId) {
      const recipe = await db.recipe.findUnique({
        where: { menuItemId },
        include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
      })
      if (!recipe) return NextResponse.json({ ok: false, error: 'Recept za ta artikel ni najden' }, { status: 404 })
      return NextResponse.json({ ok: true, recipe })
    }

    const recipes = await db.recipe.findMany({
      where: { active: true },
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { menuItemName: 'asc' },
      take: limit,
    })

    // Stats
    const stats = {
      total: recipes.length,
      avgFoodCost: recipes.length > 0
        ? Math.round(recipes.reduce((s, r) => s + r.foodCost, 0) / recipes.length * 100) / 100
        : 0,
      avgMarginPct: recipes.length > 0
        ? Math.round(recipes.reduce((s, r) => s + r.marginPct, 0) / recipes.length * 100) / 100
        : 0,
      lowMargin: recipes.filter(r => r.marginPct < 60).length,
      highMargin: recipes.filter(r => r.marginPct >= 75).length,
      avgIngredients: recipes.length > 0
        ? Math.round(recipes.reduce((s, r) => s + r.ingredients.length, 0) / recipes.length * 10) / 10
        : 0,
    }

    return NextResponse.json({ ok: true, count: recipes.length, stats, recipes })
  } catch (error) {
    console.error('[recipes] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create recipe z ingredients
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { menuItemId, menuItemName, yieldQty = 1, yieldUnit = 'porcija', ingredients, notes, performedBy } = body

    if (!menuItemId || !menuItemName) {
      return NextResponse.json({ ok: false, error: 'menuItemId in menuItemName sta obvezna' }, { status: 400 })
    }
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ ok: false, error: 'ingredients so obvezni' }, { status: 400 })
    }

    // Check if recipe already exists
    const existing = await db.recipe.findUnique({ where: { menuItemId } })
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Recept za ta artikel že obstaja. Uporabi PATCH.' }, { status: 409 })
    }

    // Get menu item price for margin calc
    const menuItem = await db.menuItem.findUnique({ where: { id: menuItemId }, select: { price: true } })
    const price = menuItem?.price || 0

    // Calculate costs
    let foodCost = 0
    const recipeIngredients = ingredients.map((ing: {
      inventoryItemId?: string; ingredientName: string; quantity: number; unit?: string;
      unitCost?: number; wasteFactor?: number; prepNotes?: string; sortOrder?: number
    }, idx: number) => {
      const qty = parseFloat(ing.quantity)
      const unitCost = ing.unitCost ? parseFloat(ing.unitCost) : 0
      const wasteFactor = ing.wasteFactor ? parseFloat(ing.wasteFactor) : 1
      const totalCost = Math.round(qty * unitCost * wasteFactor * 100) / 100
      foodCost += totalCost
      return {
        inventoryItemId: ing.inventoryItemId || null,
        ingredientName: ing.ingredientName,
        quantity: qty,
        unit: ing.unit || 'kos',
        unitCost,
        totalCost,
        wasteFactor,
        prepNotes: ing.prepNotes || null,
        sortOrder: ing.sortOrder ?? idx,
      }
    })

    foodCost = Math.round(foodCost * 100) / 100
    const yieldQ = parseFloat(yieldQty)
    const costPerServing = yieldQ > 0 ? Math.round((foodCost / yieldQ) * 100) / 100 : foodCost
    const margin = Math.round((price - costPerServing) * 100) / 100
    const marginPct = price > 0 ? Math.round((margin / price) * 10000) / 100 : 0

    const recipe = await db.recipe.create({
      data: {
        menuItemId,
        menuItemName,
        yieldQty: yieldQ,
        yieldUnit,
        foodCost,
        costPerServing,
        margin,
        marginPct,
        notes: notes || null,
        ingredients: { create: recipeIngredients },
      },
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
    })

    await auditLog({
      entityType: 'menu',
      entityId: recipe.id,
      entityName: menuItemName,
      action: 'create',
      performedBy: performedBy || 'unknown',
      metadata: { type: 'recipe', foodCost, costPerServing, margin, marginPct, ingredients: recipeIngredients.length },
    })

    console.log(`[recipes] ✓ Recept za ${menuItemName} | ${recipeIngredients.length} ingredientov | foodCost=€${foodCost} | cost/serving=€${costPerServing} | margin=${marginPct}%`)

    return NextResponse.json({
      ok: true,
      message: `Recept za ${menuItemName} ustvarjen`,
      recipe,
    }, { status: 201 })
  } catch (error) {
    console.error('[recipes] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update recipe / ingredients / recalculate
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, performedBy } = body

    if (!id || !action) return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })

    const recipe = await db.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    })
    if (!recipe) return NextResponse.json({ ok: false, error: 'Recept ni najden' }, { status: 404 })

    // ===== RECALCULATE (po spremembi cen ingredientov) =====
    if (action === 'recalculate') {
      // Pridobi aktualne cene iz InventoryItem
      const ingredients = await db.recipeIngredient.findMany({
        where: { recipeId: id },
      })

      let foodCost = 0
      for (const ing of ingredients) {
        let unitCost = ing.unitCost
        // Če ima inventoryItemId, pridobi aktualno ceno
        if (ing.inventoryItemId) {
          const invItem = await db.inventoryItem.findUnique({
            where: { id: ing.inventoryItemId },
            select: { purchasePrice: true },
          })
          if (invItem) {
            unitCost = invItem.purchasePrice
            await db.recipeIngredient.update({
              where: { id: ing.id },
              data: {
                unitCost,
                totalCost: Math.round(ing.quantity * unitCost * ing.wasteFactor * 100) / 100,
              },
            })
          }
        }
        foodCost += ing.quantity * unitCost * ing.wasteFactor
      }

      foodCost = Math.round(foodCost * 100) / 100
      const costPerServing = recipe.yieldQty > 0 ? Math.round((foodCost / recipe.yieldQty) * 100) / 100 : foodCost

      // Get menu item price
      const menuItem = await db.menuItem.findUnique({
        where: { id: recipe.menuItemId },
        select: { price: true },
      })
      const price = menuItem?.price || 0
      const margin = Math.round((price - costPerServing) * 100) / 100
      const marginPct = price > 0 ? Math.round((margin / price) * 10000) / 100 : 0

      const updated = await db.recipe.update({
        where: { id },
        data: { foodCost, costPerServing, margin, marginPct },
        include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
      })

      await auditLog({
        entityType: 'menu',
        entityId: id,
        entityName: recipe.menuItemName,
        action: 'update',
        performedBy: performedBy || 'system',
        metadata: { type: 'recipe_recalc', foodCost, costPerServing, margin, marginPct },
      })

      console.log(`[recipes] ✓ Recalculate ${recipe.menuItemName} | foodCost=€${foodCost} | margin=${marginPct}%`)

      return NextResponse.json({
        ok: true,
        message: 'Stroški preračunani',
        recipe: updated,
      })
    }

    // ===== UPDATE (posodobi yield, notes, active) =====
    if (action === 'update') {
      const updateData: Record<string, unknown> = {}
      if (body.yieldQty !== undefined) updateData.yieldQty = parseFloat(body.yieldQty)
      if (body.yieldUnit !== undefined) updateData.yieldUnit = body.yieldUnit
      if (body.notes !== undefined) updateData.notes = body.notes
      if (body.active !== undefined) updateData.active = Boolean(body.active)

      const updated = await db.recipe.update({ where: { id }, data: updateData, include: { ingredients: true } })
      return NextResponse.json({ ok: true, message: 'Recept posodobljen', recipe: updated })
    }

    // ===== ADD INGREDIENT =====
    if (action === 'add_ingredient') {
      const { ingredientName, quantity, unit, unitCost, wasteFactor, inventoryItemId, prepNotes, sortOrder } = body
      if (!ingredientName || !quantity) return NextResponse.json({ ok: false, error: 'ingredientName in quantity sta obvezna' }, { status: 400 })

      const qty = parseFloat(quantity)
      const cost = unitCost ? parseFloat(unitCost) : 0
      const waste = wasteFactor ? parseFloat(wasteFactor) : 1
      const totalCost = Math.round(qty * cost * waste * 100) / 100

      const ingredient = await db.recipeIngredient.create({
        data: {
          recipeId: id,
          inventoryItemId: inventoryItemId || null,
          ingredientName,
          quantity: qty,
          unit: unit || 'kos',
          unitCost: cost,
          totalCost,
          wasteFactor: waste,
          prepNotes: prepNotes || null,
          sortOrder: sortOrder ?? recipe.ingredients.length,
        },
      })

      // Auto-recalculate recipe
      await recalculateRecipe(id)

      return NextResponse.json({ ok: true, message: 'Ingredien dodan', ingredient })
    }

    // ===== REMOVE INGREDIENT =====
    if (action === 'remove_ingredient') {
      const { ingredientId } = body
      if (!ingredientId) return NextResponse.json({ ok: false, error: 'ingredientId je obvezen' }, { status: 400 })

      await db.recipeIngredient.delete({ where: { id: ingredientId } })
      await recalculateRecipe(id)

      return NextResponse.json({ ok: true, message: 'Ingredien odstranjen' })
    }

    return NextResponse.json({ ok: false, error: 'Neveljven action. Dovoljeni: recalculate, update, add_ingredient, remove_ingredient' }, { status: 400 })
  } catch (error) {
    console.error('[recipes] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'id je obvezen' }, { status: 400 })

    const recipe = await db.recipe.delete({ where: { id } }) // ingredients cascade delete

    await auditLog({
      entityType: 'menu',
      entityId: id,
      entityName: recipe.menuItemName,
      action: 'delete',
      severity: 'warning',
    })

    return NextResponse.json({ ok: true, message: `Recept za ${recipe.menuItemName} izbrisan` })
  } catch (error) {
    console.error('[recipes] DELETE napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Helper: recalculate recipe costs
async function recalculateRecipe(recipeId: string): Promise<void> {
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true },
  })
  if (!recipe) return

  let foodCost = 0
  for (const ing of recipe.ingredients) {
    foodCost += ing.totalCost
  }

  foodCost = Math.round(foodCost * 100) / 100
  const costPerServing = recipe.yieldQty > 0 ? Math.round((foodCost / recipe.yieldQty) * 100) / 100 : foodCost

  const menuItem = await db.menuItem.findUnique({
    where: { id: recipe.menuItemId },
    select: { price: true },
  })
  const price = menuItem?.price || 0
  const margin = Math.round((price - costPerServing) * 100) / 100
  const marginPct = price > 0 ? Math.round((margin / price) * 10000) / 100 : 0

  await db.recipe.update({
    where: { id: recipeId },
    data: { foodCost, costPerServing, margin, marginPct },
  })
}
