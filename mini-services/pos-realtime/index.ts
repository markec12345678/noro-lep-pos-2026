import { createServer } from "http";
import { Server, Socket } from "socket.io";

/**
 * POS Realtime Service — socket.io mini-service z KDS support
 *
 * Port: 3003
 *
 * KDS Rooms:
 *   - "kds:all"     — vsi KDS klienti (kuharji)
 *   - "kds:hot"     — vroča postaja (glavne jedi)
 *   - "kds:cold"    — hladna postaja (predjedi, solate)
 *   - "kds:bar"     — bar (pijače)
 *   - "kds:dessert" — sladice
 *   - "pos:all"     — vsi POS klienti (natakarji)
 *   - "dashboard"   — Command Center dashboard
 *
 * KDS Events (broadcast to kds:* rooms):
 *   - kds:new_order        { orderId, orderNumber, table, items[], channel }
 *   - kds:item_status      { itemId, status, orderId }
 *   - kds:order_recalled   { orderId }
 *   - kds:order_bumped     { orderId }
 *
 * POS Events (broadcast to pos:all + dashboard):
 *   - pos:order_paid       { orderId, total, tip, paymentMethod }
 *   - pos:table_status     { tableId, tableNumber, status }
 *   - pos:reservation_new  { reservationId, guestName, time, guests }
 *   - pos:waitlist_update  { waitlist }
 *
 * Dashboard Events (broadcast to dashboard room):
 *   - dashboard:revenue_update { total, orders }
 *   - dashboard:table_update   { occupied, free, reserved }
 *   - dashboard:kpis           { revenue, orders, avgCheck, laborPct }
 */

const PORT = 3003;

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

interface ConnectedClient {
  id: string;
  role?: string;
  username?: string;
  station?: string;
  rooms: string[];
  connectedAt: Date;
}

const clients = new Map<string, ConnectedClient>();

const log = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

// Helper: emit to specific rooms
const emitToRooms = (rooms: string[], event: string, payload: unknown) => {
  for (const room of rooms) {
    io.to(room).emit(event, payload);
  }
};

// Helper: emit to ALL clients
const broadcast = (event: string, payload: unknown) => {
  io.emit(event, payload);
};

io.on("connection", (socket: Socket) => {
  const client: ConnectedClient = {
    id: socket.id,
    rooms: [],
    connectedAt: new Date(),
  };
  clients.set(socket.id, client);
  log(`Client connected: ${socket.id} (total: ${clients.size})`);

  // ===== IDENTIFY + JOIN ROOMS =====
  socket.on("identify", (data: { role?: string; username?: string; station?: string }) => {
    client.role = data.role;
    client.username = data.username;
    client.station = data.station;

    // Join appropriate rooms based on role
    if (data.role === "kitchen" || data.role === "kds") {
      socket.join("kds:all");
      client.rooms.push("kds:all");
      // Join station-specific room
      if (data.station) {
        const stationRoom = `kds:${data.station}`;
        socket.join(stationRoom);
        client.rooms.push(stationRoom);
      }
      log(`KDS client: ${socket.id} → ${data.username} (station: ${data.station || "all"})`);
    }

    if (data.role === "server" || data.role === "pos") {
      socket.join("pos:all");
      client.rooms.push("pos:all");
      log(`POS client: ${socket.id} → ${data.username}`);
    }

    if (data.role === "dashboard" || data.role === "manager") {
      socket.join("dashboard");
      client.rooms.push("dashboard");
      log(`Dashboard client: ${socket.id} → ${data.username}`);
    }

    // Send current online count
    socket.emit("connected", {
      id: socket.id,
      role: data.role,
      onlineClients: clients.size,
      kdsClients: Array.from(clients.values()).filter(c => c.role === "kitchen" || c.role === "kds").length,
      posClients: Array.from(clients.values()).filter(c => c.role === "server" || c.role === "pos").length,
    });
  });

  // ===== KDS: NEW ORDER (POS → Kitchen) =====
  socket.on("kds:new_order", (data: {
    orderId: string;
    orderNumber: string;
    table: string;
    items: { id: string; name: string; qty: number; station?: string; notes?: string }[];
    channel: string;
    serverName?: string;
  }) => {
    log(`KDS new_order: ${data.orderNumber} | ${data.items.length} items | table=${data.table}`);

    // Broadcast to all KDS clients
    emitToRooms(["kds:all"], "kds:new_order", data);

    // Also route items to specific stations
    const stationItems: Record<string, typeof data.items> = {};
    for (const item of data.items) {
      const station = item.station || "hot"; // default to hot station
      if (!stationItems[station]) stationItems[station] = [];
      stationItems[station].push(item);
    }

    for (const [station, items] of Object.entries(stationItems)) {
      emitToRooms([`kds:${station}`], "kds:station_order", {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        table: data.table,
        station,
        items,
        channel: data.channel,
        serverName: data.serverName,
      });
      log(`  → Station ${station}: ${items.length} items`);
    }
  });

  // ===== KDS: ITEM STATUS CHANGE (Kitchen → POS + Dashboard) =====
  socket.on("kds:item_status", (data: {
    itemId: string;
    orderId: string;
    status: string; // new | preparing | ready | served | canceled
    station?: string;
  }) => {
    log(`KDS item_status: ${data.itemId} → ${data.status} | order=${data.orderId}`);
    // Broadcast to KDS + POS + Dashboard
    emitToRooms(["kds:all", "pos:all", "dashboard"], "kds:item_status", data);
  });

  // ===== KDS: ORDER RECALLED (Kitchen) =====
  socket.on("kds:order_recalled", (data: { orderId: string; recalledBy: string }) => {
    log(`KDS order_recalled: ${data.orderId} by ${data.recalledBy}`);
    emitToRooms(["kds:all", "pos:all"], "kds:order_recalled", data);
  });

  // ===== KDS: ORDER BUMPED (Kitchen → POS) =====
  socket.on("kds:order_bumped", (data: { orderId: string; bumpedBy: string }) => {
    log(`KDS order_bumped: ${data.orderId} by ${data.bumpedBy}`);
    emitToRooms(["kds:all", "pos:all", "dashboard"], "kds:order_bumped", data);
  });

  // ===== POS: ORDER PAID (POS → Dashboard + Kitchen) =====
  socket.on("pos:order_paid", (data: {
    orderId: string;
    orderNumber: string;
    total: number;
    tip: number;
    paymentMethod: string;
    tableId?: string;
  }) => {
    log(`POS order_paid: ${data.orderNumber} | €${data.total} | tip=€${data.tip}`);
    emitToRooms(["dashboard", "pos:all"], "pos:order_paid", data);

    // Auto free table
    if (data.tableId) {
      emitToRooms(["pos:all", "dashboard"], "pos:table_status", {
        tableId: data.tableId,
        status: "free",
      });
    }
  });

  // ===== POS: TABLE STATUS (POS → Dashboard) =====
  socket.on("pos:table_status", (data: { tableId: string; tableNumber: number; status: string }) => {
    log(`POS table_status: Miza ${data.tableNumber} → ${data.status}`);
    emitToRooms(["pos:all", "dashboard"], "pos:table_status", data);
  });

  // ===== POS: RESERVATION NEW (POS → Dashboard) =====
  socket.on("pos:reservation_new", (data: { reservationId: string; guestName: string; time: string; guests: number }) => {
    log(`POS reservation_new: ${data.guestName} | ${data.guests} gostov | ${data.time}`);
    emitToRooms(["pos:all", "dashboard"], "pos:reservation_new", data);
  });

  // ===== POS: WAITLIST UPDATE =====
  socket.on("pos:waitlist_update", (data: { action: string; guestName?: string; position?: number }) => {
    log(`POS waitlist_update: ${data.action} | ${data.guestName || ""}`);
    emitToRooms(["pos:all", "dashboard"], "pos:waitlist_update", data);
  });

  // ===== DASHBOARD: KPI BROADCAST (manager → all dashboards) =====
  socket.on("dashboard:kpis", (data: { revenue: number; orders: number; avgCheck: number; laborPct: number }) => {
    emitToRooms(["dashboard"], "dashboard:kpis", data);
  });

  // ===== GENERIC RELAY (backward compatible) =====
  socket.on("pos:event", (data: { type: string; payload: unknown }) => {
    if (!data?.type) return;
    log(`Relay: ${data.type} from ${socket.id}`);
    io.emit(data.type, data.payload);
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", (reason: string) => {
    clients.delete(socket.id);
    log(`Client disconnected: ${socket.id} (${reason}) (total: ${clients.size})`);

    // Notify dashboard of client count change
    emitToRooms(["dashboard"], "client_count", { total: clients.size });
  });

  socket.on("error", (error: Error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

// ===== HEALTH CHECK =====
httpServer.listen(PORT, () => {
  log(`POS Realtime WebSocket server running on port ${PORT}`);
  log(`KDS Rooms: kds:all, kds:hot, kds:cold, kds:bar, kds:dessert`);
  log(`POS Rooms: pos:all`);
  log(`Dashboard Room: dashboard`);
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
