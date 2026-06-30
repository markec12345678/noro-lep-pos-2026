# Prispevanje k Noro Lep POS

Hvala za tvoje zanimanje za prispevanje k Noro Lep POS! 🎉 Ta dokument vsebuje smernice za razvoj.

## 🚀 Hitri začetek

### Zahteve

- Node.js 18+ ali Bun
- Git
- Osnovno znanje TypeScript in React

### Lokalna namestitev

```bash
# Fork repo na GitHub-u
git clone https://github.com/TVOJ-USERNAME/noro-lep-pos-2026.git
cd noro-lep-pos-2026

# Namesti odvisnosti
bun install

# Zaženi dev server
bun run dev
```

Aplikacija teče na `http://localhost:3000`.

---

## 📋 Pred oddajo PR-ja

### 1. Preveri kodo

```bash
# Lint
bun run lint

# Type check
bunx tsc --noEmit
```

### 2. Conventional Commits

Uporabljamo [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <opis>

[optional body]

[optional footer]
```

**Tipi:**
- `feat:` — nova funkcija
- `fix:` — popravljena napaka
- `docs:` — sprememba dokumentacije
- `style:` — formatiranje, brez spremembe kode
- `refactor:` — refaktoriranje kode
- `test:` — dodani testi
- `chore:` — vzdrževalna opravila

**Primeri:**
```
feat: dodaj video demo modal v hero
fix: popravi cart izračun DDV
docs: posodobi README z VLM ocenami
style: formatiraj PosDemo komponento
```

### 3. Branch naming

- `feature/opis-funkcije` — nove funkcije
- `fix/opis-popravka` — popravki napak
- `docs/opis` — dokumentacija
- `refactor/opis` — refaktoriranje

---

## 🎨 Slog kode

### TypeScript

- Uporabljaj TypeScript za vse datoteke (`.ts`, `.tsx`)
- Definiraj interfejse za vse podatkovne strukture
- Izogibaj se `any` — uporabljaj specifične tipe
- Uporabljaj `const` namesto `let` kjer mogoče

### React

- Functional components z hooks
- `'use client'` direktiva za client komponente
- `'use server'` za server actions
- Uporabljaj shadcn/ui komponente namesto custom

### CSS / Tailwind

- Uporabljaj Tailwind utility razrede
- CSS variables za teme (definirane v `globals.css`)
- Izogibaj se inline styles (razen za dinamične vrednosti)
- Responsive: mobile-first pristop (`sm:`, `md:`, `lg:`)

### Naming conventions

- **Datoteke**: `PascalCase` za komponente (`PosDemo.tsx`), `camelCase` za utility (`formatPrice.ts`)
- **Komponente**: `PascalCase` (`PosDemo`, `KdsView`)
- **Funkcije**: `camelCase` (`addToCart`, `handleCheckout`)
- **Konstante**: `UPPER_SNAKE_CASE` (`MENU_ITEMS`, `KITCHEN_ORDERS`)
- **Tipi/interfejsi**: `PascalCase` (`MenuItem`, `KitchenOrder`)

---

## 🧪 Testiranje

Trenutno nimamo avtomatiziranih testov, a pred PR-jem:

1. **Ročno testiraj** vse spremembe v browser-ju
2. **Preveri responsive** na mobile (375px) in desktop (1440px)
3. **Preveri console** — brez error-jev ali warningov
4. **Preveri lint** — `bun run lint` mora biti čist

---

## 📝 Pull Request proces

1. **Ustvari PR** z opisnim naslovom
2. **Izpolni PR template** (glej `.github/PULL_REQUEST_TEMPLATE.md`)
3. **Dodaj screenshot-e** za UI spremembe
4. **Počakaj na review** — odgovorili bomo v 48 urah
5. **Ustrezaj na feedback** — spremembi kodo po potrebi

### PR checklist

- [ ] Koda sledi slogu projekta
- [ ] `bun run lint` je čist (0 napak)
- [ ] Spremembe so testirane v browser-ju
- [ ] Dokumentacija je posodobljena (če potrebno)
- [ ] Conventional commit message uporabljen
- [ ] Screenshot-i dodani za UI spremembe

---

## 🐛 Prijavljanje napak

Uporabljaj [GitHub Issues](https://github.com/markec12345678/noro-lep-pos-2026/issues) z bug report template-om.

### Pred prijavo

1. **Preveri obstoječe issue-je** — morda je že prijavljeno
2. **Reproduciraj** — opiši korake za reprodukcijo
3. **Dodaj environment** — OS, browser, različica

---

## 💬 Komunikacija

- **GitHub Issues** — za napake in feature requeste
- **GitHub Discussions** — za vprašanja in ideje
- **Email** — `info@norolep-pos.si` za private zadeve

---

## 📜 Code of Conduct

Sodelovanje v tem projektu zahteva spoštovanje [Code of Conduct](CODE_OF_CONDUCT.md). Prosimo, da ga prebereš.

---

Hvala za tvoje prispevke! 🙏

<div align="center">

**Zgrajeno v Sloveniji** 🇸🇮

</div>
