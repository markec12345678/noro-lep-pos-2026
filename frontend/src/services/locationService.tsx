// services/locationService
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Location } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Location CRUD                                                       */
/* ------------------------------------------------------------------ */

/** Fetch all locations. */
export const useFetchLocations = () =>
  useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: () =>
      fetcher<Location[]>(
        `${API_URL}/api/content/items/location?populate=1&sort={name:1}`,
      ),
  });

/** Fetch only active locations (for the switcher dropdown). */
export const useFetchActiveLocations = () =>
  useQuery<Location[]>({
    queryKey: ["locations", "active"],
    queryFn: () =>
      fetcher<Location[]>(
        `${API_URL}/api/content/items/location?populate=1&filter={active:true}&sort={name:1}`,
      ),
  });

export const useFetchLocation = (id: string | undefined) =>
  useQuery<Location>({
    queryKey: ["location", id],
    queryFn: () =>
      fetcher<Location>(`${API_URL}/api/content/item/location/${id}`),
    enabled: Boolean(id),
  });

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (location: Partial<Location>) =>
      fetcher<Location>(`${API_URL}/api/content/item/location`, {
        method: "POST",
        body: JSON.stringify({ data: location }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (location: Partial<Location>) =>
      fetcher<Location>(`${API_URL}/api/content/item/location`, {
        method: "POST",
        body: JSON.stringify({ data: location }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["location", variables._id],
        });
      }
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/location/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Location Context — tracks the active location across the app       */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "activeLocationId";

interface LocationContextValue {
  /** The active location ID (persisted in localStorage). */
  activeLocationId: string | null;
  /** The active Location object (resolved from cache). */
  activeLocation: Location | null;
  /** All available locations (for the switcher). */
  locations: Location[];
  /** Whether locations are still loading. */
  isLoading: boolean;
  /** Switch the active location. Persists to localStorage. */
  setActiveLocationId: (id: string | null) => void;
  /** Whether multi-location is enabled (more than 1 location exists). */
  isMultiLocation: boolean;
}

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * Provider that manages the active location.
 *
 * The active location ID is stored in localStorage so it persists
 * across sessions. When the app loads, the provider reads the stored
 * ID and validates it against the available locations — if the stored
 * ID is no longer valid (e.g. location was deleted), it falls back
 * to the first available location.
 *
 * Mount this ONCE at the app root, inside QueryClientProvider.
 */
export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { data: locations, isLoading } = useFetchActiveLocations();
  const [activeLocationId, setActiveLocationIdState] = useState<
    string | null
  >(null);

  // Load stored location ID on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setActiveLocationIdState(stored);
    }
  }, []);

  // Validate the active location ID against available locations
  useEffect(() => {
    if (isLoading || !locations) return;
    if (locations.length === 0) {
      if (activeLocationId !== null) {
        setActiveLocationIdState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }
    const isValid = locations.some((l) => l._id === activeLocationId);
    if (!isValid) {
      // Fall back to the first available location
      const fallback = locations[0]._id ?? null;
      setActiveLocationIdState(fallback);
      if (fallback) {
        localStorage.setItem(STORAGE_KEY, fallback);
      }
    }
  }, [locations, isLoading, activeLocationId]);

  const setActiveLocationId = (id: string | null) => {
    setActiveLocationIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const activeLocation =
    locations?.find((l) => l._id === activeLocationId) ?? null;

  const value: LocationContextValue = {
    activeLocationId,
    activeLocation,
    locations: locations ?? [],
    isLoading,
    setActiveLocationId,
    isMultiLocation: (locations?.length ?? 0) > 1,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

/**
 * Hook to access the active location context.
 * Must be called inside a LocationProvider.
 */
export const useActiveLocation = (): LocationContextValue => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error(
      "useActiveLocation must be called within a LocationProvider",
    );
  }
  return ctx;
};

/**
 * Build a Cockpit CMS filter fragment for the active location.
 *
 * Returns an empty string if no location is active (single-location mode
 * or no locations configured yet). Otherwise returns a filter fragment
 * like `,location:"<id>"` that can be appended to an existing filter.
 *
 * Example usage:
 *   const locFilter = useLocationFilter();
 *   const url = `${API_URL}/api/content/items/table?filter={status:"available"${locFilter}}`;
 */
export const useLocationFilter = (): string => {
  const { activeLocationId } = useActiveLocation();
  if (!activeLocationId) return "";
  return `,location:"${activeLocationId}"`;
};
