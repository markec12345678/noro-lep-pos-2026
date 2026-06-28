# Reservations — Setup Guide

Table reservation system with both a manager-facing calendar/list view
and a public booking page where guests can reserve a table online
without authentication.

## Architecture

```
  Guest phone                     Manager POS
  ┌──────────┐                   ┌──────────────┐
  │ /public/ │                   │ /reservations│
  │reservation│                   │ calendar+list│
  └─────┬────┘                   └──────┬───────┘
        │                               │
        │ POST /api/public/reservation  │ authenticated Cockpit CMS
        │ GET  /api/public/slots        │
        ↓                               ↓
  ┌─────────────────┐         ┌─────────────────┐
  │ pos-public      │ ──→    │ Cockpit CMS      │
  │ mini-service    │         │ reservation      │
  │ (port 3005)     │ ←──     │ collection       │
  └─────────────────┘         └─────────────────┘
        │
        │ WebSocket emit (reservation:created)
        ↓
  ┌─────────────────┐
  │ pos-realtime    │
  │ (port 3003)     │
  └─────────────────┘
        │
        ↓ broadcast to all manager tabs
  Reservations page auto-refreshes
```

## Cockpit CMS collection

### `reservation` (new)

| Field              | Type            | Required | Notes                                            |
|--------------------|-----------------|----------|--------------------------------------------------|
| `customerName`     | text            | yes      | Guest name                                       |
| `customerPhone`    | text            | yes      | Phone (min 6 chars)                              |
| `customerEmail`    | text            | no       | Email                                            |
| `date`             | text            | yes      | YYYY-MM-DD                                       |
| `time`             | text            | yes      | HH:MM (24h)                                      |
| `partySize`        | number          | yes      | 1-20                                             |
| `table`            | contentItemLink | no       | Optional table assignment (link → table)         |
| `notes`            | text            | no       | Special requests                                 |
| `status`           | select          | yes      | `pending`, `confirmed`, `cancelled`, `completed`, `no-show` |
| `source`           | select          | yes      | `guest` (online) or `staff` (POS-created)        |
| `staff`            | text            | no       | Staff member who created/updated                 |
| `confirmationCode` | text            | yes      | 6-char alphanumeric (excludes 0/O/1/I/L)         |

**Label expression:** `${data.date} ${data.time} - ${data.customerName}`

## Mini-service: pos-public (port 3005)

Two new endpoints added:

| Endpoint                              | Method | Auth | Purpose                              |
|---------------------------------------|--------|------|--------------------------------------|
| `/api/public/reservation/slots`       | GET    | none | Available time slots for date+size   |
| `/api/public/reservation`             | POST   | none | Create a guest reservation           |

### Slot availability logic

Default opening hours: lunch 11:00–15:00, dinner 17:00–22:00 (30-min intervals = 18 slots).

A slot is **unavailable** when:
1. The date is in the past (before today)
2. The slot time has already passed (for today's date)
3. There are already 8+ active (non-cancelled) reservations at that exact time

The capacity (8 per slot) is configurable in the mini-service source
(`MAX_PER_SLOT` in `index.ts`). For per-table capacity, a future
enhancement would link reservations to specific tables and check per-table
availability.

### Confirmation codes

Each reservation gets a unique 6-character alphanumeric code using the
charset `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (excludes ambiguous chars
0/O/1/I/L for readability). The code is checked for uniqueness against
the database (up to 5 retry attempts).

## Reservation workflow

### Guest flow (public booking page)

1. Guest visits `/public/reservation` (linked from the public menu)
2. Picks a date (today through 60 days ahead)
3. Selects party size (1-8 quick buttons + 9+ custom input)
4. Sees available time slots (greys out unavailable)
5. Enters name, phone (required), email, notes
6. Submits → server validates, generates confirmation code, stores with status=pending
7. Confirmation screen shows code + reservation details
8. WebSocket event emitted → manager's Reservations page refreshes

### Manager flow (POS admin)

1. Manager opens `/reservations`
2. Sees date navigator (prev / today / next) with weekday + date
3. Stats: total reservations, pending, confirmed, total guests
4. Filter by status (all / pending / confirmed / cancelled / completed / no-show)
5. Each row shows: time, guest name, party size, contact, notes, code, status
6. Quick actions:
   - Pending → Confirm (✓)
   - Cancel (✗)
   - Mark as no-show (UserX icon)
   - Confirmed → Complete (✓)
7. Edit / delete via icons
8. Create new reservation (staff-created) — defaults to status=confirmed

### Status lifecycle

```
   pending ──── confirm ──── confirmed ──── complete ──── completed
      │                          │
      │                          └──── cancel ──── cancelled
      │
      └──── no-show ──── no-show
```

- **pending**: Just submitted by guest, awaiting manager confirmation
- **confirmed**: Manager confirmed the table is available
- **cancelled**: Either guest cancelled or manager cancelled
- **completed**: Guests arrived and finished their meal
- **no-show**: Reservation time passed but guests didn't arrive

## Realtime integration

When a guest submits a reservation:
- pos-public emits `reservation:created` to pos-realtime (port 3003)
- All manager tabs invalidate their `["reservations"]` React Query cache
- Reservations page refetches within ~1 second — no manual refresh

When a manager updates a reservation:
- reservationService emits `reservation:updated` (or `reservation:cancelled`)
- Same invalidation flow

## Public menu integration

The public menu page (`/public/menu/:tableToken`) header includes a link
to `/public/reservation` so guests can also book a table without ordering.

## Future enhancements

- **Email/SMS confirmation**: send the confirmation code to the guest's
  email/phone automatically (requires SMTP/SMS gateway integration)
- **Per-table assignment**: link reservations to specific tables and
  check per-table availability instead of global slot capacity
- **Custom opening hours**: per-day-of-week opening hours (e.g. closed Mondays)
- **Recurring reservations**: weekly/biweekly for regular customers
- **Waitlist**: when a slot is full, offer to add to a waitlist
- **Deposit/prepayment**: require card prepayment for large parties
