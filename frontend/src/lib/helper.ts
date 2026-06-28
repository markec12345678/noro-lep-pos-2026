import { ImageType, LinkModelType } from "@/types";

/* ------------------------------------------------------------------ */
/* EU FIC Allergens (Regulation 1169/2011, Annex II)                  */
/* ------------------------------------------------------------------ */

/**
 * The 14 mandatory allergens that must be declared on food labels
 * and menus in the European Union per Regulation (EU) No 1169/2011
 * (Food Information for Consumers — FIC).
 *
 * Slovenian restaurants are legally required to indicate which of
 * these allergens are present in each dish.
 */
export enum Allergen {
  Gluten = "gluten",
  Crustaceans = "crustaceans",
  Eggs = "eggs",
  Fish = "fish",
  Peanuts = "peanuts",
  Soybeans = "soybeans",
  Milk = "milk",
  Nuts = "nuts",
  Celery = "celery",
  Mustard = "mustard",
  Sesame = "sesame",
  Sulphites = "sulphites",
  Lupin = "lupin",
  Molluscs = "molluscs",
}

export interface AllergenInfo {
  enum: Allergen;
  /** EU Annex II number (1-14) */
  number: number;
  /** Short label shown in badges (Slovenian) */
  label: string;
  /** Full description shown in tooltips/details */
  description: string;
  /** Emoji icon for quick visual identification */
  icon: string;
  /** Tailwind color classes for badges */
  color: string;
}

/**
 * Complete metadata for all 14 EU allergens.
 * Used by AllergenBadge, AllergenSelector, and AllergenFilter.
 */
export const ALLERGEN_INFO: Record<Allergen, AllergenInfo> = {
  [Allergen.Gluten]: {
    enum: Allergen.Gluten,
    number: 1,
    label: "Gluten",
    description: "Žita ki vsebujejo gluten (pšenica, rž, ječmen, oves, pira)",
    icon: "🌾",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  [Allergen.Crustaceans]: {
    enum: Allergen.Crustaceans,
    number: 2,
    label: "Raki",
    description: "Rakovaste živali (raki, jastogi, kozice)",
    icon: "🦞",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  [Allergen.Eggs]: {
    enum: Allergen.Eggs,
    number: 3,
    label: "Jajca",
    description: "Jajca in izdelki iz jajc",
    icon: "🥚",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  [Allergen.Fish]: {
    enum: Allergen.Fish,
    number: 4,
    label: "Ribe",
    description: "Ribe in ribji izdelki",
    icon: "🐟",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [Allergen.Peanuts]: {
    enum: Allergen.Peanuts,
    number: 5,
    label: "Arašidi",
    description: "Arašidi in izdelki iz arašidov",
    icon: "🥜",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  [Allergen.Soybeans]: {
    enum: Allergen.Soybeans,
    number: 6,
    label: "Soja",
    description: "Soja in izdelki iz soje",
    icon: "🫘",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  [Allergen.Milk]: {
    enum: Allergen.Milk,
    number: 7,
    label: "Mleko",
    description: "Mleko in mlečni izdelki (vključno z laktozo)",
    icon: "🥛",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  [Allergen.Nuts]: {
    enum: Allergen.Nuts,
    number: 8,
    label: "Oreški",
    description: "Oreški (mandlji, lešniki, orehi, indijski oreški...)",
    icon: "🌰",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  [Allergen.Celery]: {
    enum: Allergen.Celery,
    number: 9,
    label: "Zelena",
    description: "Zelena in izdelki iz zelene",
    icon: "🥬",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  [Allergen.Mustard]: {
    enum: Allergen.Mustard,
    number: 10,
    label: "Gorčica",
    description: "Gorčica in izdelki iz gorčice",
    icon: "🟡",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  [Allergen.Sesame]: {
    enum: Allergen.Sesame,
    number: 11,
    label: "Sezam",
    description: "Sezamovo seme in izdelki",
    icon: "⚪",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  [Allergen.Sulphites]: {
    enum: Allergen.Sulphites,
    number: 12,
    label: "Sulfiti",
    description: "Žveplov dioksid in sulfiti (pogosto v vinu)",
    icon: "🍷",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  [Allergen.Lupin]: {
    enum: Allergen.Lupin,
    number: 13,
    label: "Volčji bob",
    description: "Volčji bob in izdelki",
    icon: "🌼",
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
  [Allergen.Molluscs]: {
    enum: Allergen.Molluscs,
    number: 14,
    label: "Mehkužci",
    description: "Mehkužci (lignji, školjke, polži)",
    icon: "🦑",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
};

/** All 14 allergens in EU Annex II order (used for selectors). */
export const ALL_ALLERGENS: AllergenInfo[] = Object.values(ALLERGEN_INFO).sort(
  (a, b) => a.number - b.number,
);

/** Get allergen info safely (returns undefined for unknown values). */
export const getAllergenInfo = (
  allergen: Allergen,
): AllergenInfo | undefined => ALLERGEN_INFO[allergen];

/**
 * Check if a menu item is safe for a guest with given allergies.
 * Returns true if NONE of the guest's allergens are present in the item.
 */
export const isSafeForAllergies = (
  itemAllergens: Allergen[] | undefined,
  guestAllergens: Allergen[],
): boolean => {
  if (!itemAllergens || itemAllergens.length === 0) return true;
  if (guestAllergens.length === 0) return true;
  return !guestAllergens.some((a) => itemAllergens.includes(a));
};

/**
 * Format allergens as a comma-separated string for receipts.
 * Example: "Gluten, Mleko, Oreški"
 */
export const formatAllergens = (
  allergens: Allergen[] | undefined,
): string => {
  if (!allergens || allergens.length === 0) return "";
  return allergens
    .map((a) => ALLERGEN_INFO[a]?.label ?? a)
    .join(", ");
};

/* ------------------------------------------------------------------ */
/* Original helpers (kept for backward compatibility)                  */
/* ------------------------------------------------------------------ */

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
 */
export const formatModifierSummary = (
  selections: MenuModifierSelection[] | undefined,
): string => {
  if (!selections || selections.length === 0) return "";
  return selections.map((s) => s.optionName).join(", ");
};

/**
 * Total line price for an order item: unit_price * quantity.
 */
export const computeOrderItemLineTotal = (item: OrderItem): number =>
  round2((item.price ?? 0) * (item.quantity ?? 0));

/* ------------------------------------------------------------------ */
/* Auth + fetcher                                                     */
/* ------------------------------------------------------------------ */

/**
 * Authenticated fetcher used by React Query.
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

  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
};

/* ------------------------------------------------------------------ */
/* Type imports (kept inline to avoid circular deps)                   */
/* ------------------------------------------------------------------ */

import {
  DEFAULT_TAX_CONFIG,
  Menu,
  MenuModifierSelection,
  ModifierGroup,
  ModifierOption,
  OrderItem,
  OrderItemStatus,
  TaxBreakdownEntry,
  TaxConfig,
} from "@/types";
