// services/orderitemService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderItem } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

export const useFetchOrderItems = (
  orderId: string | undefined,
  allStatuses?: boolean,
  enabled?: boolean,
) => {
  const status = !allStatuses ? `,status:{$ne:"completed"}` : "";
  return useQuery<OrderItem[]>({
    queryKey: ["orderItems", orderId],
    queryFn: () =>
      fetcher<OrderItem[]>(
        `${API_URL}/api/content/items/orderitem?populate=1&filter={order:"${orderId}"${status}}`,
      ),
    placeholderData: [],
    // Auto-disable when orderId is missing, unless caller overrides
    enabled: enabled ?? Boolean(orderId),
  });
};

export const useFetchKitchenOrderItems = () =>
  useQuery<OrderItem[]>({
    queryKey: ["kitchenOrderItems"],
    queryFn: () =>
      fetcher<OrderItem[]>(
        `${API_URL}/api/content/items/orderitem?populate=1&sort={_created:-1}&filter={status:{$regex:"in-kitchen|ready"}}`,
      ),
  });

export const useFetchOrderItem = (orderItemId: string) =>
  useQuery<OrderItem>({
    queryKey: ["orderItem"],
    queryFn: () =>
      fetcher<OrderItem>(
        `${API_URL}/api/content/items/orderitem/${orderItemId}`,
      ),
  });

export const useCreateOrderItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderItem: Partial<OrderItem>) =>
      fetcher(`${API_URL}/api/content/item/orderitem`, {
        method: "POST",
        body: JSON.stringify({ data: orderItem }),
      }),
    onSuccess: (_, variables) => {
      if (variables.order) {
        queryClient.invalidateQueries({
          queryKey: ["orderItems", variables.order?._id],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["kitchenOrderItems"] });
    },
  });
};

export const useUpdateOrderItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderItem: Partial<OrderItem>) =>
      fetcher(`${API_URL}/api/content/item/orderitem`, {
        method: "POST",
        body: JSON.stringify({ data: orderItem }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenOrderItems"] });
      queryClient.invalidateQueries({ queryKey: ["orderItems"] });
    },
  });
};

export const useDeleteOrderItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderItemId: string) =>
      fetcher(`${API_URL}/api/content/item/orderitem/${orderItemId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["orderItems"] }),
  });
};

export const useClearOrderItems = () => {
  const queryClient = useQueryClient();

  return (orderId: string) => {
    queryClient.setQueryData(["orderItems", orderId], []);
    queryClient.invalidateQueries({ queryKey: ["orderItems", orderId] });
  };
};
