# Noro Lep POS — Najlepša slovenska restavracijska blagajna 2026

> AI-poganjana POS blagajna z avtomatskim FURS, AI predikcijo prometa, kuhinjskim zaslonom (KDS), real-time WebSocket sync, PIN-based auth z RBAC, P&L finančnim izpavkom in 40 Prisma modeli. Zgrajena z ljubeznijo za slovenske gostince. 🇸🇮

[![Version](https://img.shields.io/badge/Version-10.0-blue?style=flat-square)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Socket.io](https://img.shields.io/badge/Socket.io-realtime-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![JWT](https://img.shields.io/badge/JWT-auth-000000?style=flat-square&logo=jsonwebtokens)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📋 Kazalo

- [Pregled](#pregled)
- [Backend POS sistem](#backend-pos-sistem)
- [Landing page](#landing-page)
- [Hitri začetek](#hitri-zacetek)
- [API dokumentacija](#api-dokumentacija)
- [Tehnologije](#tehnologije)
- [Struktura projekta](#struktura-projekta)
- [Prispevanje](#prispevanje)
- [Licenca](#licenca)

---

## Pregled

**Noro Lep POS** je najlepša slovenska restavracijska blagajna zgrajena na Next.js 16. Vključuje **celovit backend POS sistem** z 40 Prisma modeli, 55 API routes, PIN-based avtentikacijo z RBAC, real-time WebSocket komunikacijo in P&L finančni izpavek.

### 🎯 Zakaj Noro Lep?

- ✅ **FURS ZDavP-2P 2025** — avtomatski ZOI, EOR, QR koda, Z-Report
- ✅ **PIN-based auth** — 4-digit PIN login, JWT, RBAC (6 role-ov)
- ✅ **P&L (Profit & Loss)** — Revenue, COGS, Labor, OpEx, Net Profit z benchmarki
- ✅ **Real-time WebSocket** — POS → KDS → Dashboard z station routing
- ✅ **40 Prisma modelov** — Orders, Tables, Reservations, Staff, Customers, Promotions, Gift Cards, Menu, Tips, Payments, Expenses, Printers, Notifications, Audit Log, Cash Drawer, Purchase Orders, Suppliers
- ✅ **ESC/POS printing** — receipt + kitchen order z auto station routing
- ✅ **Supply chain** — Purchase Orders z auto stock update na receive
- ✅ **GDPR compliant** — cookie consent, audit log, data export (11 CSV tipov)

---

## Backend POS sistem

Celovit POS backend z **real DB persistence** (Prisma + SQLite), PIN-based avtentikacijo in 27 sistemov.

### 🗄️ 40 Prisma modelov v 27 sistemih

| # | Sistem | Modeli | API | Ključna funkcionalnost |
|---|---|---|---|---|
| 1 | **Auth** | SessionLog | login/me/logout/set-pin | PIN + JWT + RBAC (6 roles) |
| 2 | **Orders** | Order, OrderItem | GET/POST/PATCH | CRUD + auto stock deduction + tip |
| 3 | **Tables** | Table | GET/PATCH/POST + seed | CRUD + auto status |
| 4 | **Reservations** | Reservation | GET/POST/PATCH/DELETE | CRUD + auto table + Customer link |
| 5 | **Waitlist** | Waitlist | GET/POST/PATCH | Auto-renumber + SMS notify |
| 6 | **Staff & Shifts** | Staff, Shift, Attendance | GET/POST/PATCH/DELETE | Labor cost + clock in/out + PIN |
| 7 | **KDS** | — | GET/PATCH + WebSocket | Board + station routing |
| 8 | **Z-Report** | ZReport | GET/POST/PATCH | FURS + VAT breakdown |
| 9 | **Inventory** | InventoryItem, InventoryTransaction | GET/POST | Stock movements + auto deduction |
| 10 | **Purchase Orders** | PurchaseOrder, PurchaseOrderItem | GET/POST/PATCH | Supply chain + auto stock on receive |
| 11 | **Suppliers** | Supplier | GET/POST/PATCH/DELETE | CRUD + search |
| 12 | **Menu** | MenuCategory, MenuItem, MenuItemModifier | GET/POST/PATCH/DELETE + seed | Kategorije/artikli/modifierji + allergens |
| 13 | **Customer** | Customer, LoyaltyTransaction | GET/POST/PATCH | CRM + točke + auto tier (bronze→silver→gold) |
| 14 | **Promotions** | Promotion, PromotionUsage | GET/POST/PATCH/DELETE + apply | Happy hour/BOGO/coupon + auto-apply |
| 15 | **Gift Cards** | GiftCard, GiftCardTransaction | GET/POST/PATCH | Issue/redeem/reload + audit trail |
| 16 | **Bill Split** | BillSplit, BillSplitShare | GET/POST/PATCH | Equal/items/custom + auto paid |
| 17 | **Tips** | TipDistribution | GET/POST/PATCH | 3 pool tipi + approval workflow |
| 18 | **Payments** | Payment | webhook + list | Stripe → auto order paid + loyalty |
| 19 | **Cash Drawer** | CashDrawerSession | GET/POST/PATCH | Open/close/reconcile + discrepancy |
| 20 | **Printers** | Printer, PrintJob | GET/POST/PATCH/DELETE + print + seed | ESC/POS receipt + kitchen + station routing |
| 21 | **Notifications** | Notification | GET/POST/PATCH + helper | 9 templates (SMS/email/push/in_app) |
| 22 | **Expenses & P&L** | ExpenseCategory, Expense | GET/POST/PATCH/DELETE + pnl + seed | Stroški + Profit & Loss |
| 23 | **Reports** | — | GET | 5 agregirana poročila (sales/labor/inventory/tables) |
| 24 | **Settings** | RestaurantSettings, BusinessHours | GET/PATCH + seed | DDV, delovni čas, FURS, receipt |
| 25 | **Audit** | AuditLog | GET/POST + helper | FURS compliance + entity trail |
| 26 | **Export** | — | GET | 11 CSV tipov za računovodstvo/FURS |
| 27 | **System** | — | health + dashboard/stats + index | Health check + Command Center + API docs |

### 🔐 Authentication (PIN-based + JWT + RBAC)

```bash
# Login s 4-digit PIN
POST /api/auth/login
{ "pin": "1234", "device": "POS-iPad" }
# Returns: { token, staff: { name, role, permissions } }

# Protected routes require:
Authorization: Bearer <token>
```

**6 role-ov z permissions:**
- **manager** — full access (`*.*`)
- **server** — orders, tables, reservations, customers, payments
- **cook** — KDS (view+update), inventory (read)
- **bartender** — orders, tables, payments, KDS
- **dishwasher** — KDS (read only)
- **sommelier** — orders, tables, customers, inventory

### 📊 P&L (Profit & Loss)

```bash
GET /api/expenses/pnl?month=7&year=2026
```

Celovit finančni izpavek:
- **Revenue** (od paid Orders) — netRevenue, VAT, tips, byChannel
- **COGS** (od InventoryTransactions) — foodCost, waste, adjustments
- **Gross Profit** — Revenue - COGS z margin %
- **Labor Cost** (od Shifts) — cost, hours, laborPct
- **Operating Expenses** (od Expense model) — byCategory, deliveryCommissions, paymentFees
- **Prime Cost** — COGS + Labor z benchmark (healthy/warning/critical)
- **Net Profit** z benchmark (excellent/good/fair/poor)

### 📡 WebSocket (mini-service na portu 3003)

Real-time komunikacija z typed events in room-based routing:
- **KDS Rooms**: `kds:all`, `kds:hot`, `kds:cold`, `kds:bar`, `kds:dessert`
- **POS Room**: `pos:all`
- **Dashboard**: `dashboard`

### 🖨️ ESC/POS Printing

```bash
# Print receipt (auto-route to receipt printer)
POST /api/printers/print
{ "type": "receipt", "orderId": "xxx" }

# Print kitchen order (auto-detect stations, separate job per station!)
POST /api/printers/print
{ "type": "kitchen_order", "orderId": "xxx" }
```

### 📤 Data Export (11 CSV tipov)

```bash
GET /api/export?type=orders&from=2026-01-01&to=2026-12-31
# Returns: CSV file download (Content-Type: text/csv)
```

Tipi: orders, z_reports, inventory, customers, staff_shifts, payments, tips, audit, purchase_orders, reservations, gift_cards

---

## Landing page

### 🎨 33 sekcij z 48 komponentami

Hero · Live ticker · Stats bar · Trust bar · Security · Multi-location · Sustainability · Command Center · Payments · Loyalty · Allergens · Promotions · Gift Cards · Inventory · Delivery · QR Ordering · AI Prediction · Menu Engineering · Staff · Reservations · Integrations · Onboarding · Support · Roadmap · Product Tour · Comparison · Interface · Testimonials · Case Studies · ROI · Z-Report · Email Capture · Pricing · FAQ · Decision Hub · Section Dots

**16 vizualnih efektov**: gradient mesh, glassmorphism, card-tilt 3D, animated gradient text, stagger, dark mode, parallax, cursor glow, magnetic buttons, shimmer, glow-pulse, live ticker, living dashboard, social proof toast, weather widget, cookie consent

---

## Hitri začetek

### Zahteve

- Node.js 18+ ali Bun
- npm/bun/yarn

### Namestitev

```bash
git clone https://github.com/markec12345678/noro-lep-pos-2026.git
cd noro-lep-pos-2026
bun install

# Database
bun run db:push

# Seed podatki
curl -X POST http://localhost:3000/api/tables/seed
curl -X POST http://localhost:3000/api/menu/seed
curl -X POST http://localhost:3000/api/settings/seed
curl -X POST http://localhost:3000/api/expenses/seed
curl -X POST http://localhost:3000/api/printers/seed

# Set PIN za staff (prvi login)
# Najprej ustvari staff, nato nastavi PIN preko DB ali API-ja

# Zaženi dev server
bun run dev
```

Aplikacija teče na `http://localhost:3000`.

### WebSocket (mini-service)

```bash
cd mini-services/pos-realtime
bun install
bun run dev  # Port 3003
```

### API pregled

```bash
# Seznam vseh API-jev
curl http://localhost:3000/api

# Health check
curl http://localhost:3000/api/health

# Unified dashboard (Command Center)
curl http://localhost:3000/api/dashboard/stats

# P&L (Profit & Loss)
curl "http://localhost:3000/api/expenses/pnl?month=7&year=2026"
```

---

## API dokumentacija

### Orders

```bash
# Ustvari nov order (auto stock deduction + auto table occupied)
POST /api/orders
{ "tableNumber": 5, "channel": "dine_in", "serverName": "Maja K.",
  "items": [{ "itemName": "Čevapi", "qty": 2, "unitPrice": 14.50, "taxRate": 22 }] }

# Posodobi status (KDS flow + payment + tip)
PATCH /api/orders
{ "id": "xxx", "status": "paid", "paymentMethod": "card", "tip": 5 }
```

### KDS (Kitchen Display)

```bash
# KDS board z active orders
GET /api/kds
GET /api/kds?station=hot

# Item lifecycle: new → preparing → ready → served
PATCH /api/kds
{ "itemId": "xxx", "action": "start" }   # → preparing
{ "itemId": "xxx", "action": "done" }    # → ready
{ "itemId": "xxx", "action": "serve" }   # → served
```

### Customer & Loyalty

```bash
# Earn točke (auto tier upgrade!)
PATCH /api/customers
{ "id": "xxx", "action": "earn", "amount": 520 }  # → silver tier + 50 bonus
```

### P&L

```bash
GET /api/expenses/pnl?month=7&year=2026
# Revenue, COGS, Gross Profit, Labor, OpEx, Net Profit z benchmarki
```

---

## Tehnologije

| Kategorija | Tehnologija |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Jezik** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Animacije** | Framer Motion |
| **Database** | Prisma ORM + SQLite |
| **Real-time** | Socket.io (mini-service, port 3003) |
| **Auth** | PIN-based + JWT + RBAC (jsonwebtoken) |
| **Plačila** | Stripe SDK |
| **Printing** | ESC/POS (receipt-builder lib) |
| **SEO** | Dynamic sitemap.ts + robots.ts + JSON-LD |
| **Icons** | Lucide React |

---

## Struktura projekta

```
noro-lep-pos-2026/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (33 sekcij, ~7400 vrstic)
│   │   ├── layout.tsx            # Root layout z metadata + JSON-LD
│   │   ├── globals.css           # Tailwind + CSS variables + a11y
│   │   ├── sitemap.ts            # Dynamic sitemap
│   │   ├── robots.ts             # Dynamic robots.txt
│   │   └── api/                  # 55 API routes (27 sistemov)
│   │       ├── auth/             # login, me, logout, set-pin
│   │       ├── orders/           # CRUD + auto stock + tip
│   │       ├── tables/           # CRUD + seed
│   │       ├── reservations/     # CRUD + auto table
│   │       ├── waitlist/         # Auto-renumber + SMS
│   │       ├── staff/            # CRUD + PIN + RBAC
│   │       ├── shifts/           # Scheduling + clock in/out
│   │       ├── kds/              # Kitchen board + station routing
│   │       ├── z-report/         # FURS + VAT breakdown
│   │       ├── inventory/        # Items + transactions + delivery
│   │       ├── purchase-orders/  # Supply chain + auto stock
│   │       ├── suppliers/        # CRUD
│   │       ├── menu/             # Categories + items + modifiers
│   │       ├── customers/        # CRM + loyalty + auto tier
│   │       ├── promotions/       # CRUD + auto-apply
│   │       ├── gift-cards/       # Issue/redeem/reload
│   │       ├── bill-split/       # Equal/items/custom
│   │       ├── tips/             # 3 pool tipi + approval
│   │       ├── payments/         # Stripe webhook + list
│   │       ├── cash-drawer/      # Open/close/reconcile
│   │       ├── printers/         # ESC/POS + station routing
│   │       ├── notifications/    # 9 templates
│   │       ├── expenses/         # CRUD + P&L + seed
│   │       ├── reports/          # 5 agregirana poročila
│   │       ├── settings/         # DDV, delovni čas, FURS
│   │       ├── audit/            # Entity trail + stats
│   │       ├── export/           # 11 CSV tipov
│   │       ├── health/           # System status
│   │       ├── dashboard/        # Command Center + overview
│   │       └── route.ts          # API Index (27 sistemov)
│   ├── components/ui/            # shadcn/ui komponente
│   ├── hooks/                    # Custom hooks
│   └── lib/
│       ├── db.ts                 # Prisma client
│       ├── auth.ts               # PIN login + JWT + RBAC
│       ├── audit.ts              # Audit log helper
│       ├── notifications.ts      # Notification templates + sender
│       ├── receipt-builder.ts    # ESC/POS receipt/kitchen builder
│       ├── stripe.ts             # Stripe integration
│       ├── ai-prediction.ts      # AI prediction logic
│       ├── delivery.ts           # Delivery logic
│       ├── analytics.ts          # Analytics tracking
│       ├── seed-data.ts          # Seed data
│       └── utils.ts              # Utilities
├── prisma/
│   └── schema.prisma             # 40 Prisma modelov
├── mini-services/
│   ├── pos-realtime/             # WebSocket (socket.io, port 3003)
│   ├── furs-service/             # FURS integration
│   └── pos-public/               # Public API
├── public/
│   ├── pos-brand/                # AI-generirane slike
│   ├── og/                       # Open Graph image
│   └── manifest.json             # PWA manifest
├── .github/                      # CI/CD, Issue/PR templates
└── package.json
```

---

## Prispevanje

Prispevki so dobrodošli! Preberi [CONTRIBUTING.md](CONTRIBUTING.md) za smernice.

```bash
git checkout -b feature/nova-funkcija
bun run lint
git commit -m "feat: opis nove funkcije"
git push origin feature/nova-funkcija
```

---

## Licenca

MIT License — glej [LICENSE](LICENSE).

---

<div align="center">

**Zgrajeno v Sloveniji** 🇸🇮 z ❤️

40 Prisma modelov · 55 API routes · 27 sistemov · 11 lib datotek · 33 sekcij · 48 komponent · 16 vizualnih efektov · WebSocket · ESC/POS · PIN auth + RBAC · P&L · 7400+ vrstic TypeScript

[🌐 Spletna stran](https://norolep-pos.si) · [📧 Kontakt](mailto:info@norolep-pos.si) · [🐛 Prijavi napako](https://github.com/markec12345678/noro-lep-pos-2026/issues) · [📚 API docs](https://norolep-pos.si/api)

</div>
