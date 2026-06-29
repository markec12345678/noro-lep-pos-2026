// services/tipService
import { useQuery } from "@tanstack/react-query";
import { Order, OrderStatus } from "@/types";
import { fetcher, round2 } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Tip calculation helpers                                             */
/* ------------------------------------------------------------------ */

export interface TipOption {
  percentage: number;
  label: string;
}

/** Default tip percentage options shown at checkout. */
export const DEFAULT_TIP_OPTIONS: TipOption[] = [
  { percentage: 0, label: "Brez" },
  { percentage: 5, label: "5%" },
  { percentage: 10, label: "10%" },
  { percentage: 15, label: "15%" },
];

/**
 * Compute the tip amount from a percentage of the grand total.
 */
export const computeTipFromPercentage = (
  total: number,
  percentage: number,
): number => round2((total * percentage) / 100);

/**
 * Compute the effective tip percentage from a custom amount.
 */
export const computeTipPercentage = (
  total: number,
  tipAmount: number,
): number => {
  if (total <= 0) return 0;
  return Math.round((tipAmount / total) * 1000) / 10; // 1 decimal
};

/**
 * Grand total including tip.
 */
export const computeGrandTotalWithTip = (
  total: number,
  tipAmount: number,
): number => round2(total + tipAmount);

/* ------------------------------------------------------------------ */
/* Tip aggregation (for reports)                                       */
/* ------------------------------------------------------------------ */

export interface TipSummaryByStaff {
  staffName: string;
  orderCount: number;
  totalTips: number;
  averageTip: number;
  /** Tips from cash payments (collected directly by staff). */
  cashTips: number;
  /** Tips from card payments (added to payroll). */
  cardTips: number;
}

export interface TipSummary {
  totalTips: number;
  totalOrders: number;
  averageTip: number;
  cashTips: number;
  cardTips: number;
  byStaff: TipSummaryByStaff[];
  /** Percentage of orders that included a tip. */
  tipRate: number;
}

/**
 * Aggregate tips from completed orders into a summary.
 * Groups by served_by (or "Unknown" if not set).
 */
export const buildTipSummary = (orders: Order[]): TipSummary => {
  const completed = orders.filter((o) => o.status === OrderStatus.Completed);

  let totalTips = 0;
  let cashTips = 0;
  let cardTips = 0;
  let ordersWithTips = 0;

  const byStaffMap = new Map<
    string,
    {
      orderCount: number;
      totalTips: number;
      cashTips: number;
      cardTips: number;
    }
  >();

  for (const order of completed) {
    const tip = order.tip_amount ?? 0;
    const staff = order.served_by ?? "Unknown";
    const method = order.payment_method ?? "cash";

    totalTips += tip;
    if (tip > 0) ordersWithTips++;

    if (method === "cash") {
      cashTips += tip;
    } else {
      cardTips += tip;
    }

    const existing = byStaffMap.get(staff) ?? {
      orderCount: 0,
      totalTips: 0,
      cashTips: 0,
      cardTips: 0,
    };
    existing.orderCount++;
    existing.totalTips += tip;
    if (method === "cash") {
      existing.cashTips += tip;
    } else {
      existing.cardTips += tip;
    }
    byStaffMap.set(staff, existing);
  }

  const byStaff: TipSummaryByStaff[] = Array.from(byStaffMap.entries())
    .map(([staffName, data]) => ({
      staffName,
      orderCount: data.orderCount,
      totalTips: round2(data.totalTips),
      averageTip: data.orderCount > 0
        ? round2(data.totalTips / data.orderCount)
        : 0,
      cashTips: round2(data.cashTips),
      cardTips: round2(data.cardTips),
    }))
    .sort((a, b) => b.totalTips - a.totalTips);

  return {
    totalTips: round2(totalTips),
    totalOrders: completed.length,
    averageTip: completed.length > 0
      ? round2(totalTips / completed.length)
      : 0,
    cashTips: round2(cashTips),
    cardTips: round2(cardTips),
    byStaff,
    tipRate: completed.length > 0
      ? Math.round((ordersWithTips / completed.length) * 1000) / 10
      : 0,
  };
};

/* ------------------------------------------------------------------ */
/* Tip report query                                                    */
/* ------------------------------------------------------------------ */

/**
 * Fetch completed orders for tip reporting.
 * Reuses the orders query — caller passes the data to buildTipSummary.
 */
export const useFetchOrdersForTips = (startDate: string, endDate: string) =>
  useQuery<Order[]>({
    queryKey: ["orders", "tips", startDate, endDate],
    queryFn: () =>
      fetcher<Order[]>(
        `${API_URL}/api/content/items/order?populate=1&filter={status:"completed",_created:{$gte:${Math.floor(new Date(startDate).getTime() / 1000)},$lte:${Math.floor(new Date(endDate + "T23:59:59").getTime() / 1000)}}}&sort={_created:-1}&limit=500`,
      ),
  });
