export interface LinkModelType {
  _model: string;
  _id: string;
}

interface BaseEntity {
  _id?: string;
  _state?: number;
  _modified?: number;
  _mby?: string;
  _created?: number;
  _cby?: string;
}

export interface ImageType extends BaseEntity {
  path: string;
  title: string;
  mime?: string;
  type?: string;
  description?: string;
  tags?: [string];
  size?: number;
  colors?: [string];
  width?: number;
  height?: number;
  _hash?: string;
  altText?: string;
  thumbhash?: string;
  folder?: string;
}

export interface Menu extends BaseEntity {
  name: string;
  price: number;
  image: ImageType;
  description: string;
  category: LinkModelType[];
  available: boolean;
  /** Optional tax rate override. Falls back to system default if undefined. */
  tax_rate?: number;
  /** Links to modifiergroup collection. Populated when fetch uses populate=1. */
  modifierGroups?: ModifierGroup[] | LinkModelType[];
}

export enum TableStatus {
  Available = "available",
  Occupied = "occupied",
  Reserved = "reserved",
}

export enum OrderStatus {
  Pending = "pending",
  Completed = "completed",
  Cancelled = "cancelled",
  Refunded = "refunded",
}

export enum OrderType {
  DineIn = "dine-in",
  TakeAway = "take-away",
}

export enum OrderItemStatus {
  New = "new",
  InKitchen = "in-kitchen",
  Ready = "ready",
  Cancelled = "cancelled",
  Completed = "completed",
}

export interface Order extends BaseEntity {
  table?: any;
  customer: any;
  status: OrderStatus;
  order_type?: OrderType;
  total_amount: number;
  /** Snapshot of tax breakdown captured at checkout time. */
  tax_breakdown?: TaxBreakdownEntry[];
  /** Final tax amount (sum of all tax_breakdown entries). */
  tax_amount?: number;
  /** Who created the order: "staff" (POS) or "guest" (QR code ordering). */
  source?: "staff" | "guest";
}

export interface OrderItem extends BaseEntity {
  order: any;
  menu: any;
  quantity: number;
  status: OrderItemStatus;
  special_instruction: string;
  /** Unit price INCLUDING selected modifiers (snapshot at add-to-cart time). */
  price: number;
  /** Base menu price without modifiers (for receipts / refunds). */
  base_price?: number;
  /** Tax rate snapshot at the time the item was added to the cart. */
  tax_rate?: number;
  /** Selected modifier options, stored as JSON on the orderitem collection. */
  selectedModifiers?: MenuModifierSelection[];
}

export interface Category extends BaseEntity {
  name: string;
  description: string;
  image: ImageType;
  _pid: string;
  _o: string;
  _children: Category[];
}

export interface Table extends BaseEntity {
  table_number?: string;
  seats?: string;
  location?: string;
  status: string;
  order: LinkModelType;
  /** Public UUID token for QR-code-based guest ordering. Null = QR disabled. */
  publicToken?: string;
}

/**
 * Tax (DDV) configuration. Slovenia has 3 rates:
 *   - 22%  standard (most food & beverages)
 *   - 9.5% reduced (food for immediate consumption, some beverages)
 *   - 5%   special (books, newspapers - not relevant for restaurants)
 *
 * Defaults to 22% which covers the majority of restaurant sales.
 */
export interface TaxConfig {
  /** Default rate applied when menu item has no explicit override. */
  defaultRate: number;
  /** Available rates exposed in the UI (percent values, e.g. 22, 9.5, 0). */
  availableRates: number[];
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  defaultRate: 22,
  availableRates: [22, 9.5, 0],
};

export interface TaxBreakdownEntry {
  rate: number;
  base: number;
  tax: number;
  total: number;
}

/* ------------------------------------------------------------------ */
/* Menu Modifiers                                                     */
/* ------------------------------------------------------------------ */

/**
 * A group of modifier options that applies to a menu item.
 * Example: "Size" (Small / Medium / Large), "Toppings" (Cheese, Ham, Mushroom).
 *
 * Stored as a Cockpit CMS collection named `modifiergroup`.
 */
export interface ModifierGroup extends BaseEntity {
  name: string;
  /** Whether the customer MUST select at least one option. */
  required: boolean;
  /** Allow selecting more than one option in this group. */
  multiSelect: boolean;
  /** Minimum number of selections (only meaningful when multiSelect=true). */
  minSelect: number;
  /** Maximum number of selections (0 = unlimited). */
  maxSelect: number;
  /** Display order — lower numbers appear first. */
  sort: number;
  /** Linked options; populated when fetch uses populate=1. */
  options?: ModifierOption[];
}

/**
 * A single selectable option within a ModifierGroup.
 * Stored as a Cockpit CMS collection named `modifieroption`.
 */
export interface ModifierOption extends BaseEntity {
  name: string;
  /** Additional price added to the menu base price when selected. */
  price: number;
  /** Pre-selected by default (only meaningful in single-select groups). */
  default: boolean;
  /** Display order within the group. */
  sort: number;
  /** Link back to the parent group (contentItemLink). */
  group?: LinkModelType | ModifierGroup;
}

/**
 * Snapshot of a selected modifier option, stored on the OrderItem.
 * We snapshot name+price so historical orders stay correct even if the
 * underlying modifier is later renamed or re-priced.
 */
export interface MenuModifierSelection {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  /** Price delta at the time of selection (can be 0). */
  price: number;
}

/* ------------------------------------------------------------------ */
/* Inventory / Stock                                                  */
/* ------------------------------------------------------------------ */

/** Measurement unit for an inventory item. */
export type InventoryUnit = "kg" | "g" | "l" | "ml" | "pc" | "box";

/**
 * A single stock-kept ingredient or supply.
 * Example: "Mozzarella 1kg block", "Coca-Cola can 330ml", "Pizza box 32cm".
 *
 * Stored as a Cockpit CMS collection named `inventoryitem`.
 */
export interface InventoryItem extends BaseEntity {
  name: string;
  /** SKU / internal code, optional. */
  sku?: string;
  unit: InventoryUnit;
  /** Current quantity in stock (in the given unit). */
  quantity: number;
  /** Low-stock threshold — triggers an alert when quantity falls below. */
  threshold: number;
  /** Last known purchase cost per unit (for food cost reporting). */
  cost: number;
  /** Supplier name, optional. */
  supplier?: string;
}

/**
 * A recipe line — how much of an inventory item is consumed by one
 * serving of a menu item.
 *
 * Stored as a Cockpit CMS collection named `recipeitem`.
 * When an order item is completed, we look up all recipe items for the
 * menu and decrement the linked inventory items.
 */
export interface RecipeItem extends BaseEntity {
  /** Link to the menu this recipe belongs to (contentItemLink, single). */
  menu: LinkModelType;
  /** Link to the inventory item consumed (contentItemLink, single). */
  inventoryItem: LinkModelType;
  /** Quantity consumed per single serving (in inventoryItem.unit). */
  quantity: number;
}

/**
 * Type of stock movement. Stored on every transaction row so we have a
 * full audit trail (who/when/why for each unit change).
 */
export enum StockTransactionType {
  Restock = "restock",
  Decrement = "decrement",
  Adjustment = "adjustment",
  Waste = "waste",
}

/**
 * Audit log entry for a stock movement.
 * Stored as a Cockpit CMS collection named `stocktransaction`.
 */
export interface StockTransaction extends BaseEntity {
  /** Link to the inventory item affected. */
  inventoryItem: LinkModelType;
  type: StockTransactionType;
  /** Signed delta (positive for restock, negative for decrement). */
  delta: number;
  /** Resulting quantity after the change (snapshot). */
  balanceAfter: number;
  /** Free-text reason (e.g. "Order #1234", "Weekly delivery", "Spillage"). */
  reason: string;
  /** User who performed the change. */
  user?: string;
}

/* ------------------------------------------------------------------ */
/* Cash Drawer                                                        */
/* ------------------------------------------------------------------ */

/**
 * A cash drawer session, opened at the start of a shift and closed at
 * the end. The expected cash is computed from completed order totals
 * (filter payment_method = cash); the difference is over/short.
 *
 * Stored as a Cockpit CMS collection named `cashdrawersession`.
 */
export interface CashDrawerSession extends BaseEntity {
  /** User ID/name of the cashier who opened the session. */
  user: string;
  openedAt: number;
  closedAt?: number;
  /** Cash counted into the drawer at session start. */
  openingFloat: number;
  /** Cash counted at session close (manual count). */
  closingCount?: number;
  /** Expected cash based on order sales during the session. */
  expectedCash?: number;
  /** closingCount - expectedCash (positive = over, negative = short). */
  difference?: number;
  /** Optional notes (e.g. explanation of a difference). */
  notes?: string;
  /** True while the session is open. */
  isOpen: boolean;
}

/* ------------------------------------------------------------------ */
/* Fiscal (FURS) — Slovenian davčna blagajna                          */
/* ------------------------------------------------------------------ */

/**
 * FURS configuration for the POS installation.
 *
 * Stored in Cockpit CMS as a singleton collection `fiscalconfig`.
 * One record per location — covers the standard single-location case.
 * For multi-location, scope by locationId (future enhancement).
 */
export interface FiscalConfig extends BaseEntity {
  /** Slovenian tax number (davčna številka), 8 digits. */
  taxNumber: string;
  /** FURS-issued business premise ID (e.g. "PRE"). */
  businessUnit: string;
  /** FURS-issued electronic device ID (e.g. "PRE1"). */
  electronicDevice: string;
  /** Sequential invoice number of the LAST issued invoice. */
  lastInvoiceNumber: number;
  /** Control sequence (always 1 for the standard algorithm). */
  controlSeq: number;
  /** When true, the FURS mini-service runs in test mode (mock EOR). */
  testMode: boolean;
  /** Restaurant name printed on the receipt header. */
  restaurantName: string;
  /** Restaurant address printed on the receipt header. */
  restaurantAddress: string;
  /** Optional: operator's tax number (for the operator field). */
  operatorTaxNumber?: string;
}

/**
 * A fiscal invoice record — one per completed order.
 *
 * Stored in Cockpit CMS collection `fiscalinvoice`. Acts as the audit
 * trail required by FURS: every invoice must have a unique sequential
 * number, ZOI, and (after submission) EOR.
 *
 * If FURS is unreachable, the invoice is stored with status "pending"
 * and submitted later (within 48 hours per Slovenian law).
 */
export interface FiscalInvoice extends BaseEntity {
  /** Link to the order this invoice belongs to. */
  order: LinkModelType;
  /** Sequential invoice number (per electronic device). */
  invoiceNumber: string;
  /** FURS business unit ID snapshot. */
  businessUnit: string;
  /** FURS electronic device ID snapshot. */
  electronicDevice: string;
  /** ZOI — protective mark of invoice issuer (26 chars, base32). */
  zoi: string;
  /** EOR — unique invoice identifier returned by FURS (36 chars). */
  eor?: string;
  /** QR code PNG data URL for the receipt. */
  qrCode?: string;
  /** Issue date/time in FURS format (YYYY-MM-DDTHH:MM:SS). */
  issueDateTime: string;
  /** Unix timestamp (seconds) of when the invoice was issued. */
  issuedAt: number;
  /** Total amount including tax. */
  totalAmount: number;
  /** Tax breakdown snapshot. */
  taxesByRate: Array<{
    rate: number;
    base: number;
    tax: number;
    total: number;
  }>;
  /** Payment method used. */
  paymentMethod: "cash" | "card" | "other";
  /** Customer's tax number (for B2B invoices, optional). */
  customerTaxNumber?: string;
  /** Submission status. */
  status: "pending" | "submitted" | "failed";
  /** When the invoice was successfully submitted to FURS. */
  submittedAt?: number;
  /** Error message if submission failed. */
  errorMessage?: string;
  /** Number of submission attempts. */
  attempts: number;
}

/* ------------------------------------------------------------------ */
/* Public / Guest Ordering (QR code)                                  */
/* ------------------------------------------------------------------ */

/** A menu item as returned by the public menu API (no auth required). */
export interface PublicMenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: { path?: string; title?: string };
  category?: Array<{ _id: string; name?: string }>;
  tax_rate?: number;
}

/** A category group returned by the public menu API. */
export interface PublicMenuCategoryGroup {
  category: { _id: string; name: string; image?: { path?: string } };
  items: PublicMenuItem[];
}

/** Full public menu response from /api/public/menu/:tableToken */
export interface PublicMenuResponse {
  table: {
    _id: string;
    table_number?: string;
    seats?: string;
    location?: string;
  };
  categories: PublicMenuCategoryGroup[];
  uncategorizedItems: PublicMenuItem[];
  totalItems: number;
}

/** Input for creating a guest order via the public API. */
export interface CreateGuestOrderInput {
  tableToken: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    menuId: string;
    quantity: number;
    specialInstruction?: string;
    selectedModifiers?: MenuModifierSelection[];
  }>;
}

/** Response from POST /api/public/order */
export interface CreateGuestOrderResponse {
  orderId: string;
  tableId: string;
  tableNumber?: string;
  totalAmount: number;
  itemCount: number;
  status: string;
  createdAt: number;
}

/** Order status response from GET /api/public/order/:orderId */
export interface GuestOrderStatusResponse {
  order: {
    _id: string;
    status: string;
    totalAmount: number;
    createdAt: number;
    customer?: { name?: string; phone?: string };
    tableNumber?: string;
  };
  items: Array<{
    _id: string;
    name: string;
    quantity: number;
    price: number;
    status: string;
    specialInstruction?: string;
    selectedModifiers?: MenuModifierSelection[];
  }>;
}

/* ------------------------------------------------------------------ */
/* Loyalty Program                                                     */
/* ------------------------------------------------------------------ */

/**
 * A loyalty program member. Identified by phone number (unique).
 *
 * Points are earned at checkout (1 point per €1 spent by default,
 * configurable via LoyaltyConfig.pointsPerEuro). Points can be
 * redeemed for rewards defined in the LoyaltyReward collection.
 *
 * Stored as Cockpit CMS collection `customer`.
 */
export interface Customer extends BaseEntity {
  /** Phone number — primary identifier (unique). */
  phone: string;
  /** Customer display name. */
  name: string;
  /** Email (optional, for marketing). */
  email?: string;
  /** Current points balance. */
  points: number;
  /** Lifetime points earned (never decreases). */
  lifetimePoints: number;
  /** Total amount spent across all orders (€). */
  totalSpent: number;
  /** Number of visits (orders placed). */
  visits: number;
  /** Timestamp of first visit. */
  firstVisitAt?: number;
  /** Timestamp of last visit. */
  lastVisitAt?: number;
  /** Optional birthday (for bonus points). */
  birthday?: string;
  /** Notes from staff (free text). */
  notes?: string;
}

/**
 * A redeemable reward in the loyalty program.
 * Example: "Free coffee" for 50 points, "10% off" for 100 points.
 *
 * Stored as Cockpit CMS collection `loyaltyreward`.
 */
export interface LoyaltyReward extends BaseEntity {
  name: string;
  description: string;
  /** Points required to redeem this reward. */
  pointsCost: number;
  /** Discount type for the reward. */
  discountType: "fixed" | "percent" | "item";
  /** Discount value (€ for fixed, % for percent, item ID for item). */
  discountValue: number;
  /** Whether this reward is currently available for redemption. */
  active: boolean;
}

/**
 * Audit log for a points movement (earn or redeem).
 *
 * Stored as Cockpit CMS collection `loyaltytransaction`.
 * Every points change creates a transaction row for auditability.
 */
export interface LoyaltyTransaction extends BaseEntity {
  /** Link to the customer. */
  customer: LinkModelType;
  /** Type of movement. */
  type: "earn" | "redeem" | "adjust" | "expire";
  /** Signed points delta (positive for earn, negative for redeem). */
  points: number;
  /** Resulting balance after the change (snapshot). */
  balanceAfter: number;
  /** Reason / description. */
  reason: string;
  /** Optional link to the order that triggered this transaction. */
  order?: LinkModelType;
  /** Optional link to the reward redeemed. */
  reward?: LinkModelType;
  /** Staff member who performed the action. */
  staff?: string;
}

/**
 * Loyalty program configuration (singleton).
 * Stored as Cockpit CMS collection `loyaltyconfig`.
 */
export interface LoyaltyConfig extends BaseEntity {
  /** Points earned per €1 spent. Default 1. */
  pointsPerEuro: number;
  /** Bonus points awarded on first visit. Default 0. */
  signupBonus: number;
  /** Points expire after N days of inactivity (0 = never). Default 0. */
  expiryDays: number;
  /** Whether the loyalty program is enabled. */
  enabled: boolean;
  /** Welcome message shown to members. */
  welcomeMessage?: string;
}

/* ------------------------------------------------------------------ */
/* Reservations                                                       */
/* ------------------------------------------------------------------ */

export enum ReservationStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Cancelled = "cancelled",
  Completed = "completed",
  NoShow = "no-show",
}

/**
 * A table reservation made by a guest (via public booking page) or
 * by staff (over the phone / walk-in).
 *
 * Stored as Cockpit CMS collection `reservation`.
 */
export interface Reservation extends BaseEntity {
  /** Guest name. */
  customerName: string;
  /** Guest phone (required for contact). */
  customerPhone: string;
  /** Guest email (optional). */
  customerEmail?: string;
  /** Reservation date in YYYY-MM-DD format. */
  date: string;
  /** Reservation time in HH:MM format (24h). */
  time: string;
  /** Number of guests. */
  partySize: number;
  /** Optional table assignment (link to table collection). */
  table?: LinkModelType | null;
  /** Special requests (high chair, birthday, etc.). */
  notes?: string;
  /** Current status. */
  status: ReservationStatus;
  /** Source of the reservation. */
  source: "guest" | "staff";
  /** Staff member who created/updated (for staff-created). */
  staff?: string;
  /** Confirmation code shown to guest (6-char alphanumeric). */
  confirmationCode: string;
}

/** Input for creating a reservation via the public API. */
export interface CreateReservationInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  partySize: number;
  notes?: string;
}

/** Response from POST /api/public/reservation */
export interface CreateReservationResponse {
  reservationId: string;
  confirmationCode: string;
  status: ReservationStatus;
  date: string;
  time: string;
  partySize: number;
}

/**
 * Available time slots for a given date + party size.
 * Returned by GET /api/public/reservation/slots
 */
export interface ReservationSlot {
  time: string;
  available: boolean;
  reason?: string;
}
