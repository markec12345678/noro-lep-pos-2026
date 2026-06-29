// services/tableOperationsService
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderItem, OrderItemStatus, Table, TableStatus, LinkModelType } from "@/types";
import { fetcher, round2 } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";
import { useFetchTables, useUpdateTable } from "@/services/tableService";
import { useFetchOrders, useUpdateOrder } from "@/services/orderService";
import {
  useFetchOrderItems,
  useUpdateOrderItem,
  useCreateOrderItem,
  useDeleteOrderItem,
} from "@/services/orderItemsService";
import { useCreateOrder } from "@/services/orderService";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Transfer: move an order from one table to another                  */
/* ------------------------------------------------------------------ */

export interface TransferOrderInput {
  sourceTableId: string;
  targetTableId: string;
  orderId: string;
}

/**
 * Transfer an order from one table to another.
 *
 * 1. Update the order's table link to the target table
 * 2. Set source table status = available, order = null
 * 3. Set target table status = occupied, order = {order link}
 *
 * Order items stay linked to the same order — no data migration needed.
 * The kitchen display sees no change (order ID is the same).
 */
export const useTransferOrder = () => {
  const updateTable = useUpdateTable();
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferOrderInput) => {
      // 1. Update order's table reference
      await updateOrder.mutateAsync({
        _id: input.orderId,
        table: {
          _model: "table",
          _id: input.targetTableId,
        } as LinkModelType,
      });

      // 2. Free the source table
      await updateTable.mutateAsync({
        _id: input.sourceTableId,
        status: TableStatus.Available,
        order: null,
      });

      // 3. Occupy the target table
      await updateTable.mutateAsync({
        _id: input.targetTableId,
        status: TableStatus.Occupied,
        order: {
          _model: "order",
          _id: input.orderId,
        } as LinkModelType,
      });

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table"] });

      // Realtime
      emitPosEvent("table:status_changed", {
        tableId: input.sourceTableId,
        status: TableStatus.Available,
        orderId: null,
      });
      emitPosEvent("table:status_changed", {
        tableId: input.targetTableId,
        status: TableStatus.Occupied,
        orderId: input.orderId,
      });
      emitPosEvent("order:updated", {
        orderId: input.orderId,
      });

      return { success: true };
    },
  });
};

/* ------------------------------------------------------------------ */
/* Merge: combine two tables' orders into one                         */
/* ------------------------------------------------------------------ */

export interface MergeTablesInput {
  sourceTableId: string;
  targetTableId: string;
  sourceOrderId: string;
  targetOrderId: string;
}

/**
 * Merge two tables into one order. All order items from the source
 * order are re-linked to the target order, then the source order is
 * deleted and the source table is freed.
 *
 * The target table keeps its order (now with all items from both).
 *
 * 1. Fetch all order items from the source order
 * 2. Update each item's order link to the target order
 * 3. Delete the source order
 * 4. Free the source table
 *
 * The target table now has the combined order.
 */
export const useMergeTables = () => {
  const updateOrderItem = useUpdateOrderItem();
  const updateTable = useUpdateTable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MergeTablesInput) => {
      // 1. Fetch all items from the source order
      const sourceItems = await fetcher<OrderItem[]>(
        `${API_URL}/api/content/items/orderitem?populate=1&filter={order:"${input.sourceOrderId}"}`,
      );

      // 2. Re-link each item to the target order
      const updates = (sourceItems ?? []).map((item) =>
        updateOrderItem.mutateAsync({
          _id: item._id,
          order: {
            _model: "order",
            _id: input.targetOrderId,
          } as LinkModelType,
        }),
      );
      await Promise.all(updates);

      // 3. Delete the source order
      await fetcher(`${API_URL}/api/content/item/order/${input.sourceOrderId}`, {
        method: "DELETE",
      });

      // 4. Free the source table
      await updateTable.mutateAsync({
        _id: input.sourceTableId,
        status: TableStatus.Available,
        order: null,
      });

      // Invalidate
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderItems"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOrderItems"] });

      emitPosEvent("table:status_changed", {
        tableId: input.sourceTableId,
        status: TableStatus.Available,
        orderId: null,
      });
      emitPosEvent("orderitem:status_changed", {
        orderId: input.targetOrderId,
      });

      return {
        success: true,
        movedItemCount: (sourceItems ?? []).length,
      };
    },
  });
};

/* ------------------------------------------------------------------ */
/* Split Bill: divide items into separate checks                      */
/* ------------------------------------------------------------------ */

export interface SplitBillItem {
  orderItemId: string;
  name: string;
  quantity: number;
  price: number;
  /** Which split group this item belongs to (0 = stays on original). */
  splitGroup: number;
}

export interface SplitBillInput {
  sourceTableId: string;
  sourceOrderId: string;
  /** Items to move to the new split, with their target group. */
  splits: Array<{
    targetTableId: string;
    itemIds: string[];
  }>;
}

/**
 * Split a bill: move selected order items to new orders on other tables.
 *
 * Each "split" in the input array creates a new order on the specified
 * target table and moves the selected items to that new order.
 *
 * Items not included in any split stay on the original order.
 *
 * Flow per split:
 * 1. Create a new order linked to the target table
 * 2. Update each selected item's order link to the new order
 * 3. Mark the target table as occupied with the new order
 *
 * After all splits:
 * - Original order keeps remaining items
 * - Each split has its own order on its own table
 * - Receipts can be printed per order
 */
export const useSplitBill = () => {
  const createOrder = useCreateOrder();
  const updateOrderItem = useUpdateOrderItem();
  const updateTable = useUpdateTable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SplitBillInput) => {
      const results: Array<{
        tableId: string;
        orderId: string;
        itemCount: number;
      }> = [];

      for (const split of input.splits) {
        if (split.itemIds.length === 0) continue;

        // 1. Create a new order on the target table
        const newOrder = await createOrder.mutateAsync({
          table: {
            _model: "table",
            _id: split.targetTableId,
          } as LinkModelType,
          status: "pending",
          order_type: "dine-in",
          total_amount: 0,
          customer: null,
          source: "staff",
        });

        if (!newOrder?._id) {
          throw new Error("Failed to create split order");
        }

        // 2. Move selected items to the new order
        const updates = split.itemIds.map((itemId) =>
          updateOrderItem.mutateAsync({
            _id: itemId,
            order: {
              _model: "order",
              _id: newOrder._id,
            } as LinkModelType,
          }),
        );
        await Promise.all(updates);

        // 3. Mark target table as occupied
        await updateTable.mutateAsync({
          _id: split.targetTableId,
          status: TableStatus.Occupied,
          order: {
            _model: "order",
            _id: newOrder._id,
          } as LinkModelType,
        });

        results.push({
          tableId: split.targetTableId,
          orderId: newOrder._id,
          itemCount: split.itemIds.length,
        });

        emitPosEvent("order:created", {
          orderId: newOrder._id,
          tableId: split.targetTableId,
        });
        emitPosEvent("table:status_changed", {
          tableId: split.targetTableId,
          status: TableStatus.Occupied,
          orderId: newOrder._id,
        });
      }

      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderItems"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOrderItems"] });

      return { success: true, splits: results };
    },
  });
};

/* ------------------------------------------------------------------ */
/* Helper: compute split totals                                        */
/* ------------------------------------------------------------------ */

export interface SplitGroup {
  id: number;
  label: string;
  tableId?: string;
  tableNumber?: string;
  items: Array<{
    orderItemId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
}

/**
 * Group order items by their splitGroup assignment and compute
 * subtotals per group. Used by the SplitBillDialog to show
 * live totals as the user assigns items to splits.
 */
export const computeSplitGroups = (
  items: Array<{
    orderItemId: string;
    name: string;
    quantity: number;
    price: number;
    splitGroup: number;
  }>,
  tableNumber?: string,
): SplitGroup[] => {
  const groups = new Map<number, SplitGroup>();

  for (const item of items) {
    let group = groups.get(item.splitGroup);
    if (!group) {
      group = {
        id: item.splitGroup,
        label: item.splitGroup === 0
          ? `Miza ${tableNumber ?? "?"} (original)`
          : `Račun ${item.splitGroup}`,
        items: [],
        subtotal: 0,
      };
      groups.set(item.splitGroup, group);
    }
    const lineTotal = round2(item.price * item.quantity);
    group.items.push({
      orderItemId: item.orderItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: lineTotal,
    });
    group.subtotal = round2(group.subtotal + lineTotal);
  }

  return Array.from(groups.values()).sort((a, b) => a.id - b.id);
};
