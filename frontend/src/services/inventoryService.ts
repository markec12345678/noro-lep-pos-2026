// services/inventoryService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  InventoryItem,
  RecipeItem,
  StockTransaction,
  StockTransactionType,
  LinkModelType,
} from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Inventory items                                                    */
/* ------------------------------------------------------------------ */

export const useFetchInventoryItems = () =>
  useQuery<InventoryItem[]>({
    queryKey: ["inventoryItems"],
    queryFn: () =>
      fetcher<InventoryItem[]>(
        `${API_URL}/api/content/items/inventoryitem?populate=1&sort={name:1}`,
      ),
  });

export const useFetchInventoryItem = (id: string | undefined) =>
  useQuery<InventoryItem>({
    queryKey: ["inventoryItem", id],
    queryFn: () =>
      fetcher<InventoryItem>(
        `${API_URL}/api/content/item/inventoryitem/${id}`,
      ),
    enabled: Boolean(id),
  });

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<InventoryItem>) =>
      fetcher<InventoryItem>(`${API_URL}/api/content/item/inventoryitem`, {
        method: "POST",
        body: JSON.stringify({ data: item }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] }),
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<InventoryItem>) =>
      fetcher<InventoryItem>(`${API_URL}/api/content/item/inventoryitem`, {
        method: "POST",
        body: JSON.stringify({ data: item }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["inventoryItem", variables._id],
        });
        queryClient.invalidateQueries({
          queryKey: ["stockTransactions", variables._id],
        });
      }
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/inventoryitem/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["recipeItems"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Recipe items (menu -> inventoryItem mapping)                       */
/* ------------------------------------------------------------------ */

/**
 * Fetch all recipe lines for a given menu item.
 * Cockpit filter: {menu:"<menuId>"} matches contentItemLink.
 */
export const useFetchRecipeItems = (menuId: string | undefined) =>
  useQuery<RecipeItem[]>({
    queryKey: ["recipeItems", menuId],
    queryFn: () =>
      fetcher<RecipeItem[]>(
        `${API_URL}/api/content/items/recipeitem?populate=1&filter={menu:"${menuId}"}`,
      ),
    enabled: Boolean(menuId),
    placeholderData: [],
  });

/** Fetch ALL recipe items (used by inventory dashboard). */
export const useFetchAllRecipeItems = () =>
  useQuery<RecipeItem[]>({
    queryKey: ["recipeItems", "all"],
    queryFn: () =>
      fetcher<RecipeItem[]>(
        `${API_URL}/api/content/items/recipeitem?populate=1`,
      ),
  });

export const useCreateRecipeItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipe: Partial<RecipeItem>) =>
      fetcher<RecipeItem>(`${API_URL}/api/content/item/recipeitem`, {
        method: "POST",
        body: JSON.stringify({ data: recipe }),
      }),
    onSuccess: (_, variables) => {
      const menuId =
        typeof variables.menu === "object"
          ? (variables.menu as LinkModelType)?._id
          : undefined;
      if (menuId) {
        queryClient.invalidateQueries({
          queryKey: ["recipeItems", menuId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["recipeItems", "all"] });
    },
  });
};

export const useDeleteRecipeItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/recipeitem/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipeItems"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Stock transactions (audit log)                                     */
/* ------------------------------------------------------------------ */

export const useFetchStockTransactions = (
  inventoryItemId: string | undefined,
) =>
  useQuery<StockTransaction[]>({
    queryKey: ["stockTransactions", inventoryItemId],
    queryFn: () =>
      fetcher<StockTransaction[]>(
        `${API_URL}/api/content/items/stocktransaction?populate=1&filter={inventoryItem:"${inventoryItemId}"}&sort={_created:-1}&limit=50`,
      ),
    enabled: Boolean(inventoryItemId),
    placeholderData: [],
  });

export const useCreateStockTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tx: Partial<StockTransaction>) =>
      fetcher<StockTransaction>(
        `${API_URL}/api/content/item/stocktransaction`,
        {
          method: "POST",
          body: JSON.stringify({ data: tx }),
        },
      ),
    onSuccess: (_, variables) => {
      const invId =
        typeof variables.inventoryItem === "object"
          ? (variables.inventoryItem as LinkModelType)?._id
          : undefined;
      if (invId) {
        queryClient.invalidateQueries({
          queryKey: ["stockTransactions", invId],
        });
        queryClient.invalidateQueries({
          queryKey: ["inventoryItem", invId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Composite: apply stock movement + write audit row                  */
/* ------------------------------------------------------------------ */

/**
 * Apply a stock movement to an inventory item:
 *   1. Read current quantity
 *   2. Compute new quantity = current + delta
 *   3. Update the inventory item
 *   4. Write a stock transaction row for the audit trail
 *
 * Both writes happen sequentially. If step 3 succeeds but step 4 fails,
 * the inventory is still correct (the transaction row is just for audit).
 * For a more robust version, wrap both in a backend transaction endpoint.
 */
export interface ApplyStockMovementInput {
  inventoryItemId: string;
  delta: number;
  type: StockTransactionType;
  reason: string;
  user?: string;
}

export const useApplyStockMovement = () => {
  const updateItem = useUpdateInventoryItem();
  const createTx = useCreateStockTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplyStockMovementInput) => {
      // Step 1: read current item
      const item = await fetcher<InventoryItem>(
        `${API_URL}/api/content/item/inventoryitem/${input.inventoryItemId}`,
      );
      const currentQty = item.quantity ?? 0;
      const newQty = Math.max(0, currentQty + input.delta);

      // Step 2: update inventory item
      await updateItem.mutateAsync({
        _id: input.inventoryItemId,
        quantity: newQty,
      });

      // Step 3: write audit transaction
      await createTx.mutateAsync({
        inventoryItem: {
          _model: "inventoryitem",
          _id: input.inventoryItemId,
        },
        type: input.type,
        delta: input.delta,
        balanceAfter: newQty,
        reason: input.reason,
        user: input.user,
      });

      return { previousQuantity: currentQty, newQuantity: newQty };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Composite: decrement stock for a completed order item              */
/* ------------------------------------------------------------------ */

/**
 * Decrement inventory based on the menu's recipe items, multiplied by
 * the order item quantity. Used at checkout time.
 *
 * Silently skips inventory items that don't exist anymore — we don't
 * want to block checkout if a recipe references a deleted inventory item.
 */
export const useDecrementStockForOrderItem = () => {
  const applyMovement = useApplyStockMovement();
  const fetchRecipes = useFetchAllRecipeItems();

  return useMutation({
    mutationFn: async (params: {
      menuId: string;
      menuName: string;
      quantity: number;
      user?: string;
    }) => {
      // Ensure recipe items are loaded
      const recipes = await fetchRecipes.refetch();
      const relevant = (recipes.data ?? []).filter(
        (r) =>
          r.menu &&
          typeof r.menu === "object" &&
          "_id" in r.menu &&
          (r.menu as LinkModelType)._id === params.menuId,
      );

      const results: Array<{ name: string; ok: boolean; error?: string }> = [];

      for (const recipe of relevant) {
        const invId =
          recipe.inventoryItem &&
          typeof recipe.inventoryItem === "object" &&
          "_id" in recipe.inventoryItem
            ? (recipe.inventoryItem as LinkModelType)._id
            : undefined;
        if (!invId) continue;

        const delta = -Math.abs(recipe.quantity) * params.quantity;
        try {
          await applyMovement.mutateAsync({
            inventoryItemId: invId,
            delta,
            type: StockTransactionType.Decrement,
            reason: `Order item: ${params.menuName} × ${params.quantity}`,
            user: params.user,
          });
          results.push({ name: invId, ok: true });
        } catch (err) {
          results.push({
            name: invId,
            ok: false,
            error: err instanceof Error ? err.message : "Unknown",
          });
        }
      }

      return results;
    },
  });
};
