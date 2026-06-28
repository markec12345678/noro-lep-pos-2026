# Public Ordering via QR Code — Setup Guide

Enables guests to scan a QR code at their table, browse the menu on
their phone, and place an order that goes directly to the kitchen
display — no app install required, no waiter intervention needed.

## Architecture

```
  Guest phone                    Caddy gateway                 Backend
  ┌──────────┐                  ┌──────────┐                ┌──────────────┐
  │ Scan QR  │                  │          │                │              │
  │ → browser│ ──HTTP──→        │  :443    │ ──→ :3005 ──→  │ pos-public   │
  │ /public/ │                  │          │                │  mini-service│
  │ menu/:t  │                  │          │                │      │       │
  └──────────┘                  └──────────┘                │      ↓       │
       │                                                    │ Cockpit CMS  │
       │ WebSocket (?XTransformPort=3003)                   │  (port 3030) │
       └──────────────────────────────────────────────────→ │              │
                                                             │ pos-realtime │
                                                             │  (port 3003) │
                                                             └──────────────┘
```

## Mini-service

Location: `/home/z/my-project/mini-services/pos-public/`

```bash
cd /home/z/my-project/mini-services/pos-public
bun install         # one-time
bun run dev         # hot-reload dev mode
# OR
bun run start       # production mode
```

The service listens on **port 3005** and exposes:

| Endpoint                          | Method | Auth | Purpose                          |
|-----------------------------------|--------|------|----------------------------------|
| `/api/public/health`              | GET    | none | Service status                   |
| `/api/public/menu/:tableToken`    | GET    | none | Table info + available menu      |
| `/api/public/order`               | POST   | none | Create a guest order             |
| `/api/public/order/:orderId`      | GET    | none | Check order status               |

The frontend calls via `?XTransformPort=3005` so Caddy routes correctly.

## Environment variables

```bash
COCKPIT_URL=http://localhost:3030              # Cockpit CMS base URL
COCKPIT_API_KEY=your-api-key-here              # Server-side key (never exposed)
REALTIME_SERVICE_URL=http://localhost:3003     # For WebSocket event emission
```

**Important**: The `COCKPIT_API_KEY` must be kept server-side only.
Never embed it in the frontend bundle. The pos-public service acts as
a proxy, using the key to read menus and write orders on behalf of
guests without exposing the key to the browser.

## Cockpit CMS changes

### Update `table` collection

Add a new field:

| Field name     | Type | Required | Notes                                              |
|----------------|------|----------|----------------------------------------------------|
| `publicToken`  | text | no       | UUID for QR-code-based guest ordering. Null = disabled. |

Generate tokens via the **QR Codes** page in the POS admin
(`/qr-codes`). Each table gets a unique UUID that is embedded in the
QR code.

### Update `order` collection

Add a new field:

| Field name | Type   | Required | Notes                                            |
|------------|--------|----------|--------------------------------------------------|
| `source`   | select | no       | Options: `staff`, `guest`. Identifies who created the order. |

Guest orders have `source: "guest"` so staff can distinguish them
from staff-created orders in the Kitchen Display and Orders list.

## Guest flow

1. **Guest scans QR code** at their table
   - QR contains URL: `https://your-restaurant.com/public/menu/<UUID>`
2. **Browser opens the public menu page**
   - No login required
   - Shows table number + restaurant name
   - Displays all available menu items grouped by category
   - Guest can search and filter
3. **Guest builds their cart**
   - Tap items to add (with quantity steppers)
   - Floating cart button shows count + total
   - Cart bottom sheet for review
4. **Guest checks out**
   - Enters their name (required) + phone (optional)
   - Sees order summary with total
   - Submits order
5. **Order is created in the backend**
   - `order` record with `source: "guest"`, `status: "pending"`
   - `orderitem` records with `status: "new"`
   - Table marked as `occupied`
   - WebSocket events emitted → kitchen display refreshes instantly
6. **Guest is redirected to order status page**
   - `/public/order/:orderId`
   - Shows progress bar: Prejeto → V pripravi → Pripravljeno → Postreženo
   - Polls every 5 seconds for updates
   - Each item shows its individual status
7. **Kitchen processes the order**
   - Kitchen display shows the new order (with "GUEST" badge)
   - Chef marks items as in-kitchen → ready
   - Guest sees status updates in real-time

## Manager flow (QR code generation)

1. Go to **QR Codes** page in the POS admin (`/qr-codes`)
2. For each table, click "Generiraj" to create a public token
3. Or click "Generiraj vse" to bulk-generate tokens for all tables
4. Print QR codes (optimized for table tents)
5. Place printed QR codes on the corresponding tables
6. Test by scanning the QR code with your phone

## Security considerations

- **Table tokens are UUIDs** — not easily enumerable, but should be
  rotated periodically (e.g. every 6 months) for security
- **Rate limiting** (TODO) should be added per IP to prevent abuse
- **Order validation**: the server validates all menu IDs and computes
  prices from the database — never trusts client-supplied prices
- **Public order tracking**: only orders with `source: "guest"` can be
  tracked publicly; staff orders are not accessible via the public API
- **CORS**: the pos-public service allows all origins (`*`). In
  production, restrict to your restaurant's domain

## Realtime integration

When a guest submits an order, the pos-public service emits WebSocket
events to the pos-realtime service (port 3003):

- `order:created` — triggers kitchen display refresh
- `orderitem:created` — for each item, triggers kitchen refresh
- `table:status_changed` — triggers tables view refresh

This means the kitchen sees the new order within ~1 second of the
guest submitting it — no manual refresh needed.

## Mobile-first design

The public menu page is designed mobile-first since guests will be
using their phones:
- Large touch targets (min 44px)
- Bottom sheet cart (thumb-friendly)
- Sticky header with cart button
- Smooth Framer Motion animations
- No horizontal scrolling required
- Works in both portrait and landscape

## Future enhancements

- **Modifier selection**: allow guests to pick modifiers (sizes,
  toppings) via the public menu — currently guests can only add items
  with quantity + special instructions
- **Payment integration**: let guests pay via Stripe/PayPal before
  submitting the order
- **Multi-language**: auto-detect browser language (Slovenian / English)
- **Loyalty integration**: link guest phone number to loyalty account
- **Table tent templates**: pre-designed printable table tents with
  restaurant branding
