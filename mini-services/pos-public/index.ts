import { createServer, IncomingMessage, ServerResponse } from "http";

const PORT = 3005;
const COCKPIT_URL = process.env.COCKPIT_URL ?? "http://localhost:3030";
const COCKPIT_API_KEY = process.env.COCKPIT_API_KEY ?? "public-read-only-key-change-me";
const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL ?? "http://localhost:3003";

interface CockpitItem { _id: string; _created?: number; _modified?: number; [key: string]: unknown; }

const cockpitFetch = async <T,>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> => {
  const response = await fetch(`${COCKPIT_URL}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", "api-key": COCKPIT_API_KEY },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) throw new Error(`Cockpit ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
};

const sendJson = (res: ServerResponse, status: number, data: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
  res.end(JSON.stringify(data));
};

const parseBody = (req: IncomingMessage): Promise<any> => new Promise((resolve, reject) => {
  let data = ""; req.on("data", (c) => (data += c)); req.on("end", () => { if (!data) return resolve({}); try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); } }); req.on("error", reject);
});

const emitRealtimeEvent = async (type: string, payload: unknown) => {
  try { await fetch(`${REALTIME_SERVICE_URL}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, payload }) }).catch(() => {}); } catch {}
};

// Handlers
const handleHealth = async (_req: any, res: ServerResponse) => sendJson(res, 200, { status: "ok", service: "pos-public", port: PORT, cockpitUrl: COCKPIT_URL, timestamp: new Date().toISOString() });

const handleGetMenu = async (_req: any, res: ServerResponse, params: { tableToken: string }) => {
  try {
    const tables = await cockpitFetch<any[]>(`/api/content/items/table?populate=1&filter={publicToken:"${params.tableToken}"}`);
    if (!tables?.length) return sendJson(res, 404, { error: "Table not found" });
    const table = tables[0];
    const menus = await cockpitFetch<any[]>(`/api/content/items/menu?populate=1&filter={available:true}`);
    const categories = await cockpitFetch<any[]>(`/api/content/items/category?populate=1`);
    const menusByCategory = (categories ?? []).map((cat) => ({ category: { _id: cat._id, name: cat.name, image: cat.image }, items: (menus ?? []).filter((m) => Array.isArray(m.category) && m.category.some((c) => c._id === cat._id)) }));
    const uncategorized = (menus ?? []).filter((m) => !Array.isArray(m.category) || !m.category.length);
    return sendJson(res, 200, { table: { _id: table._id, table_number: table.table_number, seats: table.seats, location: table.location }, categories: menusByCategory.filter((g) => g.items.length > 0), uncategorizedItems: uncategorized, totalItems: menus?.length ?? 0 });
  } catch (err) { return sendJson(res, 500, { error: "Failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

const handleCreateOrder = async (_req: any, res: ServerResponse, _params: any, body: any) => {
  try {
    if (!body?.tableToken) return sendJson(res, 400, { error: "Missing tableToken" });
    if (!body?.customerName?.trim()) return sendJson(res, 400, { error: "Customer name required" });
    if (!body?.items?.length) return sendJson(res, 400, { error: "Need at least 1 item" });
    const tables = await cockpitFetch<any[]>(`/api/content/items/table?populate=1&filter={publicToken:"${body.tableToken}"}`);
    if (!tables?.length) return sendJson(res, 404, { error: "Invalid table token" });
    const table = tables[0];
    const menuIds = body.items.map((i: any) => i.menuId);
    const menus = await cockpitFetch<any[]>(`/api/content/items/menu?populate=1&filter={_id:{$in:${JSON.stringify(menuIds)}}}`);
    const menuMap = new Map((menus ?? []).map((m) => [m._id, m]));
    for (const item of body.items) { const menu = menuMap.get(item.menuId); if (!menu) return sendJson(res, 400, { error: `Menu not found: ${item.menuId}` }); if (!menu.available) return sendJson(res, 400, { error: `${menu.name} not available` }); if (item.quantity < 1 || item.quantity > 99) return sendJson(res, 400, { error: "Qty 1-99" }); }
    const now = Math.floor(Date.now() / 1000);
    const order = await cockpitFetch<any>(`/api/content/item/order`, { method: "POST", body: { data: { table: { _model: "table", _id: table._id }, customer: { name: body.customerName.trim(), phone: body.customerPhone?.trim() || undefined }, status: "pending", order_type: "dine-in", total_amount: 0, source: "guest" } } });
    if (!order?._id) return sendJson(res, 500, { error: "Failed to create order" });
    let totalAmount = 0;
    for (const item of body.items) {
      const menu = menuMap.get(item.menuId)!;
      const modifierDelta = (item.selectedModifiers ?? []).reduce((s: number, m: any) => s + (m.price ?? 0), 0);
      const unitPrice = (menu.price ?? 0) + modifierDelta;
      totalAmount += unitPrice * item.quantity;
      await cockpitFetch(`/api/content/item/orderitem`, { method: "POST", body: { data: { order: { _model: "order", _id: order._id }, menu: { _model: "menu", _id: menu._id, name: menu.name, price: menu.price, image: menu.image, tax_rate: menu.tax_rate, category: menu.category }, quantity: item.quantity, status: "new", price: unitPrice, base_price: menu.price, special_instruction: item.specialInstruction?.trim() || "", selectedModifiers: item.selectedModifiers ?? [], tax_rate: menu.tax_rate ?? 22 } } });
    }
    await cockpitFetch(`/api/content/item/order`, { method: "POST", body: { data: { _id: order._id, total_amount: Math.round(totalAmount * 100) / 100 } } });
    await cockpitFetch(`/api/content/item/table`, { method: "POST", body: { data: { _id: table._id, status: "occupied", order: { _model: "order", _id: order._id } } } });
    emitRealtimeEvent("order:created", { orderId: order._id, tableId: table._id, source: "guest" });
    emitRealtimeEvent("table:status_changed", { tableId: table._id, status: "occupied", orderId: order._id });
    return sendJson(res, 201, { orderId: order._id, tableId: table._id, tableNumber: table.table_number, totalAmount: Math.round(totalAmount * 100) / 100, itemCount: body.items.length, status: "pending", createdAt: now });
  } catch (err) { return sendJson(res, 500, { error: "Failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

const handleGetOrderStatus = async (_req: any, res: ServerResponse, params: { orderId: string }) => {
  try {
    const order = await cockpitFetch<any>(`/api/content/item/order/${params.orderId}?populate=1`);
    if (!order?._id) return sendJson(res, 404, { error: "Order not found" });
    if (order.source && order.source !== "guest") return sendJson(res, 403, { error: "Cannot track" });
    const items = await cockpitFetch<any[]>(`/api/content/items/orderitem?populate=1&filter={order:"${params.orderId}"}`);
    return sendJson(res, 200, { order: { _id: order._id, status: order.status, totalAmount: order.total_amount, createdAt: order._created, customer: order.customer, tableNumber: order.table?.table_number }, items: (items ?? []).map((item) => ({ _id: item._id, name: item.menu?.name, quantity: item.quantity, price: item.price, status: item.status, specialInstruction: item.special_instruction, selectedModifiers: item.selectedModifiers })) });
  } catch (err) { return sendJson(res, 500, { error: "Failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

const DEFAULT_TIME_SLOTS = ["11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30"];
const generateConfirmationCode = (): string => { const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let code = ""; for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]; return code; };

const handleGetReservationSlots = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const url = new URL(req.url ?? "", `http://localhost:${PORT}`);
    const date = url.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return sendJson(res, 400, { error: "Invalid date" });
    const now = new Date(); const todayStr = now.toISOString().slice(0, 10);
    if (date < todayStr) return sendJson(res, 200, { slots: DEFAULT_TIME_SLOTS.map((t) => ({ time: t, available: false, reason: "Past" })) });
    const existing = await cockpitFetch<any[]>(`/api/content/items/reservation?filter={date:"${date}",status:{$ne:"cancelled"}}`).catch(() => []);
    const MAX = 8; const counts = new Map<string, number>();
    for (const r of existing ?? []) counts.set(r.time, (counts.get(r.time) ?? 0) + 1);
    const slots = DEFAULT_TIME_SLOTS.map((t) => { if (date === todayStr) { const [h, m] = t.split(":").map(Number); const st = new Date(now); st.setHours(h, m, 0, 0); if (st <= now) return { time: t, available: false, reason: "Past" }; } if ((counts.get(t) ?? 0) >= MAX) return { time: t, available: false, reason: "Full" }; return { time: t, available: true }; });
    return sendJson(res, 200, { slots });
  } catch (err) { return sendJson(res, 500, { error: "Failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

const handleCreateReservation = async (_req: any, res: ServerResponse, _params: any, body: any) => {
  try {
    if (!body?.customerName?.trim()) return sendJson(res, 400, { error: "Name required" });
    if (!body?.customerPhone?.trim() || body.customerPhone.trim().length < 6) return sendJson(res, 400, { error: "Phone required" });
    if (!body?.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return sendJson(res, 400, { error: "Invalid date" });
    if (!body?.time || !DEFAULT_TIME_SLOTS.includes(body.time)) return sendJson(res, 400, { error: "Invalid time" });
    if (!body?.partySize || body.partySize < 1 || body.partySize > 20) return sendJson(res, 400, { error: "Party 1-20" });
    const now = new Date(); const todayStr = now.toISOString().slice(0, 10);
    if (body.date < todayStr) return sendJson(res, 400, { error: "Past date" });
    let code = generateConfirmationCode();
    const reservation = await cockpitFetch<any>(`/api/content/item/reservation`, { method: "POST", body: { data: { customerName: body.customerName.trim(), customerPhone: body.customerPhone.trim(), customerEmail: body.customerEmail?.trim() || undefined, date: body.date, time: body.time, partySize: body.partySize, notes: body.notes?.trim() || undefined, status: "pending", source: "guest", confirmationCode: code } } });
    if (!reservation?._id) return sendJson(res, 500, { error: "Failed" });
    emitRealtimeEvent("reservation:created", { reservationId: reservation._id, date: body.date, time: body.time, partySize: body.partySize, customerName: body.customerName, source: "guest" });
    return sendJson(res, 201, { reservationId: reservation._id, confirmationCode: code, status: "pending", date: body.date, time: body.time, partySize: body.partySize });
  } catch (err) { return sendJson(res, 500, { error: "Failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

const handleGetLoyaltyByPhone = async (_req: any, res: ServerResponse, params: { phone: string }) => {
  try {
    const customers = await cockpitFetch<any[]>(`/api/content/items/customer?populate=1&filter={phone:"${params.phone}"}`);
    if (!customers?.length) return sendJson(res, 404, { error: "Not found" });
    const customer = customers[0];
    const rewards = await cockpitFetch<any[]>(`/api/content/items/loyaltyreward?populate=1&filter={active:true}&sort={pointsCost:1}`);
    return sendJson(res, 200, { customer: { _id: customer._id, name: customer.name, phone: customer.phone, points: customer.points ?? 0, lifetimePoints: customer.lifetimePoints ?? 0, totalSpent: customer.totalSpent ?? 0, visits: customer.visits ?? 0, firstVisitAt: customer.firstVisitAt, lastVisitAt: customer.lastVisitAt }, rewards: (rewards ?? []).map((r) => ({ _id: r._id, name: r.name, description: r.description, pointsCost: r.pointsCost, discountType: r.discountType, discountValue: r.discountValue })) });
  } catch (err) { return sendJson(res, 500, { error: "Failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body?: any) => Promise<void> | void;
interface Route { pattern: RegExp; paramNames: string[]; handlers: Record<string, RouteHandler>; }

const routes: Route[] = [
  { pattern: /^\/api\/public\/health$/, paramNames: [], handlers: { GET: handleHealth } },
  { pattern: /^\/api\/public\/menu\/([^/]+)$/, paramNames: ["tableToken"], handlers: { GET: handleGetMenu } },
  { pattern: /^\/api\/public\/order$/, paramNames: [], handlers: { POST: handleCreateOrder } },
  { pattern: /^\/api\/public\/order\/([^/]+)$/, paramNames: ["orderId"], handlers: { GET: handleGetOrderStatus } },
  { pattern: /^\/api\/public\/loyalty\/([^/]+)$/, paramNames: ["phone"], handlers: { GET: handleGetLoyaltyByPhone } },
  { pattern: /^\/api\/public\/reservation\/slots$/, paramNames: [], handlers: { GET: handleGetReservationSlots } },
  { pattern: /^\/api\/public\/reservation$/, paramNames: [], handlers: { POST: handleCreateReservation } },
];

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); return res.end(); }
  const url = new URL(req.url ?? "", `http://localhost:${PORT}`);
  for (const route of routes) {
    const match = url.pathname.match(route.pattern);
    if (!match) continue;
    const handler = route.handlers[req.method ?? "GET"];
    if (!handler) return sendJson(res, 405, { error: "Method not allowed" });
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, i) => { params[name] = decodeURIComponent(match[i + 1]); });
    try { const body = req.method === "POST" ? await parseBody(req) : undefined; await handler(req, res, params, body); } catch (err) { sendJson(res, 500, { error: "Internal", detail: err instanceof Error ? err.message : "Unknown" }); }
    return;
  }
  sendJson(res, 404, { error: "Not found", path: url.pathname });
});

server.listen(PORT, () => { console.log(`[pos-public] Running on port ${PORT}`); console.log(`[pos-public] Cockpit: ${COCKPIT_URL}`); console.log(`[pos-public] Realtime: ${REALTIME_SERVICE_URL}`); });
process.on("SIGTERM", () => { server.close(() => process.exit(0)); });
process.on("SIGINT", () => { server.close(() => process.exit(0)); });
process.on("uncaughtException", (err: Error) => console.error("[pos-public] UNCAUGHT:", err));
process.on("unhandledRejection", (r: unknown) => console.error("[pos-public] UNHANDLED:", r));
