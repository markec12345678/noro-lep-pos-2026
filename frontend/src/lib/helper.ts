import {
  DEFAULT_TAX_CONFIG,
  ImageType,
  Menu,
  MenuModifierSelection,
  ModifierGroup,
  ModifierOption,
  OrderItem,
  OrderItemStatus,
  TaxBreakdownEntry,
  TaxConfig,
} from "@/types";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "border-blue-500";
    case "in-kitchen":
      return "border-yellow-500";
    case "ready":
      return "border-green-500";
    case "completed":
      return "!bg-gray-800 text-white";
    default:
      return "border-gray-100";
  }
};

export const getImageUrl = (image: ImageType): string => {
  if (!image) return import.meta.env.VITE_PLACEHOLDER_IMAGE;
  return import.meta.env.VITE_ASSET_URL + image.path;
};

/* ------------------------------------------------------------------ */
/* Tax (DDV) helpers                                                  */
/* ------------------------------------------------------------------ */

/**
 * Resolve the effective tax rate for an order item.
 * Falls back to menu-level override, then to the system default.
 */
export const resolveTaxRate = (
  item: Pick<OrderItem, "tax_rate" | "menu">,
  config: TaxConfig = DEFAULT_TAX_CONFIG,
): number => {
  if (typeof item.tax_rate === "number") return item.tax_rate;
  if (item.menu && typeof item.menu.tax_rate === "number") {
    return item.menu.tax_rate;
  }
  return config.defaultRate;
};

/**
 * Compute the tax breakdown for a list of order items.
 * Items are grouped by their effective tax rate so the receipt can show
 * "22% DDV: base X, tax Y" line per rate (as required by Slovenian law).
 *
 * Cancelled items are excluded from the breakdown.
 */
export const computeTaxBreakdown = (
  items: OrderItem[],
  config: TaxConfig = DEFAULT_TAX_CONFIG,
): TaxBreakdownEntry[] => {
  const groups = new Map<number, number>();

  for (const item of items) {
    if (item.status === OrderItemStatus.Cancelled) continue;
    const rate = resolveTaxRate(item, config);
    const base = item.price * item.quantity;
    groups.set(rate, (groups.get(rate) ?? 0) + base);
  }

  return Array.from(groups.entries())
    .map(([rate, base]) => {
      const tax = (base * rate) / 100;
      return {
        rate,
        base: round2(base),
        tax: round2(tax),
        total: round2(base + tax),
      };
    })
    .sort((a, b) => b.rate - a.rate);
};

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Compute the grand total (subtotal + tax) from a tax breakdown.
 */
export const computeGrandTotal = (breakdown: TaxBreakdownEntry[]): number =>
  round2(breakdown.reduce((sum, e) => sum + e.total, 0));

export const computeSubtotal = (items: OrderItem[]): number =>
  round2(
    items.reduce((sum, item) => {
      if (item.status === OrderItemStatus.Cancelled) return sum;
      return sum + item.price * item.quantity;
    }, 0),
  );

export const computeTotalTax = (breakdown: TaxBreakdownEntry[]): number =>
  round2(breakdown.reduce((sum, e) => sum + e.tax, 0));

/* ------------------------------------------------------------------ */
/* Modifier helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Sum the price deltas of all selected modifier options.
 * Returns 0 when no modifiers are selected.
 */
export const sumModifierPrice = (
  selections: MenuModifierSelection[] | undefined,
): number => {
  if (!selections || selections.length === 0) return 0;
  return round2(
    selections.reduce((sum, s) => sum + (s.price ?? 0), 0),
  );
};

/**
 * Compute the effective unit price for a menu item given a set of selected
 * modifier options: base menu price + sum of modifier price deltas.
 *
 * This is the price that should be stored on `OrderItem.price` when an item
 * is added to the cart, so that downstream tax / total calculations stay
 * consistent without needing to re-resolve modifier lookups.
 */
export const computeItemUnitPrice = (
  menu: Pick<Menu, "price">,
  selections: MenuModifierSelection[] | undefined,
): number => {
  const base = menu?.price ?? 0;
  return round2(base + sumModifierPrice(selections));
};

/**
 * Convert a set of selected ModifierOption objects (with group context)
 * into the snapshot shape stored on the OrderItem.
 *
 * Snapshots are important: if a manager later renames "Extra Cheese" to
 * "Double Cheese" or changes its price from €1.50 to €2.00, historical
 * orders keep the original name and price they were sold at.
 */
export const snapshotSelections = (
  options: Array<{
    option: ModifierOption;
    group: ModifierGroup;
  }>,
): MenuModifierSelection[] =>
  options.map(({ option, group }) => ({
    groupId: group._id ?? "",
    groupName: group.name,
    optionId: option._id ?? "",
    optionName: option.name,
    price: option.price ?? 0,
  }));

/**
 * Human-readable summary of selected modifiers for receipts and cart UI.
 * Example: "Large, +Cheese, +Ham"
 */
export const formatModifierSummary = (
  selections: MenuModifierSelection[] | undefined,
): string => {
  if (!selections || selections.length === 0) return "";
  return selections.map((s) => s.optionName).join(", ");
};

/**
 * Total line price for an order item: unit_price * quantity.
 * The `price` field on OrderItem already includes modifier deltas
 * (captured at add-to-cart time), so this is a straight multiply.
 */
export const computeOrderItemLineTotal = (item: OrderItem): number =>
  round2((item.price ?? 0) * (item.quantity ?? 0));

/**
 * Authenticated fetcher used by React Query.
 *
 * Throws a typed `AuthError` when the user is not authenticated so that
 * React Query surfaces an `error` state instead of silently resolving
 * to `undefined` (which left the UI in a perpetual loading-looking state).
 */
export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}

export const getAuthHeaders = (): Record<string, string> => {
  const user = localStorage.getItem("user");
  if (!user) throw new AuthError();

  let userData: { apiKey?: string } = {};
  try {
    userData = JSON.parse(user);
  } catch {
    throw new AuthError("Invalid user session");
  }

  if (!userData?.apiKey) throw new AuthError("Missing API key");

  return {
    "Content-Type": "application/json",
    "api-key": userData.apiKey,
  };
};

export const fetcher = async <T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const headers = getAuthHeaders();

  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (response.status === 401) {
    // Clear invalid session and surface auth error
    localStorage.removeItem("user");
    throw new AuthError("Session expired");
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error || body?.message) {
        message = body.error || body.message;
      }
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  // Some DELETE endpoints return empty body
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
};
