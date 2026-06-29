#!/usr/bin/env php
<?php
/**
 * Noro Lep POS — Backend Setup Script
 *
 * Creates all 23 Cockpit CMS collections required by the frontend.
 * Run this once after installing Cockpit CMS.
 *
 * Usage:
 *   php setup-collections.php
 *
 * Or via HTTP:
 *   curl http://localhost:3030/setup-collections.php
 *
 * Prerequisites:
 *   - Cockpit CMS running on http://localhost:3030
 *   - Admin user created (admin/admin by default)
 *   - PHP 8.3+ with cURL extension
 */

$COCKPIT_URL = getenv('COCKPIT_URL') ?: 'http://localhost:3030';
$API_KEY = getenv('COCKPIT_API_KEY') ?: 'admin'; // default admin key

// ─── Collection definitions ───────────────────────────────────────────

$collections = [

  // 1. modifiergroup
  'modifiergroup' => [
    'name' => 'modifiergroup', 'label' => 'Modifier Group', 'type' => 'collection',
    'fields' => [
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'required', 'type' => 'boolean', 'label' => 'Required'],
      ['name' => 'multiSelect', 'type' => 'boolean', 'label' => 'Multi-select'],
      ['name' => 'minSelect', 'type' => 'number', 'label' => 'Min selections'],
      ['name' => 'maxSelect', 'type' => 'number', 'label' => 'Max selections'],
      ['name' => 'sort', 'type' => 'number', 'label' => 'Sort order'],
    ],
  ],

  // 2. modifieroption
  'modifieroption' => [
    'name' => 'modifieroption', 'label' => 'Modifier Option', 'type' => 'collection',
    'fields' => [
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'price', 'type' => 'number', 'label' => 'Price delta', 'required' => true],
      ['name' => 'default', 'type' => 'boolean', 'label' => 'Default selected'],
      ['name' => 'sort', 'type' => 'number', 'label' => 'Sort order'],
      ['name' => 'group', 'type' => 'contentItemLink', 'label' => 'Group', 'opts' => ['link' => 'modifiergroup', 'multiple' => false]],
    ],
  ],

  // 3. inventoryitem
  'inventoryitem' => [
    'name' => 'inventoryitem', 'label' => 'Inventory Item', 'type' => 'collection',
    'fields' => [
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'sku', 'type' => 'text', 'label' => 'SKU'],
      ['name' => 'unit', 'type' => 'select', 'label' => 'Unit', 'opts' => ['options' => ['kg','g','l','ml','pc','box']]],
      ['name' => 'quantity', 'type' => 'number', 'label' => 'Quantity', 'required' => true],
      ['name' => 'threshold', 'type' => 'number', 'label' => 'Low-stock threshold'],
      ['name' => 'cost', 'type' => 'number', 'label' => 'Cost per unit'],
      ['name' => 'supplier', 'type' => 'text', 'label' => 'Supplier'],
    ],
  ],

  // 4. recipeitem
  'recipeitem' => [
    'name' => 'recipeitem', 'label' => 'Recipe Item', 'type' => 'collection',
    'fields' => [
      ['name' => 'menu', 'type' => 'contentItemLink', 'label' => 'Menu', 'opts' => ['link' => 'menu', 'multiple' => false]],
      ['name' => 'inventoryItem', 'type' => 'contentItemLink', 'label' => 'Inventory Item', 'opts' => ['link' => 'inventoryitem', 'multiple' => false]],
      ['name' => 'quantity', 'type' => 'number', 'label' => 'Quantity per serving', 'required' => true],
    ],
  ],

  // 5. stocktransaction
  'stocktransaction' => [
    'name' => 'stocktransaction', 'label' => 'Stock Transaction', 'type' => 'collection',
    'fields' => [
      ['name' => 'inventoryItem', 'type' => 'contentItemLink', 'label' => 'Item', 'opts' => ['link' => 'inventoryitem', 'multiple' => false]],
      ['name' => 'type', 'type' => 'select', 'label' => 'Type', 'opts' => ['options' => ['restock','decrement','adjustment','waste']]],
      ['name' => 'delta', 'type' => 'number', 'label' => 'Delta', 'required' => true],
      ['name' => 'balanceAfter', 'type' => 'number', 'label' => 'Balance after'],
      ['name' => 'reason', 'type' => 'text', 'label' => 'Reason'],
      ['name' => 'user', 'type' => 'text', 'label' => 'User'],
    ],
  ],

  // 6. cashdrawersession
  'cashdrawersession' => [
    'name' => 'cashdrawersession', 'label' => 'Cash Drawer Session', 'type' => 'collection',
    'fields' => [
      ['name' => 'user', 'type' => 'text', 'label' => 'User', 'required' => true],
      ['name' => 'openedAt', 'type' => 'number', 'label' => 'Opened at'],
      ['name' => 'closedAt', 'type' => 'number', 'label' => 'Closed at'],
      ['name' => 'openingFloat', 'type' => 'number', 'label' => 'Opening float', 'required' => true],
      ['name' => 'closingCount', 'type' => 'number', 'label' => 'Closing count'],
      ['name' => 'expectedCash', 'type' => 'number', 'label' => 'Expected cash'],
      ['name' => 'difference', 'type' => 'number', 'label' => 'Difference'],
      ['name' => 'notes', 'type' => 'text', 'label' => 'Notes'],
      ['name' => 'isOpen', 'type' => 'boolean', 'label' => 'Is open'],
    ],
  ],

  // 7. fiscalconfig
  'fiscalconfig' => [
    'name' => 'fiscalconfig', 'label' => 'Fiscal Config', 'type' => 'collection',
    'fields' => [
      ['name' => 'taxNumber', 'type' => 'text', 'label' => 'Tax number', 'required' => true],
      ['name' => 'businessUnit', 'type' => 'text', 'label' => 'Business unit ID', 'required' => true],
      ['name' => 'electronicDevice', 'type' => 'text', 'label' => 'Electronic device ID', 'required' => true],
      ['name' => 'lastInvoiceNumber', 'type' => 'number', 'label' => 'Last invoice number'],
      ['name' => 'controlSeq', 'type' => 'number', 'label' => 'Control sequence'],
      ['name' => 'testMode', 'type' => 'boolean', 'label' => 'Test mode'],
      ['name' => 'restaurantName', 'type' => 'text', 'label' => 'Restaurant name'],
      ['name' => 'restaurantAddress', 'type' => 'text', 'label' => 'Restaurant address'],
      ['name' => 'operatorTaxNumber', 'type' => 'text', 'label' => 'Operator tax number'],
    ],
  ],

  // 8. fiscalinvoice
  'fiscalinvoice' => [
    'name' => 'fiscalinvoice', 'label' => 'Fiscal Invoice', 'type' => 'collection',
    'fields' => [
      ['name' => 'order', 'type' => 'contentItemLink', 'label' => 'Order', 'opts' => ['link' => 'order', 'multiple' => false]],
      ['name' => 'invoiceNumber', 'type' => 'text', 'label' => 'Invoice number', 'required' => true],
      ['name' => 'businessUnit', 'type' => 'text', 'label' => 'Business unit'],
      ['name' => 'electronicDevice', 'type' => 'text', 'label' => 'Electronic device'],
      ['name' => 'zoi', 'type' => 'text', 'label' => 'ZOI', 'required' => true],
      ['name' => 'eor', 'type' => 'text', 'label' => 'EOR'],
      ['name' => 'qrCode', 'type' => 'text', 'label' => 'QR code'],
      ['name' => 'issueDateTime', 'type' => 'text', 'label' => 'Issue date/time'],
      ['name' => 'issuedAt', 'type' => 'number', 'label' => 'Issued at'],
      ['name' => 'totalAmount', 'type' => 'number', 'label' => 'Total amount', 'required' => true],
      ['name' => 'taxesByRate', 'type' => 'json', 'label' => 'Taxes by rate'],
      ['name' => 'paymentMethod', 'type' => 'select', 'label' => 'Payment method', 'opts' => ['options' => ['cash','card','other']]],
      ['name' => 'status', 'type' => 'select', 'label' => 'Status', 'opts' => ['options' => ['pending','submitted','failed']]],
      ['name' => 'submittedAt', 'type' => 'number', 'label' => 'Submitted at'],
      ['name' => 'errorMessage', 'type' => 'text', 'label' => 'Error'],
      ['name' => 'attempts', 'type' => 'number', 'label' => 'Attempts'],
    ],
  ],

  // 9. customer
  'customer' => [
    'name' => 'customer', 'label' => 'Customer', 'type' => 'collection',
    'fields' => [
      ['name' => 'phone', 'type' => 'text', 'label' => 'Phone', 'required' => true],
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'email', 'type' => 'text', 'label' => 'Email'],
      ['name' => 'points', 'type' => 'number', 'label' => 'Points'],
      ['name' => 'lifetimePoints', 'type' => 'number', 'label' => 'Lifetime points'],
      ['name' => 'totalSpent', 'type' => 'number', 'label' => 'Total spent'],
      ['name' => 'visits', 'type' => 'number', 'label' => 'Visits'],
      ['name' => 'firstVisitAt', 'type' => 'number', 'label' => 'First visit'],
      ['name' => 'lastVisitAt', 'type' => 'number', 'label' => 'Last visit'],
      ['name' => 'birthday', 'type' => 'text', 'label' => 'Birthday'],
      ['name' => 'notes', 'type' => 'text', 'label' => 'Notes'],
    ],
  ],

  // 10. loyaltyreward
  'loyaltyreward' => [
    'name' => 'loyaltyreward', 'label' => 'Loyalty Reward', 'type' => 'collection',
    'fields' => [
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'description', 'type' => 'text', 'label' => 'Description'],
      ['name' => 'pointsCost', 'type' => 'number', 'label' => 'Points cost', 'required' => true],
      ['name' => 'discountType', 'type' => 'select', 'label' => 'Discount type', 'opts' => ['options' => ['fixed','percent','item']]],
      ['name' => 'discountValue', 'type' => 'number', 'label' => 'Discount value', 'required' => true],
      ['name' => 'active', 'type' => 'boolean', 'label' => 'Active'],
    ],
  ],

  // 11. loyaltytransaction
  'loyaltytransaction' => [
    'name' => 'loyaltytransaction', 'label' => 'Loyalty Transaction', 'type' => 'collection',
    'fields' => [
      ['name' => 'customer', 'type' => 'contentItemLink', 'label' => 'Customer', 'opts' => ['link' => 'customer', 'multiple' => false]],
      ['name' => 'type', 'type' => 'select', 'label' => 'Type', 'opts' => ['options' => ['earn','redeem','adjust','expire']]],
      ['name' => 'points', 'type' => 'number', 'label' => 'Points', 'required' => true],
      ['name' => 'balanceAfter', 'type' => 'number', 'label' => 'Balance after'],
      ['name' => 'reason', 'type' => 'text', 'label' => 'Reason'],
      ['name' => 'order', 'type' => 'contentItemLink', 'label' => 'Order', 'opts' => ['link' => 'order', 'multiple' => false]],
      ['name' => 'reward', 'type' => 'contentItemLink', 'label' => 'Reward', 'opts' => ['link' => 'loyaltyreward', 'multiple' => false]],
      ['name' => 'staff', 'type' => 'text', 'label' => 'Staff'],
    ],
  ],

  // 12. loyaltyconfig
  'loyaltyconfig' => [
    'name' => 'loyaltyconfig', 'label' => 'Loyalty Config', 'type' => 'collection',
    'fields' => [
      ['name' => 'pointsPerEuro', 'type' => 'number', 'label' => 'Points per €'],
      ['name' => 'signupBonus', 'type' => 'number', 'label' => 'Signup bonus'],
      ['name' => 'expiryDays', 'type' => 'number', 'label' => 'Expiry days'],
      ['name' => 'enabled', 'type' => 'boolean', 'label' => 'Enabled'],
      ['name' => 'welcomeMessage', 'type' => 'text', 'label' => 'Welcome message'],
    ],
  ],

  // 13. reservation
  'reservation' => [
    'name' => 'reservation', 'label' => 'Reservation', 'type' => 'collection',
    'fields' => [
      ['name' => 'customerName', 'type' => 'text', 'label' => 'Customer name', 'required' => true],
      ['name' => 'customerPhone', 'type' => 'text', 'label' => 'Phone', 'required' => true],
      ['name' => 'customerEmail', 'type' => 'text', 'label' => 'Email'],
      ['name' => 'date', 'type' => 'text', 'label' => 'Date (YYYY-MM-DD)', 'required' => true],
      ['name' => 'time', 'type' => 'text', 'label' => 'Time (HH:MM)', 'required' => true],
      ['name' => 'partySize', 'type' => 'number', 'label' => 'Party size', 'required' => true],
      ['name' => 'table', 'type' => 'contentItemLink', 'label' => 'Table', 'opts' => ['link' => 'table', 'multiple' => false]],
      ['name' => 'notes', 'type' => 'text', 'label' => 'Notes'],
      ['name' => 'status', 'type' => 'select', 'label' => 'Status', 'opts' => ['options' => ['pending','confirmed','cancelled','completed','no-show']]],
      ['name' => 'source', 'type' => 'select', 'label' => 'Source', 'opts' => ['options' => ['guest','staff']]],
      ['name' => 'staff', 'type' => 'text', 'label' => 'Staff'],
      ['name' => 'confirmationCode', 'type' => 'text', 'label' => 'Confirmation code', 'required' => true],
    ],
  ],

  // 14. supplier
  'supplier' => [
    'name' => 'supplier', 'label' => 'Supplier', 'type' => 'collection',
    'fields' => [
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'contactPerson', 'type' => 'text', 'label' => 'Contact person'],
      ['name' => 'email', 'type' => 'text', 'label' => 'Email'],
      ['name' => 'phone', 'type' => 'text', 'label' => 'Phone'],
      ['name' => 'address', 'type' => 'text', 'label' => 'Address'],
      ['name' => 'taxNumber', 'type' => 'text', 'label' => 'Tax number'],
      ['name' => 'paymentTerms', 'type' => 'text', 'label' => 'Payment terms'],
      ['name' => 'notes', 'type' => 'text', 'label' => 'Notes'],
      ['name' => 'active', 'type' => 'boolean', 'label' => 'Active'],
    ],
  ],

  // 15. invoice
  'invoice' => [
    'name' => 'invoice', 'label' => 'Invoice', 'type' => 'collection',
    'fields' => [
      ['name' => 'invoiceNumber', 'type' => 'text', 'label' => 'Invoice number', 'required' => true],
      ['name' => 'supplier', 'type' => 'contentItemLink', 'label' => 'Supplier', 'opts' => ['link' => 'supplier', 'multiple' => false]],
      ['name' => 'issueDate', 'type' => 'text', 'label' => 'Issue date', 'required' => true],
      ['name' => 'receivedDate', 'type' => 'text', 'label' => 'Received date'],
      ['name' => 'dueDate', 'type' => 'text', 'label' => 'Due date'],
      ['name' => 'totalAmount', 'type' => 'number', 'label' => 'Total amount', 'required' => true],
      ['name' => 'taxAmount', 'type' => 'number', 'label' => 'Tax amount'],
      ['name' => 'netAmount', 'type' => 'number', 'label' => 'Net amount'],
      ['name' => 'status', 'type' => 'select', 'label' => 'Status', 'opts' => ['options' => ['draft','received','paid','cancelled']]],
      ['name' => 'paidDate', 'type' => 'text', 'label' => 'Paid date'],
      ['name' => 'paymentMethod', 'type' => 'select', 'label' => 'Payment method', 'opts' => ['options' => ['cash','bank_transfer','card']]],
      ['name' => 'notes', 'type' => 'text', 'label' => 'Notes'],
      ['name' => 'staff', 'type' => 'text', 'label' => 'Staff'],
    ],
  ],

  // 16. invoiceitem
  'invoiceitem' => [
    'name' => 'invoiceitem', 'label' => 'Invoice Item', 'type' => 'collection',
    'fields' => [
      ['name' => 'invoice', 'type' => 'contentItemLink', 'label' => 'Invoice', 'opts' => ['link' => 'invoice', 'multiple' => false]],
      ['name' => 'inventoryItem', 'type' => 'contentItemLink', 'label' => 'Inventory item', 'opts' => ['link' => 'inventoryitem', 'multiple' => false]],
      ['name' => 'itemName', 'type' => 'text', 'label' => 'Item name', 'required' => true],
      ['name' => 'quantity', 'type' => 'number', 'label' => 'Quantity', 'required' => true],
      ['name' => 'unitPrice', 'type' => 'number', 'label' => 'Unit price', 'required' => true],
      ['name' => 'taxRate', 'type' => 'number', 'label' => 'Tax rate', 'required' => true],
      ['name' => 'lineTotal', 'type' => 'number', 'label' => 'Line total', 'required' => true],
      ['name' => 'restocked', 'type' => 'boolean', 'label' => 'Restocked'],
    ],
  ],

  // 17. location
  'location' => [
    'name' => 'location', 'label' => 'Location', 'type' => 'collection',
    'fields' => [
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'code', 'type' => 'text', 'label' => 'Code', 'required' => true],
      ['name' => 'address', 'type' => 'text', 'label' => 'Address', 'required' => true],
      ['name' => 'city', 'type' => 'text', 'label' => 'City', 'required' => true],
      ['name' => 'postalCode', 'type' => 'text', 'label' => 'Postal code', 'required' => true],
      ['name' => 'phone', 'type' => 'text', 'label' => 'Phone', 'required' => true],
      ['name' => 'email', 'type' => 'text', 'label' => 'Email'],
      ['name' => 'taxNumber', 'type' => 'text', 'label' => 'Tax number', 'required' => true],
      ['name' => 'businessPremiseId', 'type' => 'text', 'label' => 'FURS premise ID', 'required' => true],
      ['name' => 'defaultTaxRate', 'type' => 'number', 'label' => 'Default tax rate'],
      ['name' => 'currency', 'type' => 'text', 'label' => 'Currency'],
      ['name' => 'active', 'type' => 'boolean', 'label' => 'Active'],
      ['name' => 'timezone', 'type' => 'text', 'label' => 'Timezone'],
      ['name' => 'notes', 'type' => 'text', 'label' => 'Notes'],
    ],
  ],

  // 18. promotion
  'promotion' => [
    'name' => 'promotion', 'label' => 'Promotion', 'type' => 'collection',
    'fields' => [
      ['name' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
      ['name' => 'description', 'type' => 'text', 'label' => 'Description'],
      ['name' => 'type', 'type' => 'select', 'label' => 'Type', 'opts' => ['options' => ['percentage','fixed','buy_one_get_one']]],
      ['name' => 'value', 'type' => 'number', 'label' => 'Value', 'required' => true],
      ['name' => 'startTime', 'type' => 'text', 'label' => 'Start time'],
      ['name' => 'endTime', 'type' => 'text', 'label' => 'End time'],
      ['name' => 'days', 'type' => 'json', 'label' => 'Days of week'],
      ['name' => 'startDate', 'type' => 'text', 'label' => 'Start date'],
      ['name' => 'endDate', 'type' => 'text', 'label' => 'End date'],
      ['name' => 'categoryIds', 'type' => 'json', 'label' => 'Category IDs'],
      ['name' => 'menuItemIds', 'type' => 'json', 'label' => 'Menu item IDs'],
      ['name' => 'active', 'type' => 'boolean', 'label' => 'Active'],
    ],
  ],

  // 19. shift
  'shift' => [
    'name' => 'shift', 'label' => 'Shift', 'type' => 'collection',
    'fields' => [
      ['name' => 'staffName', 'type' => 'text', 'label' => 'Staff name', 'required' => true],
      ['name' => 'role', 'type' => 'text', 'label' => 'Role', 'required' => true],
      ['name' => 'date', 'type' => 'text', 'label' => 'Date', 'required' => true],
      ['name' => 'scheduledStart', 'type' => 'text', 'label' => 'Scheduled start'],
      ['name' => 'scheduledEnd', 'type' => 'text', 'label' => 'Scheduled end'],
      ['name' => 'clockIn', 'type' => 'text', 'label' => 'Clock in'],
      ['name' => 'clockOut', 'type' => 'text', 'label' => 'Clock out'],
      ['name' => 'hourlyWage', 'type' => 'number', 'label' => 'Hourly wage'],
      ['name' => 'isClockedIn', 'type' => 'boolean', 'label' => 'Clocked in'],
      ['name' => 'isCompleted', 'type' => 'boolean', 'label' => 'Completed'],
      ['name' => 'notes', 'type' => 'text', 'label' => 'Notes'],
    ],
  ],
];

// ─── Also update existing collections with new fields ─────────────────

$updates = [
  'menu' => [
    ['name' => 'tax_rate', 'type' => 'number', 'label' => 'Tax rate (DDV %)'],
    ['name' => 'modifierGroups', 'type' => 'contentItemLink', 'label' => 'Modifier groups', 'opts' => ['link' => 'modifiergroup', 'multiple' => true]],
    ['name' => 'allergens', 'type' => 'json', 'label' => 'Allergens'],
  ],
  'order' => [
    ['name' => 'source', 'type' => 'select', 'label' => 'Source', 'opts' => ['options' => ['staff','guest']]],
    ['name' => 'payment_method', 'type' => 'select', 'label' => 'Payment method', 'opts' => ['options' => ['cash','card','other']]],
    ['name' => 'tip_amount', 'type' => 'number', 'label' => 'Tip amount'],
    ['name' => 'tip_type', 'type' => 'select', 'label' => 'Tip type', 'opts' => ['options' => ['none','percentage','custom']]],
    ['name' => 'tip_percentage', 'type' => 'number', 'label' => 'Tip percentage'],
    ['name' => 'served_by', 'type' => 'text', 'label' => 'Served by'],
    ['name' => 'refund_amount', 'type' => 'number', 'label' => 'Refund amount'],
    ['name' => 'refund_reason', 'type' => 'text', 'label' => 'Refund reason'],
    ['name' => 'refund_processed_by', 'type' => 'text', 'label' => 'Refund processed by'],
    ['name' => 'refund_date', 'type' => 'number', 'label' => 'Refund date'],
    ['name' => 'tax_breakdown', 'type' => 'json', 'label' => 'Tax breakdown'],
    ['name' => 'tax_amount', 'type' => 'number', 'label' => 'Tax amount'],
  ],
  'orderitem' => [
    ['name' => 'selectedModifiers', 'type' => 'json', 'label' => 'Selected modifiers'],
    ['name' => 'base_price', 'type' => 'number', 'label' => 'Base price'],
    ['name' => 'tax_rate', 'type' => 'number', 'label' => 'Tax rate'],
  ],
  'table' => [
    ['name' => 'publicToken', 'type' => 'text', 'label' => 'Public token (UUID)'],
  ],
];

// ─── Execute ───────────────────────────────────────────────────────────

header('Content-Type: text/plain');
echo "Noro Lep POS — Backend Setup\n";
echo "============================\n\n";
echo "Cockpit URL: $COCKPIT_URL\n";
echo "API Key: " . str_repeat('*', strlen($API_KEY) - 4) . substr($API_KEY, -4) . "\n\n";

$created = 0; $updated = 0; $errors = 0;

// Create new collections
foreach ($collections as $name => $config) {
  echo "Creating collection: $name ... ";
  $ch = curl_init("$COCKPIT_URL/api/content/collections/model/$name");
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Content-Type: application/json", "api-key: $API_KEY"],
    CURLOPT_POSTFIELDS => json_encode($config),
  ]);
  $response = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($code >= 200 && $code < 300) {
    echo "✅ Created\n";
    $created++;
  } else {
    // Collection might already exist — try saving fields
    echo "⚠️  Exists or error ($code), trying save... ";
    $ch = curl_init("$COCKPIT_URL/api/content/collections/save/$name");
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => ["Content-Type: application/json", "api-key: $API_KEY"],
      CURLOPT_POSTFIELDS => json_encode($config),
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 200 && $code < 300) { echo "✅ Saved\n"; $created++; }
    else { echo "❌ Failed ($code)\n"; $errors++; }
  }
}

// Update existing collections with new fields
foreach ($updates as $name => $fields) {
  foreach ($fields as $field) {
    echo "Adding field '{$field['name']}' to '$name' ... ";
    $ch = curl_init("$COCKPIT_URL/api/content/collections/field/$name");
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => ["Content-Type: application/json", "api-key: $API_KEY"],
      CURLOPT_POSTFIELDS => json_encode($field),
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 200 && $code < 300) { echo "✅\n"; $updated++; }
    else { echo "⚠️  Exists or error ($code)\n"; }
  }
}

echo "\n============================\n";
echo "Summary:\n";
echo "  Collections created: $created\n";
echo "  Fields updated: $updated\n";
echo "  Errors: $errors\n";
echo "\nDone! You can now start using the POS frontend.\n";
