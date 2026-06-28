// services/supplierService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Supplier,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  LinkModelType,
} from "@/types";
import { fetcher, round2 } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";
import { useApplyStockMovement } from "@/services/inventoryService";
import { StockTransactionType } from "@/types";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Suppliers CRUD                                                      */
/* ------------------------------------------------------------------ */

export const useFetchSuppliers = () =>
  useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () =>
      fetcher<Supplier[]>(
        `${API_URL}/api/content/items/supplier?populate=1&sort={name:1}`,
      ),
  });

/** Fetch only active suppliers (for dropdowns in invoice form). */
export const useFetchActiveSuppliers = () =>
  useQuery<Supplier[]>({
    queryKey: ["suppliers", "active"],
    queryFn: () =>
      fetcher<Supplier[]>(
        `${API_URL}/api/content/items/supplier?populate=1&filter={active:true}&sort={name:1}`,
      ),
  });

export const useFetchSupplier = (id: string | undefined) =>
  useQuery<Supplier>({
    queryKey: ["supplier", id],
    queryFn: () =>
      fetcher<Supplier>(`${API_URL}/api/content/item/supplier/${id}`),
    enabled: Boolean(id),
  });

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplier: Partial<Supplier>) =>
      fetcher<Supplier>(`${API_URL}/api/content/item/supplier`, {
        method: "POST",
        body: JSON.stringify({ data: supplier }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplier: Partial<Supplier>) =>
      fetcher<Supplier>(`${API_URL}/api/content/item/supplier`, {
        method: "POST",
        body: JSON.stringify({ data: supplier }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["supplier", variables._id],
        });
      }
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/supplier/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Invoices CRUD                                                       */
/* ------------------------------------------------------------------ */

export const useFetchInvoices = () =>
  useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () =>
      fetcher<Invoice[]>(
        `${API_URL}/api/content/items/invoice?populate=1&sort={issueDate:-1,_created:-1}&limit=100`,
      ),
  });

/** Fetch invoices for a specific supplier. */
export const useFetchInvoicesBySupplier = (supplierId: string | undefined) =>
  useQuery<Invoice[]>({
    queryKey: ["invoices", "supplier", supplierId],
    queryFn: () =>
      fetcher<Invoice[]>(
        `${API_URL}/api/content/items/invoice?populate=1&filter={supplier:"${supplierId}"}&sort={issueDate:-1}`,
      ),
    enabled: Boolean(supplierId),
  });

export const useFetchInvoice = (id: string | undefined) =>
  useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: () =>
      fetcher<Invoice>(`${API_URL}/api/content/item/invoice/${id}`),
    enabled: Boolean(id),
  });

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoice: Partial<Invoice>) =>
      fetcher<Invoice>(`${API_URL}/api/content/item/invoice`, {
        method: "POST",
        body: JSON.stringify({ data: invoice }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      emitPosEvent("invoice:created", {
        invoiceId: data?._id,
        supplierId:
          data?.supplier && typeof data.supplier === "object"
            ? (data.supplier as LinkModelType)?._id
            : undefined,
      });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoice: Partial<Invoice>) =>
      fetcher<Invoice>(`${API_URL}/api/content/item/invoice`, {
        method: "POST",
        body: JSON.stringify({ data: invoice }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["invoice", variables._id],
        });
      }
      emitPosEvent("invoice:updated", {
        invoiceId: variables?._id ?? data?._id,
        status: variables?.status,
      });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/invoice/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Invoice items (line items)                                          */
/* ------------------------------------------------------------------ */

export const useFetchInvoiceItems = (invoiceId: string | undefined) =>
  useQuery<InvoiceItem[]>({
    queryKey: ["invoiceItems", invoiceId],
    queryFn: () =>
      fetcher<InvoiceItem[]>(
        `${API_URL}/api/content/items/invoiceitem?populate=1&filter={invoice:"${invoiceId}"}`,
      ),
    enabled: Boolean(invoiceId),
    placeholderData: [],
  });

export const useCreateInvoiceItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<InvoiceItem>) =>
      fetcher<InvoiceItem>(`${API_URL}/api/content/item/invoiceitem`, {
        method: "POST",
        body: JSON.stringify({ data: item }),
      }),
    onSuccess: (_, variables) => {
      const invoiceId =
        typeof variables.invoice === "object"
          ? (variables.invoice as LinkModelType)?._id
          : undefined;
      if (invoiceId) {
        queryClient.invalidateQueries({
          queryKey: ["invoiceItems", invoiceId],
        });
      }
    },
  });
};

export const useUpdateInvoiceItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<InvoiceItem>) =>
      fetcher<InvoiceItem>(`${API_URL}/api/content/item/invoiceitem`, {
        method: "POST",
        body: JSON.stringify({ data: item }),
      }),
    onSuccess: (_, variables) => {
      const invoiceId =
        typeof variables.invoice === "object"
          ? (variables.invoice as LinkModelType)?._id
          : undefined;
      if (invoiceId) {
        queryClient.invalidateQueries({
          queryKey: ["invoiceItems", invoiceId],
        });
      }
    },
  });
};

export const useDeleteInvoiceItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/invoiceitem/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["invoiceItems"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Composite: approve invoice + restock all line items                */
/* ------------------------------------------------------------------ */

export interface ApproveInvoiceInput {
  invoice: Invoice;
  items: InvoiceItem[];
  staff?: string;
}

/**
 * Approve an invoice (transition status to "received") and restock
 * all line items into inventory. Each line item triggers an
 * inventory restock movement + audit transaction.
 *
 * Idempotent: line items with `restocked=true` are skipped, so
 * re-running approval (e.g. after partial failure) won't double-restock.
 */
export const useApproveInvoice = () => {
  const updateInvoice = useUpdateInvoice();
  const updateInvoiceItem = useUpdateInvoiceItem();
  const applyStockMovement = useApplyStockMovement();

  return useMutation({
    mutationFn: async (
      input: ApproveInvoiceInput,
    ): Promise<{
      restockedCount: number;
      failedCount: number;
      errors: string[];
    }> => {
      const errors: string[] = [];
      let restockedCount = 0;
      let failedCount = 0;

      // 1. Restock each line item that hasn't been processed yet
      for (const item of input.items) {
        if (item.restocked) continue;

        const invId =
          item.inventoryItem &&
          typeof item.inventoryItem === "object" &&
          "_id" in item.inventoryItem
            ? (item.inventoryItem as LinkModelType)._id
            : undefined;
        if (!invId) {
          errors.push(`Line "${item.itemName}" has no inventory item link`);
          failedCount++;
          continue;
        }

        try {
          await applyStockMovement.mutateAsync({
            inventoryItemId: invId,
            delta: Math.abs(item.quantity),
            type: StockTransactionType.Restock,
            reason: `Invoice ${input.invoice.invoiceNumber} — ${item.itemName} × ${item.quantity}`,
            user: input.staff,
          });

          // Mark this line item as restocked
          await updateInvoiceItem.mutateAsync({
            _id: item._id,
            restocked: true,
          });
          restockedCount++;
        } catch (err) {
          errors.push(
            `Failed to restock ${item.itemName}: ${err instanceof Error ? err.message : "Unknown"}`,
          );
          failedCount++;
        }
      }

      // 2. Update invoice status to "received" + set receivedDate
      const today = new Date().toISOString().slice(0, 10);
      await updateInvoice.mutateAsync({
        _id: input.invoice._id,
        status: InvoiceStatus.Received,
        receivedDate: today,
      });

      return { restockedCount, failedCount, errors };
    },
  });
};

/* ------------------------------------------------------------------ */
/* Helper: compute totals from line items                              */
/* ------------------------------------------------------------------ */

export interface LineItemDraft {
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

/**
 * Compute the net/tax/total amounts for a set of line items.
 * Used by the invoice form to show running totals as the user types.
 */
export const computeInvoiceTotals = (items: LineItemDraft[]) => {
  let netAmount = 0;
  let taxAmount = 0;

  const groupedByRate = new Map<number, { net: number; tax: number }>();

  for (const item of items) {
    const lineNet = round2(item.quantity * item.unitPrice);
    const lineTax = round2((lineNet * item.taxRate) / 100);
    netAmount += lineNet;
    taxAmount += lineTax;

    const existing = groupedByRate.get(item.taxRate) ?? { net: 0, tax: 0 };
    groupedByRate.set(item.taxRate, {
      net: round2(existing.net + lineNet),
      tax: round2(existing.tax + lineTax),
    });
  }

  return {
    netAmount: round2(netAmount),
    taxAmount: round2(taxAmount),
    totalAmount: round2(netAmount + taxAmount),
    byRate: Array.from(groupedByRate.entries()).map(([rate, v]) => ({
      rate,
      ...v,
    })),
  };
};
