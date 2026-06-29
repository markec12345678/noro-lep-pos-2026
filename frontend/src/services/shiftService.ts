// services/shiftService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shift, StaffScheduleSummary } from "@/types";
import { fetcher, round2 } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Shift CRUD                                                          */
/* ------------------------------------------------------------------ */

/** Fetch all shifts sorted by date ascending. */
export const useFetchShifts = () =>
  useQuery<Shift[]>({
    queryKey: ["shifts"],
    queryFn: () =>
      fetcher<Shift[]>(
        `${API_URL}/api/content/items/shift?populate=1&sort={date:1,scheduledStart:1}`,
      ),
  });

/** Fetch shifts for a specific date range (week). */
export const useFetchShiftsByDateRange = (
  startDate: string | undefined,
  endDate: string | undefined,
) =>
  useQuery<Shift[]>({
    queryKey: ["shifts", "range", startDate, endDate],
    queryFn: () =>
      fetcher<Shift[]>(
        `${API_URL}/api/content/items/shift?populate=1&filter={date:{$gte:"${startDate}",$lte:"${endDate}"}}&sort={date:1,scheduledStart:1}`,
      ),
    enabled: Boolean(startDate && endDate),
  });

/** Fetch today's shifts only. */
export const useFetchTodayShifts = () => {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery<Shift[]>({
    queryKey: ["shifts", "today", today],
    queryFn: () =>
      fetcher<Shift[]>(
        `${API_URL}/api/content/items/shift?populate=1&filter={date:"${today}"}&sort={scheduledStart:1}`,
      ),
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shift: Partial<Shift>) =>
      fetcher<Shift>(`${API_URL}/api/content/item/shift`, {
        method: "POST",
        body: JSON.stringify({ data: shift }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shift: Partial<Shift>) =>
      fetcher<Shift>(`${API_URL}/api/content/item/shift`, {
        method: "POST",
        body: JSON.stringify({ data: shift }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["shift", variables._id],
        });
      }
      emitPosEvent("shift:updated", {
        shiftId: variables?._id ?? data?._id,
      });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/shift/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Clock in / Clock out composites                                     */
/* ------------------------------------------------------------------ */

/**
 * Clock in: set clockIn time to now, mark isClockedIn = true.
 */
export const useClockIn = () => {
  const updateShift = useUpdateShift();
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const now = new Date().toTimeString().slice(0, 5);
      return updateShift.mutateAsync({
        _id: shiftId,
        clockIn: now,
        isClockedIn: true,
      });
    },
  });
};

/**
 * Clock out: set clockOut time to now, mark isCompleted = true.
 */
export const useClockOut = () => {
  const updateShift = useUpdateShift();
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const now = new Date().toTimeString().slice(0, 5);
      return updateShift.mutateAsync({
        _id: shiftId,
        clockOut: now,
        isClockedIn: false,
        isCompleted: true,
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Helpers: compute hours and labor cost                               */
/* ------------------------------------------------------------------ */

/**
 * Compute hours between two HH:MM times.
 * Handles overnight shifts (end < start = next day).
 */
export const computeHours = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins < startMins) endMins += 24 * 60; // overnight
  return round2((endMins - startMins) / 60);
};

/**
 * Build a weekly schedule summary grouped by staff member.
 * Returns one entry per staff member with their shifts + totals.
 */
export const buildWeeklySummary = (
  shifts: Shift[],
): StaffScheduleSummary[] => {
  const byStaff = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const key = `${shift.staffName}|${shift.role}`;
    const existing = byStaff.get(key) ?? [];
    existing.push(shift);
    byStaff.set(key, existing);
  }

  const summaries: StaffScheduleSummary[] = [];
  for (const [key, staffShifts] of byStaff) {
    const [staffName, role] = key.split("|");
    const hourlyWage = staffShifts[0]?.hourlyWage ?? 0;

    let scheduledHours = 0;
    let actualHours = 0;

    for (const s of staffShifts) {
      scheduledHours += computeHours(s.scheduledStart, s.scheduledEnd);
      if (s.clockIn && s.clockOut) {
        actualHours += computeHours(s.clockIn, s.clockOut);
      }
    }

    summaries.push({
      staffName,
      role,
      hourlyWage,
      shifts: staffShifts,
      scheduledHours: round2(scheduledHours),
      actualHours: round2(actualHours),
      laborCost: round2(actualHours * hourlyWage),
    });
  }

  return summaries.sort((a, b) => a.staffName.localeCompare(b.staffName));
};

/**
 * Get the start of the current week (Monday).
 */
export const getWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
};

/**
 * Get the end of the current week (Sunday).
 */
export const getWeekEnd = (date: Date = new Date()): string => {
  const start = new Date(getWeekStart(date));
  start.setDate(start.getDate() + 6);
  return start.toISOString().slice(0, 10);
};

/**
 * Get all 7 dates of the current week (Mon-Sun).
 */
export const getWeekDates = (date: Date = new Date()): string[] => {
  const startStr = getWeekStart(date);
  const start = new Date(startStr + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
};

const DAY_NAMES = ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob"];

export const getDayName = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return DAY_NAMES[d.getDay()];
};

export const formatDateShort = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}.${d.getMonth() + 1}.`;
};
