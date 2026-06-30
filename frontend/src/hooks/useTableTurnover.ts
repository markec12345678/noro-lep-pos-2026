import { useMemo } from "react";
import { useFetchReportOrders } from "@/services/reportService";
import { Order, OrderStatus } from "@/types";
import { round2 } from "@/lib/helper";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface TableTurnoverData {
  tableNumber: string;
  /** Number of completed orders at this table. */
  orderCount: number;
  /** Total revenue from this table. */
  revenue: number;
  /** Average occupancy time per order (seconds). */
  avgOccupancy: number;
  /** Revenue per hour of occupancy. */
  revenuePerHour: number;
}

export interface TableTurnoverSummary {
  tables: TableTurnoverData[];
  /** Total orders across all tables. */
  totalOrders: number;
  /** Total revenue. */
  totalRevenue: number;
  /** Overall average occupancy time. */
  avgOccupancy: number;
  /** Overall revenue per table-hour. */
  avgRevenuePerHour: number;
  /** Busiest table (most orders). */
  busiestTable?: TableTurnoverData;
  /** Most efficient table (highest revenue/hour). */
  mostEfficientTable?: TableTurnoverData;
  /** Hourly table utilization (orders started per hour). */
  hourlyUtilization: Array<{ hour: string; orders: number }>;
}

/* ------------------------------------------------------------------ */
/* Hook: compute table turnover from completed orders                  */
/* ------------------------------------------------------------------ */

/**
 * Analyzes table utilization from completed orders.
 *
 * Metrics per table:
 * - Order count (how many times the table was used)
 * - Total revenue
 * - Average occupancy time (from order creation to completion)
 * - Revenue per hour of occupancy (efficiency metric)
 *
 * Overall:
 * - Average occupancy across all tables
 * - Hourly utilization (which hours have the most table starts)
 * - Busiest table (most orders)
 * - Most efficient table (highest €/hour)
 *
 * Occupancy time is computed from _created to _modified (last status
 * change = completion). This is an approximation — the actual time
 * from "table occupied" to "table freed" may be slightly different.
 */
export const useTableTurnover = (days = 30) => {
  const { data: orders, isLoading } = useFetchReportOrders();

  const summary: TableTurnoverSummary | null = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const now = Date.now() / 1000;
    const cutoff = now - days * 86400;

    // Filter to completed orders within the time window
    const completed = orders.filter(
      (o) =>
        o.status === OrderStatus.Completed &&
        (o._created ?? 0) >= cutoff,
    );

    if (completed.length === 0) return null;

    // Group by table number
    const byTable = new Map<
      string,
      { orders: Order[]; revenue: number; totalOccupancy: number }
    >();

    // Hourly utilization
    const hourlyBuckets = new Map<number, number>();
    for (let h = 0; h < 24; h++) hourlyBuckets.set(h, 0);

    for (const order of completed) {
      const tableNumber =
        order.table && typeof order.table === "object" && "table_number" in order.table
          ? (order.table as { table_number?: string }).table_number ?? "—"
          : "—";

      const revenue = order.total_amount ?? 0;
      const created = order._created ?? 0;
      const modified = order._modified ?? created;
      const occupancy = Math.max(0, modified - created);

      const existing = byTable.get(tableNumber) ?? {
        orders: [],
        revenue: 0,
        totalOccupancy: 0,
      };
      existing.orders.push(order);
      existing.revenue += revenue;
      existing.totalOccupancy += occupancy;
      byTable.set(tableNumber, existing);

      // Hourly: which hour did this order start?
      if (created > 0) {
        const hour = new Date(created * 1000).getHours();
        hourlyBuckets.set(hour, (hourlyBuckets.get(hour) ?? 0) + 1);
      }
    }

    // Build table data
    const tables: TableTurnoverData[] = [];
    let totalOrders = 0;
    let totalRevenue = 0;
    let totalOccupancy = 0;

    for (const [tableNumber, data] of byTable) {
      const count = data.orders.length;
      const avgOcc = count > 0 ? data.totalOccupancy / count : 0;
      const occHours = avgOcc / 3600;
      const revPerHour = occHours > 0 ? data.revenue / (data.revenue > 0 ? (data.totalOccupancy / 3600) : 1) : 0;

      tables.push({
        tableNumber,
        orderCount: count,
        revenue: round2(data.revenue),
        avgOccupancy: Math.round(avgOcc),
        revenuePerHour: round2(revPerHour),
      });

      totalOrders += count;
      totalRevenue += data.revenue;
      totalOccupancy += data.totalOccupancy;
    }

    // Sort by order count (busiest first)
    tables.sort((a, b) => b.orderCount - a.orderCount);

    // Hourly utilization
    const hourlyUtilization = Array.from(hourlyBuckets.entries())
      .filter(([, count]) => count > 0)
      .map(([hour, count]) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        orders: count,
      }));

    const avgOcc = totalOrders > 0 ? Math.round(totalOccupancy / totalOrders) : 0;
    const totalOccHours = totalOccupancy / 3600;
    const avgRevPerHour = totalOccHours > 0 ? round2(totalRevenue / totalOccHours) : 0;

    // Most efficient table (highest revenue/hour)
    const sortedByEfficiency = [...tables].sort(
      (a, b) => b.revenuePerHour - a.revenuePerHour,
    );

    return {
      tables,
      totalOrders,
      totalRevenue: round2(totalRevenue),
      avgOccupancy: avgOcc,
      avgRevenuePerHour: avgRevPerHour,
      busiestTable: tables[0],
      mostEfficientTable: sortedByEfficiency[0],
      hourlyUtilization,
    };
  }, [orders, days]);

  return { summary, isLoading };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const formatOccupancy = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
