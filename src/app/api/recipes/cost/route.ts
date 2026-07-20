import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Recipe Cost API — hitri cost lookup za menu item
 *
 * GET /api/recipes/cost                    — vsi recepti z cost/margin (sorted by marginPct)
 * GET /api/recipes/cost?menuItemId=X       — cost za specifičen menu item
 * GET /api/recipes/cost?lowMargin=true     — artikli z nizko margino (<60%)
 * GET /api/recipes/cost?highMargin=true    — artikli z visoko margino (>=75%)
 *
 * Vrača: menu engineering view (cost, price, margin, food cost %)
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')
    const lowMargin = searchParams.get('lowMargin') === 'true'
    const highMargin = searchParams.get('highMargin') === 'true'

    // Single menu item cost
    if (menuItemId) {
      const recipe = await db.recipe.findUnique({
        where: { menuItemId },
        include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
      })

      if (!recipe) return NextResponse.json({ ok: false, error: 'Recept ni najden' }, { status: 404 })

      const menuItem = await db.menuItem.findUnique({
        where: { id: menuItemId },
        select: { price: true, name: true, emoji: true, popular: true },
      })

      const foodCostPct = menuItem && menuItem.price > 0
        ? Math.round((recipe.costPerServing / menuItem.price) * 10000) / 100
        : 0

      // Menu engineering classification
      // Stars: high margin + high popularity
      // Workhorses: low margin + high popularity
      // Puzzles: high margin + low popularity
      // Dogs: low margin + low popularity
      const isHighMargin = recipe.marginPct >= 70
      const isPopular = menuItem?.popular || false
      let classification = 'dog'
      if (isHighMargin && isPopular) classification = 'star'
      else if (!isHighMargin && isPopular) classification = 'workhorse'
      else if (isHighMargin && !isPopular) classification = 'puzzle'

      return NextResponse.json({
        ok: true,
        cost: {
          menuItemName: recipe.menuItemName,
          emoji: menuItem?.emoji || '🍽️',
          price: menuItem?.price || 0,
          foodCost: recipe.foodCost,
          costPerServing: recipe.costPerServing,
          margin: recipe.margin,
          marginPct: recipe.marginPct,
          foodCostPct,
          yieldQty: recipe.yieldQty,
          ingredientCount: recipe.ingredients.length,
          popular: isPopular,
          classification,
          // Benchmark: food cost should be 25-35% of price
          benchmark: foodCostPct <= 35 ? 'healthy' : foodCostPct <= 40 ? 'warning' : 'critical',
          ingredients: recipe.ingredients.map(ing => ({
            name: ing.ingredientName,
            quantity: ing.quantity,
            unit: ing.unit,
            unitCost: ing.unitCost,
            totalCost: ing.totalCost,
            wasteFactor: ing.wasteFactor,
            wasteAmount: Math.round((ing.quantity * ing.unitCost * (ing.wasteFactor - 1)) * 100) / 100,
            prepNotes: ing.prepNotes,
          })),
        },
      })
    }

    // All recipes — menu engineering view
    const recipes = await db.recipe.findMany({
      where: { active: true },
      include: { ingredients: true },
      orderBy: { marginPct: 'desc' },
    })

    // Get menu item prices
    const menuItemIds = recipes.map(r => r.menuItemId)
    const menuItems = await db.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, price: true, name: true, emoji: true, popular: true },
    })
    const menuItemMap = Object.fromEntries(menuItems.map(m => [m.id, m]))

    let items = recipes.map(r => {
      const mi = menuItemMap[r.menuItemId]
      const price = mi?.price || 0
      const foodCostPct = price > 0 ? Math.round((r.costPerServing / price) * 10000) / 100 : 0
      const isHighMargin = r.marginPct >= 70
      const isPopular = mi?.popular || false
      let classification = 'dog'
      if (isHighMargin && isPopular) classification = 'star'
      else if (!isHighMargin && isPopular) classification = 'workhorse'
      else if (isHighMargin && !isPopular) classification = 'puzzle'

      return {
        menuItemId: r.menuItemId,
        menuItemName: r.menuItemName,
        emoji: mi?.emoji || '🍽️',
        price,
        foodCost: r.foodCost,
        costPerServing: r.costPerServing,
        margin: r.margin,
        marginPct: r.marginPct,
        foodCostPct,
        ingredientCount: r.ingredients.length,
        popular: isPopular,
        classification,
        benchmark: foodCostPct <= 35 ? 'healthy' : foodCostPct <= 40 ? 'warning' : 'critical',
      }
    })

    // Filter
    if (lowMargin) items = items.filter(i => i.marginPct < 60)
    if (highMargin) items = items.filter(i => i.marginPct >= 75)

    // Stats
    const stats = {
      total: items.length,
      avgFoodCostPct: items.length > 0
        ? Math.round(items.reduce((s, i) => s + i.foodCostPct, 0) / items.length * 100) / 100
        : 0,
      avgMarginPct: items.length > 0
        ? Math.round(items.reduce((s, i) => s + i.marginPct, 0) / items.length * 100) / 100
        : 0,
      stars: items.filter(i => i.classification === 'star').length,
      workhorses: items.filter(i => i.classification === 'workhorse').length,
      puzzles: items.filter(i => i.classification === 'puzzle').length,
      dogs: items.filter(i => i.classification === 'dog').length,
      critical: items.filter(i => i.benchmark === 'critical').length,
      healthy: items.filter(i => i.benchmark === 'healthy').length,
    }

    return NextResponse.json({
      ok: true,
      count: items.length,
      stats,
      items,
    })
  } catch (error) {
    console.error('[recipes/cost] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
