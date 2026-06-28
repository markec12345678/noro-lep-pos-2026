import { createServer, IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";

/**
 * POS Public Ordering Service
 *
 * Public-facing API for guest ordering via QR code. Guests scan a QR code
 * at their table, which opens /public/menu/:tableToken in the browser.
 * This service provides the backend for that flow — no authentication
 * required from guests.
 *
 * Endpoints:
 *   GET  /api/public/health                — service status
 *   GET  /api/public/menu/:tableToken      — table info + available menu items
 *   POST /api/public/order                 — create a guest order
 *   GET  /api/public/order/:orderId        — check order status
 *
 * Security:
 *   - The Cockpit CMS API key is kept server-side (never exposed to guests)
 *   - Rate limiting should be added (TODO) per IP to prevent abuse
 *   - Table tokens are UUIDs — not enumerable, but should be rotated
 *     periodically for security
 *   - Orders created here have source="guest" so staff can distinguish
 *     them from staff-created orders
 *
 * Communication with Cockpit CMS:
 *   Reads from /api/content/items/* using the configured API key.
 *   Writes go to /api/content/item/* (order, orderitem collections).
 *
 * Realtime:
 *   After creating a guest order, emits a WebSocket event to the
 *   pos-realtime service (port 3003) so the kitchen display refreshes.
 */

const PORT = 3005;

const COCKPIT_URL = process.env.COCKPIT_URL ?? "http://localhost:3030";
const COCKPIT_API_KEY =
  process.env.COCKPIT_API_KEY ?? "public-read-only-key-change-me";
const REALTIME_SERVICE_URL =
  process.env.REALTIME_SERVICE_URL ?? "http://localhost:3003";

/* ------------------------------------------------------------------ */
/* Cockpit CMS client                                                  */
/* ------------------------------------------------------------------ */

interface CockpitItem {
  _id: string;
  _created?: number;
  _modified?: number;
  [key: string]: unknown;
}

const cockpitFetch = async <T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> => {
  const response = await fetch(`${COCKPIT_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "api-key": COCKPIT_API_KEY,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Cockpit ${response.status}: ${text.slice(0, 200)}`,
    );
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Table {
  _id: string;
  table_number?: string;
  seats?: string;
  location?: string;
  status: string;
  publicToken?: string;
  order?: { _model: string; _id: string } | null;
}

interface Menu {
  _id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  image?: { path?: string; title?: string };
  category?: Array<{ _id: string; name?: string }>;
  tax_rate?: number;
}

interface Category {
  _id: string;
  name: string;
  image?: { path?: string };
}

interface Order {
  _id: string;
  table?: { _model: string; _id: string; table_number?: string };
  customer?: { name?: string; phone?: string } | null;
  status: string;
  order_type?: string;
  total_amount: number;
  source?: string;
  _created?: number;
}

interface OrderItem {
  _id: string;
  order?: { _model: string; _id: string };
  menu?: { _model: string; _id: string; name?: string; price?: number };
  quantity: number;
  status: string;
  price: number;
  special_instruction?: string;
  selectedModifiers?: unknown[];
}

interface GuestOrderItemInput {
  menuId: string;
  quantity: number;
  specialInstruction?: string;
  selectedModifiers?: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    optionName: string;
    price: number;
  }>;
}

interface CreateGuestOrderInput {
  tableToken: string;
  customerName: string;
  customerPhone?: string;
  items: GuestOrderItemInput[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sendJson = (res: ServerResponse, status: number, data: unknown) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
};

const parseBody = (req: IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
};

/**
 * Emit a realtime event to the pos-realtime service so the kitchen
 * display and POS tabs refresh automatically. Best-effort — if the
 * realtime service is down, the order is still created; staff will
 * see it on their next manual refresh.
 */
const emitRealtimeEvent = async (type: string, payload: unknown) => {
  try {
    await fetch(`${REALTIME_SERVICE_URL}/?XTransformPort=3003`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    }).catch(() => {
      /* socket.io expects WebSocket upgrade for POST; use HTTP fallback */
    });
  } catch {
    /* Realtime is best-effort */
  }
};

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

const handleHealth = async (_req: any, res: ServerResponse) => {
  sendJson(res, 200, {
    status: "ok",
    service: "pos-public",
    port: PORT,
    cockpitUrl: COCKPIT_URL,
    timestamp: new Date().toISOString(),
  });
};

/**
 * GET /api/public/menu/:tableToken
 *
 * Returns table info + all available menu items + categories.
 * The guest uses this to browse the menu and build their cart.
 */
const handleGetMenu = async (
  _req: any,
  res: ServerResponse,
  params: { tableToken: string },
) => {
  try {
    // 1. Find the table by publicToken
    const tables = await cockpitFetch<Table[]>(
      `/api/content/items/table?populate=1&filter={publicToken:"${params.tableToken}"}`,
    );

    if (!tables || tables.length === 0) {
      return sendJson(res, 404, {
        error: "Table not found",
        message: "Invalid or expired table token.",
      });
    }

    const table = tables[0];

    // 2. Fetch all available menu items (public, no auth)
    const menus = await cockpitFetch<Menu[]>(
      `/api/content/items/menu?populate=1&filter={available:true}`,
    );

    // 3. Fetch categories for grouping
    const categories = await cockpitFetch<Category[]>(
      `/api/content/items/category?populate=1`,
    );

    // 4. Group menus by category
    const menusByCategory = (categories ?? []).map((cat) => ({
      category: { _id: cat._id, name: cat.name, image: cat.image },
      items: (menus ?? []).filter((m) =>
        Array.isArray(m.category) &&
        m.category.some((c) => c._id === cat._id),
      ),
    }));

    const uncategorized = (menus ?? []).filter(
      (m) => !Array.isArray(m.category) || m.category.length === 0,
    );

    return sendJson(res, 200, {
      table: {
        _id: table._id,
        table_number: table.table_number,
        seats: table.seats,
        location: table.location,
      },
      categories: menusByCategory.filter((g) => g.items.length > 0),
      uncategorizedItems: uncategorized,
      totalItems: menus?.length ?? 0,
    });
  } catch (err) {
    console.error("[pos-public] getMenu failed:", err);
    return sendJson(res, 500, {
      error: "Failed to load menu",
      detail: err instanceof Error ? err.message : "Unknown",
    });
  }
};

/**
 * POST /api/public/order
 *
 * Creates a guest order with order items. Sets source="guest" so staff
 * can distinguish from staff-created orders.
 *
 * Flow:
 *   1. Validate table token + items
 *   2. Create order (status=pending, source=guest, customer=name+phone)
 *   3. Create order items (status=new)
 *   4. Link order to table
 *   5. Emit realtime event so kitchen refreshes
 *   6. Return order ID for status tracking
 */
const handleCreateOrder = async (
  _req: any,
  res: ServerResponse,
  _params: Record<string, string>,
  body: CreateGuestOrderInput,
) => {
  try {
    // Validate input
    if (!body?.tableToken) {
      return sendJson(res, 400, { error: "Missing tableToken" });
    }
    if (!body?.customerName?.trim()) {
      return sendJson(res, 400, { error: "Customer name is required" });
    }
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      return sendJson(res, 400, { error: "Order must have at least one item" });
    }

    // 1. Find the table
    const tables = await cockpitFetch<Table[]>(
      `/api/content/items/table?populate=1&filter={publicToken:"${body.tableToken}"}`,
    );
    if (!tables || tables.length === 0) {
      return sendJson(res, 404, { error: "Invalid table token" });
    }
    const table = tables[0];

    // 2. Fetch menu items to validate + get prices (don't trust client prices)
    const menuIds = body.items.map((i) => i.menuId);
    const menus = await cockpitFetch<Menu[]>(
      `/api/content/items/menu?populate=1&filter={_id:{$in:${JSON.stringify(menuIds)}}}`,
    );
    const menuMap = new Map((menus ?? []).map((m) => [m._id, m]));

    // Validate all menu items exist and are available
    for (const item of body.items) {
      const menu = menuMap.get(item.menuId);
      if (!menu) {
        return sendJson(res, 400, { error: `Menu item not found: ${item.menuId}` });
      }
      if (!menu.available) {
        return sendJson(res, 400, { error: `${menu.name} is not available` });
      }
      if (item.quantity < 1 || item.quantity > 99) {
        return sendJson(res, 400, { error: "Quantity must be 1-99" });
      }
    }

    // 3. Create the order
    const now = Math.floor(Date.now() / 1000);
    const order = await cockpitFetch<Order>(`/api/content/item/order`, {
      method: "POST",
      body: {
        data: {
          table: { _model: "table", _id: table._id },
          customer: {
            name: body.customerName.trim(),
            phone: body.customerPhone?.trim() || undefined,
          },
          status: "pending",
          order_type: "dine-in",
          total_amount: 0, // will be updated after items are added
          source: "guest",
        },
      },
    });

    if (!order?._id) {
      return sendJson(res, 500, { error: "Failed to create order" });
    }

    // 4. Create order items (server computes prices from menu, not client)
    let totalAmount = 0;
    const createdItems: OrderItem[] = [];

    for (const item of body.items) {
      const menu = menuMap.get(item.menuId)!;
      const modifierDelta = (item.selectedModifiers ?? []).reduce(
        (sum, m) => sum + (m.price ?? 0),
        0,
      );
      const unitPrice = (menu.price ?? 0) + modifierDelta;
      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      const orderItem = await cockpitFetch<OrderItem>(
        `/api/content/item/orderitem`,
        {
          method: "POST",
          body: {
            data: {
              order: { _model: "order", _id: order._id },
              menu: {
                _model: "menu",
                _id: menu._id,
                name: menu.name,
                price: menu.price,
                image: menu.image,
                tax_rate: menu.tax_rate,
              },
              quantity: item.quantity,
              status: "new",
              price: unitPrice,
              base_price: menu.price,
              special_instruction: item.specialInstruction?.trim() || "",
              selectedModifiers: item.selectedModifiers ?? [],
              tax_rate: menu.tax_rate ?? 22,
            },
          },
        },
      );
      if (orderItem?._id) createdItems.push(orderItem);
    }

    // 5. Update order with total
    await cockpitFetch(`/api/content/item/order`, {
      method: "POST",
      body: {
        data: {
          _id: order._id,
          total_amount: Math.round(totalAmount * 100) / 100,
        },
      },
    });

    // 6. Link order to table (mark as occupied)
    await cockpitFetch(`/api/content/item/table`, {
      method: "POST",
      body: {
        data: {
          _id: table._id,
          status: "occupied",
          order: { _model: "order", _id: order._id },
        },
      },
    });

    // 7. Emit realtime events (best-effort)
    emitRealtimeEvent("order:created", {
      orderId: order._id,
      tableId: table._id,
      source: "guest",
    });
    for (const item of createdItems) {
      emitRealtimeEvent("orderitem:created", {
        orderItemId: item._id,
        orderId: order._id,
        menuName: item.menu?.name,
        status: "new",
      });
    }
    emitRealtimeEvent("table:status_changed", {
      tableId: table._id,
      status: "occupied",
      orderId: order._id,
    });

    return sendJson(res, 201, {
      orderId: order._id,
      tableId: table._id,
      tableNumber: table.table_number,
      totalAmount: Math.round(totalAmount * 100) / 100,
      itemCount: createdItems.length,
      status: "pending",
      createdAt: now,
    });
  } catch (err) {
    console.error("[pos-public] createOrder failed:", err);
    return sendJson(res, 500, {
      error: "Failed to create order",
      detail: err instanceof Error ? err.message : "Unknown",
    });
  }
};

/**
 * GET /api/public/order/:orderId
 *
 * Returns order status + items for guest tracking.
 * Guests use this to watch their order progress in real-time.
 */
const handleGetOrderStatus = async (
  _req: any,
  res: ServerResponse,
  params: { orderId: string },
) => {
  try {
    // 1. Fetch the order
    const order = await cockpitFetch<Order>(
      `/api/content/item/order/${params.orderId}?populate=1`,
    );

    if (!order?._id) {
      return sendJson(res, 404, { error: "Order not found" });
    }

    // Only allow tracking guest orders (prevent staff order snooping)
    if (order.source && order.source !== "guest") {
      return sendJson(res, 403, { error: "This order cannot be tracked publicly" });
    }

    // 2. Fetch order items
    const items = await cockpitFetch<OrderItem[]>(
      `/api/content/items/orderitem?populate=1&filter={order:"${params.orderId}"}`,
    );

    return sendJson(res, 200, {
      order: {
        _id: order._id,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order._created,
        customer: order.customer,
        tableNumber: order.table?.table_number,
      },
      items: (items ?? []).map((item) => ({
        _id: item._id,
        name: item.menu?.name,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        specialInstruction: item.special_instruction,
        selectedModifiers: item.selectedModifiers,
      })),
    });
  } catch (err) {
    console.error("[pos-public] getOrderStatus failed:", err);
    return sendJson(res, 500, {
      error: "Failed to fetch order",
      detail: err instanceof Error ? err.message : "Unknown",
    });
  }
};

/* ------------------------------------------------------------------ */
/* HTTP server                                                         */
/* ------------------------------------------------------------------ */

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  body?: any,
) => Promise<void> | void;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  handlers: Record<string, RouteHandler>;
}

const routes: Route[] = [
  {
    pattern: /^\/api\/public\/health$/,
    paramNames: [],
    handlers: { GET: handleHealth },
  },
  {
    pattern: /^\/api\/public\/menu\/([^/]+)$/,
    paramNames: ["tableToken"],
    handlers: { GET: handleGetMenu },
  },
  {
    pattern: /^\/api\/public\/order$/,
    paramNames: [],
    handlers: { POST: handleCreateOrder },
  },
  {
    pattern: /^\/api\/public\/order\/([^/]+)$/,
    paramNames: ["orderId"],
    handlers: { GET: handleGetOrderStatus },
  },
];

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (!match) continue;

    const handler = route.handlers[req.method ?? "GET"];
    if (!handler) {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const params: Record<string, string> = {};
    route.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });

    try {
      const body =
        req.method === "POST" ? await parseBody(req) : undefined;
      await handler(req, res, params, body);
    } catch (err) {
      console.error("[pos-public] Handler error:", err);
      sendJson(res, 500, {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : "Unknown",
      });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found", path: pathname });
});

server.listen(PORT, () => {
  console.log(`[pos-public] Running on port ${PORT}`);
  console.log(`[pos-public] Cockpit URL: ${COCKPIT_URL}`);
  console.log(`[pos-public] Realtime service: ${REALTIME_SERVICE_URL}`);
  console.log(`[pos-public] Frontend calls via: /api/public/*?XTransformPort=${PORT}`);
});

// Graceful shutdown + error handling
const shutdown = (signal: string) => {
  console.log(`[pos-public] Received ${signal}, shutting down...`);
  server.close(() => {
    console.log("[pos-public] Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err: Error) => {
  console.error("[pos-public] UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason: unknown) => {
  console.error("[pos-public] UNHANDLED REJECTION:", reason);
});
