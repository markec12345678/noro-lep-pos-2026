# Loyalty Program — Setup Guide

A points-based loyalty program that rewards repeat customers. Customers
are identified by phone number — no app install or card required.

## Architecture

```
  POS Checkout                          Public Menu
  ┌──────────────┐                      ┌──────────────┐
  │ Enter phone  │                      │ Guest enters │
  │ → look up    │                      │ phone at     │
  │   customer   │                      │ checkout     │
  └──────┬───────┘                      └──────┬───────┘
         │                                     │
         └──────────────┬──────────────────────┘
                        ↓
              ┌─────────────────┐
              │ customerService │
              │  find-or-create │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ loyaltyService  │
              │ earn / redeem   │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ Cockpit CMS     │
              │ customer,       │
              │ loyaltyreward,  │
              │ loyaltytransaction│
              └─────────────────┘
```

## Cockpit CMS collections

### 1. `customer` (new)

| Field           | Type   | Required | Notes                                       |
|-----------------|--------|----------|---------------------------------------------|
| `phone`         | text   | yes      | Unique identifier (e.g. "031234567")        |
| `name`          | text   | yes      | Display name                                |
| `email`         | text   | no       | Optional, for marketing                     |
| `points`        | number | yes      | Current balance                             |
| `lifetimePoints`| number | yes      | Lifetime total (never decreases)            |
| `totalSpent`    | number | yes      | Total € spent across all orders             |
| `visits`        | number | yes      | Order count                                 |
| `firstVisitAt`  | number | no       | Unix timestamp of first visit               |
| `lastVisitAt`   | number | no       | Unix timestamp of last visit                |
| `birthday`      | text   | no       | For birthday bonus points                   |
| `notes`         | text   | no       | Staff notes                                 |

**Label expression:** `${data.name} (${data.phone})`

### 2. `loyaltyreward` (new)

| Field            | Type   | Required | Notes                                         |
|------------------|--------|----------|-----------------------------------------------|
| `name`           | text   | yes      | e.g. "Free Coffee", "10% Off"                 |
| `description`    | text   | no       | Shown to customer                             |
| `pointsCost`     | number | yes      | Points required to redeem                     |
| `discountType`   | select | yes      | `fixed`, `percent`, or `item`                 |
| `discountValue`  | number | yes      | € amount (fixed), % (percent), or 0 (item)    |
| `active`         | boolean| yes      | Hidden from redemption UI when false          |

**Label expression:** `${data.name} (${data.pointsCost} pts)`

### 3. `loyaltytransaction` (new — audit log)

| Field         | Type            | Required | Notes                                    |
|---------------|-----------------|----------|------------------------------------------|
| `customer`    | contentItemLink | yes      | Link → `customer`. `multiple: false`.    |
| `type`        | select          | yes      | `earn`, `redeem`, `adjust`, `expire`    |
| `points`      | number          | yes      | Signed delta (+ earn, - redeem)          |
| `balanceAfter`| number          | yes      | Snapshot of resulting balance            |
| `reason`      | text            | no       | Free-text reason                         |
| `order`       | contentItemLink | no       | Link to triggering order                 |
| `reward`      | contentItemLink | no       | Link to redeemed reward                  |
| `staff`       | text            | no       | Staff member who performed the action    |

### 4. `loyaltyconfig` (new — singleton)

| Field           | Type    | Required | Notes                                    |
|-----------------|---------|----------|------------------------------------------|
| `pointsPerEuro` | number  | yes      | Points earned per €1 spent (default 1)   |
| `signupBonus`   | number  | no       | Bonus points on first visit (default 0)  |
| `expiryDays`    | number  | no       | Points expire after N days (0 = never)   |
| `enabled`       | boolean | yes      | Master switch                           |
| `welcomeMessage`| text    | no       | Shown to new members                    |

## How points work

### Earning points

At checkout, the cashier enters the customer's phone number in the
LoyaltyPhoneInput component. After the order is completed:

1. **Find-or-create customer** by phone number
2. **Compute earned points**: `floor(grandTotal × pointsPerEuro)`
3. **Apply signup bonus** (if first visit and bonus > 0)
4. **Update customer record**: points += earned, lifetimePoints += earned,
   totalSpent += grandTotal, visits += 1, lastVisitAt = now
5. **Write audit transaction** with type="earn"

### Redeeming rewards

At checkout, if the customer has enough points, the cashier can select
a reward from the available list:

1. **Check balance** ≥ reward.pointsCost
2. **Deduct points**: customer.points -= reward.pointsCost
3. **Compute discount**:
   - `fixed`: deduct reward.discountValue from order total
   - `percent`: deduct (grandTotal × reward.discountValue / 100) from total
   - `item`: manual (no automatic discount — staff gives the item)
4. **Write audit transaction** with type="redeem"
5. **Apply discount** to the grand total before fiscal invoice

### Points expiration

If `loyaltyconfig.expiryDays > 0`, a background job (TODO) should:
1. Find customers whose lastVisitAt is older than expiryDays
2. Set their points to 0
3. Write a transaction with type="expire"

## Frontend pages

### `/customers` (manager only)
- Searchable list of all loyalty members
- Stats: total members, outstanding points, lifetime spend
- Create / edit customer profiles
- Click any row → detail dialog with points history

### `/loyalty-rewards` (manager only)
- Grid of reward cards (name, description, cost, discount)
- Create / edit / delete rewards
- Toggle active/inactive
- Discount type selector (fixed / percent / item)

### POS checkout (CartSidebar)
- LoyaltyPhoneInput component shown above totals
- Debounced phone lookup
- Shows customer info + points balance
- Lists redeemable rewards (filtered by balance)
- Shows "will earn +N points" indicator
- Loyalty discount line in totals
- After checkout: find-or-create + earn + redeem

## Realtime integration

When points change, the customerService emits a `customer:updated`
WebSocket event. All open POS tabs invalidate their customer caches,
so a customer's balance is always up-to-date across multiple devices.

## Security considerations

- Phone numbers are the primary identifier — no password required
  (loyalty is convenience-based, not security-critical)
- Points can only be earned/redeemed by authenticated staff (POS)
  or via the public ordering flow (which is server-validated)
- All point movements are logged in `loyaltytransaction` for audit
- Staff name is recorded on every transaction for accountability
