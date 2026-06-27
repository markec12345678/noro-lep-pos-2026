// services/tableService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table } from "@/types";
import { fetcher } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;

export const useFetchTables = () =>
  useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () =>
      fetcher<Table[]>(
        `${API_URL}/api/content/items/table?populate=1`,
      ),
  });

export const useFetchTable = (tableId: string | undefined) =>
  useQuery<Table>({
    queryKey: ["table", tableId],
    queryFn: () =>
      fetcher<Table>(`${API_URL}/api/content/item/table/${tableId}`),
    enabled: Boolean(tableId),
  });

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (table: Partial<Table>) =>
      fetcher<Table>(`${API_URL}/api/content/item/table`, {
        method: "POST",
        body: JSON.stringify({ data: table }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables"] }),
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (table: Partial<Table>) =>
      fetcher<Table>(`${API_URL}/api/content/item/table`, {
        method: "POST",
        body: JSON.stringify({ data: table }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["table", variables._id],
        });
      }
      // Realtime: notify all clients that a table's status changed
      emitPosEvent("table:status_changed", {
        tableId: variables?._id ?? data?._id,
        status: variables?.status,
        orderId:
          variables?.order && typeof variables.order === "object"
            ? (variables.order as { _id?: string })?._id
            : null,
      });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tableId: string) =>
      fetcher(`${API_URL}/api/content/item/table/${tableId}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables"] }),
  });
};
