// services/publicMenuService
import {
  CreateGuestOrderInput,
  CreateGuestOrderResponse,
  GuestOrderStatusResponse,
  PublicMenuResponse,
} from "@/types";

/**
 * Public ordering API client — no authentication required.
 *
 * All calls go through the Caddy gateway with XTransformPort=3005,
 * which routes them to the pos-public mini-service. The mini-service
 * then proxies to Cockpit CMS using a server-side API key that is
 * never exposed to the browser.
 *
 * These functions are used by the guest-facing /public/* routes
 * (PublicMenu, PublicOrderStatus) — NOT by the authenticated POS app.
 */

const PUBLIC_API_BASE = "/api/public";

/**
 * Fetch the public menu for a table identified by its publicToken.
 * The token is embedded in the QR code printed on the table.
 */
export const fetchPublicMenu = async (
  tableToken: string,
): Promise<PublicMenuResponse> => {
  const response = await fetch(
    `${PUBLIC_API_BASE}/menu/${encodeURIComponent(tableToken)}?XTransformPort=3005`,
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.message ?? error?.error ?? `Failed to load menu (${response.status})`,
    );
  }
  return response.json();
};

/**
 * Submit a guest order. The server validates all menu IDs and computes
 * prices from the database (never trusts client-supplied prices).
 *
 * Returns the created order ID so the guest can be redirected to the
 * order status tracking page.
 */
export const createGuestOrder = async (
  input: CreateGuestOrderInput,
): Promise<CreateGuestOrderResponse> => {
  const response = await fetch(
    `${PUBLIC_API_BASE}/order?XTransformPort=3005`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.error ?? `Failed to create order (${response.status})`,
    );
  }
  return response.json();
};

/**
 * Fetch the current status of a guest order for tracking.
 * Only orders with source="guest" can be tracked publicly.
 */
export const fetchGuestOrderStatus = async (
  orderId: string,
): Promise<GuestOrderStatusResponse> => {
  const response = await fetch(
    `${PUBLIC_API_BASE}/order/${encodeURIComponent(orderId)}?XTransformPort=3005`,
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.error ?? `Failed to fetch order (${response.status})`,
    );
  }
  return response.json();
};

/* ------------------------------------------------------------------ */
/* React Query hooks for public pages                                 */
/* ------------------------------------------------------------------ */

import { useQuery } from "@tanstack/react-query";

export const useFetchPublicMenu = (tableToken: string | undefined) =>
  useQuery<PublicMenuResponse>({
    queryKey: ["publicMenu", tableToken],
    queryFn: () => fetchPublicMenu(tableToken!),
    enabled: Boolean(tableToken),
    staleTime: 60_000, // cache for 1 minute — menu doesn't change often
  });

export const useFetchGuestOrderStatus = (orderId: string | undefined) =>
  useQuery<GuestOrderStatusResponse>({
    queryKey: ["guestOrder", orderId],
    queryFn: () => fetchGuestOrderStatus(orderId!),
    enabled: Boolean(orderId),
    // Poll every 5 seconds for status updates (in addition to WebSocket)
    refetchInterval: 5_000,
  });
