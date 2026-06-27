// services/fiscalService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiscalConfig, FiscalInvoice, TaxBreakdownEntry } from "@/types";
import { fetcher } from "@/lib/helper";

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------------------------------------------------------ */
/* Fiscal configuration (Cockpit CMS)                                 */
/* ------------------------------------------------------------------ */

/** Fetch the (singleton) fiscal configuration record. */
export const useFetchFiscalConfig = () =>
  useQuery<FiscalConfig[]>({
    queryKey: ["fiscalConfig"],
    queryFn: () =>
      fetcher<FiscalConfig[]>(
        `${API_URL}/api/content/items/fiscalconfig?populate=1&limit=1`,
      ),
  });

export const useUpdateFiscalConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<FiscalConfig>) =>
      fetcher<FiscalConfig>(`${API_URL}/api/content/item/fiscalconfig`, {
        method: "POST",
        body: JSON.stringify({ data: config }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["fiscalConfig"] }),
  });
};

/**
 * Atomically increment the invoice sequence counter and return the next
 * invoice number. Implemented as a read-modify-write on the singleton
 * config record. In a high-concurrency deployment this should be moved
 * to a backend transaction endpoint, but for a single-POS restaurant
 * the race window is negligible.
 */
export const useGetNextInvoiceNumber = () => {
  const queryClient = useQueryClient();
  const updateConfig = useUpdateFiscalConfig();
  const fetchConfig = useFetchFiscalConfig();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      // Wait for the config to be loaded
      const config = (await fetchConfig.refetch()).data?.[0];
      if (!config?._id) {
        throw new Error(
          "Fiscal config not found. Configure FURS settings first.",
        );
      }
      const next = (config.lastInvoiceNumber ?? 0) + 1;
      await updateConfig.mutateAsync({
        _id: config._id,
        lastInvoiceNumber: next,
      });
      queryClient.invalidateQueries({ queryKey: ["fiscalConfig"] });
      return String(next);
    },
  });
};

/* ------------------------------------------------------------------ */
/* Fiscal invoices (audit log)                                        */
/* ------------------------------------------------------------------ */

/** Fetch all fiscal invoices, newest first. */
export const useFetchFiscalInvoices = () =>
  useQuery<FiscalInvoice[]>({
    queryKey: ["fiscalInvoices"],
    queryFn: () =>
      fetcher<FiscalInvoice[]>(
        `${API_URL}/api/content/items/fiscalinvoice?populate=1&sort={issuedAt:-1}&limit=100`,
      ),
  });

/** Fetch the fiscal invoice linked to a specific order. */
export const useFetchFiscalInvoiceForOrder = (orderId: string | undefined) =>
  useQuery<FiscalInvoice[]>({
    queryKey: ["fiscalInvoices", "order", orderId],
    queryFn: () =>
      fetcher<FiscalInvoice[]>(
        `${API_URL}/api/content/items/fiscalinvoice?populate=1&filter={order:"${orderId}"}`,
      ),
    enabled: Boolean(orderId),
  });

export const useCreateFiscalInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoice: Partial<FiscalInvoice>) =>
      fetcher<FiscalInvoice>(`${API_URL}/api/content/item/fiscalinvoice`, {
        method: "POST",
        body: JSON.stringify({ data: invoice }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["fiscalInvoices"] }),
  });
};

export const useUpdateFiscalInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoice: Partial<FiscalInvoice>) =>
      fetcher<FiscalInvoice>(`${API_URL}/api/content/item/fiscalinvoice`, {
        method: "POST",
        body: JSON.stringify({ data: invoice }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fiscalInvoices"] });
      if (variables?._id) {
        queryClient.invalidateQueries({
          queryKey: ["fiscalInvoices", "order"],
        });
      }
    },
  });
};

/* ------------------------------------------------------------------ */
/* FURS mini-service client (port 3004 via XTransformPort)            */
/* ------------------------------------------------------------------ */

const FURS_SERVICE_BASE = "/api/furs";

export interface GenerateZoiInput {
  taxNumber: string;
  issueDateTime: string;
  invoiceNumber: string;
  businessUnit: string;
  electronicDevice: string;
  total: number;
  controlSeq?: number;
}

export interface GenerateZoiResult {
  zoi: string;
  qrCode: string;
  signatureLength: number;
}

/**
 * Call the FURS mini-service to compute the ZOI + QR code.
 * Falls through the Caddy gateway via XTransformPort=3004.
 */
export const generateZoi = async (
  input: GenerateZoiInput,
): Promise<GenerateZoiResult> => {
  const url = `${FURS_SERVICE_BASE}/generate-zoi?XTransformPort=3004`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `ZOI generation failed: ${error.detail ?? response.status}`,
    );
  }
  return response.json();
};

export interface SubmitInvoiceInput {
  zoi: string;
  taxNumber: string;
  issueDateTime: string;
  invoiceNumber: string;
  businessUnit: string;
  electronicDevice: string;
  controlSeq?: number;
  totalAmount: number;
  taxesByRate: TaxBreakdownEntry[];
  paymentMethod: "cash" | "card" | "other";
  customerTaxNumber?: string;
}

export interface SubmitInvoiceResult {
  eor: string;
  submittedAt: string;
  mode: "test" | "production";
  mock: boolean;
  message?: string;
}

/**
 * Call the FURS mini-service to submit an invoice.
 * In test mode returns a mock EOR; in production mode requires
 * FURS_MODE=production + FURS_CERT_PATH + FURS_KEY_PATH env vars.
 */
export const submitFursInvoice = async (
  input: SubmitInvoiceInput,
): Promise<SubmitInvoiceResult> => {
  const url = `${FURS_SERVICE_BASE}/submit-invoice?XTransformPort=3004`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `FURS submission failed: ${error.detail ?? response.status}`,
    );
  }
  return response.json();
};

/* ------------------------------------------------------------------ */
/* Composite: issue a fiscal invoice end-to-end                       */
/* ------------------------------------------------------------------ */

export interface IssueFiscalInvoiceInput {
  orderId: string;
  totalAmount: number;
  taxesByRate: TaxBreakdownEntry[];
  paymentMethod: "cash" | "card" | "other";
  customerTaxNumber?: string;
  config: FiscalConfig;
}

/**
 * End-to-end fiscal invoice issuance:
 *   1. Get next invoice number (atomic increment)
 *   2. Generate ZOI + QR code via FURS mini-service
 *   3. Submit invoice to FURS (mock in test mode, real in production)
 *   4. Persist a FiscalInvoice record with all snapshots
 *
 * Returns the created FiscalInvoice so the receipt can display ZOI/EOR/QR.
 *
 * If FURS submission fails (network, server down), the invoice is still
 * stored with status="pending" and a ZOI so the receipt can be printed.
 * The submission must be retried within 48 hours per Slovenian law.
 */
export const useIssueFiscalInvoice = () => {
  const getNextNumber = useGetNextInvoiceNumber();
  const createInvoice = useCreateFiscalInvoice();
  const updateInvoice = useUpdateFiscalInvoice();

  return useMutation({
    mutationFn: async (
      input: IssueFiscalInvoiceInput,
    ): Promise<FiscalInvoice> => {
      const { config } = input;

      // 1. Get next invoice number
      const invoiceNumber = await getNextNumber.mutateAsync();
      const now = Math.floor(Date.now() / 1000);
      const issueDateTime = new Date(now * 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, "");

      // 2. Generate ZOI + QR via FURS mini-service
      const { zoi, qrCode } = await generateZoi({
        taxNumber: config.taxNumber,
        issueDateTime,
        invoiceNumber,
        businessUnit: config.businessUnit,
        electronicDevice: config.electronicDevice,
        total: input.totalAmount,
        controlSeq: config.controlSeq ?? 1,
      });

      // 3. Persist the invoice record with status="pending"
      const invoice = await createInvoice.mutateAsync({
        order: { _model: "order", _id: input.orderId },
        invoiceNumber,
        businessUnit: config.businessUnit,
        electronicDevice: config.electronicDevice,
        zoi,
        qrCode,
        issueDateTime,
        issuedAt: now,
        totalAmount: input.totalAmount,
        taxesByRate: input.taxesByRate,
        paymentMethod: input.paymentMethod,
        customerTaxNumber: input.customerTaxNumber,
        status: "pending",
        attempts: 0,
      });

      // 4. Submit to FURS (best-effort — don't fail checkout if this errors)
      try {
        const submission = await submitFursInvoice({
          zoi,
          taxNumber: config.taxNumber,
          issueDateTime,
          invoiceNumber,
          businessUnit: config.businessUnit,
          electronicDevice: config.electronicDevice,
          controlSeq: config.controlSeq ?? 1,
          totalAmount: input.totalAmount,
          taxesByRate: input.taxesByRate,
          paymentMethod: input.paymentMethod,
          customerTaxNumber: input.customerTaxNumber,
        });

        const updated = await updateInvoice.mutateAsync({
          _id: invoice._id,
          eor: submission.eor,
          status: "submitted",
          submittedAt: now,
          attempts: 1,
        });
        return updated;
      } catch (err) {
        // Mark as failed but keep the invoice — must retry within 48h
        const updated = await updateInvoice.mutateAsync({
          _id: invoice._id,
          status: "failed",
          errorMessage:
            err instanceof Error ? err.message : "Unknown error",
          attempts: 1,
        });
        return updated;
      }
    },
  });
};
