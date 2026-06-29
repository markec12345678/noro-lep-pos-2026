# Security Policy

## Prijavljanje ranljivosti

Če odkrijete varnostno ranljivost, prosimo **NE odpirajte javnega GitHub issue-ja**.

Namesto tega pošljite e-mail na: security@norolep.si

Vključite:
1. Opis ranljivosti
2. Koraki za reprodukcijo
3. Možen vpliv
4. Predlog popravka (če ga imate)

Odgovorili bomo v 48 urah.

## Podprte verzije

| Verzija | Podpora |
|---------|---------|
| 1.x     | ✅ Aktivno |

## Varnostne funkcije

- **RBAC**: 3 vloge (manager / waiter / chef) z restrikcijami na nivoju routov
- **API avtentikacija**: Cockpit CMS API key (server-side only za public API)
- **FURS certifikati**: TLS mutual authentication za fiskalne račune
- **Loyalty**: telefonska številka kot ID (brez gesel za goste)
- **Cash drawer**: audit trail vseh transakcij z imenom zaposlenega

## Znana tveganja

- `localStorage` za user session (XSS ranljivost — načrtovana nadgradnja na httpOnly cookies)
- Cockpit CMS API key v frontend bundle (za avtentificirane klice — public API uporablja server-side proxy)
- Mini-services nimajo rate limitingja (TODO)
