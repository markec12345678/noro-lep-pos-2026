# 🚀 Noro Lep POS — Deployment Guide

Celovit vodič za deploy na **Vercel** + **Stripe production** + **FURS**.

---

## 📋 Predpogoji

- [Vercel račun](https://vercel.com/signup) (free tier je dovolj za začetek)
- [Stripe račun](https://dashboard.stripe.com/register) (test mode → live mode)
- [GitHub repo](https://github.com/markec12345678/noro-lep-pos-2026) (veja `nextjs-landing`)
- FURS certifikat (.p12) + davčna številka (za production)
- Opcijsko: custom domain (npr. `norolep-pos.si`)

---

## 1️⃣ Vercel Setup (5 min)

### A. Import projekta
1. Pojdi na [vercel.com/new](https://vercel.com/new)
2. Import `markec12345678/noro-lep-pos-2026` → veja `nextjs-landing`
3. Framework Preset: **Next.js** (auto-detected)
4. Build Command: `bun run build` (že v `vercel.json`)
5. Install Command: `bun install --frozen-lockfile`
6. Klikni **Deploy** → dobiš `https://noro-lep-pos-2026.vercel.app`

### B. Environment Variables
V Vercel → Settings → Environment Variables dodaj:

| Key | Value | Environment |
|---|---|---|
| `DATABASE_URL` | `file:/tmp/prod.db` | Production + Preview |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Production |
| `NEXTAUTH_URL` | `https://tvoj-domena.vercel.app` | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (glej spodaj) | Production |
| `FURS_TAX_NUMBER` | `12345678` | Production |
| `FURS_ENVIRONMENT` | `production` | Production |

### C. Database setup
SQLite na Vercelu mora biti v `/tmp` (ephemeral filesystem):
```bash
DATABASE_URL="file:/tmp/prod.db"
```
Po deployu poženi:
```bash
vercel env pull .env.production.local
bun run db:push
```

---

## 2️⃣ Stripe Production Setup (10 min)

### A. Pridobi API ključe
1. [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. **Publishable key**: `pk_live_...` → `STRIPE_PUBLISHABLE_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. **Secret key**: `sk_live_...` → `STRIPE_SECRET_KEY`

### B. Webhook setup (KRITIČNO)
1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → **Add endpoint**
2. **Endpoint URL**: `https://tvoj-domena.vercel.app/api/payments/webhook`
3. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET` v Vercel

### C. Lokalno testiranje webhooks
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/webhook

# Dobi local webhook secret (> ready! > whsec_...)
# Nastavi STRIPE_WEBHOOK_SECRET lokalno
```

### D. Aktiviraj live mode
1. Stripe Dashboard → **Activate account** (poslovni podatki, bank račun)
2. Zamenjaj `sk_test_` → `sk_live_` v Vercel env vars
3. Redeploy

---

## 3️⃣ FURS Setup (Slovenska davčna blagajna)

### A. Pridobi certifikat
1. [eDavki](https://edavki.durs.si/) → Registracija davčnega zavezanca
2. FURS → Zahtevek za digitalno potrdilo za davčno blagajno
3. Prenesi `.p12` certifikat

### B. Konfiguracija
```env
FURS_CERT_PATH="./certs/furs.p12"
FURS_CERT_PASSWORD="geslo-certifikata"
FURS_TAX_NUMBER="12345678"       # davčna številka
FURS_ENVIRONMENT="test"          # test → production po testiranju
```

### C. Testiranje FURS
1. `FURS_ENVIRONMENT="test"` — FURS test okolje
2. Pošlji testni račun → preveri EOR (Enkratna identifikacija odgovora)
3. Preklopi na `production` ko vse deluje

---

## 4️⃣ Custom Domain (opcionalno)

### V Vercel
1. Settings → Domains → Add
2. Vnesi `norolep-pos.si` (ali `www.norolep-pos.si`)
3. Dodaj DNS zapise pri registrarju:
   - **A record**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`
4. Počakaj SSL certifikat (avtomatsko, ~5 min)

### Posodobi env vars
```env
NEXTAUTH_URL="https://norolep-pos.si"
NEXT_PUBLIC_APP_URL="https://norolep-pos.si"
```

### Posodobi Stripe webhook
- Stripe Dashboard → Webhooks → Edit endpoint
- URL: `https://norolep-pos.si/api/payments/webhook`

---

## 5️⃣ GitHub Actions Auto-Deploy

Rep vsebuje `.github/workflows/deploy.yml` ki avtomatsko deploya na Vercel ob push-u na `main`.

### Setup
1. [Vercel Tokens](https://vercel.com/account/tokens) → Create Token
2. Pridobi `ORG_ID` in `PROJECT_ID` iz Vercel project settings
3. GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | `vercel_xxx` |
| `VERCEL_ORG_ID` | `team_xxx` |
| `VERCEL_PROJECT_ID` | `prj_xxx` |

4. Push na `main` → avtomatski deploy 🚀

---

## 6️⃣ Verification Checklist

Po deployu preveri:

- [ ] Stran naloži na `https://tvoj-domena.vercel.app`
- [ ] `GET /api/dashboard/overview` vrne 200
- [ ] `GET /api/payments/create-intent` vrne `stripeConfigured: true`
- [ ] `GET /api/payments/webhook` vrne `configured: true`
- [ ] Demo plačilo (12,50 €) procesira preko Stripe
- [ ] Webhook prejme `payment_intent.succeeded` event
- [ ] FURS testni račun vrne EOR
- [ ] OG image prikazuje na social media preview
- [ ] Lighthouse score > 90 (Performance, Accessibility, SEO)

---

## 7️⃣ Monitoring & Post-Deploy

### Vercel Analytics
- Vercel Dashboard → Analytics (brezplačno, privacy-first)

### Stripe Dashboard
- Monitor payments, disputes, payouts
- Set up email alerts za failed payments

### Error tracking (opcionalno)
- [Sentry](https://sentry.io) za error monitoring (free tier)
- Dodaj `SENTRY_DSN` env var

---

## 🆘 Troubleshooting

### Stripe webhook ne deluje
```bash
# Lokalno testiraj
stripe listen --forward-to localhost:3000/api/payments/webhook
stripe trigger payment_intent.succeeded
```
Preveri:
- `STRIPE_WEBHOOK_SECRET` je pravilen
- Webhook URL je javno dostopen
- Signature verification (raw body)

### FURS connection failed
- Certifikat je pravilno naložen (`FURS_CERT_PATH`)
- Davčna številka je pravilna
- `FURS_ENVIRONMENT="test"` za testiranje

### Database wiped na Vercel
SQLite v `/tmp` je ephemeral — na vsak cold start se izbriše.
**Rešitev**: Za production uporabi [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) ali [Turso](https://turso.tech).

---

## 📞 Podpora

- GitHub Issues: [noro-lep-pos-2026/issues](https://github.com/markec12345678/noro-lep-pos-2026/issues)
- Email: info@norolep-pos.si

---

**Zadnja posodobitev**: 2026-07-02 · v6.3
