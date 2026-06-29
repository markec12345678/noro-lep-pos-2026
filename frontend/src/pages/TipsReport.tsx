import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  TrendingUp,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useFetchOrdersForTips,
  buildTipSummary,
} from "@/services/tipService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

/**
 * Tips Report — daily/weekly tip breakdown per staff member.
 *
 * Shows:
 * - Total tips collected (today / this week)
 * - Cash vs card tips (cash tips go directly to staff, card tips to payroll)
 * - Tip rate (% of orders that included a tip)
 * - Per-staff breakdown: orders served, total tips, average tip, cash vs card
 *
 * Useful for fair tip distribution at end of shift.
 */
const TipsReport = () => {
  const [mode, setMode] = useState<"today" | "week">("today");

  // Compute date range
  const { startDate, endDate, label } = useMemo(() => {
    const now = new Date();
    if (mode === "today") {
      const today = now.toISOString().slice(0, 10);
      return { startDate: today, endDate: today, label: "Danes" };
    }
    // This week (Mon-Sun)
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: monday.toISOString().slice(0, 10),
      endDate: sunday.toISOString().slice(0, 10),
      label: "Ta teden",
    };
  }, [mode]);

  const { data: orders, isLoading } = useFetchOrdersForTips(
    startDate,
    endDate,
  );

  const summary = useMemo(
    () => buildTipSummary(orders ?? []),
    [orders],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            Pregled napitnin
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {label} · {formatDate(startDate)}
            {mode === "week" && ` – ${formatDate(endDate)}`}
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setMode("today")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "today"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Danes
          </button>
          <button
            onClick={() => setMode("week")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "week"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Ta teden
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox
          icon={Heart}
          label="Skupne napitnine"
          value={formatCurrency(summary.totalTips)}
          color="text-pink-600"
          bg="bg-pink-100"
        />
        <StatBox
          icon={Wallet}
          label="Gotovinske"
          value={formatCurrency(summary.cashTips)}
          color="text-green-600"
          bg="bg-green-100"
        />
        <StatBox
          icon={TrendingUp}
          label="Kartične"
          value={formatCurrency(summary.cardTips)}
          color="text-blue-600"
          bg="bg-blue-100"
        />
        <StatBox
          icon={Users}
          label="Delež z napitnino"
          value={`${summary.tipRate}%`}
          color="text-orange-600"
          bg="bg-orange-100"
        />
      </div>

      {/* Per-staff table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            Po zaposlenem
          </h2>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : summary.byStaff.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            Ni podatkov za izbrano obdobje.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zaposleni</TableHead>
                <TableHead className="text-right">Naročil</TableHead>
                <TableHead className="text-right">Povprečno</TableHead>
                <TableHead className="text-right">Gotovina</TableHead>
                <TableHead className="text-right">Kartica</TableHead>
                <TableHead className="text-right">Skupaj</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.byStaff.map((staff) => (
                <TableRow key={staff.staffName} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {staff.staffName}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {staff.orderCount}
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-500">
                    {formatCurrency(staff.averageTip)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-600">
                    {formatCurrency(staff.cashTips)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-blue-600">
                    {formatCurrency(staff.cardTips)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-pink-600">
                    {formatCurrency(staff.totalTips)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-bold">
                <TableCell>SKUPAJ</TableCell>
                <TableCell className="text-right">
                  {summary.totalOrders}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.averageTip)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(summary.cashTips)}
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {formatCurrency(summary.cardTips)}
                </TableCell>
                <TableCell className="text-right text-pink-600">
                  {formatCurrency(summary.totalTips)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Distribucija napitnin</p>
        <ul className="list-disc pl-5 space-y-0.5 text-xs">
          <li>
            <strong>Gotovinske napitnine</strong> gredo neposredno zaposlenemu
            (pripravljene ob koncu izmene).
          </li>
          <li>
            <strong>Kartične napitnine</strong> se dodajo k plači (izplačilo
            ob rednem izplačilu).
          </li>
          <li>
            Napitnina se shrani ob checkoutu skupaj z naročilom in se
            pripisuje zaposlenemu, ki je postregel (served_by).
          </li>
          <li>
            Pregled po zaposlenih je razvrščen po znesku napitnin (največ
            prvi).
          </li>
        </ul>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Stat box                                                            */
/* ------------------------------------------------------------------ */

const StatBox = ({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
          {label}
        </p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg} ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

export default TipsReport;
