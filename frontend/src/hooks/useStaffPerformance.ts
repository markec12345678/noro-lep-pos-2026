import { useMemo } from "react";
import { useFetchReportOrders } from "@/services/reportService";
import { useFetchFeedback } from "@/services/feedbackService";
import { Order, OrderStatus } from "@/types";
import { round2 } from "@/lib/helper";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface StaffPerformanceData {
  staffName: string;
  /** Number of orders served. */
  orderCount: number;
  /** Total revenue generated. */
  revenue: number;
  /** Average ticket size. */
  avgTicket: number;
  /** Total tips collected. */
  totalTips: number;
  /** Average tip per order. */
  avgTip: number;
  /** Average tip percentage. */
  tipRate: number;
  /** Average guest rating (if feedback linked to their orders). */
  avgRating: number | null;
  /** Number of ratings received. */
  ratingCount: number;
  /** Performance score (composite: revenue + tips + ratings). */
  performanceScore: number;
}

export interface StaffPerformanceSummary {
  staff: StaffPerformanceData[];
  totalRevenue: number;
  totalOrders: number;
  totalTips: number;
  topPerformer?: StaffPerformanceData;
  /** Staff member with highest avg ticket. */
  topByTicket?: StaffPerformanceData;
  /** Staff member with highest tip rate. */
  topByTips?: StaffPerformanceData;
}

/* ------------------------------------------------------------------ */
/* Hook: staff performance from orders + tips + feedback               */
/* ------------------------------------------------------------------ */

/**
 * Analyzes staff performance by aggregating orders, tips, and feedback
 * per staff member (served_by field).
 *
 * Metrics per staff:
 * - Order count
 * - Total revenue generated
 * - Average ticket size
 * - Total tips + average tip + tip rate (%)
 * - Average guest rating (from feedback on their orders)
 * - Composite performance score (0-100)
 *
 * Performance score formula:
 *   revenueWeight (40%) + tipsWeight (30%) + ratingWeight (20%) +
 *   volumeWeight (10%)
 *   Normalized to 0-100 scale relative to the top performer.
 */
export const useStaffPerformance = () => {
  const { data: orders, isLoading: ordersLoading } = useFetchReportOrders();
  const { data: feedback, isLoading: feedbackLoading } = useFetchFeedback();

  const isLoading = ordersLoading || feedbackLoading;

  const summary: StaffPerformanceSummary | null = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    // Group completed orders by served_by
    const byStaff = new Map<
      string,
      {
        orders: Order[];
        revenue: number;
        tips: number;
        ratedOrders: number;
        ratingSum: number;
      }
    >();

    // Build order → feedback map for rating lookup
    const feedbackByOrder = new Map<string, number>();
    if (feedback) {
      for (const fb of feedback) {
        if (fb.order && typeof fb.order === "object" && "_id" in fb.order) {
          const orderId = (fb.order as { _id?: string })._id;
          if (orderId) {
            feedbackByOrder.set(orderId, fb.rating ?? 0);
          }
        }
      }
    }

    for (const order of orders) {
      if (order.status !== OrderStatus.Completed) continue;
      const staffName = order.served_by ?? "Unknown";
      const revenue = order.total_amount ?? 0;
      const tips = order.tip_amount ?? 0;

      const existing = byStaff.get(staffName) ?? {
        orders: [],
        revenue: 0,
        tips: 0,
        ratedOrders: 0,
        ratingSum: 0,
      };
      existing.orders.push(order);
      existing.revenue += revenue;
      existing.tips += tips;

      // Check if this order has feedback
      const rating = feedbackByOrder.get(order._id ?? "");
      if (rating !== undefined) {
        existing.ratedOrders += 1;
        existing.ratingSum += rating;
      }

      byStaff.set(staffName, existing);
    }

    if (byStaff.size === 0) return null;

    // Build staff performance array
    const staff: StaffPerformanceData[] = [];
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalTips = 0;

    for (const [staffName, data] of byStaff) {
      const count = data.orders.length;
      const avgTicket = count > 0 ? round2(data.revenue / count) : 0;
      const avgTip = count > 0 ? round2(data.tips / count) : 0;
      const tipRate =
        data.revenue > 0 ? round2((data.tips / data.revenue) * 100) : 0;
      const avgRating =
        data.ratedOrders > 0
          ? round2(data.ratingSum / data.ratedOrders)
          : null;

      staff.push({
        staffName,
        orderCount: count,
        revenue: round2(data.revenue),
        avgTicket,
        totalTips: round2(data.tips),
        avgTip,
        tipRate,
        avgRating,
        ratingCount: data.ratedOrders,
        performanceScore: 0, // computed after normalization
      });

      totalRevenue += data.revenue;
      totalOrders += count;
      totalTips += data.tips;
    }

    // Normalize performance scores (0-100)
    const maxRevenue = Math.max(...staff.map((s) => s.revenue), 1);
    const maxTips = Math.max(...staff.map((s) => s.totalTips), 1);
    const maxVolume = Math.max(...staff.map((s) => s.orderCount), 1);
    const maxRating = 5; // ratings are 1-5

    for (const s of staff) {
      const revenueScore = (s.revenue / maxRevenue) * 40;
      const tipsScore = (s.totalTips / maxTips) * 30;
      const ratingScore =
        s.avgRating !== null ? (s.avgRating / maxRating) * 20 : 10;
      const volumeScore = (s.orderCount / maxVolume) * 10;
      s.performanceScore = Math.round(
        revenueScore + tipsScore + ratingScore + volumeScore,
      );
    }

    // Sort by performance score (highest first)
    staff.sort((a, b) => b.performanceScore - a.performanceScore);

    const topPerformer = staff[0];
    const topByTicket = [...staff].sort((a, b) => b.avgTicket - a.avgTicket)[0];
    const topByTips = [...staff].sort((a, b) => b.tipRate - a.tipRate)[0];

    return {
      staff,
      totalRevenue: round2(totalRevenue),
      totalOrders,
      totalTips: round2(totalTips),
      topPerformer,
      topByTicket,
      topByTips,
    };
  }, [orders, feedback]);

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

export const renderStars = (rating: number | null): string => {
  if (rating === null) return "—";
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
};

export const getScoreBg = (score: number): string => {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 60) return "bg-blue-100 text-blue-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};
