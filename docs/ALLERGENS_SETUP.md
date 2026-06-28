# Allergen Tracking — EU FIC 1169/2011 Compliance

Implements the 14 mandatory allergens required by EU Regulation (EU)
No 1169/2011 (Food Information for Consumers — FIC). Slovenian
restaurants are legally required to declare which allergens are
present in each dish.

## The 14 EU Allergens

| # | Code           | Slovenian label  | Icon |
|---|----------------|------------------|------|
| 1 | gluten         | Gluten           | 🌾   |
| 2 | crustaceans    | Raki             | 🦞   |
| 3 | eggs           | Jajca            | 🥚   |
| 4 | fish           | Ribe             | 🐟   |
| 5 | peanuts        | Arašidi          | 🥜   |
| 6 | soybeans       | Soja             | 🫘   |
| 7 | milk           | Mleko            | 🥛   |
| 8 | nuts           | Oreški           | 🌰   |
| 9 | celery         | Zelena           | 🥬   |
| 10| mustard        | Gorčica          | 🟡   |
| 11| sesame         | Sezam            | ⚪   |
| 12| sulphites      | Sulfiti          | 🍷   |
| 13| lupin          | Volčji bob       | 🌼   |
| 14| molluscs       | Mehkužci         | 🦑   |

## Cockpit CMS changes

### Update `menu` collection

Add a new field:

| Field name  | Type | Required | Notes                                              |
|-------------|------|----------|----------------------------------------------------|
| `allergens` | json | no       | Array of allergen code strings (e.g. ["gluten","milk"]) |

The field stores a JSON array of allergen enum values. Example:
```json
["gluten", "milk", "eggs"]
```

Items with no allergens have an empty array `[]` or no field at all.

## Frontend components

### AllergenBadge (`src/components/custom/allergens/`)

Single allergen pill with icon + label + color. Used in receipts,
detail dialogs, and anywhere space allows full labels.

### AllergenIcons

Compact icon-only display for menu cards (saves space). Shows up to
8 allergen icons + "+N" indicator for items with more.

### AllergenSelector (manager)

Grid of 14 toggle buttons used in the FoodMenus create/edit dialog.
Each button shows the allergen icon, label, and EU number.
Selected buttons get the allergen's color background.

### AllergenFilter (guest-facing)

Compact filter on the public menu. Guests tap allergens they want to
AVOID (e.g. "I'm allergic to peanuts"). Items containing any selected
allergen are hidden from the menu in real-time.

Shows first 7 allergens by default with a "Več..." button to expand
to all 14. Includes a "Počisti (N)" clear button.

## Where allergens appear

### Manager POS (POS.tsx)
- Menu cards show allergen icons under the item name
- Hovering over an icon shows the full allergen description as tooltip
- Helps waiters answer customer questions about ingredients

### FoodMenus admin (FoodMenus.tsx)
- Allergen selector in create/edit dialog (14 toggle buttons)
- Allergen icons shown in the table under each item name
- Manager can quickly see which items have allergens declared

### Public menu (PublicMenu.tsx)
- Allergen filter at the top (guests select what to avoid)
- Each menu card shows allergen icons
- Items with selected allergens are hidden from view
- Guests can clear the filter with one click

### Receipts (PrintOrderDetails.tsx)
- Allergen list shown per item on the printed receipt
- Helps customers verify their order is safe

## Legal compliance

Per Regulation (EU) No 1169/2011, Article 9:
- Allergen information must be provided for all food sold to consumers
- Must be clearly indicated and easily visible
- Must reference the 14 allergens listed in Annex II

This implementation satisfies the requirement by:
1. Storing allergens per menu item in the database
2. Displaying them visually (icons + labels) on all customer-facing surfaces
3. Allowing guests to filter out unsafe items
4. Printing allergen info on receipts for reference

## Future enhancements

- **Cross-contamination warnings**: "May contain traces of..." field
  for items produced in facilities that handle allergens
- **Detailed ingredient lists**: per-item ingredient breakdown
- **Nutritional information**: calories, fat, protein, carbs per item
- **Allergen reports**: export list of all items containing a specific
  allergen (useful for health inspections)
- **Multi-language allergen labels**: for international guests
