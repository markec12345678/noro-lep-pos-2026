# Noro Lep POS — Najlepša slovenska restavracijska blagajna 2026

> AI-poganjana POS blagajna z avtomatskim FURS, AI predikcijo prometa, kuhinjskim zaslonom (KDS), real-time WebSocket sync in 31 Prisma modeli. Zgrajena z ljubeznijo za slovenske gostince. 🇸🇮

[![Version](https://img.shields.io/badge/Version-9.0-blue?style=flat-square)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Socket.io](https://img.shields.io/badge/Socket.io-realtime-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📋 Kazalo

- [Pregled](#pregled)
- [Backend POS sistem](#backend-pos-sistem)
- [Landing page](#landing-page)
- [Ključne funkcije](#ključne-funkcije)
- [Hitri začetek](#hitri-zacetek)
- [Tehnologije](#tehnologije)
- [Struktura projekta](#struktura-projekta)
- [API dokumentacija](#api-dokumentacija)
- [Prispevanje](#prispevanje)
- [Licenca](#licenca)

---

## Pregled

**Noro Lep POS** je najlepša slovenska restavracijska blagajna zgrajena na Next.js 16. Vključuje **celovit backend POS sistem** z 31 Prisma modeli, 36 API routes in real-time WebSocket komunikacijo.

### 🎯 Zakaj Noro Lep?

- ✅ **FURS ZDavP-2P 2025** — avtomatski ZOI, EOR, QR koda, Z-Report
- ✅ **AI predikcija** — promet, zaloge, menu engineering, weather-aware
- ✅ **Real-time WebSocket** — POS → KDS → Dashboard v realnem času
- ✅ **31 Prisma modelov** — Orders, Tables, Reservations, Staff, Customers, Promotions, Gift Cards, Menu, Tips, Payments, Audit Log
- ✅ **Slovenski jezik** — native SLO podpora z lokalnim kontekstom
- ✅ **Offline-first** — deluje brez interneta, sinhronizira ko je povezava nazaj
- ✅ **GDPR compliant** — cookie consent, audit log, data masking

---

## Backend POS sistem

Celovit POS backend z **real DB persistence** (Prisma + SQLite), ne le mock podatki.

### 🗄️ 31 Prisma modelov

| Sistem | Modeli | Ključna funkcionalnost |
|---|---|---|
| **Orders** | Order, OrderItem | CRUD + auto stock deduction + tip |
| **Tables** | Table | CRUD + auto status (free/occupied/reserved/payment) |
| **Reservations** | Reservation | CRUD + auto table release + Customer link |
| **Waitlist** | Waitlist | Auto-renumber + SMS notify + AI wait estimate |
| **Staff** | Staff, Shift, Attendance | Scheduling + clock in/out + labor cost tracking |
| **Z-Report** | ZReport | FURS dnevno zaključevanje + VAT breakdown |
| **Inventory** | InventoryItem, InventoryTransaction | Stock movements + auto deduction na order |
| **Bill Split** | BillSplit, BillSplitShare | Equal / items / custom delitev + auto paid |
| **Customer** | Customer, LoyaltyTransaction | CRM + točke + auto tier (bronze→silver→gold) |
| **Promotions** | Promotion, PromotionUsage | Happy hour / BOGO / coupon + auto-apply + ROI |
| **Gift Cards** | GiftCard, GiftCardTransaction | Issue / redeem / reload + audit trail |
| **Menu** | MenuCategory, MenuItem, MenuItemModifier | Kategorije + artikli + modifierji + allergens |
| **Tips** | TipDistribution | 3 pool tipi (individual/shared/pooled) + approval |
| **Payments** | Payment | Stripe webhook → auto order paid + loyalty earn |
| **Settings** | RestaurantSettings, BusinessHours | DDV stopnje, delovni čas, FURS, receipt config |
| **Audit** | AuditLog | FURS compliance + entity trail + security |
| **Reports** | — | Agregacija vseh POS podatkov v BI poročila |

### 🔌 36 API routes

```
src/app/api/
├── orders/              GET, POST, PATCH (CRUD + auto stock + tip)
├── tables/              GET, POST, PATCH + seed
├── reservations/        GET, POST, PATCH, DELETE
├── waitlist/            GET, POST, PATCH (auto-renumber)
├── staff/               GET, POST, PATCH, DELETE
├── shifts/              GET, POST, PATCH (clock in/out + labor cost)
├── z-report/            GET, POST, PATCH (FURS + VAT breakdown)
├── inventory/
│   ├── items/           GET, POST, PATCH, DELETE
│   ├── list/            GET
│   ├── transactions/    GET, POST (stock movements)
│   ├── delivery/        POST
│   └── seed/            POST
├── reports/             GET (agregacija vseh — sales/labor/inventory/tables)
├── bill-split/          GET, POST, PATCH (equal/items/custom)
├── customers/           GET, POST, PATCH (CRM + loyalty earn/redeem)
├── promotions/
│   ├── route.ts         GET, POST, PATCH, DELETE
│   └── apply/           POST (auto-apply na order items)
├── gift-cards/          GET, POST, PATCH (issue/redeem/reload)
├── menu/
│   ├── route.ts         GET, POST, PATCH, DELETE
│   └── seed/            POST
├── tips/                GET, POST, PATCH (pool + approval)
├── payments/
│   ├── create-intent/   POST (Stripe)
│   ├── webhook/         POST (Stripe → auto order paid)
│   └── list/            GET (payment history + stats)
├── kds/                 GET, PATCH (kitchen board + item lifecycle)
├── settings/            GET, PATCH + seed (DDV, delovni čas, FURS)
├── audit/               GET, POST (entity trail + stats)
├── leads/               GET, POST (email capture + GDPR)
├── analytics/           POST
├── dashboard/overview/  GET
├── ai/predict/          GET
└── delivery/orders/     GET
```

### 📡 WebSocket (mini-service na portu 3003)

Real-time komunikacija z **typed events** in **room-based routing**:

- **KDS Rooms**: `kds:all`, `kds:hot`, `kds:cold`, `kds:bar`, `kds:dessert`
- **POS Rooms**: `pos:all`
- **Dashboard**: `dashboard`

Eventi: `kds:new_order`, `kds:station_order` (auto station routing), `kds:item_status`, `pos:order_paid`, `pos:table_status`, `dashboard:kpis`

### 📊 Reports API — 5 agregiranih poročil

1. **Sales**: revenue, orders, avgCheck, top 10 items, channel/payment breakdown, hourly distribution
2. **Labor**: shifts, hours, labor cost, laborPct, staff performance
3. **Inventory**: total value, low stock, transactions summary
4. **Tables**: occupancy rate, revenue per table
5. **Reservations + Z-Reports**: summary stats

---

## Landing page

### 🎨 33 sekcij z 48 komponentami

**Hero** z AI sliko · **Live sales ticker** · **Stats bar** · **Trust bar** (FURS ZDavP-2P) · **Security & compliance** (AES-256, MFA, RBAC) · **Multi-location & mobile** · **Sustainability** (CO₂ tracking) · **Command Center** (living dashboard) · **Payments** · **Loyalty & CRM** · **Allergen & compliance** (14 alergenov) · **Promotions** (Happy Hour, BOGO) · **Gift Cards** · **Inventory** · **Delivery** (Wolt/Glovo/Uber Eats) · **QR Ordering & Kiosk** · **AI Prediction** (weather-aware) · **Menu Engineering** (4 kvadranti) · **Staff & Shift** · **Reservations** (3 tabi) · **Integrations** (24+) · **Onboarding Wizard** (5 korakov) · **Support & Training** · **Roadmap & Changelog** · **Product Tour** (4 moduli) · **Competition Comparison** (slovenske blagajne) · **Interface Comparison** (VLM) · **Testimonials** · **Case Studies** · **ROI Kalkulator** · **Z-Report** · **Email Capture** (lead magnet) · **Pricing** · **FAQ** · **Decision Hub** · **Section Dots Navigator**

**16 vizualnih efektov**: gradient mesh, glassmorphism, card-tilt 3D, animated gradient text, stagger, dark mode toggle, parallax hero, cursor glow, magnetic buttons, shimmer, glow-pulse, live ticker, living dashboard, social proof toast, weather widget, cookie consent

---

## Ključne funkcije

### 🖥️ 4 moduli z real-time sync

| Modul | Opis | VLM ocena |
|-------|------|-----------|
| **POS Blagajna** | Natakar (TEXT gumbi) + Gost (SLIKE artiklov) | 8/10 |
| **Kuhinja (KDS)** | 3-column kanban z station routing | **9/10** 🏆 |
| **Mize** | Tloris restavracije z 12 mizami, 4 statusi | **8.5/10** 🏆 |
| **Analitika** | AI dashboard z grafi, KPI, menu engineering | 8/10 |

---

## Hitri začetek

### Zahteve

- Node.js 18+ ali Bun
- npm/bun/yarn

### Namestitev

```bash
# Kloniraj repo
git clone https://github.com/markec12345678/noro-lep-pos-2026.git
cd noro-lep-pos-2026

# Namesti odvisnosti
bun install

# Zaženi dev server
bun run dev
```

Aplikacija teče na `http://localhost:3000`.

### Database (Prisma + SQLite)

```bash
# Push schema v SQLite
bun run db:push

# Seed testne podatke (mize, meni, nastavitve)
curl -X POST http://localhost:3000/api/tables/seed
curl -X POST http://localhost:3000/api/menu/seed
curl -X POST http://localhost:3000/api/settings/seed
```

### WebSocket (mini-service)

```bash
cd mini-services/pos-realtime
bun install
bun run dev  # Port 3003
```

---

## Tehnologije

| Kategorija | Tehnologija |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Jezik** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Animacije** | Framer Motion |
| **Grafi** | Recharts |
| **Database** | Prisma ORM + SQLite |
| **Real-time** | Socket.io (mini-service, port 3003) |
| **Plačila** | Stripe SDK |
| **Auth** | NextAuth.js v4 (available) |
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
│   │   ├── sitemap.ts            # Dynamic sitemap (Next.js native)
│   │   ├── robots.ts             # Dynamic robots.txt
│   │   └── api/                  # 36 API routes (POS backend)
│   ├── components/ui/            # shadcn/ui komponente
│   ├── hooks/                    # Custom hooks
│   └── lib/
│       ├── db.ts                 # Prisma client (dev/prod logging)
│       ├── audit.ts              # Audit log helper
│       ├── stripe.ts             # Stripe integration
│       ├── ai-prediction.ts      # AI prediction logic
│       ├── delivery.ts           # Delivery logic
│       ├── analytics.ts          # Analytics tracking
│       ├── seed-data.ts          # Seed data
│       └── utils.ts              # Utilities
├── prisma/
│   └── schema.prisma             # 31 Prisma modelov
├── mini-services/
│   ├── pos-realtime/             # WebSocket (socket.io, port 3003)
│   ├── furs-service/             # FURS integration
│   └── pos-public/               # Public API
├── public/
│   ├── pos-brand/                # AI-generirane slike
│   ├── pos-demo/                 # Demo screenshots
│   ├── og/                       # Open Graph image
│   └── manifest.json             # PWA manifest
├── .github/                      # CI/CD, Issue/PR templates
└── package.json
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

# Filtriraj po statusu
GET /api/orders?status=paid
```

### KDS (Kitchen Display)

```bash
# KDS board z active orders
GET /api/kds
GET /api/kds?station=hot    # samo vroča postaja

# Item lifecycle: new → preparing → ready → served
PATCH /api/kds
{ "itemId": "xxx", "action": "start" }   # → preparing
{ "itemId": "xxx", "action": "done" }    # → ready
{ "itemId": "xxx", "action": "serve" }   # → served
```

### Customer & Loyalty

```bash
# Ustvari gosta
POST /api/customers
{ "firstName": "Maja", "lastName": "Kralj", "phone": "+38641234567" }

# Earn točke (auto tier upgrade)
PATCH /api/customers
{ "id": "xxx", "action": "earn", "amount": 520 }  # → silver tier + 50 bonus

# Redeem točke
PATCH /api/customers
{ "id": "xxx", "action": "redeem", "points": 200 }
```

### Promotions (auto-apply)

```bash
# Apply promocije na items (stackable)
POST /api/promotions/apply
{ "items": [{ "itemName": "Pizza", "qty": 2, "unitPrice": 11, "category": "pice" }],
  "code": "NOVO10", "orderTime": "2026-07-03T17:00:00" }
# Returns: originalTotal, discountAmount, finalTotal, appliedPromotions[]
```

### Z-Report (FURS)

```bash
# Generiraj dnevni Z-report iz paid orders
POST /api/z-report
{ "date": "2026-07-03", "cashier": "Maja K." }
# Auto: subtotal, tax, VAT breakdown (22%/9.5%/5%), payment breakdown

# Zaključi (FURS EOR/ZOI)
PATCH /api/z-report
{ "id": "xxx", "action": "close", "fursEOR": "EOR-xxx", "fursZOI": "ZOI-xxx" }
```

### Reports

```bash
# Dnevno poročilo (vsi sistemi agregirani)
GET /api/reports?range=today

# Tedensko
GET /api/reports?range=week

# Samo prodaja
GET /api/reports?type=sales&range=month
```

---

## Prispevanje

Prispevki so dobrodošli! Preberi [CONTRIBUTING.md](CONTRIBUTING.md) za smernice.

```bash
# Fork + clone
git checkout -b feature/nova-funkcija

# Preveri kodo
bun run lint

# Commit z conventional commits
git commit -m "feat: opis nove funkcije"

# Push + Pull Request
git push origin feature/nova-funkcija
```

---

## Licenca

MIT License — glej [LICENSE](LICENSE).

---

<div align="center">

**Zgrajeno v Sloveniji** 🇸🇮 z ❤️

31 Prisma modelov · 36 API routes · 33 sekcij · 48 komponent · 16 vizualnih efektov · WebSocket real-time · 7400+ vrstic TypeScript

[🌐 Spletna stran](https://norolep-pos.si) · [📧 Kontakt](mailto:info@norolep-pos.si) · [🐛 Prijavi napako](https://github.com/markec12345678/noro-lep-pos-2026/issues)

</div>
