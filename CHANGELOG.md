# Changelog

Vse pomembne spremembe v projektu Noro Lep POS so dokumentirane tukaj.

Format temelji na [Keep a Changelog](https://keepachangelog.com/sl/1.0.0/),
in projekt sledi [Semantic Versioning](https://semver.org/lang/sl/).

## [Unreleased]

### Načrtovano
- i18n z next-intl (dejavni prevodi SLO/EN/DE/IT)
- Realni customer logotipi
- Hardware showcase sekcija
- Video testimonials
- Stripe payment integracija
- WebSocket za multi-user sync

## [3.2.0] — 2026-06-30

### Dodano
- ✨ POS natakar modularni layout (color-coded sekcije, F1-F9 shortcuts, TOP badges)
- ✨ Gost view promo tiles (banner, POPULARNO ribbons, strike-through cene)
- ✨ Language switcher SLO/EN/DE/IT v header z dropdown
- ✨ Video demo modal z animate-ping play button
- ✨ PWA manifest.json (namestitev na domači zaslon)
- ✨ appleWebApp meta tags

### Spremenjeno
- ♻️ POS natakar: 6.3 → 8.0/10 (VLM ocena)
- ♻️ Hero CTA: "Poskusi demo" → "Oglej si demo (2 min)" z modal

## [3.1.0] — 2026-06-30

### Dodano
- ✨ Competition comparison sekcija (Noro Lep vs Toast/Square/Lightspeed/Shopify)
- ✨ 11 funkcij primerjanih v tabeli
- ✨ 3 key win cards (FURS, Real-time sync, Slovenski jezik)
- ✨ "Primerjava" navigacijski link

### Spremenjeno
- 📈 VLM full page: 8/10 → 9/10

## [3.0.0] — 2026-06-30

### Dodano
- 🎉 Interaktivni ROI kalkulator (3 drsniki, real-time izračun prihranka)
- ✨ Real-time sync med 4 moduli (POS → KDS → Mize → Analitika)
- ✨ Live sync status bar z pulsing indikatorjem
- ✨ Badge counter-ji na tab-ih (št. novih naročil, zasedenih miz)
- ✨ 4-module Product Tour (POS, KDS, Tables, Analytics)
- ✨ Recharts integracija (Area, Bar, Pie chart-i)
- ✨ AI slike jedi (6 jedi: pizza, čevapi, burger, rižota, kava, tiramisu)
- ✨ Hero z AI lifestyle sliko + 3 floating cards
- ✨ Animated stats bar z framer-motion useInView
- ✨ Interface comparison sekcija (4 VLM primerjave z screenshoti)
- ✨ Honest verdict card z badges

### VLM ocene
- Hero: 9/10 (presega Square v lokalni relevantnosti)
- KDS: 9/10 (zmaga vs Lightspeed)
- Tables: 8.5/10 (zmaga vs TouchBistro)
- Full page: 9/10

## [2.0.0] — 2026-06-29

### Dodano (Vite + Cockpit CMS verzija)
- 30+ pages (Dashboard, POS, Kitchen, Tables, Orders, Reports, etc.)
- 22+ services (orderService, menuService, fiscalService, etc.)
- 8 hooks (useSocket, useRealtimeSync, useKitchenTickets, etc.)
- 3 mini-services (pos-realtime, furs-service, pos-public)
- FURS compliance (ZOI, EOR, QR codes)
- EU FIC 1169/2011 (14 mandatory allergens)
- RBAC (3 roles: manager/waiter/chef)
- Dark mode
- Code splitting (82% smaller initial bundle)
- Thermal printer CSS (80mm ESC/POS)
- Keyboard shortcuts (F1-F3, Enter, Esc)

## [1.0.0] — 2026-06-28

### Dodano
- 🎉 Initial release
- Vite 5 + React 18 + TypeScript 5
- Tailwind CSS 3 + shadcn/ui
- Cockpit CMS backend (PHP 8.3 + SQLite)
- Osnovni POS functionality
- Menu management
- Table management
- Order management

---

## Tipi sprememb

- `🎉` — Initial release
- `✨` — Nova funkcija
- `♻️` — Refaktoriranje
- `📈` — Performance izboljšava
- `🐛` — Popravljena napaka
- `🔒` — Varnostna popravka
- `📦` — Dependency update
- `📝` — Dokumentacija
- `🎨` — UI/UX izboljšava
- `🚀` — Deployment
- `❌` — Odstranjeno
