import { createServer } from "http";
import { Server, Socket } from "socket.io";

/**
 * POS Realtime Service — socket.io mini-service
 *
 * Runs on port 3003 and broadcasts POS-related events to all connected
 * clients (kitchen display, orders list, tables view, etc.).
 *
 * Events emitted by the server (broadcast):
 *   - order:created        { orderId, tableId }
 *   - order:updated        { orderId, changes }
 *   - order:status_changed { orderId, status }
 *   - order:completed      { orderId, total }
 *   - orderitem:created    { orderItemId, orderId, menuName }
 *   - orderitem:status_changed { orderItemId, status, orderId }
 *   - table:status_changed { tableId, status, orderId }
 *   - cashdrawer:opened    { sessionId, user }
 *   - cashdrawer:closed    { sessionId, difference }
 *   - inventory:low_stock  { inventoryItemId, name, quantity, threshold }
 *   - inventory:updated    { inventoryItemId, quantity }
 *
 * Events received from clients (relay):
 *   - pos:event  { type, payload }  — generic relay; server re-broadcasts
 *
 * Architecture:
 *   The frontend (Vite SPA) connects via `io("/?XTransformPort=3003")`.
 *   Caddy strips the XTransformPort query and forwards to this port.
 *   Any client can emit `pos:event` and the server broadcasts it to
 *   everyone else (including the sender, so React Query invalidation
 *   works uniformly across all open tabs).
 */

const PORT = 3003;

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it to route the request.
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

interface ConnectedClient {
  id: string;
  role?: string;
  username?: string;
  connectedAt: Date;
}

const clients = new Map<string, ConnectedClient>();

const log = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

io.on("connection", (socket: Socket) => {
  const client: ConnectedClient = {
    id: socket.id,
    connectedAt: new Date(),
  };
  clients.set(socket.id, client);
  log(`Client connected: ${socket.id} (total: ${clients.size})`);

  // Identify — client sends this right after connect
  socket.on("identify", (data: { role?: string; username?: string }) => {
    client.role = data.role;
    client.username = data.username;
    log(
      `Client identified: ${socket.id} → ${data.username ?? "?"} (${data.role ?? "?"})`,
    );
  });

  /**
   * Generic event relay. Any client can emit `pos:event` with a typed
   * payload; the server re-broadcasts to ALL connected clients
   * (including sender) so they can invalidate their React Query caches.
   *
   * Example client payload:
   *   {
   *     type: "orderitem:status_changed",
   *     payload: { orderItemId: "...", status: "ready", orderId: "..." }
   *   }
   */
  socket.on("pos:event", (data: { type: string; payload: unknown }) => {
    if (!data?.type) return;
    log(`Relay: ${data.type} from ${socket.id}`);
    // Broadcast to everyone (including sender for cache invalidation)
    io.emit(data.type, data.payload);
  });

  socket.on("disconnect", (reason: string) => {
    clients.delete(socket.id);
    log(
      `Client disconnected: ${socket.id} (${reason}) (total: ${clients.size})`,
    );
  });

  socket.on("error", (error: Error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

httpServer.listen(PORT, () => {
  log(`POS Realtime WebSocket server running on port ${PORT}`);
  log(`Clients connect via: io("/?XTransformPort=${PORT}")`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  log(`Received ${signal}, shutting down...`);
  io.close(() => {
    httpServer.close(() => {
      log("Server closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
