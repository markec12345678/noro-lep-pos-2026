# Changelog

Vse pomembne spremembe v projektu Noro Lep POS so dokumentirane tukaj.

Format temelji na [Keep a Changelog](https://keepachangelog.com/sl/1.0.0/),
in projekt sledi [Semantic Versioning](https://semver.org/lang/sl/).

## [Unreleased]

### Načrtovano
- Hosting (Vercel / self-hosted)
- Custom domain (norolep-pos.si)
- Realni customer logotipi
- i18n z next-intl (dejavni prevodi SLO/EN/DE/IT)
- WebSocket za multi-user sync

## [4.3] — 2026-07-01

### Dodano
- ✨ Unified Command Center — 7 sistemov na enem zaslonu (dark, live, pulsing)
  * POS (revenue + sparkline), KDS (3-column status), Mize (dots), Dostava, AI, Plačila, Zaloge
  * System Health bar (score, uptime, alerts, live clock)
  * Real-time sync indicator
  * Auto-refresh vsakih 15s
- ✨ Navigacija posodobljena z 7 sekcijami (Dashboard, Zaloge, Placila, Dostava, AI, Cene, FAQ)
- ✨ Sitemap.xml posodobljen z vsemi novimi sekcijami

### Spremenjeno
- 📈 VLM full page: 9/10 ("one of the most thorough POS landing pages")
- 📈 VLM mobile: 9/10 ("excellent mobile UX")

## [4.2] — 2026-07-01

### Dodano
- ✨ Delivery integracija — Wolt, Uber Eats, Glovo, Lastmin, QR
  * 5 platform z provizijami (12%, 15%, 10%, 8%, 0%)
  * Live feed (auto-refresh 10s)
  * Auto-accept toggle
  * Status workflow (new → accepted → preparing → ready → picked_up)
  * Commission tracking (bruto vs neto)
  * "Simuliraj naročilo" gumb
- ✨ `/api/delivery/orders` (GET + POST)

## [4.1] — 2026-07-01

### Dodano
- ✨ AI predikcija zalog — trend detection + samodejne dobavnice
  * Trend detection: rising, falling, stable, seasonal (vikend spike)
  * Demand prediction (povprečje + trend + sezonskost)
  * Confidence calculation (CV-based, 50-95%)
  * Days until stockout
  * Reorder suggestion (demand + 30% safety stock)
  * Urgency: critical, high, medium, low, none
  * AI reasoning (human-readable)
- ✨ `/api/ai/predict` (GET) — 10 artiklov z mock prodajo
- ✨ AIPredictionSection — toggle med Predikcije in Dobavnica

## [4.0] — 2026-06-30

### Dodano
- ✨ Stripe contactless plačila — Apple Pay, Google Pay, kartica, NFC, gotovina
  * Demo mode (brez STRIPE_SECRET_KEY)
  * Production mode (pravi Stripe API)
  * PaymentModal z 5 metodami + processing + success/demo states
  * PaymentsSection z 6 method karticami + trust badges
- ✨ `/api/payments/create-intent` (GET + POST)
- ✨ Stripe SDK (stripe@22.3.0 + @stripe/stripe-js@9.8.0)

### Trend pokrit
- $90.6B contactless payment market (15.4% CAGR)

## [3.9] — 2026-06-30

### Dodano
- ✨ InventoryPreview sekcija — 232 artiklov prikazanih na landing page
  * Stats bar (skupaj, kategorij, nizka zaloga, vrednost)
  * Search input (real-time)
  * Category filter chips (19 kategorij)
  * Low stock filter toggle
  * Scrollable grid z ZALOGA 0 badges

## [3.8] — 2026-06-30

### Dodano
- ✨ Inventory CRUD — ročni vnos, posodobitev, brisanje artiklov
  * POST /api/inventory/items — ročni vnos (validacija, prepreči duplikate)
  * PUT /api/inventory/items/[id] — posodobitev
  * DELETE /api/inventory/items/[id] — soft/hard delete
  * 12 E2E testov (CRUD, duplikati, filtri, delivery)

## [3.7] — 2026-06-30

### Dodano
- ✨ 232 slovenskih artiklov v 19 kategorijah (zaloga=0)
  * Predjedi, Juhé, Solate, Mesne jedi, Ribe, Vegetarijanske
  * Pice, Testenine, Priloge, Sladice, Tople pijače
  * Brezalkoholne, Pivo, Vino, Žgane pijače, Koktajli
  * Embalaža, Pribor, Čistila
- ✨ 6 dobaviteljev (Hofer, Metro, Mercator, Jata, Laško, Brda)
- ✨ InventoryItem + Supplier model v Prisma schema
- ✨ /api/inventory/seed, /api/inventory/list, /api/inventory/delivery

## [3.6] — 2026-06-30

### Dodano
- ✨ OG social image (1344x768, AI-generated)
- ✨ LAUNCH.md — Reddit, Slo-Tech, Product Hunt, Twitter, email posts

## [3.5] — 2026-06-30

### Dodano
- ✨ Privacy-friendly analytics (GDPR-compliant, no cookies)
  * src/lib/analytics.ts — localStorage, no PII, no fingerprinting
  * /api/analytics — event receiver + aggregator
  * useAnalytics hook — auto-tracking (page_view, section_view, scroll_depth)
  * data-track delegation za CTA gumbe
- ✨ 7 E2E testov za analytics

## [3.4] — 2026-06-30

### Dodano
- ✨ JSON-LD structured data (Organization, SoftwareApplication, WebSite, FAQPage)
- ✨ Sitemap.xml z hreflang alternates
- ✨ Skip-to-content link (a11y)
- ✨ ARIA labels + focus rings
- ✨ Mobile hamburger menu
- ✨ lang="sl-SI" na html

## [3.3] — 2026-06-30

### Dodano
- ✨ ScrollProgressBar (emerald gradient)
- ✨ TrustBar (6 certifikatov: FURS, GDPR, ISO 27001, 99.9% SLA, PCI DSS, AI)
- ✨ BackToTop floating button

## [3.2] — 2026-06-30

### Dodano
- ✨ POS natakar modularni layout (color-coded, F1-F9 shortcuts)
- ✨ Gost view promo tiles (banner, POPULARNO ribbons, strike-through)
- ✨ Language switcher SLO/EN/DE/IT
- ✨ Video demo modal
- ✨ PWA manifest

## [3.1] — 2026-06-30

### Dodano
- ✨ Competition comparison table (vs Toast/Square/Lightspeed/Shopify)
- ✨ Interface comparison (4 VLM primerjave z screenshoti)

## [3.0] — 2026-06-30

### Dodano
- 🎉 Interaktivni ROI kalkulator (3 drsniki, real-time izračun)
- ✨ Real-time sync med 4 moduli (POS → KDS → Mize → Analitika)
- ✨ 4-module Product Tour (POS, KDS, Tables, Analytics)
- ✨ Recharts integracija (Area, Bar, Pie)
- ✨ AI slike jedi (6 jedi)
- ✨ Hero z AI lifestyle + floating cards
- ✨ Animated stats bar
- ✨ Playwright E2E test suite (28 testov)

## [2.0] — 2026-06-29

### Dodano (Vite + Cockpit CMS verzija)
- 30+ pages, 22+ services, 8 hooks, 3 mini-services
- FURS compliance, EU FIC 1169/2011, RBAC, dark mode, code splitting

## [1.0] — 2026-06-28

### Dodano
- 🎉 Initial release (Vite 5 + React 18 + Cockpit CMS)
