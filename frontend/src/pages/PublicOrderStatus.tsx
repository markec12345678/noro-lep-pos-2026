import { motion } from "framer-motion";
import {
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useFetchGuestOrderStatus } from "@/services/publicMenuService";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatTime = (epoch: number) =>
  new Date(epoch * 1000).toLocaleString("sl-SI", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Order status tracking page for guests.
 *
 * After a guest submits their order via the public menu, they are
 * redirected here: /public/order/:orderId
 *
 * The page polls the public API every 5 seconds for status updates
 * (see useFetchGuestOrderStatus). In a full implementation it would
 * also subscribe to WebSocket events via useSocket() for instant
 * updates — but polling is simpler and sufficient for the MVP.
 *
 * Status flow:
 *   pending → (items go to in-kitchen) → ready → completed
 *   or → cancelled
 */

const STATUS_STEPS = [
  { key: "pending", label: "Prejeto", icon: Clock, color: "text-amber-500" },
  { key: "in-kitchen", label: "V pripravi", icon: ChefHat, color: "text-orange-500" },
  { key: "ready", label: "Pripravljeno", icon: ShoppingBag, color: "text-green-500" },
  { key: "completed", label: "Postreženo", icon: CheckCircle, color: "text-blue-500" },
] as const;

const getItemStatusInfo = (status: string) => {
  switch (status) {
    case "new":
      return { label: "Čaka", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" };
    case "in-kitchen":
      return { label: "V pripravi", icon: ChefHat, color: "text-orange-500", bg: "bg-orange-50" };
    case "ready":
      return { label: "Pripravljeno", icon: ShoppingBag, color: "text-green-500", bg: "bg-green-50" };
    case "completed":
      return { label: "Postreženo", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50" };
    case "cancelled":
      return { label: "Preklicano", icon: XCircle, color: "text-red-500", bg: "bg-red-50" };
    default:
      return { label: status, icon: Clock, color: "text-gray-500", bg: "bg-gray-50" };
  }
};

const PublicOrderStatus = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data, isLoading, error } = useFetchGuestOrderStatus(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500 mb-4" />
          <p className="text-gray-600">Nalagam naročilo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Naročila ni mogoče najti
          </h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : "Neveljaven ID naročila."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-orange-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazaj na meni
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { order, items } = data;
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";

  // Determine current step index for the progress bar
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Status naročila
              </h1>
              <p className="text-sm text-gray-500">
                Miza {order.tableNumber ?? "?"} · {formatTime(order.createdAt)}
              </p>
            </div>
            {order.customer?.name && (
              <div className="text-right">
                <p className="text-sm font-medium">{order.customer.name}</p>
                <p className="text-xs text-gray-500">#{order._id.slice(-8)}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Status progress bar */}
        {!isCancelled ? (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              {STATUS_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isDone = index < activeStep || isCompleted;
                const isActive = index === activeStep && !isCompleted;
                return (
                  <div
                    key={step.key}
                    className="flex-1 flex flex-col items-center relative"
                  >
                    {/* Connector line */}
                    {index > 0 && (
                      <div
                        className={`absolute top-5 left-0 right-1/2 h-0.5 -translate-y-1/2 ${
                          isDone || isActive
                            ? "bg-orange-500"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        className={`absolute top-5 left-1/2 right-0 h-0.5 -translate-y-1/2 ${
                          isDone ? "bg-orange-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                    {/* Icon circle */}
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isActive
                            ? `bg-orange-500 text-white ${step.color.replace("text-", "bg-")}`
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </motion.div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${
                        isDone || isActive
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-700"
              >
                <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                <p className="text-sm font-medium">
                  Vaše naročilo je postreženo. Dober tek!
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <XCircle className="h-10 w-10 mx-auto text-red-500 mb-2" />
            <p className="font-medium text-red-700">Naročilo preklicano</p>
            <p className="text-sm text-red-600 mt-1">
              Obvestite natakarja za več informacij.
            </p>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-500" />
            <h2 className="font-medium">Postavke naročila</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const statusInfo = getItemStatusInfo(item.status);
              const StatusIcon = statusInfo.icon;
              return (
                <div key={item._id} className="p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.quantity}×</span>
                      <span className="font-medium text-gray-900">
                        {item.name}
                      </span>
                    </div>
                    {item.specialInstruction && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        "{item.specialInstruction}"
                      </p>
                    )}
                    {item.selectedModifiers &&
                      Array.isArray(item.selectedModifiers) &&
                      item.selectedModifiers.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.selectedModifiers
                            .map((m: { optionName: string }) => m.optionName)
                            .join(", ")}
                        </p>
                      )}
                    <div
                      className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </div>
                  </div>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-between font-bold text-lg">
            <span>Skupaj</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Back to menu */}
        {isCompleted && (
          <div className="text-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-orange-600 hover:underline font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Nazaj na meni
            </Link>
          </div>
        )}

        {/* Help text */}
        <div className="text-center text-xs text-gray-400">
          <p>Stran se samodejno osvežuje vsakih 5 sekund.</p>
          <p className="mt-1">
            Za pomoč pokličite natakarja — miza {order.tableNumber ?? "?"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicOrderStatus;
