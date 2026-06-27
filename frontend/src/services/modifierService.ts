// services/modifierService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModifierGroup, ModifierOption, LinkModelType } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Modifier Groups                                                    */
/* ------------------------------------------------------------------ */

/** Fetch all modifier groups (without options). */
export const useFetchModifierGroups = () =>
  useQuery<ModifierGroup[]>({
    queryKey: ["modifierGroups"],
    queryFn: () =>
      fetcher<ModifierGroup[]>(
        `${API_URL}/api/content/items/modifiergroup?populate=1&sort={sort:1}`,
      ),
  });

/**
 * Fetch a single modifier group by ID, with its options populated.
 * Returns undefined while loading; uses enabled flag.
 */
export const useFetchModifierGroup = (groupId: string | undefined) =>
  useQuery<ModifierGroup>({
    queryKey: ["modifierGroup", groupId],
    queryFn: () =>
      fetcher<ModifierGroup>(
        `${API_URL}/api/content/item/modifiergroup/${groupId}`,
      ),
    enabled: Boolean(groupId),
  });

export const useCreateModifierGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: Partial<ModifierGroup>) =>
      fetcher<ModifierGroup>(`${API_URL}/api/content/item/modifiergroup`, {
        method: "POST",
        body: JSON.stringify({ data: group }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["modifierGroups"] }),
  });
};

export const useUpdateModifierGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: Partial<ModifierGroup>) =>
      fetcher<ModifierGroup>(`${API_URL}/api/content/item/modifiergroup`, {
        method: "POST",
        body: JSON.stringify({ data: group }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modifierGroups"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["modifierGroup", variables._id],
        });
        queryClient.invalidateQueries({
          queryKey: ["modifierOptions", variables._id],
        });
      }
    },
  });
};

export const useDeleteModifierGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      fetcher(`${API_URL}/api/content/item/modifiergroup/${groupId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifierGroups"] });
      queryClient.invalidateQueries({ queryKey: ["modifierOptions"] });
      // Menus that referenced the deleted group need re-fetch too
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Modifier Options                                                   */
/* ------------------------------------------------------------------ */

/**
 * Fetch all options belonging to a specific modifier group.
 * Cockpit filter syntax: {group:"<groupId>"} matches contentItemLink field.
 */
export const useFetchModifierOptions = (groupId: string | undefined) =>
  useQuery<ModifierOption[]>({
    queryKey: ["modifierOptions", groupId],
    queryFn: () =>
      fetcher<ModifierOption[]>(
        `${API_URL}/api/content/items/modifieroption?populate=1&filter={group:"${groupId}"}&sort={sort:1}`,
      ),
    enabled: Boolean(groupId),
    placeholderData: [],
  });

/** Fetch ALL options (used by manager UI when reordering across groups). */
export const useFetchAllModifierOptions = () =>
  useQuery<ModifierOption[]>({
    queryKey: ["modifierOptions", "all"],
    queryFn: () =>
      fetcher<ModifierOption[]>(
        `${API_URL}/api/content/items/modifieroption?populate=1&sort={sort:1}`,
      ),
  });

export const useCreateModifierOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (option: Partial<ModifierOption>) =>
      fetcher<ModifierOption>(`${API_URL}/api/content/item/modifieroption`, {
        method: "POST",
        body: JSON.stringify({ data: option }),
      }),
    onSuccess: (_, variables) => {
      // Invalidate the parent group's option list
      const groupId =
        typeof variables.group === "object"
          ? (variables.group as LinkModelType)?._id
          : undefined;
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: ["modifierOptions", groupId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["modifierOptions", "all"] });
      queryClient.invalidateQueries({ queryKey: ["modifierGroups"] });
    },
  });
};

export const useUpdateModifierOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (option: Partial<ModifierOption>) =>
      fetcher<ModifierOption>(`${API_URL}/api/content/item/modifieroption`, {
        method: "POST",
        body: JSON.stringify({ data: option }),
      }),
    onSuccess: (_, variables) => {
      const groupId =
        typeof variables.group === "object"
          ? (variables.group as LinkModelType)?._id
          : undefined;
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: ["modifierOptions", groupId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["modifierOptions", "all"] });
    },
  });
};

export const useDeleteModifierOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionId: string) =>
      fetcher(`${API_URL}/api/content/item/modifieroption/${optionId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifierOptions"] });
      queryClient.invalidateQueries({ queryKey: ["modifierGroups"] });
    },
  });
};
