// services/promotionService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Promotion,
  PromotionType,
  AppliedPromotion,
  OrderItem,
  OrderItemStatus,
} from "@/types";
import { fetcher, round2 } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Promotion CRUD                                                      */
/* ------------------------------------------------------------------ */

export const useFetchPromotions = () =>
  useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: () =>
      fetcher<Promotion[]>(
        `${API_URL}/api/content/items/promotion?populate=1&sort={_created:-1}`,
      ),
  });

/** Fetch only active promotions (for auto-apply at checkout). */
export const useFetchActivePromotions = () =>
  useQuery<Promotion[]>({
    queryKey: ["promotions", "active"],
    queryFn: () =>
      fetcher<Promotion[]>(
        `${API_URL}/api/content/items/promotion?populate=1&filter={active:true}`,
      ),
  });

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promo: Partial<Promotion>) =>
      fetcher<Promotion>(`${API_URL}/api/content/item/promotion`, {
        method: "POST",
        body: JSON.stringify({ data: promo }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["promotions"] }),
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promo: Partial<Promotion>) =>
      fetcher<Promotion>(`${API_URL}/api/content/item/promotion`, {
        method: "POST",
        body: JSON.stringify({ data: promo }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["promotion", variables._id],
        });
      }
      emitPosEvent("promotion:updated", {
        promotionId: variables?._id ?? data?._id,
      });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/promotion/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["promotions"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Active promotion detection                                          */
/* ------------------------------------------------------------------ */

const DAY_NAMES = ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob"];

/**
 * Check if a promotion is currently active based on:
 * - current time vs startTime/endTime
 * - current day of week vs days array
 * - current date vs startDate/endDate
 */
export const isPromotionActiveNow = (
  promotion: Promotion,
  now: Date = new Date(),
): boolean => {
  if (!promotion.active) return false;

  const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (!promotion.days || !promotion.days.includes(currentDay)) return false;

  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  if (currentTime < promotion.startTime || currentTime >= promotion.endTime) {
    return false;
  }

  const todayStr = now.toISOString().slice(0, 10);
  if (promotion.startDate && todayStr < promotion.startDate) return false;
  if (promotion.endDate && todayStr > promotion.endDate) return false;

  return true;
};

/**
 * Get all currently-active promotions from a list.
 */
export const getActivePromotionsNow = (
  promotions: Promotion[] | undefined,
  now: Date = new Date(),
): Promotion[] => {
  if (!promotions) return [];
  return promotions.filter((p) => isPromotionActiveNow(p, now));
};

/* ------------------------------------------------------------------ */
/* Apply promotions to cart items                                      */
/* ------------------------------------------------------------------ */

/**
 * Check if a specific order item is eligible for a promotion.
 * An item is eligible if:
 * - promotion has no category/item filters (applies to all), OR
 * - the item's category is in the promotion's categoryIds, OR
 * - the item's menu ID is in the promotion's menuItemIds
 */
const isItemEligible = (
  item: OrderItem,
  promotion: Promotion,
): boolean => {
  // No filters = applies to all items
  if (
    (!promotion.categoryIds || promotion.categoryIds.length === 0) &&
    (!promotion.menuItemIds || promotion.menuItemIds.length === 0)
  ) {
    return true;
  }

  // Check menu item ID
  const menuId =
    item.menu && typeof item.menu === "object" && "_id" in item.menu
      ? (item.menu as { _id?: string })._id
      : undefined;
  if (menuId && promotion.menuItemIds?.includes(menuId)) {
    return true;
  }

  // Check category IDs
  const itemCategories =
    item.menu &&
    typeof item.menu === "object" &&
    "category" in item.menu
      ? (item.menu as { category?: Array<{ _id?: string }> }).category
      : undefined;
  if (itemCategories && promotion.categoryIds) {
    for (const cat of itemCategories) {
      if (cat._id && promotion.categoryIds.includes(cat._id)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Compute the discount for a single item under a promotion.
 */
const computeItemDiscount = (
  item: OrderItem,
  promotion: Promotion,
): number => {
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 1);

  switch (promotion.type) {
    case "percentage":
      return round2((lineTotal * promotion.value) / 100);
    case "fixed":
      return Math.min(promotion.value, lineTotal);
    case "buy_one_get_one": {
      // BOGO: every 2nd item is free (discount = price of every 2nd unit)
      const freeQty = Math.floor((item.quantity ?? 0) / 2);
      return round2((item.price ?? 0) * freeQty);
    }
    default:
      return 0;
  }
};

/**
 * Evaluate all active promotions against the current cart items
 * and return a list of AppliedPromotion objects with the total
 * discount amount.
 *
 * Only non-cancelled items are considered.
 *
 * Multiple promotions can apply simultaneously — each is computed
 * independently against the original item prices (not stacked).
 */
export const evaluatePromotions = (
  promotions: Promotion[] | undefined,
  items: OrderItem[],
  now: Date = new Date(),
): { applied: AppliedPromotion[]; totalDiscount: number } => {
  const active = getActivePromotionsNow(promotions, now);
  if (active.length === 0) {
    return { applied: [], totalDiscount: 0 };
  }

  const eligibleItems = items.filter(
    (item) => item.status !== OrderItemStatus.Cancelled,
  );

  const applied: AppliedPromotion[] = [];
  let totalDiscount = 0;

  for (const promo of active) {
    const affectedItemIds: string[] = [];
    let promoDiscount = 0;

    for (const item of eligibleItems) {
      if (isItemEligible(item, promo)) {
        const discount = computeItemDiscount(item, promo);
        if (discount > 0) {
          promoDiscount += discount;
          affectedItemIds.push(item._id ?? "");
        }
      }
    }

    if (promoDiscount > 0) {
      applied.push({
        promotionId: promo._id ?? "",
        name: promo.name,
        type: promo.type,
        value: promo.value,
        discountAmount: round2(promoDiscount),
        affectedItemIds,
      });
      totalDiscount += promoDiscount;
    }
  }

  return {
    applied,
    totalDiscount: round2(totalDiscount),
  };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const formatPromotionType = (type: PromotionType, value: number): string => {
  switch (type) {
    case "percentage":
      return `${value}% popust`;
    case "fixed":
      return `${value.toFixed(2)}€ popust`;
    case "buy_one_get_one":
      return "2+1 gratis";
    default:
      return "—";
  }
};

export const formatPromotionSchedule = (promo: Promotion): string => {
  const days =
    promo.days && promo.days.length > 0
      ? promo.days.map((d) => DAY_NAMES[d] ?? "?").join(", ")
      : "Vsi dnevi";
  return `${days} · ${promo.startTime}–${promo.endTime}`;
};

export { DAY_NAMES as PROMOTION_DAY_NAMES };
