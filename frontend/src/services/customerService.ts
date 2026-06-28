// services/customerService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Customer, LinkModelType } from "@/types";
import { fetcher } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Customer CRUD                                                       */
/* ------------------------------------------------------------------ */

/** Fetch all customers, sorted by last visit (most recent first). */
export const useFetchCustomers = () =>
  useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () =>
      fetcher<Customer[]>(
        `${API_URL}/api/content/items/customer?populate=1&sort={lastVisitAt:-1}&limit=200`,
      ),
  });

/**
 * Look up a customer by phone number.
 * Returns the customer or null if not found.
 */
export const useFetchCustomerByPhone = (phone: string | undefined) =>
  useQuery<Customer[]>({
    queryKey: ["customer", "phone", phone],
    queryFn: () =>
      fetcher<Customer[]>(
        `${API_URL}/api/content/items/customer?populate=1&filter={phone:"${phone}"}`,
      ),
    enabled: Boolean(phone && phone.length >= 6),
  });

/** Fetch a single customer by ID, with transaction history. */
export const useFetchCustomer = (id: string | undefined) =>
  useQuery<Customer>({
    queryKey: ["customer", id],
    queryFn: () =>
      fetcher<Customer>(`${API_URL}/api/content/item/customer/${id}`),
    enabled: Boolean(id),
  });

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customer: Partial<Customer>) =>
      fetcher<Customer>(`${API_URL}/api/content/item/customer`, {
        method: "POST",
        body: JSON.stringify({ data: customer }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customer: Partial<Customer>) =>
      fetcher<Customer>(`${API_URL}/api/content/item/customer`, {
        method: "POST",
        body: JSON.stringify({ data: customer }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["customer", variables._id],
        });
      }
      if (variables?.phone) {
        queryClient.invalidateQueries({
          queryKey: ["customer", "phone", variables.phone],
        });
      }
      // Realtime: notify all clients
      emitPosEvent("customer:updated", {
        customerId: variables?._id ?? data?._id,
        phone: variables?.phone,
        points: variables?.points,
      });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/customer/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Loyalty config (singleton)                                          */
/* ------------------------------------------------------------------ */

export const useFetchLoyaltyConfig = () =>
  useQuery<Customer[]>({
    queryKey: ["loyaltyConfig"],
    queryFn: () =>
      fetcher<Customer[]>(
        `${API_URL}/api/content/items/loyaltyconfig?populate=1&limit=1`,
      ),
  });

export const useUpdateLoyaltyConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Customer>) =>
      fetcher<Customer>(`${API_URL}/api/content/item/loyaltyconfig`, {
        method: "POST",
        body: JSON.stringify({ data: config }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["loyaltyConfig"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Composite: find-or-create customer by phone                         */
/* ------------------------------------------------------------------ */

export interface FindOrCreateCustomerInput {
  phone: string;
  name?: string;
  email?: string;
}

/**
 * Find an existing customer by phone, or create a new one if not found.
 * Used at checkout: cashier enters the customer's phone number, and
 * we either load their existing profile or create a new one on the fly.
 *
 * New customers start with 0 points; signup bonus (if configured) is
 * applied by the calling code after the first order is completed.
 */
export const useFindOrCreateCustomer = () => {
  const updateCustomer = useUpdateCustomer();
  const createCustomer = useCreateCustomer();

  return useMutation({
    mutationFn: async (
      input: FindOrCreateCustomerInput,
    ): Promise<Customer> => {
      // 1. Look up by phone
      const existing = await fetcher<Customer[]>(
        `${API_URL}/api/content/items/customer?populate=1&filter={phone:"${input.phone}"}`,
      );
      if (existing && existing.length > 0) {
        // Update name/email if provided and different
        const customer = existing[0];
        if (
          (input.name && customer.name !== input.name) ||
          (input.email && customer.email !== input.email)
        ) {
          const updated = await updateCustomer.mutateAsync({
            _id: customer._id,
            name: input.name ?? customer.name,
            email: input.email ?? customer.email,
          });
          return updated;
        }
        return customer;
      }

      // 2. Create new customer
      const now = Math.floor(Date.now() / 1000);
      const created = await createCustomer.mutateAsync({
        phone: input.phone,
        name: input.name ?? input.phone,
        email: input.email,
        points: 0,
        lifetimePoints: 0,
        totalSpent: 0,
        visits: 0,
        firstVisitAt: now,
        lastVisitAt: now,
      });
      return created;
    },
  });
};
