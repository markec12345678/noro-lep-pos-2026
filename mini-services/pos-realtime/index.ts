import { createServer } from "http";
import { Server, Socket } from "socket.io";

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
  connectedAt: Date;
}

const clients = new Map<string, ConnectedClient>();

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

io.on("connection", (socket: Socket) => {
  const client: ConnectedClient = { id: socket.id, connectedAt: new Date() };
  clients.set(socket.id, client);
  log(`Client connected: ${socket.id} (total: ${clients.size})`);

  socket.on("identify", (data: { role?: string; username?: string }) => {
    client.role = data.role;
    client.username = data.username;
    log(`Client identified: ${socket.id} → ${data.username ?? "?"} (${data.role ?? "?"})`);
  });

  socket.on("pos:event", (data: { type: string; payload: unknown }) => {
    if (!data?.type) return;
    log(`Relay: ${data.type} from ${socket.id}`);
    io.emit(data.type, data.payload);
  });

  socket.on("disconnect", (reason: string) => {
    clients.delete(socket.id);
    log(`Client disconnected: ${socket.id} (${reason}) (total: ${clients.size})`);
  });

  socket.on("error", (error: Error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

httpServer.listen(PORT, () => {
  log(`POS Realtime WebSocket server running on port ${PORT}`);
  log(`Clients connect via: io("/?XTransformPort=${PORT}")`);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  io.close(() => { httpServer.close(() => process.exit(0)); });
});
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down...");
  io.close(() => { httpServer.close(() => process.exit(0)); });
});
process.on("uncaughtException", (err: Error) => console.error("UNCAUGHT:", err));
process.on("unhandledRejection", (reason: unknown) => console.error("UNHANDLED:", reason));
