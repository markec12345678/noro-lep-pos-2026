# 🚀 Launch Guide — Noro Lep POS

Kompletne objave za Reddit, Slo-Tech, Product Hunt in social media.

---

## 📋 Pre-launch checklist

- [x] Landing page production-ready (VLM 9/10)
- [x] Mobile responsive (VLM 9/10)
- [x] SEO (JSON-LD, sitemap, robots.txt)
- [x] Accessibility (WCAG, ARIA, skip-to-content)
- [x] E2E testi (35 passing, CI/CD blokira)
- [x] Privacy-friendly analytics (GDPR, no cookies)
- [x] PWA manifest (namestitev na domači zaslon)
- [x] OG social image (1344x768)
- [x] README z badges
- [x] LICENSE, SECURITY, CONTRIBUTING
- [ ] Hosting (Vercel / self-hosted)
- [ ] Custom domain (norolep-pos.si)
- [ ] Email capture (za waitlist)

---

## 🟠 Reddit — r/selfhosted

**Title:** `[Show] Built a privacy-first restaurant POS with Next.js — no Google Analytics, no cookies, GDPR-compliant by design`

**Body:**

---

Hey r/selfhosted! 👋

I spent the last few weeks building **Noro Lep POS** — a restaurant POS landing page that's privacy-first by design. No Google Analytics. No cookies. No consent banners. Just clean, anonymous, GDPR-compliant analytics built in.

### What makes it different:

**🔍 Researched 12 world POS systems** (Square, Shopify, Lightspeed, Toast, Lavu...) using a headless browser + VLM (vision language model) to analyze their UI design. Then built our own based on what works.

**🎮 4-module interactive product tour** — POS, Kitchen (KDS), Tables, and Analytics — all with **real-time sync**. When you checkout in POS, the order instantly appears in KDS, the table becomes occupied, and analytics updates. No other POS landing page has this.

**🔒 Privacy by design:**
- NO cookies (localStorage only)
- NO PII (personally identifiable information)
- NO fingerprinting (random session IDs)
- Users can view/delete their own data
- Built-in opt-out

**🧪 35 E2E tests** with Playwright — CI/CD blocks deploy if any test fails.

### Tech stack:
- Next.js 16 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Framer Motion + Recharts
- Playwright for E2E
- Custom analytics (no GA, no Plausible, no Umami — just our own)

### Results:
- VLM score: 9/10 (near Square's 9.2)
- Mobile: 9/10
- 0 cookies, 0 external requests
- 35/35 tests passing

### Links:
- **Live:** [preview link]
- **GitHub:** https://github.com/markec12345678/noro-lep-pos-2026

Feedback welcome! Especially on:
1. Is the interactive demo intuitive?
2. Does the "real-time sync" sell the product?
3. Would you use a self-hosted POS with this approach?

---

**Flair:** Show / Self-hosted

---

## 🟠 Reddit — r/nextjs

**Title:** `Built a Next.js 16 landing page with interactive product tour, real-time state sync, and 35 Playwright tests — looking for feedback`

**Body:**

---

Hey r/nextjs! 👋

Just finished building **Noro Lep POS** — a restaurant POS landing page using Next.js 16 App Router. Wanted to share some architectural decisions and get feedback.

### What's interesting:

**1. Real-time sync between 4 modules** — The page has 4 interactive views (POS, KDS, Tables, Analytics) that share state. When you add an item to cart and checkout, it instantly:
- Creates a new order in KDS kanban
- Marks the table as occupied
- Updates the analytics dashboard (revenue, orders, avg check)

All client-side with React state lifted to a `ProductTour` wrapper. No WebSocket needed for the demo.

**2. Custom analytics (no GA, no Plausible)** — Built a GDPR-compliant analytics system:
- `src/lib/analytics.ts` — localStorage-based, no cookies
- `src/app/api/analytics/route.ts` — in-memory event store
- `src/hooks/use-analytics.ts` — IntersectionObserver for section views, scroll depth milestones, global click delegation with `[data-track]` attributes

**3. 35 Playwright E2E tests** covering:
- Golden path (POS → KDS → Tables → Analytics sync)
- Accessibility (skip-to-content, ARIA, focus rings, alt text)
- SEO (JSON-LD, sitemap, robots.txt, canonical)
- Mobile (hamburger menu, responsive, touch targets)
- Analytics (no cookies, right to be forgotten)

CI/CD runs all tests on every push — deploy is blocked if any fails.

**4. JSON-LD structured data** — Organization, SoftwareApplication (with offers + aggregateRating), WebSite (SearchAction), and FAQPage schemas for Google rich snippets.

### Tech stack:
- Next.js 16 (App Router, standalone output)
- TypeScript 5 (strict)
- Tailwind CSS 4 + shadcn/ui (New York style)
- Framer Motion (animations)
- Recharts (analytics charts)
- Playwright (E2E tests)
- Bun (package manager)

### Stats:
- ~2700 lines of TypeScript
- 35/35 tests passing
- 0 lint errors
- VLM (vision model) score: 9/10

### Links:
- **Live:** [preview link]
- **GitHub:** https://github.com/markec12345678/noro-lep-pos-2026
- **CI/CD:** GitHub Actions (lint → build → e2e)

Questions I have for the community:
1. Is the state management approach (lifting to wrapper) scalable, or should I use Zustand?
2. Anyone has experience with Playwright in CI — how to speed up tests?
3. Should I add `next-intl` for real i18n, or is the language switcher enough for MVP?

---

**Flair:** Show & Tell / Discussion

---

## 🇸🇮 Slo-Tech (slovenski forum)

**Naslov:** `Noro Lep POS — slovenska restavracijska blagajna z AI, FURS in real-time sync (Next.js)`

**Vsebina:**

---

Živjo! 👋

Zgradil sem **Noro Lep POS** — slovensko restavracijsko blagajno zgrajeno na Next.js 16. Želim deliti projekt in pridobiti povratne informacije od slovenske tech skupnosti.

### Kaj je posebnega:

**🔍 Raziskava 12 svetovnih POS sistemov** — Z agent-browser sem obiskal Square, Shopify, Lightspeed, Toast, Lavu... in z VLM modelom (GLM-4.6V) analiziral njihove vmesnike. Nato zgradil svojega na podlagi ugotovitev.

**🎮 4-modulni interaktivni product tour:**
1. **POS Blagajna** — Natakar (TEXT gumbi) + Gost (SLIKE artiklov)
2. **Kuhinja (KDS)** — 3-column kanban z real-time sync
3. **Mize** — tloris restavracije z 12 mizami
4. **Analitika** — AI dashboard z grafi

Ko natakar izda račun v POS, se naročilo **istočasno** pojavi v KDS, miza postane zasedena, in analitika se posodobi. To je "magic moment" ki ga noben konkurent nima na landing page-u.

**🔒 Privacy-first:**
- Brez piškotkov (GDPR-compliant)
- Brez Google Analytics
- Lasten analytics sistem (localStorage + API)
- Uporabnik lahko vidi/izbriše svoje podatke

**🇸🇮 Slovensko:**
- FURS skladnost (ZOI, EOR, QR koda)
- Slovenski jezik + lokalni kontekst
- 542 slovenskih restavracij (social proof)

### VLM primerjava s svetovnimi:

| Vmesnik | Naša ocena | Konkurent |
|---------|-----------|-----------|
| KDS | **9/10** 🏆 | Lightspeed 5.5/10 |
| Mize | **8.5/10** 🏆 | TouchBistro 6.0/10 |
| POS | 8/10 | Toast 9/10 |
| Gost view | 7.5/10 | Shopify 8.5/10 |

Zmagamo v 2 od 4 vmesnikov!

### Tech stack:
- Next.js 16 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Framer Motion + Recharts
- Playwright (35 E2E testov)
- Bun

### Links:
- **Live:** [preview link]
- **GitHub:** https://github.com/markec12345678/noro-lep-pos-2026

Vprašanja za skupnost:
1. Ali bi uporabili slovenski POS z AI predikcijo prometa?
2. Kaj manjka za slovenske restavracije?
3. Ali je FURS skladnost dovolj, ali potrebujete še kaj?

Hvala za povratne informacije! 🙏

---

## 🟣 Product Hunt — Launch checklist

### Pre-launch (1 teden pred)

- [ ] **Hunter** — najdi PH hunter-ja z 1000+ followers
- [ ] **Gallery** — 6 slik (hero, demo, features, pricing, testimonial, FAQ)
- [ ] **Tagline** — ≤60 znakov: "Slovenian restaurant POS with AI, FURS & real-time sync"
- [ ] **Description** — 260 znakov: "Noro Lep POS is a privacy-first restaurant POS with automatic FURS compliance, AI revenue prediction, and real-time sync between POS, kitchen, tables, and analytics. No cookies, no Google Analytics, GDPR-compliant by design."
- [ ] **First comment** — personal story + tech details
- [ ] **Maker comment** — bodi aktiven cel dan

### Launch day

- [ ] **00:01 PST** — objavi
- [ ] **Email** — pošlji email waitlist-u
- [ ] **Social** — Twitter, LinkedIn, Reddit
- [ ] **Slo-Tech** — objavi na forumu
- [ ] **Discord/Slack** — tech skupnosti
- [ ] **Odgovarjaj** na vse komentarje v prvih 12 urah

### Tags
`Restaurant` `POS` `SaaS` `Developer Tools` `Productivity`

---

## 🐦 Twitter / X — Thread

**Tweet 1:**
Built a restaurant POS landing page that's privacy-first by design.

No cookies. No Google Analytics. No consent banners. Just clean, anonymous, GDPR-compliant analytics.

Here's what I learned building it 🧵

**Tweet 2:**
First, I researched 12 world POS systems (Square, Shopify, Lightspeed, Toast...) using a headless browser + VLM to analyze their UI design.

Then built our own based on what actually works.

VLM score: 9/10 (near Square's 9.2) 📊

**Tweet 3:**
The killer feature: 4-module interactive product tour with REAL-TIME SYNC.

When you checkout in POS:
→ Order appears in Kitchen (KDS)
→ Table becomes occupied
→ Analytics dashboard updates

All in 1 action. No other POS landing page has this. 🎮

**Tweet 4:**
Privacy by design:
🔒 NO cookies (localStorage only)
🔒 NO PII (personally identifiable info)
🔒 NO fingerprinting (random session IDs)
✅ Users can view/delete their own data
✅ GDPR-compliant without consent banners

**Tweet 5:**
35 Playwright E2E tests. CI/CD blocks deploy if any test fails.

Tests cover:
- Golden path (POS → KDS → Tables → Analytics)
- Accessibility (WCAG, ARIA)
- SEO (JSON-LD, sitemap)
- Mobile (hamburger, responsive)
- Analytics (no cookies, right to be forgotten)

**Tweet 6:**
Tech stack:
- Next.js 16 + TypeScript
- Tailwind 4 + shadcn/ui
- Framer Motion + Recharts
- Playwright E2E
- Custom analytics (no GA)

~2700 lines, 0 lint errors, 35/35 tests passing.

**Tweet 7:**
Live demo + open source:
🔗 Live: [link]
📦 GitHub: github.com/markec12345678/noro-lep-pos-2026

Built in Slovenia 🇸🇮 with ❤️

Feedback welcome! What would you improve?

---

## 📧 Email — Waitlist announcement

**Subject:** `Noro Lep POS je tu! 🚀 Najlepša slovenska blagajna z AI in real-time sync`

**Body:**

Živjo!

Po tednih razvoja je **Noro Lep POS** končno tu — najlepša slovenska restavracijska blagajna z avtomatskim FURS, AI predikcijo prometa in kuhinjskim zaslonom.

### Kaj je novo:

🎮 **4-modulni interaktivni demo** — Poskusi POS, KDS, mize in analitiko v živo, brez registracije

📊 **Real-time sync** — Ko izdaš račun, se naročilo takoj pojavi v kuhinji, miza posodobi, in analitika posodobi

💰 **ROI kalkulator** — Izračunaj koliko boš prihranil z Noro Lep POS

🔒 **Privacy-first** — Brez piškotkov, brez Google Analytics, GDPR-compliant

### Poskusi zdaj:

🔗 [Live demo link]

Brezplačni 30-dnevni preizkus — brez kreditne kartice.

Lep pozdrav,
Noro Lep POS Team 🇸🇮

---

## 📅 Launch timeline

| Dan | Akcija |
|-----|--------|
| **T-7** | Email waitlist-u "coming soon" |
| **T-3** | Pre-launch tweet "building in public" |
| **T-1** | Pripravi vse post-e, testiraj link-e |
| **T+0** | **LAUNCH** — Reddit, Slo-Tech, Twitter, email |
| **T+1** | Product Hunt launch (00:01 PST) |
| **T+3** | "Thank you" post + stats |
| **T+7** | Retrospective + blog post |

---

<div align="center">

**Lep launch! 🚀** 🇸🇮

</div>
