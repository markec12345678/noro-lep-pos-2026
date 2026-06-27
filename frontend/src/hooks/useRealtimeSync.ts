import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket";

/**
 * Mapping of realtime event types to React Query cache keys that should
 * be invalidated when the event is received.
 *
 * When a kitchen tab marks an order item as "ready", the orders list
 * and the cart on the waiter's POS both need to refetch — we do this
 * by invalidating the relevant query keys.
 *
 * Add new mappings here as new event types are introduced.
 */
const EVENT_TO_QUERY_KEYS: Record<string, readonly string[]> = {
  // Order events
  "order:created": ["orders"],
  "order:updated": ["orders"],
  "order:status_changed": ["orders", "order"],
  "order:completed": ["orders", "order", "reportOrders"],

  // Order item events
  "orderitem:created": ["orderItems", "kitchenOrderItems"],
  "orderitem:status_changed": [
    "orderItems",
    "kitchenOrderItems",
    "reportOrderItems",
  ],
  "orderitem:deleted": ["orderItems", "kitchenOrderItems"],

  // Table events
  "table:status_changed": ["tables", "table"],

  // Cash drawer events
  "cashdrawer:opened": ["cashDrawerSessions"],
  "cashdrawer:closed": ["cashDrawerSessions"],

  // Inventory events
  "inventory:updated": ["inventoryItems", "inventoryItem"],
  "inventory:low_stock": ["inventoryItems"],

  // Menu events
  "menu:updated": ["menus", "menu"],
  "menu:created": ["menus"],
  "menu:deleted": ["menus"],
} as const;

/**
 * Subscribe to all POS realtime events and invalidate the relevant
 * React Query caches. Mount this hook ONCE at the app root level
 * (inside the QueryClientProvider) so that every tab automatically
 * refreshes stale data when another tab/device mutates it.
 *
 * Components can still subscribe to individual events via `useSocket`
 * for custom side-effects (e.g. toast notifications, sound alerts).
 */
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlers: Array<{ type: string; fn: (payload: unknown) => void }> =
      [];

    for (const [eventType, queryKeys] of Object.entries(
      EVENT_TO_QUERY_KEYS,
    )) {
      const fn = (payload: unknown) => {
        // Debug aid — comment out in production
        console.debug(
          `[realtime] ${eventType} → invalidating`,
          queryKeys,
          payload,
        );
        // Invalidate each top-level key. React Query will refetch
        // active queries matching the prefix.
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      };
      socket.on(eventType, fn);
      handlers.push({ type: eventType, fn });
    }

    return () => {
      handlers.forEach(({ type, fn }) => socket.off(type, fn));
    };
  }, [socket, queryClient]);

  return { isConnected };
};
