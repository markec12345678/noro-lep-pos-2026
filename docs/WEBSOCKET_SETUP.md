# Realtime (WebSocket) — Setup & Architecture

The POS uses a dedicated socket.io mini-service for real-time event
broadcasting between open tabs and devices.

## Service location

```
/home/z/my-project/mini-services/pos-realtime/
├── index.ts        # socket.io server (port 3003)
├── package.json
└── (auto-installed: socket.io)
```

## Starting the service

```bash
cd /home/z/my-project/mini-services/pos-realtime
bun install         # one-time
bun run dev         # hot-reload dev mode (recommended)
# OR
bun run start       # production mode
```

The service listens on **port 3003**. It is designed to be started once
and kept running in the background.

## How the gateway routes it

The Caddy gateway inspects the `XTransformPort` query parameter on
incoming requests. When the frontend connects with:

```ts
io("/?XTransformPort=3003", { transports: ["websocket", "polling"] })
```

Caddy strips the query parameter and forwards the WebSocket upgrade to
`localhost:3003`. **Never** use an absolute URL like
`http://localhost:3003` — it breaks the gateway and CORS.

## Events broadcast

| Event                          | Emitted when                              | Payload                                  |
|--------------------------------|-------------------------------------------|------------------------------------------|
| `order:created`                | New order created on a table              | `{ orderId, tableId }`                   |
| `order:status_changed`         | Order completed / cancelled               | `{ orderId, status, total }`             |
| `orderitem:created`            | Item added to a cart                      | `{ orderItemId, orderId, menuName, status }` |
| `orderitem:status_changed`     | Kitchen marks item ready / cancelled      | `{ orderItemId, status, orderId }`       |
| `table:status_changed`         | Table becomes available / occupied        | `{ tableId, status, orderId }`           |
| `cashdrawer:opened`            | Cash drawer session opened                | `{ sessionId, user }`                    |
| `cashdrawer:closed`            | Cash drawer session closed                | `{ sessionId, difference }`              |
| `inventory:low_stock`          | Item falls below threshold                | `{ inventoryItemId, name, quantity, threshold }` |
| `inventory:updated`            | Stock level changed                       | `{ inventoryItemId, quantity }`          |

## Frontend integration

### Hooks (in `src/hooks/`)

- **`useSocket()`** — returns `{ socket, isConnected }`. Lazily creates a
  singleton connection, ref-counted so it disconnects when the last
  component unmounts. Reconnects automatically on disconnect.
- **`useRealtimeSync()`** — subscribes to all known event types and
  invalidates the relevant React Query cache keys. Mount ONCE at the
  app root (already done in `App.tsx`).
- **`emitPosEvent(type, payload)`** — convenience function for any
  component to broadcast an event after a mutation.

### Where emits happen

All service mutations (`useCreateOrder`, `useUpdateOrder`,
`useCreateOrderItem`, `useUpdateOrderItem`, `useUpdateTable`, etc.)
call `emitPosEvent(...)` in their `onSuccess` callback. This means:

- A waiter on tablet A adds an item to cart
- The backend confirms
- The frontend emits `orderitem:created` via socket.io
- ALL connected clients (kitchen display, manager's laptop, waiter B)
  receive the event and invalidate their React Query caches
- The kitchen display refetches automatically — no manual refresh

## Connection indicator

The Sidebar shows a small "Realtime connected" / "Offline mode"
indicator at the bottom, so users immediately see if they're getting
live updates.

## Architecture notes

- The socket.io server is **stateless** — it doesn't persist events.
  Persistence is handled by Cockpit CMS via the normal REST API; the
  WebSocket layer is purely for cache invalidation.
- If the realtime service goes down, the app continues to work —
  React Query will just refetch on the next user action or window focus.
  Realtime is a UX enhancement, not a hard dependency.
- For multi-location deployments, the server could be extended to
  support "rooms" (one per location) so events only broadcast within
  the same restaurant. For now, all events broadcast to all clients.

## Troubleshooting

**Frontend shows "Offline mode" indefinitely**
- Check that the mini-service is running: `curl http://localhost:3003`
  should return a 400 with "Upgrade required" (that's normal for
  socket.io — it means the server is alive but expects WebSocket).
- Check browser dev console for `connect_error` logs.
- Verify Caddy is configured to forward `XTransformPort=3003`.

**Events not propagating between tabs**
- Verify the sending tab actually called `emitPosEvent` (check console
  for `[socket] Relay:` log on the server).
- Verify the receiving tab is subscribed (check for `[realtime]` log).
- Ensure both tabs are signed in as users with the same role/view.
