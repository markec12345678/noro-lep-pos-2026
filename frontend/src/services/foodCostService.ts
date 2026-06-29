// services/foodCostService
import { useQuery } from "@tanstack/react-query";
import {
  Menu,
  InventoryItem,
  RecipeItem,
  OrderItem,
  OrderItemStatus,
  LinkModelType,
} from "@/types";
import { fetcher, round2 } from "@/lib/helper";
import { useFetchInventoryItems, useFetchAllRecipeItems } from "@/services/inventoryService";
import { useFetchMenus } from "@/services/menuService";
import { useFetchReportOrderItems } from "@/services/reportService";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface DishCostBreakdown {
  menuId: string;
  menuName: string;
  menuPrice: number;
  /** Total ingredient cost per serving. */
  costPerServing: number;
  /** Gross profit (price - cost). */
  grossProfit: number;
  /** Profit margin percentage. */
  marginPercent: number;
  /** Markup percentage (price / cost - 1). */
  markupPercent: number;
  /** Food cost percentage (cost / price × 100). */
  foodCostPercent: number;
  /** Per-ingredient breakdown. */
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
    lineCost: number;
  }>;
  /** Whether the dish has a recipe defined. */
  hasRecipe: boolean;
}

export interface MenuEngineeringItem {
  menuId: string;
  name: string;
  price: number;
  costPerServing: number;
  grossProfit: number;
  marginPercent: number;
  /** Number sold in the period. */
  quantitySold: number;
  /** Total revenue from this item. */
  revenue: number;
  /** Total profit from this item. */
  totalProfit: number;
  /**
   * Menu engineering classification:
   * - Star: high popularity + high profitability
   * - Plowhorse: high popularity + low profitability
   * - Puzzle: low popularity + high profitability
   * - Dog: low popularity + low profitability
   */
  classification: "star" | "plowhorse" | "puzzle" | "dog" | "unknown";
}

export interface MenuEngineeringSummary {
  items: MenuEngineeringItem[];
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  averageMargin: number;
  stars: number;
  plowhorses: number;
  puzzles: number;
  dogs: number;
}

/* ------------------------------------------------------------------ */
/* Hook: compute dish cost breakdowns for all menus                   */
/* ------------------------------------------------------------------ */

/**
 * Fetches all menus, inventory items, and recipe items, then computes
 * the cost breakdown for each menu item.
 *
 * Returns a map of menuId → DishCostBreakdown.
 */
export const useDishCostBreakdowns = () => {
  const { data: menus, isLoading: menusLoading } = useFetchMenus();
  const { data: inventory, isLoading: invLoading } = useFetchInventoryItems();
  const { data: recipes, isLoading: recipesLoading } =
    useFetchAllRecipeItems();

  const isLoading = menusLoading || invLoading || recipesLoading;

  const breakdowns: Map<string, DishCostBreakdown> = new Map();

  if (!isLoading && menus && inventory && recipes) {
    // Build inventory lookup: id → InventoryItem
    const invMap = new Map<string, InventoryItem>();
    for (const inv of inventory) {
      if (inv._id) invMap.set(inv._id, inv);
    }

    // Build recipe lookup: menuId → RecipeItem[]
    const recipeMap = new Map<string, RecipeItem[]>();
    for (const recipe of recipes) {
      const menuId =
        recipe.menu && typeof recipe.menu === "object" && "_id" in recipe.menu
          ? (recipe.menu as LinkModelType)._id
          : undefined;
      if (!menuId) continue;
      const existing = recipeMap.get(menuId) ?? [];
      existing.push(recipe);
      recipeMap.set(menuId, existing);
    }

    // Compute cost per menu
    for (const menu of menus) {
      if (!menu._id) continue;
      const menuRecipes = recipeMap.get(menu._id) ?? [];
      const ingredients: DishCostBreakdown["ingredients"] = [];
      let costPerServing = 0;

      for (const recipe of menuRecipes) {
        const invId =
          recipe.inventoryItem &&
          typeof recipe.inventoryItem === "object" &&
          "_id" in recipe.inventoryItem
            ? (recipe.inventoryItem as LinkModelType)._id
            : undefined;
        if (!invId) continue;
        const inv = invMap.get(invId);
        if (!inv) continue;

        const lineCost = round2((inv.cost ?? 0) * (recipe.quantity ?? 0));
        costPerServing += lineCost;
        ingredients.push({
          name: inv.name,
          quantity: recipe.quantity ?? 0,
          unit: inv.unit ?? "pc",
          unitCost: inv.cost ?? 0,
          lineCost,
        });
      }

      costPerServing = round2(costPerServing);
      const menuPrice = menu.price ?? 0;
      const grossProfit = round2(menuPrice - costPerServing);
      const marginPercent =
        menuPrice > 0
          ? Math.round((grossProfit / menuPrice) * 1000) / 10
          : 0;
      const markupPercent =
        costPerServing > 0
          ? Math.round((menuPrice / costPerServing - 1) * 1000) / 10
          : 0;
      const foodCostPercent =
        menuPrice > 0
          ? Math.round((costPerServing / menuPrice) * 1000) / 10
          : 0;

      breakdowns.set(menu._id, {
        menuId: menu._id,
        menuName: menu.name,
        menuPrice,
        costPerServing,
        grossProfit,
        marginPercent,
        markupPercent,
        foodCostPercent,
        ingredients,
        hasRecipe: menuRecipes.length > 0,
      });
    }
  }

  return { breakdowns, isLoading };
};

/* ------------------------------------------------------------------ */
/* Hook: menu engineering analysis (profitability × popularity)       */
/* ------------------------------------------------------------------ */

/**
 * Combines dish cost breakdowns with sales data to produce a menu
 * engineering matrix (Stars / Plowhorses / Puzzles / Dogs).
 *
 * Classification logic:
 * - Compute average popularity (quantity sold) and average margin
 * - Star: above-average popularity AND above-average margin
 * - Plowhorse: above-average popularity, below-average margin
 * - Puzzle: below-average popularity, above-average margin
 * - Dog: below-average popularity AND below-average margin
 *
 * Uses reportOrderItems (completed orders) for sales data.
 */
export const useMenuEngineering = () => {
  const { breakdowns, isLoading: costLoading } = useDishCostBreakdowns();
  const { data: orderItems, isLoading: salesLoading } =
    useFetchReportOrderItems();

  const isLoading = costLoading || salesLoading;

  const summary: MenuEngineeringSummary | null = (() => {
    if (isLoading || !breakdowns || !orderItems) return null;

    // Aggregate sales per menu item
    const salesMap = new Map<
      string,
      { quantity: number; revenue: number }
    >();

    for (const oi of orderItems) {
      if (oi.status === OrderItemStatus.Cancelled) continue;
      const menuId =
        oi.menu && typeof oi.menu === "object" && "_id" in oi.menu
          ? (oi.menu as LinkModelType)._id
          : undefined;
      if (!menuId) continue;
      const existing = salesMap.get(menuId) ?? { quantity: 0, revenue: 0 };
      existing.quantity += oi.quantity ?? 0;
      existing.revenue += (oi.price ?? 0) * (oi.quantity ?? 0);
      salesMap.set(menuId, existing);
    }

    // Build items array
    const items: MenuEngineeringItem[] = [];
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCost = 0;

    for (const [menuId, breakdown] of breakdowns) {
      const sales = salesMap.get(menuId) ?? { quantity: 0, revenue: 0 };
      const totalItemCost = round2(breakdown.costPerServing * sales.quantity);
      const totalItemProfit = round2(sales.revenue - totalItemCost);

      items.push({
        menuId,
        name: breakdown.menuName,
        price: breakdown.menuPrice,
        costPerServing: breakdown.costPerServing,
        grossProfit: breakdown.grossProfit,
        marginPercent: breakdown.marginPercent,
        quantitySold: sales.quantity,
        revenue: round2(sales.revenue),
        totalProfit: totalItemProfit,
        classification: "unknown", // assigned after computing averages
      });

      totalRevenue += sales.revenue;
      totalProfit += totalItemProfit;
      totalCost += totalItemCost;
    }

    // Compute averages for classification
    const itemsWithSales = items.filter((i) => i.quantitySold > 0);
    const avgQuantity =
      itemsWithSales.length > 0
        ? itemsWithSales.reduce((s, i) => s + i.quantitySold, 0) /
          itemsWithSales.length
        : 0;
    const avgMargin =
      items.length > 0
        ? items.reduce((s, i) => s + i.marginPercent, 0) / items.length
        : 0;

    // Classify each item
    let stars = 0;
    let plowhorses = 0;
    let puzzles = 0;
    let dogs = 0;

    for (const item of items) {
      if (item.quantitySold === 0) {
        item.classification = "unknown";
        continue;
      }
      const isPopular = item.quantitySold >= avgQuantity;
      const isProfitable = item.marginPercent >= avgMargin;

      if (isPopular && isProfitable) {
        item.classification = "star";
        stars++;
      } else if (isPopular && !isProfitable) {
        item.classification = "plowhorse";
        plowhorses++;
      } else if (!isPopular && isProfitable) {
        item.classification = "puzzle";
        puzzles++;
      } else {
        item.classification = "dog";
        dogs++;
      }
    }

    // Sort by total profit descending
    items.sort((a, b) => b.totalProfit - a.totalProfit);

    return {
      items,
      totalRevenue: round2(totalRevenue),
      totalProfit: round2(totalProfit),
      totalCost: round2(totalCost),
      averageMargin: items.length > 0
        ? Math.round((totalProfit / (totalRevenue || 1)) * 1000) / 10
        : 0,
      stars,
      plowhorses,
      puzzles,
      dogs,
    };
  })();

  return { summary, isLoading };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

export const formatPercent = (value: number) =>
  `${(value ?? 0).toFixed(1)}%`;

export const CLASSIFICATION_INFO = {
  star: {
    label: "Zvezda",
    description: "Priljubljena in donosna — ohranite in promovirajte",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "⭐",
  },
  plowhorse: {
    label: "Delavni konj",
    description: "Priljubljena a manj donosna — povečajte ceno ali zmanjšajte stroške",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "🐴",
  },
  puzzle: {
    label: "Uganka",
    description: "Donosna a nepopularna — promovirajte ali spremenite recepturo",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: "🧩",
  },
  dog: {
    label: "Pes",
    description: "Nepopularna in nedonosna — razmislite o odstranitvi",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: "🐶",
  },
  unknown: {
    label: "Brez prodaje",
    description: "Ni bil prodan v izbranem obdobju",
    color: "bg-gray-50 text-gray-500 border-gray-200",
    icon: "—",
  },
} as const;
