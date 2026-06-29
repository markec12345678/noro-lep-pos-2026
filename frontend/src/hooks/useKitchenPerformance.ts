import { useMemo } from "react";
import { useFetchReportOrderItems } from "@/services/reportService";
import { OrderItem, OrderItemStatus } from "@/types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface DishPerformance {
  menuId: string;
  name: string;
  /** Number of times this dish was prepared. */
  count: number;
  /** Average preparation time in seconds (from new → ready/completed). */
  avgPrepTime: number;
  /** Median preparation time. */
  medianPrepTime: number;
  /** Fastest preparation time. */
  minPrepTime: number;
  /** Slowest preparation time. */
  maxPrepTime: number;
  /** All preparation times for this dish (for charts). */
  prepTimes: number[];
  /** Performance rating based on avg time. */
  rating: "fast" | "normal" | "slow" | "critical";
}

export interface KitchenPerformanceSummary {
  dishes: DishPerformance[];
  /** Overall average prep time across all dishes. */
  overallAvg: number;
  /** Slowest dish. */
  slowestDish?: DishPerformance;
  /** Fastest dish. */
  fastestDish?: DishPerformance;
  /** Total dishes analyzed. */
  totalDishes: number;
  /** Total items prepared. */
  totalItems: number;
}

/* ------------------------------------------------------------------ */
/* Performance thresholds (in seconds)                                 */
/* ------------------------------------------------------------------ */

const THRESHOLDS = {
  fast: 300,      // < 5 min
  normal: 600,    // 5-10 min
  slow: 900,      // 10-15 min
  // > 15 min = critical
};

/* ------------------------------------------------------------------ */
/* Hook: compute kitchen performance from order items                  */
/* ------------------------------------------------------------------ */

/**
 * Analyzes kitchen preparation times by dish.
 *
 * For each completed order item, computes the time from creation (_created)
 * to when it was marked as "ready" or "completed". This is the actual
 * preparation time the kitchen took.
 *
 * Since we don't have per-status timestamps (Cockpit CMS only stores
 * _created and _modified), we use _modified as the completion time.
 * This is the last time the item was updated (which happens when the
 * chef marks it ready or the waiter completes checkout).
 *
 * Groups by menu item and computes avg/median/min/max prep times.
 */
export const useKitchenPerformance = () => {
  const { data: orderItems, isLoading } = useFetchReportOrderItems();

  const summary: KitchenPerformanceSummary | null = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return null;

    // Filter to items that were actually prepared (not cancelled)
    const prepared = orderItems.filter(
      (item) =>
        item.status === OrderItemStatus.Completed ||
        item.status === OrderItemStatus.Ready,
    );

    if (prepared.length === 0) return null;

    // Group by menu ID
    const byMenu = new Map<
      string,
      { name: string; prepTimes: number[] }
    >();

    for (const item of prepared) {
      const menuId =
        item.menu && typeof item.menu === "object" && "_id" in item.menu
          ? (item.menu as { _id?: string })._id
          : undefined;
      if (!menuId) continue;

      const menuName =
        item.menu && typeof item.menu === "object" && "name" in item.menu
          ? (item.menu as { name?: string }).name ?? "Unknown"
          : "Unknown";

      // Prep time = _modified - _created (in seconds)
      const created = item._created ?? 0;
      const modified = item._modified ?? created;
      const prepTime = modified - created;

      // Skip invalid times (0 or negative)
      if (prepTime <= 0) continue;

      const existing = byMenu.get(menuId) ?? { name: menuName, prepTimes: [] };
      existing.prepTimes.push(prepTime);
      byMenu.set(menuId, existing);
    }

    // Build dish performance entries
    const dishes: DishPerformance[] = [];
    let allTimes: number[] = [];

    for (const [menuId, data] of byMenu) {
      const times = data.prepTimes.sort((a, b) => a - b);
      const count = times.length;
      const avg = times.reduce((s, t) => s + t, 0) / count;
      const median = count % 2 === 0
        ? (times[count / 2 - 1] + times[count / 2]) / 2
        : times[Math.floor(count / 2)];
      const min = times[0];
      const max = times[count - 1];

      const rating: DishPerformance["rating"] =
        avg < THRESHOLDS.fast ? "fast"
        : avg < THRESHOLDS.normal ? "normal"
        : avg < THRESHOLDS.slow ? "slow"
        : "critical";

      dishes.push({
        menuId,
        name: data.name,
        count,
        avgPrepTime: Math.round(avg),
        medianPrepTime: Math.round(median),
        minPrepTime: min,
        maxPrepTime: max,
        prepTimes: times,
        rating,
      });

      allTimes = allTimes.concat(times);
    }

    // Sort by avg prep time descending (slowest first)
    dishes.sort((a, b) => b.avgPrepTime - a.avgPrepTime);

    const overallAvg =
      allTimes.length > 0
        ? Math.round(allTimes.reduce((s, t) => s + t, 0) / allTimes.length)
        : 0;

    return {
      dishes,
      overallAvg,
      slowestDish: dishes[0],
      fastestDish: dishes[dishes.length - 1],
      totalDishes: dishes.length,
      totalItems: allTimes.length,
    };
  }, [orderItems]);

  return { summary, isLoading };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const formatPrepTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export const RATING_INFO: Record<
  DishPerformance["rating"],
  { label: string; color: string; bg: string }
> = {
  fast: { label: "Hitro", color: "text-green-600", bg: "bg-green-100" },
  normal: { label: "Normalno", color: "text-blue-600", bg: "bg-blue-100" },
  slow: { label: "Počasno", color: "text-amber-600", bg: "bg-amber-100" },
  critical: { label: "Kritično", color: "text-red-600", bg: "bg-red-100" },
};
