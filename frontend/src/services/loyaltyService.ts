// services/loyaltyService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Customer,
  LoyaltyConfig,
  LoyaltyReward,
  LoyaltyTransaction,
  LinkModelType,
} from "@/types";
import { fetcher, round2 } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";
import { useUpdateCustomer } from "@/services/customerService";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Loyalty rewards CRUD                                                */
/* ------------------------------------------------------------------ */

export const useFetchLoyaltyRewards = () =>
  useQuery<LoyaltyReward[]>({
    queryKey: ["loyaltyRewards"],
    queryFn: () =>
      fetcher<LoyaltyReward[]>(
        `${API_URL}/api/content/items/loyaltyreward?populate=1&sort={pointsCost:1}`,
      ),
  });

/** Fetch only active rewards (for redemption UI). */
export const useFetchActiveLoyaltyRewards = () =>
  useQuery<LoyaltyReward[]>({
    queryKey: ["loyaltyRewards", "active"],
    queryFn: () =>
      fetcher<LoyaltyReward[]>(
        `${API_URL}/api/content/items/loyaltyreward?populate=1&filter={active:true}&sort={pointsCost:1}`,
      ),
  });

export const useCreateLoyaltyReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reward: Partial<LoyaltyReward>) =>
      fetcher<LoyaltyReward>(`${API_URL}/api/content/item/loyaltyreward`, {
        method: "POST",
        body: JSON.stringify({ data: reward }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["loyaltyRewards"] }),
  });
};

export const useUpdateLoyaltyReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reward: Partial<LoyaltyReward>) =>
      fetcher<LoyaltyReward>(`${API_URL}/api/content/item/loyaltyreward`, {
        method: "POST",
        body: JSON.stringify({ data: reward }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyRewards"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["loyaltyReward", variables._id],
        });
      }
    },
  });
};

export const useDeleteLoyaltyReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/loyaltyreward/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["loyaltyRewards"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Loyalty transactions (audit log)                                    */
/* ------------------------------------------------------------------ */

export const useFetchLoyaltyTransactions = (customerId: string | undefined) =>
  useQuery<LoyaltyTransaction[]>({
    queryKey: ["loyaltyTransactions", customerId],
    queryFn: () =>
      fetcher<LoyaltyTransaction[]>(
        `${API_URL}/api/content/items/loyaltytransaction?populate=1&filter={customer:"${customerId}"}&sort={_created:-1}&limit=50`,
      ),
    enabled: Boolean(customerId),
    placeholderData: [],
  });

export const useCreateLoyaltyTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tx: Partial<LoyaltyTransaction>) =>
      fetcher<LoyaltyTransaction>(
        `${API_URL}/api/content/item/loyaltytransaction`,
        {
          method: "POST",
          body: JSON.stringify({ data: tx }),
        },
      ),
    onSuccess: (_, variables) => {
      const customerId =
        typeof variables.customer === "object"
          ? (variables.customer as LinkModelType)?._id
          : undefined;
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: ["loyaltyTransactions", customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ["customer", customerId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      emitPosEvent("loyalty:points_changed", {
        customerId,
        points: variables.points,
        type: variables.type,
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Composite: earn points for an order                                 */
/* ------------------------------------------------------------------ */

export interface EarnPointsInput {
  customerId: string;
  orderId: string;
  amountSpent: number;
  config?: LoyaltyConfig;
  staff?: string;
}

/**
 * Award loyalty points to a customer based on their order total.
 *
 * Points = floor(amountSpent × pointsPerEuro)
 * (We floor to avoid fractional points — simpler for customers to understand)
 *
 * Also updates the customer record:
 *   - points += earned
 *   - lifetimePoints += earned
 *   - totalSpent += amountSpent
 *   - visits += 1
 *   - lastVisitAt = now
 *
 * If this is the customer's first visit and signupBonus > 0, the bonus
 * is added on top of the earned points.
 *
 * Writes a loyalty transaction row for the audit trail.
 */
export const useEarnPoints = () => {
  const updateCustomer = useUpdateCustomer();
  const createTx = useCreateLoyaltyTransaction();

  return useMutation({
    mutationFn: async (
      input: EarnPointsInput,
    ): Promise<{ earned: number; newBalance: number; bonus: number }> => {
      // 1. Fetch current customer
      const customer = await fetcher<Customer>(
        `${API_URL}/api/content/item/customer/${input.customerId}`,
      );

      const pointsPerEuro = input.config?.pointsPerEuro ?? 1;
      const earned = Math.floor(input.amountSpent * pointsPerEuro);

      // Check if this is the first visit (signup bonus)
      const isFirstVisit = (customer.visits ?? 0) === 0;
      const signupBonus =
        isFirstVisit && (input.config?.signupBonus ?? 0) > 0
          ? input.config.signupBonus
          : 0;

      const totalEarned = earned + signupBonus;
      const newBalance = (customer.points ?? 0) + totalEarned;
      const now = Math.floor(Date.now() / 1000);

      // 2. Update customer record
      const updated = await updateCustomer.mutateAsync({
        _id: customer._id,
        points: newBalance,
        lifetimePoints: (customer.lifetimePoints ?? 0) + totalEarned,
        totalSpent: round2((customer.totalSpent ?? 0) + input.amountSpent),
        visits: (customer.visits ?? 0) + 1,
        lastVisitAt: now,
        firstVisitAt: customer.firstVisitAt ?? now,
      });

      // 3. Write audit transaction
      await createTx.mutateAsync({
        customer: {
          _model: "customer",
          _id: customer._id,
        },
        type: "earn",
        points: totalEarned,
        balanceAfter: newBalance,
        reason: `Order #${input.orderId.slice(-8)} · €${input.amountSpent.toFixed(2)}`,
        order: { _model: "order", _id: input.orderId },
        staff: input.staff,
      });

      // 4. If signup bonus was applied, write a separate transaction for clarity
      if (signupBonus > 0) {
        await createTx.mutateAsync({
          customer: {
            _model: "customer",
            _id: customer._id,
          },
          type: "adjust",
          points: signupBonus,
          balanceAfter: newBalance,
          reason: "Signup bonus (first visit)",
          staff: input.staff,
        });
      }

      return {
        earned: totalEarned,
        newBalance,
        bonus: signupBonus,
      };
    },
  });
};

/* ------------------------------------------------------------------ */
/* Composite: redeem a reward                                          */
/* ------------------------------------------------------------------ */

export interface RedeemRewardInput {
  customerId: string;
  reward: LoyaltyReward;
  staff?: string;
}

/**
 * Redeem a loyalty reward for a customer.
 *
 * Checks that the customer has enough points, deducts the pointsCost,
 * and writes a transaction row. Returns the discount to apply at checkout.
 *
 * Does NOT apply the discount to the order — that's the caller's job.
 */
export const useRedeemReward = () => {
  const updateCustomer = useUpdateCustomer();
  const createTx = useCreateLoyaltyTransaction();

  return useMutation({
    mutationFn: async (
      input: RedeemRewardInput,
    ): Promise<{
      success: boolean;
      newBalance: number;
      discount: number;
      error?: string;
    }> => {
      // 1. Fetch current customer
      const customer = await fetcher<Customer>(
        `${API_URL}/api/content/item/customer/${input.customerId}`,
      );

      // 2. Check balance
      if ((customer.points ?? 0) < input.reward.pointsCost) {
        return {
          success: false,
          newBalance: customer.points ?? 0,
          discount: 0,
          error: "Insufficient points",
        };
      }

      // 3. Deduct points
      const newBalance = (customer.points ?? 0) - input.reward.pointsCost;
      await updateCustomer.mutateAsync({
        _id: customer._id,
        points: newBalance,
      });

      // 4. Write audit transaction
      await createTx.mutateAsync({
        customer: {
          _model: "customer",
          _id: customer._id,
        },
        type: "redeem",
        points: -input.reward.pointsCost,
        balanceAfter: newBalance,
        reason: `Redeemed: ${input.reward.name}`,
        reward: {
          _model: "loyaltyreward",
          _id: input.reward._id,
        },
        staff: input.staff,
      });

      // 5. Calculate discount value
      let discount = 0;
      if (input.reward.discountType === "fixed") {
        discount = input.reward.discountValue;
      } else if (input.reward.discountType === "percent") {
        // Percent discount is applied at checkout — return the rate
        // Caller must compute discount = total × (rate / 100)
        discount = input.reward.discountValue;
      }

      return {
        success: true,
        newBalance,
        discount,
      };
    },
  });
};
