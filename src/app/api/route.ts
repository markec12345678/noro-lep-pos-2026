import { NextResponse } from 'next/server'

/**
 * API Index — seznam vseh API endpoints z metodami in opisi
 * GET /api
 *
 * Vrača strukturiran seznam vseh 53+ API routes, organiziranih po sistemu.
 */

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'Noro Lep POS API',
    version: '10.0',
    description: 'Celovit POS backend za slovenske restavracije',
    baseUrl: '/api',
    authentication: {
      type: 'Bearer JWT (PIN-based login)',
      login: 'POST /api/auth/login { pin: "1234" }',
      header: 'Authorization: Bearer <token>',
    },
    models: 40,
    routes: 55,
    systems: [
      {
        name: 'Authentication',
        icon: '🔐',
        routes: [
          { method: 'POST', path: '/api/auth/login', desc: 'PIN login → JWT token', auth: false },
          { method: 'GET', path: '/api/auth/me', desc: 'Trenutno prijavljeni uporabnik', auth: true },
          { method: 'POST', path: '/api/auth/logout', desc: 'Odjava', auth: true },
          { method: 'POST', path: '/api/auth/set-pin', desc: 'Nastavi PIN (manager/self)', auth: true },
        ],
      },
      {
        name: 'Orders',
        icon: '🧾',
        routes: [
          { method: 'GET', path: '/api/orders', desc: 'Seznam naročil (filter: status, tableId)', auth: true },
          { method: 'GET', path: '/api/orders?id=X', desc: 'Eno naročilo z items', auth: true },
          { method: 'POST', path: '/api/orders', desc: 'Ustvari naročilo (auto stock deduction + tip)', auth: true },
          { method: 'PATCH', path: '/api/orders', desc: 'Posodobi status (KDS flow, payment, tip)', auth: true },
        ],
      },
      {
        name: 'Tables',
        icon: '🪑',
        routes: [
          { method: 'GET', path: '/api/tables', desc: 'Seznam miz z active orders + stats', auth: true },
          { method: 'POST', path: '/api/tables', desc: 'Ustvari mizo', auth: true },
          { method: 'PATCH', path: '/api/tables', desc: 'Posodobi status (free/occupied/reserved)', auth: true },
          { method: 'POST', path: '/api/tables/seed', desc: 'Seed 12 demo miz', auth: true },
        ],
      },
      {
        name: 'Reservations',
        icon: '📅',
        routes: [
          { method: 'GET', path: '/api/reservations', desc: 'Seznam rezervacij (filter: status, date, phone)', auth: true },
          { method: 'POST', path: '/api/reservations', desc: 'Ustvari rezervacijo (auto table reserved)', auth: true },
          { method: 'PATCH', path: '/api/reservations', desc: 'Posodobi status (confirmed→seated→completed)', auth: true },
          { method: 'DELETE', path: '/api/reservations?id=X', desc: 'Prekliči rezervacijo (auto table free)', auth: true },
        ],
      },
      {
        name: 'Waitlist',
        icon: '⏳',
        routes: [
          { method: 'GET', path: '/api/waitlist', desc: 'Čakalna vrsta z stats', auth: true },
          { method: 'POST', path: '/api/waitlist', desc: 'Dodaj v čakalno vrsto (auto position + AI wait)', auth: true },
          { method: 'PATCH', path: '/api/waitlist', desc: 'Notify (SMS) / seat (auto renumber) / leave', auth: true },
        ],
      },
      {
        name: 'Staff & Shifts',
        icon: '👥',
        routes: [
          { method: 'GET', path: '/api/staff', desc: 'Seznam osebja z stats (byRole, avgRate)', auth: true },
          { method: 'POST', path: '/api/staff', desc: 'Dodaj osebo (email unique)', auth: true },
          { method: 'PATCH', path: '/api/staff', desc: 'Posodobi (role, rate, active, PIN)', auth: true },
          { method: 'DELETE', path: '/api/staff?id=X', desc: 'Deaktiviraj (soft delete)', auth: true },
          { method: 'GET', path: '/api/shifts', desc: 'Seznam izmen z labor cost calc', auth: true },
          { method: 'POST', path: '/api/shifts', desc: 'Razporedi izmeno', auth: true },
          { method: 'PATCH', path: '/api/shifts', desc: 'Start (clock in) / complete (clock out) / cancel', auth: true },
        ],
      },
      {
        name: 'KDS (Kitchen Display)',
        icon: '👨‍🍳',
        routes: [
          { method: 'GET', path: '/api/kds', desc: 'KDS board z active orders + station filter', auth: true },
          { method: 'GET', path: '/api/kds?station=hot', desc: 'Samo vroča postaja (auto-detect)', auth: true },
          { method: 'PATCH', path: '/api/kds', desc: 'start/done/serve/cancel/recall (auto order status)', auth: true },
        ],
      },
      {
        name: 'Z-Report (FURS)',
        icon: '🏛️',
        routes: [
          { method: 'GET', path: '/api/z-report', desc: 'Seznam Z-reportov', auth: true },
          { method: 'POST', path: '/api/z-report', desc: 'Generiraj dnevni Z-report iz paid orders (auto VAT)', auth: true },
          { method: 'PATCH', path: '/api/z-report', desc: 'Zaključi (FURS EOR/ZOI) / arhiviraj', auth: true },
        ],
      },
      {
        name: 'Inventory',
        icon: '📦',
        routes: [
          { method: 'GET', path: '/api/inventory/items', desc: 'CRUD artiklov', auth: true },
          { method: 'GET', path: '/api/inventory/list', desc: 'Seznam z low stock filter', auth: true },
          { method: 'GET', path: '/api/inventory/transactions', desc: 'Stock movements z stats', auth: true },
          { method: 'POST', path: '/api/inventory/transactions', desc: 'Ustvari transakcijo (auto stock update)', auth: true },
          { method: 'POST', path: '/api/inventory/delivery', desc: 'Zabeleži dobavo', auth: true },
          { method: 'POST', path: '/api/inventory/seed', desc: 'Seed 232 artiklov', auth: true },
        ],
      },
      {
        name: 'Purchase Orders',
        icon: '🚚',
        routes: [
          { method: 'GET', path: '/api/purchase-orders', desc: 'Seznam nabavnih nalogov z stats', auth: true },
          { method: 'POST', path: '/api/purchase-orders', desc: 'Ustvari nabavni nalog (draft)', auth: true },
          { method: 'PATCH', path: '/api/purchase-orders', desc: 'send / receive_item (auto stock!) / receive_all / cancel', auth: true },
        ],
      },
      {
        name: 'Suppliers',
        icon: '🏢',
        routes: [
          { method: 'GET', path: '/api/suppliers', desc: 'Seznam dobaviteljev', auth: true },
          { method: 'POST', path: '/api/suppliers', desc: 'Dodaj dobavitelja', auth: true },
          { method: 'PATCH', path: '/api/suppliers', desc: 'Posodobi dobavitelja', auth: true },
          { method: 'DELETE', path: '/api/suppliers?id=X', desc: 'Odstrani dobavitelja', auth: true },
        ],
      },
      {
        name: 'Menu Management',
        icon: '🍽️',
        routes: [
          { method: 'GET', path: '/api/menu', desc: 'Vse kategorije z artikli + modifiers + stats', auth: false },
          { method: 'GET', path: '/api/menu?category=pice', desc: 'Artikli za kategorijo', auth: false },
          { method: 'GET', path: '/api/menu?id=X', desc: 'En artikel z modifiers', auth: false },
          { method: 'POST', path: '/api/menu', desc: 'Ustvari kategorijo ali artikel (z modifiers)', auth: true },
          { method: 'PATCH', path: '/api/menu', desc: 'Posodobi artikel/kategorijo', auth: true },
          { method: 'DELETE', path: '/api/menu?id=X&type=item', desc: 'Deaktiviraj artikel/kategorijo', auth: true },
          { method: 'POST', path: '/api/menu/seed', desc: 'Seed 5 kategorij + 15 artiklov', auth: true },
        ],
      },
      {
        name: 'Customers & Loyalty',
        icon: '⭐',
        routes: [
          { method: 'GET', path: '/api/customers', desc: 'Seznam gostov z stats (byTier, points)', auth: true },
          { method: 'POST', path: '/api/customers', desc: 'Dodaj gosta (email/phone unique, GDPR consent)', auth: true },
          { method: 'PATCH', path: '/api/customers', desc: 'earn (auto tier upgrade!) / redeem / birthday_bonus / update', auth: true },
        ],
      },
      {
        name: 'Promotions',
        icon: '🎉',
        routes: [
          { method: 'GET', path: '/api/promotions', desc: 'Seznam promocij + stats (ROI)', auth: true },
          { method: 'GET', path: '/api/promotions?code=NOVO10', desc: 'Lookup coupon kodo', auth: true },
          { method: 'POST', path: '/api/promotions', desc: 'Ustvari promocijo (happy_hour/bogo/coupon/seasonal)', auth: true },
          { method: 'PATCH', path: '/api/promotions', desc: 'pause / activate / expire / update', auth: true },
          { method: 'DELETE', path: '/api/promotions?id=X', desc: 'Arhiviraj', auth: true },
          { method: 'POST', path: '/api/promotions/apply', desc: 'Auto-apply na items (stackable!)', auth: true },
        ],
      },
      {
        name: 'Gift Cards',
        icon: '🎁',
        routes: [
          { method: 'GET', path: '/api/gift-cards', desc: 'Seznam kartic + stats (issued, balance)', auth: true },
          { method: 'GET', path: '/api/gift-cards?number=GC-X', desc: 'Lookup po številki (POS redeem)', auth: true },
          { method: 'POST', path: '/api/gift-cards', desc: 'Izdaj kartico (auto GC-2026-XXXX)', auth: true },
          { method: 'PATCH', path: '/api/gift-cards', desc: 'redeem (balance check) / reload / deliver / cancel', auth: true },
        ],
      },
      {
        name: 'Bill Split',
        icon: '💸',
        routes: [
          { method: 'GET', path: '/api/bill-split', desc: 'Seznam delitev', auth: true },
          { method: 'POST', path: '/api/bill-split', desc: 'Ustvari delitev (equal/items/custom)', auth: true },
          { method: 'PATCH', path: '/api/bill-split', desc: 'Označi share kot plačan (auto order paid!)', auth: true },
        ],
      },
      {
        name: 'Tips',
        icon: '💰',
        routes: [
          { method: 'GET', path: '/api/tips', desc: 'Seznam distribucij + daily summary', auth: true },
          { method: 'GET', path: '/api/tips?summary=true&date=X', desc: 'Dnevni povzetek (totalTips, byServer)', auth: true },
          { method: 'POST', path: '/api/tips', desc: 'Distribuiraj tips (individual/shared/pooled)', auth: true },
          { method: 'PATCH', path: '/api/tips', desc: 'approve / pay / reject', auth: true },
        ],
      },
      {
        name: 'Payments',
        icon: '💳',
        routes: [
          { method: 'POST', path: '/api/payments/create-intent', desc: 'Stripe payment intent', auth: true },
          { method: 'POST', path: '/api/payments/webhook', desc: 'Stripe webhook (auto order paid + loyalty!)', auth: false },
          { method: 'GET', path: '/api/payments/list', desc: 'Zgodovina plačil + stats (successRate)', auth: true },
        ],
      },
      {
        name: 'Cash Drawer',
        icon: '🗄️',
        routes: [
          { method: 'GET', path: '/api/cash-drawer', desc: 'Seznam sej + stats (discrepancy)', auth: true },
          { method: 'GET', path: '/api/cash-drawer?active=true', desc: 'Trenutno odprta seja', auth: true },
          { method: 'POST', path: '/api/cash-drawer', desc: 'Odpri sejo (opening float)', auth: true },
          { method: 'PATCH', path: '/api/cash-drawer', desc: 'pay_in / pay_out / close (discrepancy!) / reconcile', auth: true },
        ],
      },
      {
        name: 'Printers',
        icon: '🖨️',
        routes: [
          { method: 'GET', path: '/api/printers', desc: 'Seznam tiskalnikov + stats', auth: true },
          { method: 'POST', path: '/api/printers', desc: 'Dodaj tiskalnik (ESC/POS)', auth: true },
          { method: 'PATCH', path: '/api/printers', desc: 'Posodobi (online/offline, settings)', auth: true },
          { method: 'DELETE', path: '/api/printers?id=X', desc: 'Odstrani', auth: true },
          { method: 'POST', path: '/api/printers/print', desc: 'Print receipt/kitchen_order (auto station routing!)', auth: true },
          { method: 'POST', path: '/api/printers/seed', desc: 'Seed 3 printerje', auth: true },
        ],
      },
      {
        name: 'Notifications',
        icon: '🔔',
        routes: [
          { method: 'GET', path: '/api/notifications', desc: 'Seznam obvestil + stats', auth: true },
          { method: 'GET', path: '/api/notifications?templates=true', desc: '9 predpripravljenih templates', auth: true },
          { method: 'POST', path: '/api/notifications', desc: 'Pošlji (template-based ali custom)', auth: true },
          { method: 'PATCH', path: '/api/notifications', desc: 'mark as read / retry failed', auth: true },
        ],
      },
      {
        name: 'Expenses & P&L',
        icon: '📊',
        routes: [
          { method: 'GET', path: '/api/expenses', desc: 'Seznam stroškov + stats (byCategory)', auth: true },
          { method: 'POST', path: '/api/expenses', desc: 'Ustvari strošek (auto VAT calc, recurring)', auth: true },
          { method: 'PATCH', path: '/api/expenses', desc: 'approve / pay / reject / update', auth: true },
          { method: 'DELETE', path: '/api/expenses?id=X', desc: 'Izbriši strošek', auth: true },
          { method: 'GET', path: '/api/expenses/pnl', desc: 'P&L (Profit & Loss) — celovit finančni izpavek!', auth: true },
          { method: 'POST', path: '/api/expenses/seed', desc: 'Seed 15 kategorij stroškov', auth: true },
        ],
      },
      {
        name: 'Reports',
        icon: '📈',
        routes: [
          { method: 'GET', path: '/api/reports', desc: 'Agregirana poročila (sales/labor/inventory/tables)', auth: true },
          { method: 'GET', path: '/api/reports?range=week&type=sales', desc: 'Filter po obdobju in tipu', auth: true },
        ],
      },
      {
        name: 'Settings',
        icon: '⚙️',
        routes: [
          { method: 'GET', path: '/api/settings', desc: 'Vse nastavitve + delovni čas (auto-seed)', auth: true },
          { method: 'PATCH', path: '/api/settings', desc: 'Posodobi nastavitve (DDV, FURS, receipt)', auth: true },
          { method: 'PATCH', path: '/api/settings?hours=true', desc: 'Posodobi delovni čas', auth: true },
          { method: 'POST', path: '/api/settings/seed', desc: 'Seed default nastavitve', auth: true },
        ],
      },
      {
        name: 'Audit Log',
        icon: '📜',
        routes: [
          { method: 'GET', path: '/api/audit', desc: 'Seznam logov + stats (byEntity, byAction)', auth: true },
          { method: 'GET', path: '/api/audit?entityType=order&id=X', desc: 'Entity audit trail', auth: true },
          { method: 'POST', path: '/api/audit', desc: 'Ročni audit entry', auth: true },
        ],
      },
      {
        name: 'Export',
        icon: '📤',
        routes: [
          { method: 'GET', path: '/api/export', desc: 'Seznam 11 tipov izvoza', auth: true },
          { method: 'GET', path: '/api/export?type=orders&from=X&to=Y', desc: 'CSV download (FURS, računovodstvo)', auth: true },
        ],
      },
      {
        name: 'System',
        icon: '🩺',
        routes: [
          { method: 'GET', path: '/api/health', desc: 'System health check (DB, uptime, KPIs)', auth: false },
          { method: 'GET', path: '/api/dashboard/overview', desc: 'Dashboard overview (legacy)', auth: false },
          { method: 'GET', path: '/api/dashboard/stats', desc: 'Unified Command Center (10 sekcij, 14 queries)', auth: false },
          { method: 'GET', path: '/api', desc: 'Ta API indeks', auth: false },
        ],
      },
    ],
  })
}
