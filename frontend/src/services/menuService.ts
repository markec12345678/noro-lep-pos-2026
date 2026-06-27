// services/menuService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

export const useFetchMenus = () =>
  useQuery<Menu[]>({
    queryKey: ["menus"],
    queryFn: () =>
      fetcher<Menu[]>(`${API_URL}/api/content/items/menu?populate=1`),
  });

export const useFetchMenu = (menuId: string | undefined) =>
  useQuery<Menu>({
    queryKey: ["menu", menuId],
    queryFn: () => fetcher<Menu>(`${API_URL}/api/content/item/menu/${menuId}`),
    enabled: Boolean(menuId),
  });

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (menu: Partial<Menu>) =>
      fetcher<Menu>(`${API_URL}/api/content/item/menu`, {
        method: "POST",
        body: JSON.stringify({ data: menu }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menus"] }),
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (menu: Partial<Menu>) =>
      fetcher<Menu>(`${API_URL}/api/content/item/menu`, {
        method: "POST",
        body: JSON.stringify({ data: menu }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["menu", variables._id],
        });
      }
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (menuId: string) =>
      fetcher(`${API_URL}/api/content/item/menu/${menuId}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menus"] }),
  });
};
