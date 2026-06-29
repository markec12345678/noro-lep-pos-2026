import { useMemo, useState, useEffect, useCallback } from "react";
import { useFetchOrders } from "@/services/orderService";
import { useFetchReservations } from "@/services/reservationService";
import { useFetchInventoryItems } from "@/services/inventoryService";
import { useFetchKitchenOrderItems } from "@/services/orderItemsService";
import { useFetchOpenCashDrawerSession } from "@/services/cashDrawerService";
import { OrderStatus, ReservationStatus, OrderItemStatus } from "@/types";

export type NotificationType =
  | "new_online_order" | "new_reservation" | "low_stock" | "out_of_stock"
  | "kitchen_ready" | "cash_drawer_closed" | "pending_reservation";

export type NotificationPriority = "critical" | "warning" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  link: string;
  icon: string;
  read: boolean;
}

const STORAGE_KEY = "readNotificationIds";
const REFRESH_INTERVAL = 30_000;

export const useNotifications = () => {
  const { data: orders } = useFetchOrders();
  const { data: reservations } = useFetchReservations();
  const { data: inventory } = useFetchInventoryItems();
  const { data: kitchenItems } = useFetchKitchenOrderItems();
  const { data: openSessions } = useFetchOpenCashDrawerSession();

  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReadIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const markAllAsRead = useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const notifications: AppNotification[] = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentHour = new Date().getHours();
    const result: AppNotification[] = [];

    // 1. New online (guest) orders
    const guestOrders = (orders ?? []).filter(
      (o) => o.source === "guest" && o.status === OrderStatus.Pending &&
      (o._created ?? 0) * 1000 > now - 3600_000,
    );
    for (const order of guestOrders.slice(0, 5)) {
      const age = Math.floor((now - (order._created ?? 0) * 1000) / 1000);
      const id = `order-${order._id}`;
      result.push({
        id, type: "new_online_order", priority: "info",
        title: "Novo online naročilo",
        message: `Miza ${order.table?.table_number ?? "?"} · ${age > 60 ? `${Math.floor(age / 60)} min` : `${age}s`} nazaj`,
        timestamp: (order._created ?? 0) * 1000, link: "/orders", icon: "🛒", read: readIds.has(id),
      });
    }

    // 2. Pending reservations for today
    const todayPending = (reservations ?? []).filter(
      (r) => r.date === todayStr && r.status === ReservationStatus.Pending,
    );
    if (todayPending.length > 0) {
      const id = `reservations-pending-today`;
      result.push({
        id, type: "pending_reservation", priority: "warning",
        title: `${todayPending.length} nepotrjenih rezervacij`,
        message: `Danes · ${todayPending.map((r) => r.time).join(", ")}`,
        timestamp: now, link: "/reservations", icon: "📅", read: readIds.has(id),
      });
    }

    // 3. Out of stock items
    const outOfStock = (inventory ?? []).filter((i) => (i.quantity ?? 0) <= 0);
    if (outOfStock.length > 0) {
      const id = `inventory-out-of-stock`;
      result.push({
        id, type: "out_of_stock", priority: "critical",
        title: `${outOfStock.length} artiklov brez zaloge!`,
        message: outOfStock.slice(0, 3).map((i) => i.name).join(", ") +
          (outOfStock.length > 3 ? ` +${outOfStock.length - 3}` : ""),
        timestamp: now, link: "/inventory", icon: "⛔", read: readIds.has(id),
      });
    }

    // 4. Low stock items
    const lowStock = (inventory ?? []).filter(
      (i) => (i.quantity ?? 0) > 0 && (i.quantity ?? 0) < (i.threshold ?? 0),
    );
    if (lowStock.length > 0 && outOfStock.length === 0) {
      const id = `inventory-low-stock`;
      result.push({
        id, type: "low_stock", priority: "warning",
        title: `${lowStock.length} artiklov z nizko zalogo`,
        message: lowStock.slice(0, 3).map((i) => `${i.name} (${i.quantity}${i.unit})`).join(", "),
        timestamp: now, link: "/inventory", icon: "⚠️", read: readIds.has(id),
      });
    }

    // 5. Kitchen items ready for pickup
    const readyItems = (kitchenItems ?? []).filter(
      (item) => item.status === OrderItemStatus.Ready,
    );
    if (readyItems.length > 0) {
      const byOrder = new Map<string, number>();
      for (const item of readyItems) {
        const orderId = item.order && typeof item.order === "object" && "_id" in item.order
          ? (item.order as { _id: string })._id : "unknown";
        byOrder.set(orderId, (byOrder.get(orderId) ?? 0) + 1);
      }
      const id = `kitchen-ready`;
      result.push({
        id, type: "kitchen_ready", priority: "info",
        title: `${readyItems.length} jedi pripravljenih!`,
        message: `${byOrder.size} naročil čaka na prevzem`,
        timestamp: now, link: "/kitchen", icon: "✅", read: readIds.has(id),
      });
    }

    // 6. Cash drawer closed during business hours
    if ((openSessions ?? []).length === 0 && currentHour >= 10 && currentHour < 23) {
      const id = `cash-drawer-closed`;
      result.push({
        id, type: "cash_drawer_closed", priority: "warning",
        title: "Blagajna je zaprta",
        message: "Odprite izmeno za sledenje prodaje",
        timestamp: now, link: "/cash-drawer", icon: "💰", read: readIds.has(id),
      });
    }

    const priorityOrder: Record<NotificationPriority, number> = { critical: 0, warning: 1, info: 2 };
    result.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return b.timestamp - a.timestamp;
    });

    return result;
  }, [orders, reservations, inventory, kitchenItems, openSessions, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasCritical = notifications.some((n) => !n.read && n.priority === "critical");

  return { notifications, unreadCount, hasCritical, markAsRead, markAllAsRead };
};
