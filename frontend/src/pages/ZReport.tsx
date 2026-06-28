import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Printer,
  Calendar,
  TrendingUp,
  Wallet,
  Receipt,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useFetchOrders } from "@/services/orderService";
import { useFetchOpenCashDrawerSession } from "@/services/cashDrawerService";
import { useFetchFiscalInvoices } from "@/services/fiscalService";
import { Order, OrderStatus, PaymentMethod } from "@/types";
import { round2 } from "@/lib/helper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatDateLong = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

interface PaymentBreakdown {
  method: PaymentMethod;
  label: string;
  count: number;
  total: number;
}

interface TaxBreakdownAgg {
  rate: number;
  base: number;
  tax: number;
  total: number;
}

/**
 * Z-Report (dnevni zaključek) — daily closing report required by Slovenian
 * law (ZDavPR). Shows:
 *
 * - Total sales for the day (by payment method)
 * - Tax breakdown per DDV rate (22%, 9.5%, 0%)
 * - Cash drawer reconciliation (opening float + cash sales = expected)
 * - Invoice count (FURS submitted / pending / failed)
 * - Voided/cancelled orders
 *
 * The report can be printed (window.print) and kept as the daily record.
 */
const ZReport = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: allOrders, isLoading } = useFetchOrders();
  const { data: openSessions } = useFetchOpenCashDrawerSession();
  const { data: fiscalInvoices } = useFetchFiscalInvoices();

  // Filter orders for the selected date
  const dayOrders = useMemo(() => {
    if (!allOrders) return [];
    const start = new Date(selectedDate + "T00:00:00").getTime() / 1000;
    const end = new Date(selectedDate + "T23:59:59").getTime() / 1000;
    return allOrders.filter(
      (o) => (o._created ?? 0) >= start && (o._created ?? 0) <= end,
    );
  }, [allOrders, selectedDate]);

  // Compute breakdowns
  const summary = useMemo(() => {
    const completed = dayOrders.filter(
      (o) => o.status === OrderStatus.Completed,
    );
    const cancelled = dayOrders.filter(
      (o) => o.status === OrderStatus.Cancelled,
    );

    // Payment method breakdown
    const paymentMethods: PaymentMethod[] = ["cash", "card", "other"];
    const paymentBreakdown: PaymentBreakdown[] = paymentMethods.map((m) => {
      const methodOrders = completed.filter(
        (o) => (o.payment_method ?? "cash") === m,
      );
      return {
        method: m,
        label:
          m === "cash" ? "Gotovina" : m === "card" ? "Kartica" : "Drugo",
        count: methodOrders.length,
        total: methodOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0),
      };
    });

    // Tax breakdown — aggregate from order snapshots
    const taxMap = new Map<number, TaxBreakdownAgg>();
    for (const o of completed) {
      if (o.tax_breakdown && Array.isArray(o.tax_breakdown)) {
        for (const entry of o.tax_breakdown) {
          const existing = taxMap.get(entry.rate) ?? {
            rate: entry.rate,
            base: 0,
            tax: 0,
            total: 0,
          };
          existing.base += entry.base ?? 0;
          existing.tax += entry.tax ?? 0;
          existing.total += entry.total ?? 0;
          taxMap.set(entry.rate, existing);
        }
      }
    }
    const taxBreakdown = Array.from(taxMap.values())
      .map((t) => ({
        ...t,
        base: round2(t.base),
        tax: round2(t.tax),
        total: round2(t.total),
      }))
      .sort((a, b) => b.rate - a.rate);

    const totalRevenue = completed.reduce(
      (s, o) => s + (o.total_amount ?? 0),
      0,
    );
    const totalTax = taxBreakdown.reduce((s, t) => s + t.tax, 0);
    const netRevenue = round2(totalRevenue - totalTax);

    // Cash drawer reconciliation
    const cashSales = paymentBreakdown.find((p) => p.method === "cash");
    const openSession = openSessions?.[0];
    const openingFloat = openSession?.openingFloat ?? 0;
    const expectedCash = round2(openingFloat + (cashSales?.total ?? 0));

    return {
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      cancelledTotal: cancelled.reduce(
        (s, o) => s + (o.total_amount ?? 0),
        0,
      ),
      paymentBreakdown,
      taxBreakdown,
      totalRevenue: round2(totalRevenue),
      totalTax: round2(totalTax),
      netRevenue,
      openingFloat,
      expectedCash,
      cashDrawerOpen: Boolean(openSession),
    };
  }, [dayOrders, openSessions]);

  // Fiscal invoice stats
  const fiscalStats = useMemo(() => {
    if (!fiscalInvoices) return { submitted: 0, pending: 0, failed: 0 };
    const dayInvoices = fiscalInvoices.filter((inv) => {
      if (!inv.issuedAt) return false;
      const d = new Date(inv.issuedAt * 1000);
      return d.toISOString().slice(0, 10) === selectedDate;
    });
    return {
      submitted: dayInvoices.filter((i) => i.status === "submitted").length,
      pending: dayInvoices.filter((i) => i.status === "pending").length,
      failed: dayInvoices.filter((i) => i.status === "failed").length,
    };
  }, [fiscalInvoices, selectedDate]);

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header — no-print */}
      <div className="flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-secondary" />
            Dnevni zaključek (Z-Report)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dnevno poročilo o prodaji za fiskalne namene
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(-1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(1)}
            className="gap-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={handlePrint} className="gap-2 ml-2">
            <Printer className="h-4 w-4" />
            Natisni
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto print:border-0 print:shadow-none print:p-4">
        {/* Report header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h2 className="text-xl font-bold">NORO LEP POS</h2>
          <p className="text-sm text-gray-600">Dnevni zaključek</p>
          <p className="text-lg font-medium mt-1 capitalize">
            {formatDateLong(selectedDate)}
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 no-print">
          <SummaryBox
            label="Promet"
            value={formatCurrency(summary.totalRevenue)}
            color="text-green-600"
          />
          <SummaryBox
            label="Naročil"
            value={String(summary.completedCount)}
            color="text-orange-600"
          />
          <SummaryBox
            label="DDV"
            value={formatCurrency(summary.totalTax)}
            color="text-blue-600"
          />
          <SummaryBox
            label="Preklicanih"
            value={String(summary.cancelledCount)}
            color="text-red-600"
          />
        </div>

        {/* Payment method breakdown */}
        <div className="mb-6">
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-500" />
            Po načinu plačila
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Način plačila</TableHead>
                <TableHead className="text-right">Št. naročil</TableHead>
                <TableHead className="text-right">Znesek</TableHead>
                <TableHead className="text-right">Delež</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.paymentBreakdown.map((pm) => (
                <TableRow key={pm.method}>
                  <TableCell className="font-medium">{pm.label}</TableCell>
                  <TableCell className="text-right">{pm.count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(pm.total)}
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {summary.totalRevenue > 0
                      ? `${((pm.total / summary.totalRevenue) * 100).toFixed(1)}%`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-bold">
                <TableCell>SKUPAJ</TableCell>
                <TableCell className="text-right">
                  {summary.completedCount}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.totalRevenue)}
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Tax breakdown */}
        <div className="mb-6">
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-500" />
            DDV razčlenitev
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stopnja</TableHead>
                <TableHead className="text-right">Osnova</TableHead>
                <TableHead className="text-right">DDV</TableHead>
                <TableHead className="text-right">Skupaj</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.taxBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-400 py-4"
                  >
                    Ni podatkov o DDV za ta dan.
                  </TableCell>
                </TableRow>
              ) : (
                summary.taxBreakdown.map((row) => (
                  <TableRow key={row.rate}>
                    <TableCell className="font-medium">
                      DDV {row.rate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.base)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.tax)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              <TableRow className="border-t-2 font-bold">
                <TableCell>SKUPAJ</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.netRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.totalTax)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.totalRevenue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Cash drawer reconciliation */}
        <div className="mb-6">
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-500" />
            Blagajna (gotovina)
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Začetni stanje (float):</span>
              <span className="font-medium">
                {formatCurrency(summary.openingFloat)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                + Gotovinska prodaja:
              </span>
              <span className="font-medium">
                {formatCurrency(
                  summary.paymentBreakdown.find((p) => p.method === "cash")
                    ?.total ?? 0,
                )}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-bold text-base">
              <span>Pričakovan denar v blagajni:</span>
              <span className="text-green-600">
                {formatCurrency(summary.expectedCash)}
              </span>
            </div>
            {!summary.cashDrawerOpen && (
              <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Blagajna je zaprta — preštejte denar in primerjajte s
                pričakovanim zneskom.
              </div>
            )}
          </div>
        </div>

        {/* FURS invoices */}
        <div className="mb-6">
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-500" />
            FURS računi
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">
                {fiscalStats.submitted}
              </p>
              <p className="text-xs text-gray-500">Potrjenih</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-amber-600">
                {fiscalStats.pending}
              </p>
              <p className="text-xs text-gray-500">Na čakanju</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-red-600">
                {fiscalStats.failed}
              </p>
              <p className="text-xs text-gray-500">Neuspešnih</p>
            </div>
          </div>
        </div>

        {/* Cancelled orders */}
        {summary.cancelledCount > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Preklicana naročila
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <span className="text-gray-600">
                {summary.cancelledCount} preklicanih naročil s skupnim
                zneskom{" "}
              </span>
              <span className="font-medium text-red-600">
                {formatCurrency(summary.cancelledTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t text-center text-xs text-gray-400">
          <p>
            Poročilo generirano:{" "}
            {new Date().toLocaleString("sl-SI", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="mt-1">
            Noro Lep POS · Davčna blagajna · ZDavPR
          </p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Summary box                                                         */
/* ------------------------------------------------------------------ */

const SummaryBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
  >
    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
      {label}
    </p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
  </motion.div>
);

export default ZReport;
