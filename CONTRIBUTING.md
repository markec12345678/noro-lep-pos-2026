# Contributing to Noro Lep POS

Hvala, da želite prispevati! Prosimo, sledite tem smernicam.

## 🚀 Hitri začetek

```bash
git clone https://github.com/markec12345678/noro-lep-pos-2026.git
cd noro-lep-pos-2026
docker-compose up
```

## 📋 Prednosti prispevanja

- Fork repozitorija
- Ustvarite branch: `git checkout -b feature/ime-funkcije`
- Commit spremembe: `git commit -m 'feat: opis funkcije'`
- Push: `git push origin feature/ime-funkcije`
- Odprite Pull Request

## 📝 Commit konvencije

Uporabljamo [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): opis

Tipi:
  feat     — nova funkcija
  fix      — popravek hrošča
  docs     — dokumentacija
  style    — formatiranje (brez logičnih sprememb)
  refactor — prestrukturiranje kode
  test     — testi
  chore    — orodja, odvisnosti, konfiguracija
```

Primeri:
```
feat(pos): dodana podpora za napitnino
fix(kitchen): popravljena napaka pri sortiranju ticketov
docs(readme): posodobljen seznam funkcij
```

## 🧪 Pred oddajo PR-ja

```bash
cd frontend
bun run lint        # ESLint mora pasti brez napak
bunx tsc --noEmit   # TypeScript brez napak
bun run build       # Vite build mora uspeti
```

## 🎨 Slog kode

- TypeScript povsod (strict mode)
- shadcn/ui komponente (ne pišite custom UI od začetka)
- Tailwind CSS razredi (ne custom CSS razen če nujno)
- 2-space indent
- Double quotes za nize
- Semicolons obvezni

## 📦 Struktura projekta

```
frontend/src/
  pages/       — 30 strani (lazy-loaded)
  services/    — 22 API servisov (React Query hooks)
  hooks/       — 6 custom hooks
  components/  — UI komponente (shadcn + custom)
  lib/         — helper funkcije
  types.ts     — vsi TypeScript tipi
  middleware/  — RBAC konfiguracija
```

## 🐛 Prijavljanje hroščev

Odprite [GitHub Issue](https://github.com/markec12345678/noro-lep-pos-2026/issues/new) z:
1. Opis problema
2. Koraki za reprodukcijo
3. Pričakovano vs dejansko obnašanje
4. Screenshot (če relevantno)
5. Browser/OS informacije

## 💬 Vprašanja

Odprite [Discussion](https://github.com/markec12345678/noro-lep-pos-2026/discussions) za splošna vprašanja.
