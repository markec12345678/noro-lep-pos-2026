# Inventory & Stock Management — Backend Setup

This feature requires 3 new Cockpit CMS collections:

## 1. Collection: `inventoryitem`

| Field name  | Type   | Required | Notes                                              |
|-------------|--------|----------|----------------------------------------------------|
| `name`      | text   | yes      | e.g. "Mozzarella 1kg", "Pizza box 32cm"            |
| `sku`       | text   | no       | Internal stock-keeping code                        |
| `unit`      | select | yes      | Options: `kg`, `g`, `l`, `ml`, `pc`, `box`         |
| `quantity`  | number | yes      | Current quantity in stock                          |
| `threshold` | number | no       | Low-stock threshold (default 0)                    |
| `cost`      | number | no       | Last-known purchase cost per unit (€)              |
| `supplier`  | text   | no       | Supplier name                                      |

**Label expression:** `${data.name}`

## 2. Collection: `recipeitem`

Maps a menu item to the inventory items it consumes per serving.

| Field name       | Type            | Required | Notes                                       |
|------------------|-----------------|----------|---------------------------------------------|
| `menu`           | contentItemLink | yes      | Link → `menu`. `multiple: false`.           |
| `inventoryItem`  | contentItemLink | yes      | Link → `inventoryitem`. `multiple: false`.  |
| `quantity`       | number          | yes      | Per single serving (in inventoryItem.unit). |

**Label expression:** `${data.menu.name} → ${data.inventoryItem.name}`

## 3. Collection: `stocktransaction`

Audit log for every stock movement.

| Field name       | Type            | Required | Notes                                                        |
|------------------|-----------------|----------|--------------------------------------------------------------|
| `inventoryItem`  | contentItemLink | yes      | Link → `inventoryitem`. `multiple: false`.                   |
| `type`           | select          | yes      | Options: `restock`, `decrement`, `adjustment`, `waste`      |
| `delta`          | number          | yes      | Signed change (positive for restock, negative for decrement) |
| `balanceAfter`   | number          | yes      | Snapshot of resulting quantity                               |
| `reason`         | text            | no       | Free-text reason                                             |
| `user`           | text            | no       | Who performed the change                                     |

**Label expression:** `${data.type} ${data.delta} (${data.reason})`

## How stock decrement works

When an order is checked out via the POS cart sidebar:

1. Frontend fetches ALL `recipeitem` entries (cached via React Query).
2. Filters to those whose `menu` link matches each completed order item's menu ID.
3. For each matching recipe, calls `useApplyStockMovement` which:
   - Reads current `inventoryitem.quantity`
   - Computes `newQty = max(0, current - recipe.quantity × orderItem.quantity)`
   - Updates `inventoryitem.quantity`
   - Writes a `stocktransaction` row with `type=decrement`

Failures are non-blocking — checkout succeeds even if stock update fails
(order is already paid; stock can be reconciled later via audit log).

## Low-stock alerts

The Inventory page shows a "Low stock" badge when `quantity < threshold`.
A realtime event `inventory:low_stock` can be emitted from the
`useApplyStockMovement.onSuccess` to trigger toast notifications
across all open tabs (TODO: implement emission when threshold is crossed).
