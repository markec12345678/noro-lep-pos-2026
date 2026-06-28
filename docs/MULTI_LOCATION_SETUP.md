# Multi-Location Support — Setup Guide

Enables a restaurant chain to manage multiple locations from a single
POS installation. Each location has its own tables, menus, inventory,
orders, staff, etc. The active location is tracked client-side and
used to filter all data queries. Inspired by Toast's multi-location
management (Restaurants API + Partners API concept).

## Architecture

```
  ┌─────────────────────────────────────────────────────────┐
  │                    POS Frontend                          │
  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
  │  │ Location    │  │ Location    │  │ All services │    │
  │  │ Provider    │→│ Switcher    │  │ (use location │    │
  │  │ (context)   │  │ (header)    │  │  filter)     │    │
  │  └──────┬──────┘  └─────────────┘  └──────┬──────┘    │
  │         │ activeLocationId                │             │
  │         │ stored in localStorage          │ filter in   │
  │         │                                 │ Cockpit URL │
  └─────────┼─────────────────────────────────┼────────────┘
            │                                 │
            ↓                                 ↓
  ┌─────────────────┐         ┌─────────────────────────┐
  │ Cockpit CMS     │         │ Cockpit CMS queries     │
  │ location        │         │ ?filter={...,location:  │
  │ collection      │         │   "<activeId>"}         │
  └─────────────────┘         └─────────────────────────┘
```

## Cockpit CMS collection

### `location` (new)

| Field               | Type    | Required | Notes                                              |
|---------------------|---------|----------|----------------------------------------------------|
| `name`              | text    | yes      | "Noro Lep Center", "Noro Lep BTC"                  |
| `code`              | text    | yes      | Short code: "CENTER", "BTC"                        |
| `address`           | text    | yes      | Street address                                     |
| `city`              | text    | yes      | City                                               |
| `postalCode`        | text    | yes      | Postal code                                        |
| `phone`             | text    | yes      | Phone number                                       |
| `email`             | text    | no       | Email                                              |
| `taxNumber`         | text    | yes      | Slovenian tax number (each location may differ)    |
| `businessPremiseId` | text    | yes      | FURS business premise ID (registered per location) |
| `defaultTaxRate`    | number  | yes      | Default DDV % (22, 9.5, 0)                         |
| `currency`          | text    | yes      | ISO 4217 (EUR, USD, GBP, CHF)                      |
| `active`            | boolean | yes      | Inactive locations hidden from switcher            |
| `timezone`          | text    | no       | IANA name (e.g. "Europe/Ljubljana")                |
| `notes`             | text    | no       | Operating hours, notes                             |

**Label expression:** `${data.name} (${data.code})`

### Adding `location` field to existing collections

For full multi-location filtering, add a `location` field
(contentItemLink → `location`, `multiple: false`) to each of these
existing collections:

- `table`
- `menu`
- `category`
- `order`
- `orderitem`
- `inventoryitem`
- `recipeitem`
- `cashdrawersession`
- `reservation`
- `customer` (optional — customers can be shared across locations)
- `supplier` (optional — suppliers can be shared across locations)
- `invoice` (optional — invoices can be shared)

This is a one-time schema change in Cockpit CMS. Existing records
will have `location: null` — they'll appear in all locations until
explicitly assigned.

## Frontend architecture

### LocationProvider (src/services/locationService.tsx)

A React Context provider mounted at the app root (inside
QueryClientProvider, outside AppInner). It:

1. Fetches all active locations on mount
2. Reads the stored `activeLocationId` from localStorage
3. Validates the stored ID against available locations
   - If invalid (e.g. location was deleted), falls back to first available
4. Exposes `{ activeLocationId, activeLocation, locations, isMultiLocation }`
5. Persists location changes to localStorage

### useActiveLocation hook

Used by any component that needs to know the active location:

```ts
const { activeLocation, activeLocationId, isMultiLocation } = useActiveLocation();
```

### useLocationFilter hook

Returns a Cockpit CMS filter fragment for the active location:

```ts
const locFilter = useLocationFilter();
// Returns: ',location:"<activeId>"' or '' if no location

const url = `${API_URL}/api/content/items/table?filter={status:"available"${locFilter}}`;
```

### LocationSwitcher component

A dropdown in the app header (next to the user menu). Shows the
active location name + code. Clicking opens a list of all active
locations. Selecting one calls `setActiveLocationId` which:

1. Updates the context state
2. Persists to localStorage
3. All queries that include the location filter refetch automatically
   (React Query detects the query key change)

**Hidden when only one location exists** (single-location mode) —
the switcher only appears when `isMultiLocation === true`.

## How filtering works

The `useLocationFilter` hook returns a string fragment that gets
appended to Cockpit CMS filter queries. Example:

Without location filtering:
```
/api/content/items/table?filter={status:"available"}
```

With location filtering (active location = "abc123"):
```
/api/content/items/table?filter={status:"available",location:"abc123"}
```

Services that support location filtering can use the hook:

```ts
const locFilter = useLocationFilter();
const url = `${API_URL}/api/content/items/table?populate=1&filter={status:"available"${locFilter}}`;
```

**Note**: The existing service files do not yet include location
filtering in their query URLs. To enable per-location filtering,
each service's query function would need to incorporate the
`useLocationFilter` hook. This is a gradual migration — the
LocationProvider and Switcher work immediately, but full data
isolation requires updating each service's fetch URL.

For a new deployment, add the `location` field to all collections
during initial setup and update the service query URLs to include
the filter from day one.

## FURS multi-location compliance

In Slovenia, each restaurant location must:

1. Register separately with FURS (different businessPremiseId)
2. Have its own davčna številka (tax number) — or use the
   company's tax number with a different premise ID
3. Issue invoices with the location's own invoice sequence
4. Submit invoices to FURS from each location's electronic device

The `Location` entity stores `taxNumber` and `businessPremiseId`
per location. The FURS mini-service (port 3004) uses these when
generating ZOI and submitting invoices.

When switching locations, the FURS config is automatically scoped
to the active location's tax number + premise ID.

## Single-location mode

For restaurants with only one location:
- Create one Location record during initial setup
- The LocationSwitcher is automatically hidden (`isMultiLocation === false`)
- All data flows through without filtering (location filter returns "")
- The Locations admin page is still accessible but only shows one entry

This means single-location deployments work exactly like before —
multi-location is an additive feature that doesn't change the
single-location experience.

## Manager workflow

1. Go to `/locations` (Locations nav entry with Store icon)
2. Click "Nova lokacija" to add a new location
3. Fill in: name, code, address, tax number, FURS premise ID, etc.
4. The new location appears in the header switcher
5. Click the switcher to select the active location
6. All data (tables, orders, inventory, etc.) is now scoped to that location
7. Switch back anytime — the selection persists across sessions

## Reports aggregation

The Reports page can show either:
- **Per-location stats**: filtered by the active location
- **Chain-wide stats**: aggregated across all locations

A toggle on the Reports page (future enhancement) would let the
manager switch between "this location" and "all locations" views.

## Future enhancements

- **Per-location staff assignments**: link users to specific locations
  (a waiter at Location A can't see Location B's tables)
- **Cross-location inventory transfers**: move stock between locations
  with audit trail
- **Chain-wide loyalty**: customers earn points at any location,
  redeemable at any location
- **Centralized menu management**: edit menu once, push to all locations
  (or per-location menu overrides)
- **Location-specific pricing**: same menu item, different price per location
- **Chain reports**: compare performance across locations
