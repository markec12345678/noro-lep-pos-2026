# Cash Drawer — Backend Setup

This feature requires 1 new Cockpit CMS collection:

## Collection: `cashdrawersession`

| Field name      | Type    | Required | Notes                                                  |
|-----------------|---------|----------|--------------------------------------------------------|
| `user`          | text    | yes      | Cashier name (from logged-in user)                     |
| `openedAt`      | number  | yes      | Unix timestamp (seconds) when session was opened       |
| `closedAt`      | number  | no       | Unix timestamp when session was closed                 |
| `openingFloat`  | number  | yes      | Cash counted into the drawer at session start          |
| `closingCount`  | number  | no       | Cash counted at session close                          |
| `expectedCash`  | number  | no       | Computed: openingFloat + cash sales during session     |
| `difference`    | number  | no       | closingCount - expectedCash (positive = over)          |
| `notes`         | text    | no       | Optional notes (e.g. explanation of over/short)        |
| `isOpen`        | boolean | yes      | `true` while the session is active                     |

**Label expression:** `${data.user} — ${data.openedAt}`

## Workflow

### Opening a session
1. Cashier clicks "Open Session" on the Cash Drawer page
2. Counts starting cash in the drawer
3. Enters the amount, clicks "Open Session"
4. Backend creates a `cashdrawersession` with `isOpen=true`, `openingFloat`, `openedAt=now`

### During the session
- The page polls `orders` and computes `expectedCash = openingFloat + Σ completed orders created between openedAt and now`
- Note: this assumes ALL completed orders were paid in cash. When payment
  methods are added later, the filter should be `payment_method = "cash"`.

### Closing a session
1. Cashier clicks "Close Session"
2. Dialog pre-fills "expected" amount (opening + cash sales)
3. Cashier counts actual cash, enters the count
4. Live diff indicator shows: balanced / over / short
5. Optional notes for any discrepancy
6. On submit, backend updates the session with `closedAt`, `closingCount`,
   `expectedCash`, `difference`, `notes`, `isOpen=false`

### Session history
The page lists all past sessions with their differences, status badges,
and timestamps — useful for end-of-day reconciliation and audits.

## Slovenian fiscal compliance note

Cash drawer sessions are **strongly recommended** for Slovenian
restaurants under the davčna blagajna regime — FURS expects businesses
to track cash flow with audit trails. Pair this with the planned FURS
integration (ZOI / QR code on receipts) for full compliance.
