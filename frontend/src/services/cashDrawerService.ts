// services/cashDrawerService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CashDrawerSession, Order, OrderStatus, LinkModelType } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Sessions                                                           */
/* ------------------------------------------------------------------ */

/** Fetch all cash drawer sessions, newest first. */
export const useFetchCashDrawerSessions = () =>
  useQuery<CashDrawerSession[]>({
    queryKey: ["cashDrawerSessions"],
    queryFn: () =>
      fetcher<CashDrawerSession[]>(
        `${API_URL}/api/content/items/cashdrawersession?populate=1&sort={openedAt:-1}&limit=100`,
      ),
  });

/**
 * Fetch the currently-open session (isOpen=true).
 * There should be at most one open session per location at any time.
 */
export const useFetchOpenCashDrawerSession = () =>
  useQuery<CashDrawerSession[]>({
    queryKey: ["cashDrawerSessions", "open"],
    queryFn: () =>
      fetcher<CashDrawerSession[]>(
        `${API_URL}/api/content/items/cashdrawersession?populate=1&filter={isOpen:true}`,
      ),
  });

export const useCreateCashDrawerSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (session: Partial<CashDrawerSession>) =>
      fetcher<CashDrawerSession>(
        `${API_URL}/api/content/item/cashdrawersession`,
        {
          method: "POST",
          body: JSON.stringify({ data: session }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashDrawerSessions"] });
    },
  });
};

export const useUpdateCashDrawerSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (session: Partial<CashDrawerSession>) =>
      fetcher<CashDrawerSession>(
        `${API_URL}/api/content/item/cashdrawersession`,
        {
          method: "POST",
          body: JSON.stringify({ data: session }),
        },
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cashDrawerSessions"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["cashDrawerSession", variables._id],
        });
      }
    },
  });
};

/* ------------------------------------------------------------------ */
/* Composite: open session                                            */
/* ------------------------------------------------------------------ */

export interface OpenSessionInput {
  user: string;
  openingFloat: number;
}

/**
 * Open a new cash drawer session. If another session is already open
 * for this user, the caller should prompt to close it first — we don't
 * auto-close here to avoid silent data loss.
 */
export const useOpenCashDrawerSession = () => {
  const createSession = useCreateCashDrawerSession();

  return useMutation({
    mutationFn: async (input: OpenSessionInput) => {
      const now = Math.floor(Date.now() / 1000);
      const session = await createSession.mutateAsync({
        user: input.user,
        openedAt: now,
        openingFloat: input.openingFloat,
        expectedCash: input.openingFloat,
        isOpen: true,
      });
      return session;
    },
  });
};

/* ------------------------------------------------------------------ */
/* Composite: close session                                           */
/* ------------------------------------------------------------------ */

export interface CloseSessionInput {
  session: CashDrawerSession;
  closingCount: number;
  expectedCash: number;
  notes?: string;
  user: string;
}

/**
 * Close an open cash drawer session.
 *
 * Computes:
 *   difference = closingCount - expectedCash
 *
 * A positive difference = over (more cash than expected).
 * A negative difference = short (less cash than expected).
 *
 * Stores all final numbers as snapshots so historical reports stay
 * correct even if orders are later edited.
 */
export const useCloseCashDrawerSession = () => {
  const updateSession = useUpdateCashDrawerSession();

  return useMutation({
    mutationFn: async (input: CloseSessionInput) => {
      const now = Math.floor(Date.now() / 1000);
      const difference = input.closingCount - input.expectedCash;

      const updated = await updateSession.mutateAsync({
        _id: input.session._id,
        closedAt: now,
        closingCount: input.closingCount,
        expectedCash: input.expectedCash,
        difference,
        notes: input.notes,
        isOpen: false,
      });

      return {
        session: updated,
        difference,
        isOver: difference > 0,
        isShort: difference < 0,
        isBalanced: Math.abs(difference) < 0.005,
      };
    },
  });
};

/* ------------------------------------------------------------------ */
/* Helper: compute expected cash from completed orders                */
/* ------------------------------------------------------------------ */

/**
 * Compute the expected cash amount for a session based on orders completed
 * between session.openedAt and now.
 *
 * IMPORTANT: Only counts orders where payment_method = "cash". Card and
 * other payment methods don't affect the cash drawer. Orders without a
 * payment_method field (legacy data) are treated as cash for backward
 * compatibility.
 */
export const computeExpectedCash = (
  orders: Order[] | undefined,
  session: CashDrawerSession | null | undefined,
  openingFloat: number,
): number => {
  if (!orders || !session?.openedAt) return openingFloat;
  const now = Math.floor(Date.now() / 1000);
  const cashSales = orders
    .filter(
      (o) =>
        o.status === OrderStatus.Completed &&
        (o._created ?? 0) >= session.openedAt! &&
        (o._created ?? 0) <= now &&
        // Only cash payments affect the drawer.
        // Legacy orders without payment_method default to "cash".
        (!o.payment_method || o.payment_method === "cash"),
    )
    .reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  return Math.round((openingFloat + cashSales) * 100) / 100;
};
