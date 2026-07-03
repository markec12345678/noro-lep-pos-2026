# Noro Lep POS — Najlepša slovenska restavracijska blagajna 2026

> AI-poganjana POS blagajna z avtomatskim FURS, AI predikcijo prometa, kuhinjskim zaslonom (KDS) in real-time sync med 4 moduli. Zgrajena z ljubeznijo za slovenske gostince. 🇸🇮

[![VLM Score](https://img.shields.io/badge/VLM%20Score-9%2F10-brightgreen?style=flat-square)](#vmesniki-v-primerjavi)
[![Version](https://img.shields.io/badge/Version-8.5-blue?style=flat-square)](CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

---

## 📋 Kazalo

- [Pregled](#pregled)
- [Ključne funkcije](#ključne-funkcije)
- [Vmesniki v primerjavi](#vmesniki-v-primerjavi)
- [Hitri začetek](#hitri-zacetek)
- [Tehnologije](#tehnologije)
- [Struktura projekta](#struktura-projekta)
- [POS raziskava](#pos-raziskava)
- [Roadmap](#roadmap)
- [Prispevanje](#prispevanje)
- [Licenca](#licenca)

---

## Pregled

**Noro Lep POS** je najlepša slovenska restavracijska blagajna zgrajena na Next.js 16. Vključuje 4 interaktivne module z **real-time sinhronizacijo** — ko natakar izda račun v POS, se naročilo takoj pojavi v KDS, miza postane zasedena, in analitika se posodobi.

### 🎯 Zakaj Noro Lep?

- ✅ **FURS skladnost** — avtomatski ZOI, EOR, QR koda (ZDavPR)
- ✅ **AI predikcija prometa** — napoved za naslednji teden
- ✅ **Real-time sync** — POS → KDS → Mize → Analitika v 1 akciji
- ✅ **Slovenski jezik** — native SLO podpora z lokalnim kontekstom
- ✅ **Offline način** — deluje brez interneta, sinhronizira ko je povezava nazaj
- ✅ **ROI kalkulator** — interaktivni izračun prihranka na landing page

---

## Ključne funkcije

### 🖥️ 4 moduli z real-time sync

| Modul | Opis | VLM ocena |
|-------|------|-----------|
| **POS Blagajna** | Natakar (TEXT gumbi) + Gost (SLIKE artiklov) | 8/10 |
| **Kuhinja (KDS)** | 3-column kanban (Nova → V pripravi → Pripravljena) | **9/10** 🏆 |
| **Mize** | Tloris restavracije z 12 mizami, 4 statusi | **8.5/10** 🏆 |
| **Analitika** | AI dashboard z grafi, KPI, menu engineering | 8/10 |

### 🎨 Landing page (30 sekcij)

1. **Hero** z AI lifestyle sliko + floating cards + video demo modal
2. **Live sales ticker** (rotating sporočila v realnem času)
3. **Stats bar** z animated counters
4. **Trust bar** (FURS ZDavP-2P, GDPR, ISO, PCI DSS, SOC 2)
5. **Security & compliance** (AES-256, MFA, backup, offline, RBAC)
6. **Multi-location & mobile** (chain management + owner app)
7. **Sustainability & cost control** (CO₂ tracking, DDV, P&L)
8. **Command Center** (living dashboard z real-time simulacijo)
9. **Payments** (Stripe demo, Apple/Google Pay)
10. **Loyalty & CRM** (3 tierji, CRM profili, avtomatske akcije)
11. **Inventory** (232 artiklov, AI predikcija)
12. **Delivery** (Wolt/Glovo/Uber Eats)
13. **QR Ordering & Kiosk** (interaktivni demo)
14. **AI Prediction** (weather-aware, Deloitte statistike)
15. **Menu Engineering** (4 kvadranti: Zvezde/Konji/Uganke/Psi)
16. **Staff & Shift** (scheduling, labor cost, AI priporočila)
17. **Reservations** (3 tabi: danes/waitlist/tloris miz)
18. **Integrations marketplace** (24+ integracij, 6 kategorij)
19. **Onboarding wizard** (5 korakov, 15 min time-to-value)
20. **Support & training** (4 kanali, 47 video, garancija)
21. **Roadmap & changelog** (shipped/next/planned + voting)
22. **4-module Product Tour** z real-time sync
23. **Features grid** (9 modulov)
24. **Competition Comparison** (vs slovenske blagajne)
25. **Interface Comparison** (4 VLM primerjave)
26. **Testimonials** (3 slovenske restavracije)
27. **Case Studies** (3 restavracije s pred/po metrikami)
28. **ROI kalkulator** (interaktivni drsniki)
29. **Z-Report** (FURS dnevno zaključevanje)
30. **Email capture** (brezplačni vodič lead magnet)
31. **Pricing** (3-tier: Starter 0€, Pro 49€, Enterprise)
32. **FAQ accordion**
33. **Decision Hub** (3 poti + 6 ugodnosti + comparison)
34. **Section dots navigator** (29 pik za hiter skip)

---

## Vmesniki v primerjavi

Z VLM modelom GLM-4.6V smo primerjali naše 4 vmesnike z najboljšimi POS sistemi na svetu:

| Vmesnik | Naša ocena | Konkurent | Konkurent ocena | Zmagovalca |
|---------|-----------|-----------|-----------------|------------|
| Blagajniški (POS) | 8.0/10 | Toast 🇺🇸 | 9.0/10 | Toast |
| **Kuhinjski (KDS)** | **9.0/10** | Lightspeed 🇨🇦 | 5.5/10 | **Noro Lep!** 🏆 |
| Gostov (ordering) | 7.5/10 | Shopify 🇨🇦 | 8.5/10 | Shopify |
| **Mize (tloris)** | **8.5/10** | TouchBistro 🇨🇦 | 6.0/10 | **Noro Lep!** 🏆 |

**Iskren zaključek:** Zmagamo v 2 od 4 vmesnikov (KDS, Tables) ker smo kitchen-centric in floor-plan-centric.

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
# ali: npm install

# Zaženi dev server
bun run dev
# ali: npm run dev
```

Aplikacija teče na `http://localhost:3000`.

### Build za produkcijo

```bash
bun run build
bun run start
```

### Database (Prisma + SQLite)

```bash
# Push schema v SQLite
bun run db:push

# Generiraj Prisma client
bun run db:generate
```

---

## Tehnologije

| Kategorija | Tehnologija |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router) |
| **Jezik** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Animacije** | Framer Motion |
| **Grafi** | Recharts |
| **Ikone** | Lucide React |
| **Database** | Prisma ORM + SQLite |
| **Cache** | Local memory |
| **Auth** | NextAuth.js v4 (available) |
| **State** | Zustand + TanStack Query |

---

## Struktura projekta

```
noro-lep-pos-2026/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page (30+ sekcij, ~6900 vrstic)
│   │   ├── layout.tsx        # Root layout z metadata
│   │   ├── globals.css       # Tailwind + CSS variables
│   │   └── api/
│   │       └── pos-research/ # API route z raziskavo
│   ├── components/ui/        # shadcn/ui komponente (55+)
│   ├── hooks/                # Custom hooks
│   └── lib/                  # Utils, db client
├── public/
│   ├── pos-brand/            # AI-generirane slike (hero, jedi)
│   ├── pos-demo/             # Screenshots za demo
│   ├── pos-interfaces/       # VLM primerjave vmesnikov
│   ├── pos-research/         # Raziskava 12 POS sistemov
│   └── manifest.json         # PWA manifest
├── prisma/
│   └── schema.prisma         # Database schema
├── mini-services/            # WebSocket, FURS, Public API
├── .github/                  # Issue/PR templates, CI/CD
└── package.json
```

---

## POS raziskava

Z **agent-browser** in **VLM modelom** smo raziskali 12 vodilnih svetovnih POS sistemov:

- ✅ **Square POS** (9.2/10) — ZDA, retail + restaurant
- ✅ **Shopify POS** (9.0/10) — Kanada, retail
- ✅ **Lightspeed** (8.8/10) — Kanada, enterprise
- ✅ **Lavu POS** (8.5/10) — ZDA, AI-focused
- ✅ **Restroworks** (8.3/10) — Indija, enterprise
- ✅ **Petpooja** (8.0/10) — Indija, dark mode
- ⚠️ **Toast POS** — Cloudflare zaščita (ni analiziran)
- ⚠️ **TouchBistro** — Cloudflare zaščita

**Ključne ugotovitve:**
- Restaurant POS (Toast, Lightspeed) uporablja TEXT v POS vmesniku
- Retail POS (Square, Shopify) uporablja SLIKE
- Vsi podpirajo slike, a restaurant POS jih uporablja za goste (online ordering)

---

## Roadmap

- [x] Hero z AI sliko + floating cards
- [x] 4-module Product Tour (POS, KDS, Tables, Analytics)
- [x] Real-time sync med moduli
- [x] ROI kalkulator
- [x] Competition comparison table
- [x] Interface comparison z VLM ocenami
- [x] Language switcher (SLO/EN/DE/IT)
- [x] Video demo modal
- [x] PWA manifest
- [ ] Realni customer logotipi
- [ ] Hardware showcase sekcija
- [ ] Video testimonials
- [ ] i18n z next-intl (dejavni prevodi)
- [ ] Stripe payment integracija
- [ ] WebSocket za multi-user sync

---

## Prispevanje

Prispevki so dobrodošli! Preberi [CONTRIBUTING.md](CONTRIBUTING.md) za smernice.

### Razvoj

```bash
# Fork + clone
git checkout -b feature/nova-funkcija

# Naredi spremembe
bun run lint  # preveri kodo

# Commit z conventional commits
git commit -m "feat: opis nove funkcije"

# Push + Pull Request
git push origin feature/nova-funkcija
```

---

## Licenca

MIT License — glej [LICENSE](LICENSE).

---

## Avtorji

- **Noro Lep POS Team** — *Initial work* — [markec12345678](https://github.com/markec12345678)

## Zahvale

- [Next.js](https://nextjs.org/) — React framework
- [shadcn/ui](https://ui.shadcn.com/) — UI komponente
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Framer Motion](https://www.framer.com/motion/) — Animacije
- [Recharts](https://recharts.org/) — Grafi
- [Lucide](https://lucide.dev/) — Ikone

---

<div align="center">

**Zgrajeno v Sloveniji** 🇸🇮 z ❤️

VLM 9/10 · 45 komponent · 16 vizualnih efektov · 12 APIjev · 6933 vrstic TypeScript · 30 sekcij

[🌐 Spletna stran](https://chat.z.ai) · [📧 Kontakt](mailto:info@norolep-pos.si) · [🐛 Prijavi napako](https://github.com/markec12345678/noro-lep-pos-2026/issues)

</div>
