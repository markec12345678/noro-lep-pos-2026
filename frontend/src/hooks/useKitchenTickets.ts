import { useMemo, useEffect, useRef } from "react";
import { useFetchKitchenOrderItems } from "@/services/orderItemsService";
import { useFetchOrders } from "@/services/orderService";
import { OrderItem, OrderItemStatus, Order, Menu } from "@/types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface KitchenTicket {
  orderId: string;
  orderItemId?: string;
  tableNumber?: string;
  customerName?: string;
  source: "staff" | "guest" | "unknown";
  items: Array<{
    _id: string;
    name: string;
    quantity: number;
    status: OrderItemStatus;
    specialInstruction?: string;
    selectedModifiers?: Array<{ optionName: string }>;
    price: number;
    created: number;
    waitSeconds: number;
  }>;
  /** Overall ticket status = highest priority status across items. */
  status: OrderItemStatus;
  /** When the ticket (first item) was created. */
  createdAt: number;
  /** Seconds since the ticket was created. */
  waitSeconds: number;
  /** Urgency level based on wait time. */
  urgency: "fresh" | "warning" | "critical";
}

/* ------------------------------------------------------------------ */
/* Hook: group order items into kitchen tickets                       */
/* ------------------------------------------------------------------ */

const STATUS_PRIORITY: Record<OrderItemStatus, number> = {
  [OrderItemStatus.New]: 0,
  [OrderItemStatus.InKitchen]: 1,
  [OrderItemStatus.Ready]: 2,
  [OrderItemStatus.Completed]: 3,
  [OrderItemStatus.Cancelled]: 4,
};

/**
 * Fetches all active kitchen order items (new + in-kitchen + ready)
 * and groups them by order into KitchenTicket objects.
 *
 * Each ticket contains:
 * - Order metadata (table number, customer, source)
 * - All active items for that order
 * - Computed wait time (seconds since first item was created)
 * - Urgency level: fresh (< 5min), warning (5-10min), critical (> 10min)
 *
 * Items with status "completed" or "cancelled" are excluded.
 */
export const useKitchenTickets = () => {
  const { data: orderItems, isLoading, error } = useFetchKitchenOrderItems();
  const { data: orders } = useFetchOrders();

  const tickets: KitchenTicket[] = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return [];

    const now = Math.floor(Date.now() / 1000);

    // Group items by order ID
    const byOrder = new Map<string, OrderItem[]>();
    for (const item of orderItems) {
      const orderId =
        item.order && typeof item.order === "object" && "_id" in item.order
          ? (item.order as { _id: string })._id
          : undefined;
      if (!orderId) continue;
      // Skip completed/cancelled items
      if (
        item.status === OrderItemStatus.Completed ||
        item.status === OrderItemStatus.Cancelled
      ) {
        continue;
      }
      const existing = byOrder.get(orderId) ?? [];
      existing.push(item);
      byOrder.set(orderId, existing);
    }

    // Build tickets
    const orderMap = new Map<string, Order>();
    for (const o of orders ?? []) {
      if (o._id) orderMap.set(o._id, o);
    }

    const result: KitchenTicket[] = [];
    for (const [orderId, items] of byOrder) {
      const order = orderMap.get(orderId);
      const tableNumber =
        order?.table && typeof order.table === "object" && "table_number" in order.table
          ? (order.table as { table_number?: string }).table_number
          : undefined;
      const customerName =
        order?.customer && typeof order.customer === "object" && "name" in order.customer
          ? (order.customer as { name?: string }).name
          : undefined;

      // Ticket status = lowest-priority (most urgent) status across items
      // New (0) takes priority over InKitchen (1) takes priority over Ready (2)
      let ticketStatus = OrderItemStatus.Ready;
      for (const item of items) {
        if (STATUS_PRIORITY[item.status] < STATUS_PRIORITY[ticketStatus]) {
          ticketStatus = item.status;
        }
      }

      // Compute earliest creation time for wait calculation
      const createdAt = Math.min(
        ...items.map((i) => i._created ?? now),
      );
      const waitSeconds = now - createdAt;

      // Urgency based on wait time
      let urgency: KitchenTicket["urgency"] = "fresh";
      if (waitSeconds > 600) {
        urgency = "critical"; // > 10 minutes
      } else if (waitSeconds > 300) {
        urgency = "warning"; // > 5 minutes
      }

      result.push({
        orderId,
        tableNumber,
        customerName,
        source: (order?.source as "staff" | "guest" | "unknown") ?? "unknown",
        items: items.map((item) => ({
          _id: item._id ?? "",
          name:
            item.menu && typeof item.menu === "object" && "name" in item.menu
              ? (item.menu as Menu).name
              : "Unknown",
          quantity: item.quantity ?? 1,
          status: item.status,
          specialInstruction: item.special_instruction,
          selectedModifiers: item.selectedModifiers as Array<{ optionName: string }>,
          price: item.price ?? 0,
          created: item._created ?? now,
          waitSeconds: now - (item._created ?? now),
        })),
        status: ticketStatus,
        createdAt,
        waitSeconds,
        urgency,
      });
    }

    // Sort: most urgent first (critical > warning > fresh), then oldest first
    const urgencyOrder = { critical: 0, warning: 1, fresh: 2 };
    result.sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.createdAt - b.createdAt;
    });

    return result;
  }, [orderItems, orders]);

  return { tickets, isLoading, error };
};

/* ------------------------------------------------------------------ */
/* Hook: sound notification on new orders                             */
/* ------------------------------------------------------------------ */

/**
 * Plays a short beep when new tickets arrive in the kitchen.
 * Uses the Web Audio API (no external sound files needed).
 *
 * The hook tracks previously-seen order IDs and only beeps when
 * a NEW orderId appears that wasn't in the previous list.
 */
export const useNewOrderSound = (tickets: KitchenTicket[]) => {
  const previousIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext lazily (must be triggered by user interaction)
  const getAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      } catch {
        return null;
      }
    }
    return audioCtxRef.current;
  };

  const playBeep = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880; // A5
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + 0.5,
      );
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      /* ignore audio errors */
    }
  };

  useEffect(() => {
    const currentIds = new Set(tickets.map((t) => t.orderId));
    const newIds: string[] = [];

    for (const id of currentIds) {
      if (!previousIds.current.has(id)) {
        newIds.push(id);
      }
    }

    // Only beep if we have previous state (skip initial load)
    if (previousIds.current.size > 0 && newIds.length > 0) {
      playBeep();
    }

    previousIds.current = currentIds;
  }, [tickets]);
};

/* ------------------------------------------------------------------ */
/* Hook: live ticking timer (re-render every second)                  */
/* ------------------------------------------------------------------ */

import { useState } from "react";

/**
 * Returns a counter that increments every second, forcing re-renders
 * so that wait timers on kitchen tickets stay up-to-date.
 */
export const useTick = (intervalMs = 1000): number => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return tick;
};

/* ------------------------------------------------------------------ */
/* Helper: format wait time                                           */
/* ------------------------------------------------------------------ */

export const formatWaitTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/* ------------------------------------------------------------------ */
/* Helper: urgency colors                                             */
/* ------------------------------------------------------------------ */

export const getUrgencyColors = (
  urgency: KitchenTicket["urgency"],
): {
  border: string;
  bg: string;
  text: string;
  badge: string;
} => {
  switch (urgency) {
    case "critical":
      return {
        border: "border-red-400",
        bg: "bg-red-50",
        text: "text-red-700",
        badge: "bg-red-500 text-white",
      };
    case "warning":
      return {
        border: "border-amber-400",
        bg: "bg-amber-50",
        text: "text-amber-700",
        badge: "bg-amber-500 text-white",
      };
    default:
      return {
        border: "border-green-300",
        bg: "bg-green-50",
        text: "text-green-700",
        badge: "bg-green-500 text-white",
      };
  }
};
