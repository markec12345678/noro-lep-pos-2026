// services/orderService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order } from "@/types";
import { fetcher } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;

export const useFetchOrders = () =>
  useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () =>
      fetcher<Order[]>(
        `${API_URL}/api/content/items/order?populate=1&sort={_created:-1}`,
      ),
  });

export const useFetchKitchenOrders = () =>
  useQuery<Order[]>({
    queryKey: ["kitchenOrders"],
    queryFn: () =>
      fetcher<Order[]>(
        `${API_URL}/api/content/items/order?populate=1&sort={_created:-1}&filter={status:"in-kitchen"}`,
      ),
  });

export const useFetchOrder = (orderId: string | undefined) =>
  useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: () =>
      fetcher<Order>(`${API_URL}/api/content/item/order/${orderId}`),
    enabled: Boolean(orderId),
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Partial<Order>) =>
      fetcher<Order>(`${API_URL}/api/content/item/order`, {
        method: "POST",
        body: JSON.stringify({ data: order }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      emitPosEvent("order:created", {
        orderId: data?._id,
        tableId:
          variables?.table && typeof variables.table === "object"
            ? (variables.table as { _id?: string })?._id
            : undefined,
      });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Partial<Order>) =>
      fetcher<Order>(`${API_URL}/api/content/item/order`, {
        method: "POST",
        body: JSON.stringify({ data: order }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["order", variables._id],
        });
      }
      // Realtime: broadcast order status change (e.g. completed checkout)
      emitPosEvent("order:status_changed", {
        orderId: variables?._id ?? data?._id,
        status: variables?.status,
        total: variables?.total_amount,
      });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      fetcher(`${API_URL}/api/content/item/order/${orderId}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};
