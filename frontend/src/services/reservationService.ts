// services/reservationService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Reservation,
  ReservationStatus,
  LinkModelType,
} from "@/types";
import { fetcher } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Reservation CRUD (authenticated — manager/staff)                   */
/* ------------------------------------------------------------------ */

/** Fetch all reservations, sorted by date+time ascending. */
export const useFetchReservations = () =>
  useQuery<Reservation[]>({
    queryKey: ["reservations"],
    queryFn: () =>
      fetcher<Reservation[]>(
        `${API_URL}/api/content/items/reservation?populate=1&sort={date:1,time:1}`,
      ),
  });

/**
 * Fetch reservations for a specific date.
 * Used by the calendar day view.
 */
export const useFetchReservationsByDate = (date: string | undefined) =>
  useQuery<Reservation[]>({
    queryKey: ["reservations", "date", date],
    queryFn: () =>
      fetcher<Reservation[]>(
        `${API_URL}/api/content/items/reservation?populate=1&filter={date:"${date}"}&sort={time:1}`,
      ),
    enabled: Boolean(date),
  });

/** Fetch a single reservation by ID. */
export const useFetchReservation = (id: string | undefined) =>
  useQuery<Reservation>({
    queryKey: ["reservation", id],
    queryFn: () =>
      fetcher<Reservation>(`${API_URL}/api/content/item/reservation/${id}`),
    enabled: Boolean(id),
  });

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservation: Partial<Reservation>) =>
      fetcher<Reservation>(`${API_URL}/api/content/item/reservation`, {
        method: "POST",
        body: JSON.stringify({ data: reservation }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      emitPosEvent("reservation:created", {
        reservationId: data?._id,
        date: data?.date,
        time: data?.time,
      });
    },
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservation: Partial<Reservation>) =>
      fetcher<Reservation>(`${API_URL}/api/content/item/reservation`, {
        method: "POST",
        body: JSON.stringify({ data: reservation }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["reservation", variables._id],
        });
      }
      if (variables?.date) {
        queryClient.invalidateQueries({
          queryKey: ["reservations", "date", variables.date],
        });
      }
      emitPosEvent("reservation:updated", {
        reservationId: variables?._id ?? data?._id,
        status: variables?.status,
      });
    },
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/reservation/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      emitPosEvent("reservation:cancelled", {});
    },
  });
};

/* ------------------------------------------------------------------ */
/* Status update helpers                                               */
/* ------------------------------------------------------------------ */

/** Update only the status of a reservation (with optional staff note). */
export const useUpdateReservationStatus = () => {
  const updateReservation = useUpdateReservation();
  return useMutation({
    mutationFn: async (params: {
      reservationId: string;
      status: ReservationStatus;
      staff?: string;
      date?: string;
    }) => {
      return updateReservation.mutateAsync({
        _id: params.reservationId,
        status: params.status,
        staff: params.staff,
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Public API client (no auth — guest booking page)                   */
/* ------------------------------------------------------------------ */

const PUBLIC_API_BASE = "/api/public";

/**
 * Fetch available time slots for a given date + party size.
 * Calls the pos-public mini-service (no auth required).
 */
export const fetchReservationSlots = async (
  date: string,
  partySize: number,
): Promise<{ slots: Array<{ time: string; available: boolean; reason?: string }> }> => {
  const url = `${PUBLIC_API_BASE}/reservation/slots?date=${encodeURIComponent(date)}&partySize=${partySize}&XTransformPort=3005`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch slots (${response.status})`);
  }
  return response.json();
};

/**
 * Create a reservation from the public booking page (no auth).
 * The server validates availability and generates a confirmation code.
 */
export const createPublicReservation = async (
  input: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    date: string;
    time: string;
    partySize: number;
    notes?: string;
  },
): Promise<{
  reservationId: string;
  confirmationCode: string;
  status: string;
  date: string;
  time: string;
  partySize: number;
}> => {
  const response = await fetch(
    `${PUBLIC_API_BASE}/reservation?XTransformPort=3005`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error ?? `Failed to create reservation (${response.status})`);
  }
  return response.json();
};

/* ------------------------------------------------------------------ */
/* React Query hooks for public pages                                  */
/* ------------------------------------------------------------------ */

import { useQuery as useReactQuery } from "@tanstack/react-query";

export const useFetchReservationSlots = (
  date: string | undefined,
  partySize: number,
) =>
  useReactQuery({
    queryKey: ["reservationSlots", date, partySize],
    queryFn: () => fetchReservationSlots(date!, partySize),
    enabled: Boolean(date) && partySize > 0,
    staleTime: 30_000, // cache 30s — slots don't change often
  });

/* ------------------------------------------------------------------ */
/* Helper: generate confirmation code                                  */
/* ------------------------------------------------------------------ */

/**
 * Generate a 6-character alphanumeric confirmation code.
 * Excludes ambiguous characters (0/O, 1/I/L) for readability.
 */
export const generateConfirmationCode = (): string => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/* ------------------------------------------------------------------ */
/* Helper: default time slots (lunch + dinner service)                */
/* ------------------------------------------------------------------ */

/**
 * Default opening hours: 11:00–15:00 (lunch) + 17:00–22:00 (dinner).
 * Slots are 30 minutes apart. Override per-location in a future config.
 */
export const DEFAULT_TIME_SLOTS: string[] = [
  // Lunch service
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  // Dinner service
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];
