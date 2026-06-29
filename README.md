# Noro Lep POS

Production-ready **restaurant management system** for Slovenian restaurants and chains. Built with Vite + React + TypeScript + Cockpit CMS, with full FURS fiscal compliance, real-time WebSocket sync, and 25+ modules covering every aspect of restaurant operations.

![POS](./frontend/public/pos-image.png)

---

## Features (25 modules)

### Core POS
- **POS** — point of sale with menu modifiers (sizes, toppings), DDV tax (22%/9.5%/0%), payment methods (cash/card), tips, happy hour promotions, and table operations (transfer/merge/split bill)
- **Enhanced KDS** — kanban-style kitchen display with live wait timers, color-coded urgency alerts, sound notifications, and order bump functionality
- **Tables** — table management with status tracking, QR code generation for guest ordering
- **Orders** — order list with filtering, refunds, and receipt printing
- **Food Menus** — menu CRUD with allergen tracking (EU FIC 1169/2011), modifier groups, and tax rates
- **Categories** — menu category management

### Financial
- **FURS Davčna Blagajna** — Slovenian fiscal compliance: ZOI generation, EOR submission, QR codes on receipts (mini-service on port 3004)
- **Z-Report** — daily closing report with tax/payment breakdown, cash drawer reconciliation, and refund tracking
- **Cash Drawer** — shift-based cash sessions with opening float, expected cash computation, and over/short detection
- **Tips & Gratuity** — tip collection at checkout (percentage/custom) with per-staff distribution reporting
- **Payment Methods** — cash/card/other with cash-only filtering for drawer reconciliation

### Inventory & Suppliers
- **Inventory** — stock tracking with auto-decrement on checkout, low-stock alerts, and stock movement audit log
- **Recipe Costing** — per-dish ingredient cost calculation from recipe + inventory data
- **Menu Engineering** — profitability × popularity matrix (Stars/Plowhorses/Puzzles/Dogs)
- **Suppliers** — supplier management with contact info, payment terms, and invoice history
- **Invoices** — supplier invoice processing with line items and auto-restock on approval

### Customer & Marketing
- **Online Ordering** — QR code-based guest ordering (public menu, cart, checkout) with real-time kitchen sync
- **Loyalty Program** — points-based loyalty with phone number lookup, rewards redemption, and per-customer history
- **Reservations** — public booking page + manager calendar with time slot management and confirmation codes
- **Happy Hour** — time-based promotions with auto-apply at checkout (percentage/fixed/BOGO)
- **Allergen Tracking** — 14 EU FIC allergens with guest-facing filter on public menu

### Operations
- **Staff Scheduling** — weekly shift grid with clock in/out and labor cost calculation
- **Multi-Location** — chain management with location switcher, per-location FURS config
- **Manager Dashboard** — KPI overview with activity feed and context-aware alerts
- **Notification Center** — live alerts from all modules (bell icon in header)
- **Refund Processing** — partial/full refunds with reason tracking and Z-Report integration
- **Realtime WebSocket** — multi-tab sync via socket.io (orders, kitchen, reservations, inventory)

### RBAC
- **Manager** — full access to all 25+ modules
- **Waiter** — POS + Tables + Dashboard only
- **Chef** — Dashboard + Kitchen + Tables only

---

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │ Mini-services│
│  Vite+React  │───▶│  Cockpit CMS │    │              │
│  TypeScript  │    │  PHP + SQLite│    │ pos-realtime │ :3003 (WebSocket)
│  Port 8080   │    │  Port 3030   │    │ furs-service │ :3004 (FURS ZOI/EOR)
└──────────────┘    └──────────────┘    │ pos-public   │ :3005 (Guest API)
                                         └──────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 20+ (or Bun)
- PHP 8.3+ with SQLite
- Docker (optional, recommended)

### Option 1: Docker (recommended)

```bash
git clone https://github.com/markec12345678/noro-lep-pos-2026.git
cd noro-lep-pos-2026
docker-compose up
```

Access:
- Frontend: http://localhost:8080
- Cockpit CMS: http://localhost:3030 (admin/admin)
- Realtime: port 3003 (WebSocket)
- FURS service: port 3004
- Public API: port 3005

### Option 2: Manual

#### Backend
```bash
cd backend
php -S localhost:3030
```

#### Setup Collections
```bash
# After Cockpit CMS is running, create all 23 collections:
php backend/setup-collections.php
# Or via HTTP:
curl http://localhost:3030/setup-collections.php
```

#### Mini-services
```bash
# 1. Realtime WebSocket (port 3003)
cd mini-services/pos-realtime
bun install && bun run dev

# 2. FURS service (port 3004)
cd mini-services/furs-service
bun install && bun run dev

# 3. Public API (port 3005)
cd mini-services/pos-public
bun install && bun run dev
```

#### Frontend
```bash
cd frontend
cp .env.example .env
bun install
bun run dev
```

---

## Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Manager | manager | m123456 |
| Chef | chef | c123456 |
| Waiter | waiter2 | w123456 |

---

## Documentation

Detailed setup guides for each module:

| Document | Module |
|----------|--------|
| [MODIFIERS_SETUP.md](docs/MODIFIERS_SETUP.md) | Menu modifiers |
| [INVENTORY_SETUP.md](docs/INVENTORY_SETUP.md) | Inventory & stock |
| [CASH_DRAWER_SETUP.md](docs/CASH_DRAWER_SETUP.md) | Cash drawer |
| [WEBSOCKET_SETUP.md](docs/WEBSOCKET_SETUP.md) | Realtime WebSocket |
| [FURS_SETUP.md](docs/FURS_SETUP.md) | FURS fiscal compliance |
| [PUBLIC_ORDERING_SETUP.md](docs/PUBLIC_ORDERING_SETUP.md) | Online ordering + QR menu |
| [LOYALTY_SETUP.md](docs/LOYALTY_SETUP.md) | Loyalty program |
| [RESERVATIONS_SETUP.md](docs/RESERVATIONS_SETUP.md) | Reservations |
| [SUPPLIERS_SETUP.md](docs/SUPPLIERS_SETUP.md) | Suppliers & invoices |
| [MULTI_LOCATION_SETUP.md](docs/MULTI_LOCATION_SETUP.md) | Multi-location |
| [ALLERGENS_SETUP.md](docs/ALLERGENS_SETUP.md) | Allergen tracking |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 5, React 18, TypeScript 5, Tailwind CSS 3, shadcn/ui |
| State | TanStack Query 5 (server), useState (client) |
| Realtime | socket.io (mini-service) |
| Charts | Recharts |
| Routing | React Router DOM 6 |
| Backend | Cockpit CMS (PHP 8.3), SQLite |
| Mini-services | Bun + TypeScript |
| FURS | RSA-SHA1 + MD5 + Base32 + QR code generation |

---

## License

GPLv3 — see [LICENSE](frontend/LICENSE)
