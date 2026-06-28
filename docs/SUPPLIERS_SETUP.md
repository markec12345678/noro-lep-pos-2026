# Suppliers & Invoices — Setup Guide

Supplier and invoice management module that integrates with the existing
Inventory module. When an invoice is approved, each line item automatically
restocks the linked inventory item (writes a `StockTransactionType.Restock`
audit row). Inspired by Toast's supplier integration (xtraCHEF concept).

## Architecture

```
  Manager creates Invoice
  ┌──────────────┐
  │ /invoices    │
  │ - select     │
  │   supplier   │
  │ - add line   │
  │   items      │
  └──────┬───────┘
         │ 1. Approve invoice
         ↓
  ┌─────────────────┐
  │ supplierService │
  │ useApproveInvoice│
  └──────┬──────────┘
         │ 2. For each line item:
         │    - applyStockMovement (delta = +qty)
         │    - write StockTransaction (type=restock)
         │    - mark line item as restocked=true
         ↓
  ┌─────────────────┐
  │ InventoryItem   │
  │ quantity += qty │
  │ cost updated    │
  └─────────────────┘
         │
         │ 3. Invoice status → "received"
         ↓
  ┌─────────────────┐
  │ Invoice ready   │
  │ for payment     │
  └─────────────────┘
```

## Cockpit CMS collections

### 1. `supplier` (new)

| Field            | Type    | Required | Notes                                          |
|------------------|---------|----------|------------------------------------------------|
| `name`           | text    | yes      | Supplier name (e.g. "Hofer", "Metro")          |
| `contactPerson`  | text    | no       | Contact person                                 |
| `email`          | text    | no       | Email for ordering                             |
| `phone`          | text    | no       | Phone number                                   |
| `address`        | text    | no       | Address                                        |
| `taxNumber`      | text    | no       | Slovenian tax number (e.g. "SI12345678")       |
| `paymentTerms`   | text    | no       | "30 dni", "15 dni", "predračun"                |
| `notes`          | text    | no       | Delivery days, MOQ, etc.                       |
| `active`         | boolean | yes      | Inactive suppliers hidden from dropdowns       |

**Label expression:** `${data.name}`

### 2. `invoice` (new)

| Field            | Type            | Required | Notes                                            |
|------------------|-----------------|----------|--------------------------------------------------|
| `invoiceNumber`  | text            | yes      | Supplier's invoice number (their numbering)      |
| `supplier`       | contentItemLink | yes      | Link → `supplier`. `multiple: false`.            |
| `issueDate`      | text            | yes      | YYYY-MM-DD                                       |
| `receivedDate`   | text            | no       | Set when status → received                       |
| `dueDate`        | text            | no       | YYYY-MM-DD                                       |
| `totalAmount`    | number          | yes      | Auto-computed from line items                    |
| `netAmount`      | number          | no       | Sum of line net amounts                          |
| `taxAmount`      | number          | no       | Sum of line tax amounts                          |
| `status`         | select          | yes      | `draft`, `received`, `paid`, `cancelled`         |
| `paidDate`       | text            | no       | Set when status → paid                           |
| `paymentMethod`  | select          | no       | `cash`, `bank_transfer`, `card`                  |
| `notes`          | text            | no       | Damaged items, partial delivery                  |
| `staff`          | text            | no       | Who entered the invoice                          |

**Label expression:** `${data.invoiceNumber} (${data.supplier.name})`

### 3. `invoiceitem` (new — line items)

| Field            | Type            | Required | Notes                                              |
|------------------|-----------------|----------|----------------------------------------------------|
| `invoice`        | contentItemLink | yes      | Link → `invoice`. `multiple: false`.               |
| `inventoryItem`  | contentItemLink | yes      | Link → `inventoryitem`. `multiple: false`.         |
| `itemName`       | text            | yes      | Snapshot of inventory item name                    |
| `quantity`       | number          | yes      | Quantity delivered                                 |
| `unitPrice`      | number          | yes      | Per-unit price (net, before tax)                   |
| `taxRate`        | number          | yes      | 22, 9.5, or 0                                      |
| `lineTotal`      | number          | yes      | quantity × unitPrice (net)                         |
| `restocked`      | boolean         | yes      | True after stock has been updated (idempotency)    |

**Label expression:** `${data.itemName} × ${data.quantity}`

## Invoice workflow

### Status lifecycle

```
   draft ──── approve ──── received ──── mark paid ──── paid
      │
      └──── cancel ──── cancelled
```

1. **draft**: Invoice created with line items, not yet approved
   - Line items can be added/edited/deleted
   - Total amount auto-computed from line items
2. **received**: Manager approves invoice
   - Each line item triggers an inventory restock (delta = +quantity)
   - StockTransaction audit rows written (type=restock)
   - Line items marked `restocked=true` (idempotent — safe to re-approve)
   - Invoice total + net + tax amounts finalized
   - Line items become read-only
3. **paid**: Manager marks invoice as paid
   - Sets `paidDate` to today
   - Optional: payment method recorded
4. **cancelled**: Invoice voided (e.g. duplicate, error)
   - Stock already restocked is NOT reversed (must be done manually)

### Approval flow (useApproveInvoice composite)

When the manager clicks the green ✓ on a draft invoice:

1. Fetch all `invoiceitem` rows for this invoice
2. For each line item where `restocked === false`:
   a. Resolve the linked `inventoryItem` ID
   b. Call `useApplyStockMovement` with:
      - `delta = +quantity`
      - `type = StockTransactionType.Restock`
      - `reason = "Invoice {number} — {itemName} × {qty}"`
   c. If success: update line item `restocked = true`
   d. If failure: log error, continue with next item
3. Update invoice: `status = received`, `receivedDate = today`
4. Return summary: `{ restockedCount, failedCount, errors }`

If some items fail (e.g. inventory item deleted), the invoice is still
marked as received — the manager can manually restock the failed items
via the Inventory page.

## Frontend pages

### `/suppliers` (manager only)
- Searchable table of all suppliers (by name, contact, phone, tax number)
- Stats: total / active / inactive
- Create / edit / delete with full contact info form
- Toggle active/inactive per supplier
- Click row → detail dialog with:
  - All contact info + payment terms + notes
  - Stats: total invoices, total spend
  - Invoice history table (number, date, amount, status badge)

### `/invoices` (manager only)
- Stats: total, drafts, received, total amount
- Filterable table (search by number + status filter)
- Create invoice dialog (number, supplier, dates, notes)
- Click row → detail dialog with:
  - Invoice header info
  - Line items editor (add/edit/delete while in draft)
  - Inline add form with inventory item picker, qty, price, tax rate
  - Auto-computed totals (net, tax per rate, total)
  - "Knjiženo" badge per line item after approval
  - Approve button (✓) on draft invoices
  - Mark paid button on received invoices
- All Slovenian labels (Račun, Postavke, Skupaj, etc.)

## Auto-restock integration

The key feature: approving an invoice automatically restocks inventory.
This eliminates the need for manual stock adjustments when deliveries
arrive — the manager simply enters the invoice once, and both the
financial record AND the inventory are updated in a single action.

Each restock writes a `StockTransaction` row visible in the Inventory
page's history dialog, with the reason "Invoice {number} — {item} × {qty}"
so the audit trail is complete.

## Realtime integration

When invoices are created/updated, `supplierService` emits WebSocket
events (`invoice:created`, `invoice:updated`) so all manager tabs
refresh their invoice lists.

Inventory changes (from restock) also invalidate the `inventoryItems`
cache via `useApplyStockMovement`, so the Inventory page reflects the
new quantities immediately.

## Future enhancements

- **CSV import**: bulk import invoices from supplier EDI files
- **PDF upload + OCR**: scan paper invoices, auto-extract line items
- **Price history tracking**: track unit price changes per supplier
  per item (compare suppliers over time)
- **Auto-reorder**: when inventory falls below threshold, suggest
  creating a draft invoice to the cheapest supplier
- **Three-way matching**: match invoice → purchase order → goods receipt
  before allowing approval (enterprise procurement feature)
