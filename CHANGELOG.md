# Changelog

Vse pomembne spremembe tega projekta bodo zapisane v tem datoteki.

Format temelji na [Keep a Changelog](https://keepachangelog.com/sl/1.1.0/),
in verzije sledijo [Semantic Versioning](https://semver.org/lang/sl/).

## [1.0.0] — 2025-06-29

### Dodano
- **POS** — point of sale z modifikatorji (velikosti, dodatki), DDV (22%/9.5%/0%), načini plačila (gotovina/kartica), napitnine
- **Enhanced KDS** — kanban kuhinjski display z live timerji, barvnimi alerti in zvočnimi obvestili
- **Table Operations** — prenos naročil, združevanje miz, razdelitev računa
- **FURS davčna blagajna** — ZOI generacija, EOR submission, QR kode na računih
- **Z-Report** — dnevni zaključek s razčlenitvijo DDV, povračili in blagajno
- **Cash Drawer** — izmenske seje z reconciliation (samo gotovinska prodaja)
- **Inventory** — sledenje zaloge z auto-decrement ob checkoutu in low-stock alerti
- **Recipe Costing & Menu Engineering** — stroški jedi, profitabilnost, Stars/Plowhorses/Puzzles/Dogs matrika
- **Suppliers & Invoices** — upravljanje dobaviteljev z auto-restock ob odobritvi računa
- **Online Ordering** — QR kodni meni za goste z real-time kuhinjsko sinhronizacijo
- **Loyalty Program** — točke po telefonski številki z unovčljivimi nagradami
- **Reservations** — javna rezervacijska stran + manager koledar
- **Happy Hour Promotions** — časovno omejene akcije z auto-apply ob checkoutu
- **Allergen Tracking** — 14 EU FIC alergenov z gostujočim filtrom
- **Staff Scheduling** — tedenski urnik z clock in/out in stroški dela
- **Tips Management** — napitnine z distribucijo po zaposlenih
- **Multi-Location** — chain management z lokacijskim preklopnikom
- **Refund Processing** — delna/polna povračila z razlogi in Z-Report integracijo
- **Manager Dashboard** — KPI pregled z activity feed in context-aware alerti
- **Notification Center** — live obvestila iz vseh modulov (bell icon)
- **Realtime WebSocket** — multi-tab sinhronizacija preko socket.io
- **RBAC** — manager / waiter / chef z restrikcijami na nivoju routov

### Tehnične komponente
- 3 mini-servisi: pos-realtime (port 3003), furs-service (port 3004), pos-public (port 3005)
- Backend setup skripta za 23 Cockpit CMS kolekcij
- Docker Compose z 5 servisi
- CI/CD z ESLint + TypeScript + build check
- 12 setup dokumentov
- Production deployment guide
