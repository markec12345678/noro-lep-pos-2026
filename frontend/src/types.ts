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
