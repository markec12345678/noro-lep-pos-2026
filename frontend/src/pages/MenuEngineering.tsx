import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Percent,
  Package,
  Star,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import {
  useMenuEngineering,
  formatCurrency,
  formatPercent,
  CLASSIFICATION_INFO,
} from "@/services/foodCostService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Menu Engineering page — profitability × popularity matrix.
 *
 * Classifies every menu item into one of 4 categories:
 * - ⭐ Star: popular + profitable (keep & promote)
 * - 🐴 Plowhorse: popular but low margin (raise price or cut costs)
 * - 🧩 Puzzle: profitable but unpopular (promote or rework)
 * - 🐶 Dog: unpopular + low margin (consider removing)
 *
 * Also shows:
 * - Total revenue / cost / profit across all items
 * - Average margin
 * - Per-item breakdown: price, cost, profit, qty sold, revenue, classification
 */
const MenuEngineering = () => {
  const { summary, isLoading } = useMenuEngineering();
  const [sortBy, setSortBy] = useState<
    "profit" | "revenue" | "quantity" | "margin"
  >("profit");

  const sortedItems = useMemo(() => {
    if (!summary) return [];
    const items = [...summary.items];
    switch (sortBy) {
      case "profit":
        items.sort((a, b) => b.totalProfit - a.totalProfit);
        break;
      case "revenue":
        items.sort((a, b) => b.revenue - a.revenue);
        break;
      case "quantity":
        items.sort((a, b) => b.quantitySold - a.quantitySold);
        break;
      case "margin":
        items.sort((a, b) => b.marginPercent - a.marginPercent);
        break;
    }
    return items;
  }, [summary, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Ni podatkov za analizo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-secondary" />
          Analiza donosnosti menija
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Profitabilnost vsake jedi glede na strošek sestavin in prodajo
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox
          icon={DollarSign}
          label="Skupni prihodek"
          value={formatCurrency(summary.totalRevenue)}
          color="text-green-600"
        />
        <StatBox
          icon={Package}
          label="Strošek sestavin"
          value={formatCurrency(summary.totalCost)}
          color="text-red-600"
        />
        <StatBox
          icon={TrendingUp}
          label="Bruto dobiček"
          value={formatCurrency(summary.totalProfit)}
          color="text-blue-600"
        />
        <StatBox
          icon={Percent}
          label="Povprečna marža"
          value={formatPercent(summary.averageMargin)}
          color="text-purple-600"
        />
      </div>

      {/* Classification overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ClassBox
          icon="⭐"
          label="Zvezde"
          count={summary.stars}
          description="Priljubljene & donosne"
          color="bg-yellow-50 border-yellow-200 text-yellow-800"
        />
        <ClassBox
          icon="🐴"
          label="Delavni konji"
          count={summary.plowhorses}
          description="Priljubljene, nizka marža"
          color="bg-blue-50 border-blue-200 text-blue-800"
        />
        <ClassBox
          icon="🧩"
          label="Uganke"
          count={summary.puzzles}
          description="Donosne, nepopularne"
          color="bg-purple-50 border-purple-200 text-purple-800"
        />
        <ClassBox
          icon="🐶"
          label="Psi"
          count={summary.dogs}
          description="Nepopularne & nedonosne"
          color="bg-gray-50 border-gray-200 text-gray-700"
        />
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-medium flex items-center gap-2 mb-1">
          <Info className="h-4 w-4" />
          Kako brati matriko?
        </p>
        <ul className="list-disc pl-5 space-y-0.5 text-xs">
          <li>
            <strong>Zvezde (⭐)</strong>: ohranite, promovirajte, poskrbite za
            doslednost kakovosti
          </li>
          <li>
            <strong>Delavni konji (🐴)</strong>: povečajte ceno ali zmanjšajte
            porcije/stroške sestavin
          </li>
          <li>
            <strong>Uganke (🧩)</strong>: promovirajte jih bolj (fotografije,
            priporočila natakarjev) ali spremenite recepturo
          </li>
          <li>
            <strong>Psi (🐶)</strong>: razmislite o odstranitvi ali
            preoblikovanju jedi
          </li>
          <li>
            Stroški se izračunajo iz receptov (RecipeItem × InventoryItem.cost)
          </li>
        </ul>
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Razvrsti po:</span>
        {(
          [
            { value: "profit", label: "Dobiček" },
            { value: "revenue", label: "Prihodek" },
            { value: "quantity", label: "Količina" },
            { value: "margin", label: "Marža" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              sortBy === opt.value
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-gray-200 text-gray-500 hover:border-gray-300",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jed</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead className="text-right">Strošek</TableHead>
                <TableHead className="text-right">Dobiček/kos</TableHead>
                <TableHead className="text-right">Marža</TableHead>
                <TableHead className="text-right">Prodano</TableHead>
                <TableHead className="text-right">Prihodek</TableHead>
                <TableHead className="text-right">Skupni dobiček</TableHead>
                <TableHead>Kategorija</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item) => {
                const info = CLASSIFICATION_INFO[item.classification];
                return (
                  <TableRow
                    key={item.menuId}
                    className={cn(
                      "hover:bg-gray-50",
                      item.classification === "dog" && "opacity-60",
                    )}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-red-500">
                      {item.costPerServing > 0
                        ? formatCurrency(item.costPerServing)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-green-600 font-medium">
                      {formatCurrency(item.grossProfit)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span
                        className={cn(
                          "font-medium",
                          item.marginPercent > 70
                            ? "text-green-600"
                            : item.marginPercent > 50
                              ? "text-yellow-600"
                              : "text-red-600",
                        )}
                      >
                        {formatPercent(item.marginPercent)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.quantitySold}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(item.totalProfit)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
                          info.color,
                        )}
                        title={info.description}
                      >
                        {info.icon} {info.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedItems.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-400"
                  >
                    Ni podatkov. Dodajte recepte (RecipeItem) k meni item-om
                    za izračun stroškov.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {sortedItems.length > 0 && (
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="px-4 py-3">SKUPAJ</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-red-500">
                    {formatCurrency(summary.totalCost)}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right">
                    {formatPercent(summary.averageMargin)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {summary.items.reduce((s, i) => s + i.quantitySold, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatCurrency(summary.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatCurrency(summary.totalProfit)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
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
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          color.replace("text-", "bg-").replace("600", "100"),
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Classification box                                                  */
/* ------------------------------------------------------------------ */

const ClassBox = ({
  icon,
  label,
  count,
  description,
  color,
}: {
  icon: string;
  label: string;
  count: number;
  description: string;
  color: string;
}) => (
  <div className={cn("rounded-xl border p-4", color)}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-bold">{count}</span>
    </div>
    <p className="font-medium text-sm">{label}</p>
    <p className="text-xs opacity-70 mt-0.5">{description}</p>
  </div>
);

export default MenuEngineering;
