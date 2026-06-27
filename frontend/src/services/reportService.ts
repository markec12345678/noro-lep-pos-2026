// services/reportService
import { useQuery } from "@tanstack/react-query";
import { Order, OrderItem, OrderStatus } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetches ALL completed orders for reporting purposes.
 * Sorted by creation date ascending so charts can plot chronologically.
 */
export const useFetchReportOrders = () =>
  useQuery<Order[]>({
    queryKey: ["reportOrders"],
    queryFn: () =>
      fetcher<Order[]>(
        `${API_URL}/api/content/items/order?populate=1&sort={_created:1}&filter={status:"completed"}`,
      ),
  });

/**
 * Fetches ALL completed order items (across all orders) for reporting.
 * Used for top-selling items, category breakdown, etc.
 */
export const useFetchReportOrderItems = () =>
  useQuery<OrderItem[]>({
    queryKey: ["reportOrderItems"],
    queryFn: () =>
      fetcher<OrderItem[]>(
        `${API_URL}/api/content/items/orderitem?populate=1&sort={_created:1}&filter={status:"completed"}`,
      ),
  });

/* ------------------------------------------------------------------ */
/* Pure analytics helpers — keep them pure so they're testable        */
/* ------------------------------------------------------------------ */

export interface DailySalesPoint {
  date: string; // ISO date YYYY-MM-DD
  label: string; // human-readable label e.g. "27 Jun"
  revenue: number;
  orders: number;
}

export const aggregateDailySales = (
  orders: Order[],
  days = 30,
): DailySalesPoint[] => {
  const now = new Date();
  const buckets = new Map<string, { revenue: number; orders: number }>();

  // Initialize last N days (so chart shows gaps too)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { revenue: 0, orders: 0 });
  }

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

  return Array.from(buckets.entries()).map(([key, val]) => {
    const d = new Date(key + "T00:00:00");
    return {
      date: key,
      label: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      revenue: Math.round(val.revenue * 100) / 100,
      orders: val.orders,
    };
  });
};

export interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

export const aggregateTopItems = (
  orderItems: OrderItem[],
  limit = 10,
): TopItem[] => {
  const map = new Map<string, TopItem>();
  for (const oi of orderItems) {
    const name = oi?.menu?.name ?? "Unknown";
    const existing = map.get(name) ?? {
      name,
      quantity: 0,
      revenue: 0,
    };
    existing.quantity += oi.quantity ?? 0;
    existing.revenue += (oi.price ?? 0) * (oi.quantity ?? 0);
    map.set(name, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((t) => ({
      ...t,
      revenue: Math.round(t.revenue * 100) / 100,
    }));
};

export interface CategorySales {
  name: string;
  revenue: number;
  quantity: number;
}

export const aggregateCategorySales = (
  orderItems: OrderItem[],
): CategorySales[] => {
  const map = new Map<string, CategorySales>();
  for (const oi of orderItems) {
    const categories = oi?.menu?.category;
    const name =
      Array.isArray(categories) && categories.length > 0
        ? categories[0]?.name ?? "Uncategorized"
        : "Uncategorized";
    const existing = map.get(name) ?? {
      name,
      revenue: 0,
      quantity: 0,
    };
    existing.quantity += oi.quantity ?? 0;
    existing.revenue += (oi.price ?? 0) * (oi.quantity ?? 0);
    map.set(name, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((c) => ({ ...c, revenue: Math.round(c.revenue * 100) / 100 }));
};

export interface HourlySalesPoint {
  hour: number; // 0-23
  label: string;
  revenue: number;
  orders: number;
}

export const aggregateHourlySales = (orders: Order[]): HourlySalesPoint[] => {
  const buckets: HourlySalesPoint[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h.toString().padStart(2, "0")}:00`,
    revenue: 0,
    orders: 0,
  }));

  for (const order of orders) {
    if (order.status !== OrderStatus.Completed || !order._created) continue;
    const d = new Date(order._created * 1000);
    const bucket = buckets[d.getHours()];
    if (!bucket) continue;
    bucket.revenue += order.total_amount ?? 0;
    bucket.orders += 1;
  }

  return buckets.map((b) => ({
    ...b,
    revenue: Math.round(b.revenue * 100) / 100,
  }));
};

export interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  uniqueItemsSold: number;
  totalItemsSold: number;
}

export const computeSummaryStats = (
  orders: Order[],
  orderItems: OrderItem[],
): SummaryStats => {
  const completed = orders.filter((o) => o.status === OrderStatus.Completed);
  const totalRevenue = completed.reduce(
    (sum, o) => sum + (o.total_amount ?? 0),
    0,
  );
  const totalOrders = completed.length;
  const totalItemsSold = orderItems.reduce(
    (sum, oi) => sum + (oi.quantity ?? 0),
    0,
  );
  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    averageTicket:
      totalOrders > 0
        ? Math.round((totalRevenue / totalOrders) * 100) / 100
        : 0,
    uniqueItemsSold: new Set(
      orderItems.map((oi) => oi?.menu?._id).filter(Boolean),
    ).size,
    totalItemsSold,
  };
};
