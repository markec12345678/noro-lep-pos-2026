# Security Policy

## 🛡️ Prijavljene varnostne ranljivosti

Varnost vzamemo resno. Hvala za tvoje poročilo o varnostnih ranljivostih.

## 📧 Kako prijaviti

**NE prijavljaj varnostnih ranljivosti preko javnih GitHub Issues.**

Namesto tega pošlji email na: `security@norolep-pos.si`

V emailu vključi:
- Opis ranljivosti
- Koraki za reprodukcijo
- Možen vpliv
- Predlog rešitve (če ga imaš)

Odgovorili bomo v **48 urah**.

## 🔒 Podprte različice

| Različica | Podpora |
|-----------|---------|
| 3.x (nextjs-landing) | ✅ Aktivna |
| 2.x (main) | ⚠️ Vzdrževalna |
| < 2.0 | ❌ Nepodprta |

## 🛠️ Varnostne prakse

### FURS skladnost

- ZOI (Zaščitna oznaka izdajatelja) — MD5 → Base32
- EOR (Enkratna identifikacijska oznaka računa) — FURS submission
- QR koda na računu — avtomatsko generirana
- Skladno z [ZDavPR](https://www.fu.gov.si/slovenija/davki_in_postopki/drugi_davki/zakon_o_davcnem_

### GDPR

- Osebni podatki se shranjujejo lokalno (SQLite)
- Brez pošiljanja podatkov tretjim osebam
- Pravica do izbrisa (right to be forgotten)
- Data export funkcionalnost

### Avtentikacija

- NextAuth.js v4 za session management
- Bcrypt za password hashing
- JWT tokens s kratko veljavnostjo
- HTTPS zahtevan v produkciji

### API varnost

- Rate limiting na vseh API endpointih
- Input validacija z Zod
- SQL injection zaščita (Prisma ORM)
- XSS zaščita (React escaping)

## 🚨 Kaj prijaviti

- ✅ SQL injection ranljivosti
- ✅ XSS ranljivosti
- ✅ CSRF ranljivosti
- ✅ Avtentikacije bypass
- ✅ Razkritje občutljivih podatkov
- ✅ FURS skladnost težave
- ✅ GDPR kršitve

## ❌ Kaj NE prijaviti

- ❌ Spell-check napake
- ❌ Feature requesti
- ❌ Vprašanja o uporabi
- ❌ Težave s performance (razen če vplivajo na varnost)

## 📋 Disclosure Policy

1. Prejeli smo tvoje poročilo (48h)
2. Potrditev ranljivosti (7 dni)
3. Popravilo v razvoju (30 dni)
4. Izdaja popravka + public disclosure (90 dni)

Hvala za pomoč pri ohranjanju Noro Lep POS varne! 🙏
