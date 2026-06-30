import { useMemo } from "react";
import { useFetchReportOrders } from "@/services/reportService";
import { Order, OrderStatus } from "@/types";
import { round2 } from "@/lib/helper";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface DailyRevenue {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  /** 7-day moving average (null if not enough data). */
  movingAvg: number | null;
}

export interface WeekComparison {
  thisWeek: { revenue: number; orders: number; avgTicket: number };
  lastWeek: { revenue: number; orders: number; avgTicket: number };
  /** Percentage change in revenue. */
  revenueChange: number;
  /** Percentage change in orders. */
  ordersChange: number;
  /** Percentage change in average ticket. */
  ticketChange: number;
}

export interface ForecastSummary {
  daily: DailyRevenue[];
  /** Projected revenue for the next 7 days (based on moving avg trend). */
  projection: number;
  /** Current 7-day moving average. */
  currentMovingAvg: number;
  /** Trend direction. */
  trend: "up" | "down" | "stable";
  /** Trend strength (% change in moving avg over the period). */
  trendStrength: number;
  weekComparison: WeekComparison;
  /** Best day of the week (highest avg revenue). */
  bestDayOfWeek: { day: string; avgRevenue: number } | null;
  /** Best day overall in the period. */
  bestDay: DailyRevenue | null;
  /** Worst day overall in the period. */
  worstDay: DailyRevenue | null;
}

const DAY_NAMES = ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob"];

/* ------------------------------------------------------------------ */
/* Hook: revenue forecast + week comparison                            */
/* ------------------------------------------------------------------ */

/**
 * Analyzes revenue trends over the last 30 days:
 * - Daily revenue with 7-day moving average
 * - Revenue projection for next 7 days
 * - Week-over-week comparison (revenue, orders, avg ticket)
 * - Best/worst day analysis
 * - Best day of week pattern
 *
 * Uses completed orders only.
 */
export const useRevenueForecast = (days = 30) => {
  const { data: orders, isLoading } = useFetchReportOrders();

  const summary: ForecastSummary | null = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Build daily buckets for the last N days
    const buckets = new Map<
      string,
      { revenue: number; orders: number }
    >();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { revenue: 0, orders: 0 });
    }

    // Fill with order data
    for (const order of orders) {
      if (order.status !== OrderStatus.Completed) continue;
      if (!order._created) continue;
      const d = new Date(order._created * 1000);
      const key = d.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.revenue += order.total_amount ?? 0;
      bucket.orders += 1;
    }

    // Build daily array with moving average
    const daily: DailyRevenue[] = [];
    const dates = Array.from(buckets.keys()).sort();
    const revenues = dates.map((d) => buckets.get(d)?.revenue ?? 0);

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i] + "T00:00:00");
      const bucket = buckets.get(dates[i])!;

      // 7-day moving average (look back 7 days including current)
      const startIdx = Math.max(0, i - 6);
      const window = revenues.slice(startIdx, i + 1);
      const movingAvg =
        window.length >= 3
          ? round2(window.reduce((s, v) => s + v, 0) / window.length)
          : null;

      daily.push({
        date: dates[i],
        label: d.toLocaleDateString("sl-SI", {
          day: "2-digit",
          month: "short",
        }),
        revenue: round2(bucket.revenue),
        orders: bucket.orders,
        movingAvg,
      });
    }

    // Current moving average (last 7 days)
    const last7 = revenues.slice(-7);
    const currentMovingAvg = round2(
      last7.reduce((s, v) => s + v, 0) / Math.max(last7.length, 1),
    );

    // Projection: extend the moving average trend
    const firstAvg = daily.find((d) => d.movingAvg !== null)?.movingAvg ?? currentMovingAvg;
    const trendStrength =
      firstAvg > 0
        ? round2(((currentMovingAvg - firstAvg) / firstAvg) * 100)
        : 0;

    const trend: ForecastSummary["trend"] =
      trendStrength > 5 ? "up" : trendStrength < -5 ? "down" : "stable";

    const projection = round2(currentMovingAvg * 7);

    // Week-over-week comparison
    const thisWeekStart = new Date(now);
    const dayOfWeek = now.getDay();
    thisWeekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const thisWeekStartStr = thisWeekStart.toISOString().slice(0, 10);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);

    const thisWeekData = { revenue: 0, orders: 0 };
    const lastWeekData = { revenue: 0, orders: 0 };

    for (const order of orders) {
      if (order.status !== OrderStatus.Completed || !order._created) continue;
      const d = new Date(order._created * 1000);
      const key = d.toISOString().slice(0, 10);
      const amount = order.total_amount ?? 0;

      if (key >= thisWeekStartStr && key <= todayStr) {
        thisWeekData.revenue += amount;
        thisWeekData.orders += 1;
      } else if (key >= lastWeekStartStr && key < thisWeekStartStr) {
        lastWeekData.revenue += amount;
        lastWeekData.orders += 1;
      }
    }

    const thisWeek = {
      revenue: round2(thisWeekData.revenue),
      orders: thisWeekData.orders,
      avgTicket: thisWeekData.orders > 0
        ? round2(thisWeekData.revenue / thisWeekData.orders)
        : 0,
    };
    const lastWeek = {
      revenue: round2(lastWeekData.revenue),
      orders: lastWeekData.orders,
      avgTicket: lastWeekData.orders > 0
        ? round2(lastWeekData.revenue / lastWeekData.orders)
        : 0,
    };

    const weekComparison: WeekComparison = {
      thisWeek,
      lastWeek,
      revenueChange: lastWeek.revenue > 0
        ? round2(((thisWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100)
        : 0,
      ordersChange: lastWeek.orders > 0
        ? round2(((thisWeek.orders - lastWeek.orders) / lastWeek.orders) * 100)
        : 0,
      ticketChange: lastWeek.avgTicket > 0
        ? round2(((thisWeek.avgTicket - lastWeek.avgTicket) / lastWeek.avgTicket) * 100)
        : 0,
    };

    // Best/worst day
    const sortedByRevenue = [...daily].filter((d) => d.revenue > 0).sort(
      (a, b) => b.revenue - a.revenue,
    );
    const bestDay = sortedByRevenue[0] ?? null;
    const worstDay = sortedByRevenue[sortedByRevenue.length - 1] ?? null;

    // Best day of week (average revenue per weekday)
    const byDayOfWeek = new Map<number, { total: number; count: number }>();
    for (const d of daily) {
      if (d.revenue <= 0) continue;
      const dow = new Date(d.date + "T00:00:00").getDay();
      const existing = byDayOfWeek.get(dow) ?? { total: 0, count: 0 };
      existing.total += d.revenue;
      existing.count += 1;
      byDayOfWeek.set(dow, existing);
    }

    let bestDayOfWeek: ForecastSummary["bestDayOfWeek"] = null;
    let bestAvg = 0;
    for (const [dow, data] of byDayOfWeek) {
      const avg = data.count > 0 ? data.total / data.count : 0;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDayOfWeek = {
          day: DAY_NAMES[dow],
          avgRevenue: round2(avg),
        };
      }
    }

    return {
      daily,
      projection,
      currentMovingAvg,
      trend,
      trendStrength,
      weekComparison,
      bestDayOfWeek,
      bestDay,
      worstDay,
    };
  }, [orders, days]);

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

export const formatPercent = (value: number, withSign = true) => {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

export const TREND_INFO = {
  up: { label: "Narašča", color: "text-green-600", icon: "📈" },
  down: { label: "pada", color: "text-red-600", icon: "📉" },
  stable: { label: "Stabilen", color: "text-gray-500", icon: "➡️" },
} as const;
