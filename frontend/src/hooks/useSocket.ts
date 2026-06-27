import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Singleton socket.io connection shared across all hook instances.
 * Lazily initialised on first use.
 *
 * Connects via `/?XTransformPort=3003` so that the Caddy gateway can
 * forward the WebSocket to the pos-realtime mini-service. Never use
 * an absolute URL like `http://localhost:3003` — it breaks the gateway.
 */
let socket: Socket | null = null;
let connectionCount = 0;

const getSocket = (): Socket => {
  if (!socket) {
    socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.debug("[socket] connected:", socket?.id);
      // Identify ourselves to the server for logging/role-based features
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        socket?.emit("identify", {
          role: user?.role,
          username: user?.name ?? user?.username,
        });
      } catch {
        /* ignore */
      }
    });

    socket.on("disconnect", (reason: string) => {
      console.debug("[socket] disconnected:", reason);
    });

    socket.on("connect_error", (err: Error) => {
      // Don't spam console — the realtime layer is best-effort
      console.warn("[socket] connection error:", err.message);
    });
  }
  return socket;
};

/**
 * Hook that returns a connected socket.io client.
 *
 * - On mount: increments a ref-count so the singleton stays alive while
 *   at least one component is using it.
 * - On unmount: decrements; if count reaches 0, disconnects.
 * - Returns `{ socket, isConnected }` so components can render a
 *   connection status indicator if they want.
 *
 * Usage:
 *   const { socket, isConnected } = useSocket();
 *   useEffect(() => {
 *     if (!socket) return;
 *     const handler = (data) => { ... };
 *     socket.on('order:status_changed', handler);
 *     return () => socket.off('order:status_changed', handler);
 *   }, [socket]);
 */
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;
    connectionCount++;

    // Sync initial state
    setIsConnected(s.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      connectionCount--;
      if (connectionCount <= 0 && socket) {
        socket.disconnect();
        socket = null;
        connectionCount = 0;
      }
    };
  }, []);

  return { socket: socketRef.current, isConnected };
};

/**
 * Emit a typed POS event to the realtime server, which will broadcast
 * it to all connected clients (including this one).
 *
 * Components should call this AFTER a successful mutation to notify
 * other tabs / devices that something changed.
 *
 * Example:
 *   emitPosEvent('orderitem:status_changed', { orderItemId, status, orderId });
 */
export const emitPosEvent = (type: string, payload: unknown) => {
  const s = getSocket();
  if (!s.connected) {
    // Silently drop if not connected — realtime is best-effort
    return;
  }
  s.emit("pos:event", { type, payload });
};
