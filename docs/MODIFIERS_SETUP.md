# Menu Modifiers — Backend Setup Guide

This document describes the Cockpit CMS collections that must be created
in the backend to support the menu modifiers feature.

> **TL;DR** — Create 2 new collections (`modifiergroup`, `modifieroption`),
> add a `contentItemLink` field to the existing `menu` collection, and
> add a `json` field to the existing `orderitem` collection.

## 1. New collection: `modifiergroup`

Login to Cockpit CMS at `http://localhost:3030` (admin / admin),
go to **Content → Collections → Create Collection**, and create:

| Field name    | Type    | Required | Options / notes                          |
|---------------|---------|----------|------------------------------------------|
| `name`        | text    | yes      | e.g. "Size", "Toppings", "Spice Level"   |
| `required`    | boolean | no       | Default `false`. Customer must select.   |
| `multiSelect` | boolean | no       | Default `false`. Allow multiple picks.   |
| `minSelect`   | number  | no       | Only when `multiSelect=true`.            |
| `maxSelect`   | number  | no       | `0` = unlimited.                         |
| `sort`        | number  | no       | Display order. Lower appears first.      |

**Label expression:** `${data.name}`

## 2. New collection: `modifieroption`

| Field name | Type              | Required | Options / notes                                  |
|------------|-------------------|----------|--------------------------------------------------|
| `name`     | text              | yes      | e.g. "Extra Cheese", "Large", "Spicy"            |
| `price`    | number            | yes      | Price delta added to menu base price. `0` = free.|
| `default`  | boolean           | no       | Pre-selected in single-select groups.            |
| `sort`     | number            | no       | Display order within group.                      |
| `group`    | contentItemLink   | yes      | Link → `modifiergroup` collection. `multiple: false`. Display: `${data.name}`. |

**Label expression:** `${data.name} (+${data.price}€)`

## 3. Update existing `menu` collection

Add a new field:

| Field name        | Type            | Required | Options                                       |
|-------------------|-----------------|----------|-----------------------------------------------|
| `modifierGroups`  | contentItemLink | no       | Link → `modifiergroup`. **`multiple: true`**. Display: `${data.name}`. |

This allows a menu item to reference zero, one, or many modifier groups.

## 4. Update existing `orderitem` collection

Add two new fields:

| Field name           | Type | Required | Notes                                                            |
|----------------------|------|----------|------------------------------------------------------------------|
| `selectedModifiers`  | json | no       | Array of `{groupId, groupName, optionId, optionName, price}`.   |
| `base_price`         | number | no     | Menu base price at add-to-cart time (without modifier deltas).   |

The `price` field already on `orderitem` should now store the **effective
unit price** = `base_price + sum(selectedModifiers.price)`.

## 5. Verification

After creating the collections:

1. In **Food Menus** page, click the new sliders icon (purple) on a row.
2. Create a modifier group named "Size" with options Small (+0), Medium (+2), Large (+4).
3. Link it to a pizza menu item.
4. In **POS**, click that pizza — the selection modal should open with the
   size options.
5. Pick Large, add to cart — the cart should show `€<base+4>`.

## 6. Why snapshots?

When an order item is added, we store a **snapshot** of each selected
modifier option (name + price) rather than just a link. This means:

- If a manager later renames "Extra Cheese" to "Double Cheese", old
  receipts still say "Extra Cheese".
- If the price goes from €1.50 to €2.00, old orders keep €1.50.
- Reporting stays accurate to what was actually sold.

This matches how Toast's Menus API handles modifier persistence on orders.
