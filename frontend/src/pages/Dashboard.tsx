import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  CalendarCheck,
  Package,
  Wallet,
  AlertTriangle,
  Clock,
  ArrowRight,
  Receipt,
  Users,
  ChefHat,
  CheckCircle,
  PlusCircle,
  Unlock,
  QrCode,
  Award,
  Star,
} from "lucide-react";
import { useFetchOrders } from "@/services/orderService";
import { useFetchReservations } from "@/services/reservationService";
import { useFetchInventoryItems } from "@/services/inventoryService";
import { useFetchOpenCashDrawerSession } from "@/services/cashDrawerService";
import { useFetchCustomers } from "@/services/customerService";
import { useFetchFeedback, buildFeedbackSummary, renderStars } from "@/services/feedbackService";
import { OrderStatus, ReservationStatus } from "@/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatTime = (epoch?: number) => {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const today = () => new Date().toISOString().slice(0, 10);
const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};

/**
 * Manager Dashboard — the new home page for managers.
 *
 * Aggregates data from all modules into a single overview:
 * - KPI cards: today's revenue, orders, reservations, low stock
 * - Cash drawer status (open/closed)
 * - Active kitchen orders count
 * - Recent activity feed (latest orders + reservations)
 * - Quick action buttons
 *
 * Waiters and chefs skip this page and go directly to Tables / Kitchen.
 */
const Dashboard = () => {
  const navigate = useNavigate();

  const { data: orders } = useFetchOrders();
  const { data: reservations } = useFetchReservations();
  const { data: inventory } = useFetchInventoryItems();
  const { data: openSessions } = useFetchOpenCashDrawerSession();
  const { data: customers } = useFetchCustomers();
  const { data: feedback } = useFetchFeedback();
  const feedbackSummary = useMemo(
    () => buildFeedbackSummary(feedback),
    [feedback],
  );

  // Compute today's metrics
  const metrics = useMemo(() => {
    const start = todayStart();
    const todaysOrders = (orders ?? []).filter(
      (o) => (o._created ?? 0) >= start,
    );
    const todaysCompleted = todaysOrders.filter(
      (o) => o.status === OrderStatus.Completed,
    );
    const todaysRevenue = todaysCompleted.reduce(
      (sum, o) => sum + (o.total_amount ?? 0),
      0,
    );
    const todaysReservations = (reservations ?? []).filter(
      (r) => r.date === today(),
    );
    const activeReservations = todaysReservations.filter(
      (r) =>
        r.status === ReservationStatus.Pending ||
        r.status === ReservationStatus.Confirmed,
    );
    const lowStockItems = (inventory ?? []).filter(
      (i) => (i.quantity ?? 0) < (i.threshold ?? 0),
    );
    const outOfStockItems = (inventory ?? []).filter(
      (i) => (i.quantity ?? 0) <= 0,
    );
    const pendingKitchenOrders = todaysOrders.filter(
      (o) => o.status === OrderStatus.Pending,
    ).length;

    return {
      todaysRevenue,
      todaysOrderCount: todaysOrders.length,
      completedOrderCount: todaysCompleted.length,
      todaysReservations: activeReservations.length,
      totalReservationsToday: todaysReservations.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      pendingKitchenOrders,
      totalCustomers: customers?.length ?? 0,
      cashDrawerOpen: (openSessions ?? []).length > 0,
    };
  }, [orders, reservations, inventory, customers, openSessions]);

  // Recent activity (latest 8 events from orders + reservations)
  const recentActivity = useMemo(() => {
    const recentOrders = (orders ?? [])
      .slice(0, 5)
      .map((o) => ({
        type: "order" as const,
        _id: o._id ?? "",
        _created: o._created ?? 0,
        title: `Naročilo ${o._id?.slice(-6) ?? ""}`,
        subtitle:
          o.table?.table_number
            ? `Miza ${o.table.table_number}`
            : "Naročilo",
        status: o.status,
        amount: o.total_amount,
      }));

    const recentReservations = (reservations ?? [])
      .filter((r) => r.date === today())
      .slice(0, 3)
      .map((r) => ({
        type: "reservation" as const,
        _id: r._id ?? "",
        _created: r._created ?? 0,
        title: `Rezervacija — ${r.customerName}`,
        subtitle: `${r.time} · ${r.partySize} oseb`,
        status: r.status,
        amount: undefined,
      }));

    return [...recentOrders, ...recentReservations]
      .sort((a, b) => (b._created ?? 0) - (a._created ?? 0))
      .slice(0, 8);
  }, [orders, reservations]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Nadzorna plošča</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("sl-SI", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPI cards row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          label="Današnja prodaja"
          value={formatCurrency(metrics.todaysRevenue)}
          subtitle={`${metrics.completedOrderCount} zaključenih naročil`}
          color="#10b981"
          onClick={() => navigate("/orders")}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Naročila danes"
          value={String(metrics.todaysOrderCount)}
          subtitle={`${metrics.pendingKitchenOrders} v obdelavi`}
          color="#f97316"
          onClick={() => navigate("/orders")}
        />
        <KpiCard
          icon={CalendarCheck}
          label="Rezervacije danes"
          value={String(metrics.todaysReservations)}
          subtitle={`${metrics.totalReservationsToday} skupno`}
          color="#3b82f6"
          onClick={() => navigate("/reservations")}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Nizka zaloga"
          value={String(metrics.lowStockCount)}
          subtitle={
            metrics.outOfStockCount > 0
              ? `${metrics.outOfStockCount} brez zaloge!`
              : "Vse v redu"
          }
          color={
            metrics.outOfStockCount > 0
              ? "#ef4444"
              : metrics.lowStockCount > 0
                ? "#f59e0b"
                : "#9ca3af"
          }
          onClick={() => navigate("/inventory")}
        />
      </div>

      {/* KPI cards row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Wallet}
          label="Blagajna"
          value={metrics.cashDrawerOpen ? "Odprta" : "Zaprta"}
          subtitle={
            metrics.cashDrawerOpen ? "Izmena aktivna" : "Začetek izmene"
          }
          color={metrics.cashDrawerOpen ? "#10b981" : "#6b7280"}
          onClick={() => navigate("/cash-drawer")}
        />
        <KpiCard
          icon={ChefHat}
          label="Kuhinja"
          value={String(metrics.pendingKitchenOrders)}
          subtitle="naročil čaka"
          color="#f97316"
          onClick={() => navigate("/kitchen")}
        />
        <KpiCard
          icon={Users}
          label="Stranke"
          value={String(metrics.totalCustomers)}
          subtitle="lojalnost člani"
          color="#8b5cf6"
          onClick={() => navigate("/customers")}
        />
        <KpiCard
          icon={Receipt}
          label="Računi FURS"
          value="aktivni"
          subtitle="ZOI + EOR + QR"
          color="#06b6d4"
          onClick={() => navigate("/fiscal")}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Hitre akcije
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction
            icon={PlusCircle}
            label="Novo naročilo"
            onClick={() => navigate("/")}
            color="bg-orange-100 text-orange-600"
          />
          <QuickAction
            icon={CalendarCheck}
            label="Nova rezervacija"
            onClick={() => navigate("/reservations")}
            color="bg-blue-100 text-blue-600"
          />
          <QuickAction
            icon={Unlock}
            label="Odpri blagajno"
            onClick={() => navigate("/cash-drawer")}
            color="bg-green-100 text-green-600"
          />
          <QuickAction
            icon={QrCode}
            label="QR kode"
            onClick={() => navigate("/qr-codes")}
            color="bg-purple-100 text-purple-600"
          />
          <QuickAction
            icon={Award}
            label="Nagrade"
            onClick={() => navigate("/loyalty-rewards")}
            color="bg-pink-100 text-pink-600"
          />
          <QuickAction
            icon={TrendingUp}
            label="Poročila"
            onClick={() => navigate("/reports")}
            color="bg-cyan-100 text-cyan-600"
          />
        </div>
      </div>

      {/* Recent activity + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Zadnja aktivnost
            </h2>
            <button
              onClick={() => navigate("/orders")}
              className="text-xs text-secondary hover:underline flex items-center gap-1"
            >
              Vsi <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Ni nedavne aktivnosti.
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity._id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === "order"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {activity.type === "order" ? (
                      <ShoppingBag className="h-4 w-4" />
                    ) : (
                      <CalendarCheck className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.subtitle} · {formatTime(activity._created)}
                    </p>
                  </div>
                  {activity.amount !== undefined && (
                    <span className="text-sm font-medium">
                      {formatCurrency(activity.amount)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Guest feedback widget */}
        {feedbackSummary.totalFeedback > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                Ocene gostov
              </h2>
              <span className="text-2xl font-bold text-amber-500">
                {feedbackSummary.averageRating.toFixed(1)}
                <span className="text-sm text-gray-400">/5</span>
              </span>
            </div>
            <div className="p-4 space-y-2">
              {/* Distribution bars */}
              {feedbackSummary.distribution.reverse().map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-8">{d.stars}★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{d.count}</span>
                </div>
              ))}
              {/* Recent comments */}
              {feedbackSummary.recentComments.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-2 max-h-32 overflow-y-auto">
                  {feedbackSummary.recentComments.slice(0, 3).map((c) => (
                    <div key={c._id} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400">
                          {"★".repeat(c.rating)}
                          <span className="text-gray-200">{"★".repeat(5 - c.rating)}</span>
                        </span>
                        <span className="font-medium text-gray-600">{c.guestName ?? "Gost"}</span>
                        {c.tableNumber && (
                          <span className="text-gray-400">· Miza {c.tableNumber}</span>
                        )}
                      </div>
                      {c.comment && (
                        <p className="text-gray-500 italic mt-0.5 line-clamp-2">"{c.comment}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerts + status */}
        <div className="space-y-4">
          {/* Low stock alert */}
          {metrics.lowStockCount > 0 && (
            <div
              className={`rounded-xl border p-4 ${
                metrics.outOfStockCount > 0
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    metrics.outOfStockCount > 0
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`font-medium text-sm ${
                      metrics.outOfStockCount > 0
                        ? "text-red-800"
                        : "text-amber-800"
                    }`}
                  >
                    {metrics.outOfStockCount > 0
                      ? `${metrics.outOfStockCount} artiklov brez zaloge!`
                      : `${metrics.lowStockCount} artiklov z nizko zalogo`}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Preverite zalogo in naročite pri dobaviteljih.
                  </p>
                  <button
                    onClick={() => navigate("/inventory")}
                    className={`text-xs mt-2 flex items-center gap-1 ${
                      metrics.outOfStockCount > 0
                        ? "text-red-700"
                        : "text-amber-700"
                    } hover:underline`}
                  >
                    Upravljaj zalogo <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cash drawer alert */}
          {!metrics.cashDrawerOpen && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 flex-shrink-0 mt-0.5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">
                    Blagajna je zaprta
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Začnite izmeno z odprtjem blagajne.
                  </p>
                  <button
                    onClick={() => navigate("/cash-drawer")}
                    className="text-xs mt-2 flex items-center gap-1 text-secondary hover:underline"
                  >
                    Odpri blagajno <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reservations today */}
          {metrics.todaysReservations > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <CalendarCheck className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-blue-800">
                    {metrics.todaysReservations} rezervacij danes
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Preverite ure in potrdite nepotrjene.
                  </p>
                  <button
                    onClick={() => navigate("/reservations")}
                    className="text-xs mt-2 flex items-center gap-1 text-blue-700 hover:underline"
                  >
                    Upravljaj rezervacije <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All good indicator */}
          {metrics.lowStockCount === 0 &&
            metrics.cashDrawerOpen &&
            metrics.todaysReservations === 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm text-green-800">
                      Vse v redu!
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Zaloga OK, blagajna odprta, ni rezervacij.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

const KpiCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  onClick?: () => void;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-shadow w-full"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
          {label}
        </p>
        <p className="text-2xl font-bold mt-1 truncate">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </motion.button>
);

/* ------------------------------------------------------------------ */
/* Quick action button                                                 */
/* ------------------------------------------------------------------ */

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}
    >
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-xs font-medium text-gray-700 text-center">
      {label}
    </span>
  </motion.button>
);

export default Dashboard;
