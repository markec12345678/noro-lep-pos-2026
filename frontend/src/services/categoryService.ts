// services/categoryService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

export const useFetchCategories = () =>
  useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () =>
      fetcher<Category[]>(
        `${API_URL}/api/content/items/category?populate=1`,
      ),
  });

export const useFetchCategory = (categoryId: string | undefined) =>
  useQuery<Category>({
    queryKey: ["category", categoryId],
    queryFn: () =>
      fetcher<Category>(
        `${API_URL}/api/content/items/category/${categoryId}`,
      ),
    enabled: Boolean(categoryId),
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: Partial<Category>) =>
      fetcher<Category>(`${API_URL}/api/content/item/category`, {
        method: "POST",
        body: JSON.stringify({ data: category }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: Partial<Category>) =>
      fetcher<Category>(`${API_URL}/api/content/item/category`, {
        method: "POST",
        body: JSON.stringify({ data: category }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["category", variables._id],
        });
      }
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      fetcher(`${API_URL}/api/content/item/category/${categoryId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};
