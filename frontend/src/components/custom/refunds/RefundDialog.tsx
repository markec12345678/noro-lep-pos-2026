import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProcessRefund,
  REFUND_REASONS,
  computeRefundTotal,
  RefundItemSelection,
} from "@/services/refundService";
import { useFetchOrderItems } from "@/services/orderItemsService";
import { Order, OrderItem, OrderItemStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { round2 } from "@/lib/helper";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

/**
 * Refund dialog — select items to refund, choose reason,
 * optionally restock inventory.
 *
 * Shows:
 * - List of completed (non-cancelled) order items with quantity steppers
 * - Refund reason dropdown (predefined + custom text)
 * - Restock toggle (put ingredients back into inventory)
 * - Live refund total
 * - Warning about irreversibility
 */
const RefundDialog = ({
  open,
  onOpenChange,
  order,
}: RefundDialogProps) => {
  const { data: orderItems } = useFetchOrderItems(order._id, true);
  const { mutateAsync: processRefund, isPending } = useProcessRefund();

  const [reason, setReason] = useState<string>(REFUND_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [restockItems, setRestockItems] = useState(true);
  const [refundQuantities, setRefundQuantities] = useState<
    Record<string, number>
  >({});

  // Build item selections from order items
  const items: RefundItemSelection[] = useMemo(() => {
    if (!orderItems) return [];
    return orderItems
      .filter((item) => item.status !== OrderItemStatus.Cancelled)
      .map((item) => ({
        orderItemId: item._id ?? "",
        name: item.menu?.name ?? "Unknown",
        quantity: item.quantity ?? 1,
        price: item.price ?? 0,
        refundQuantity: refundQuantities[item._id ?? ""] ?? 0,
      }));
  }, [orderItems, refundQuantities]);

  const refundTotal = computeRefundTotal(items);
  const orderTotal = order.total_amount ?? 0;
  const isFullRefund = refundTotal >= orderTotal - 0.01;

  const setRefundQty = (itemId: string, qty: number) => {
    setRefundQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, qty),
    }));
  };

  const handleRefundAll = () => {
    const newQtys: Record<string, number> = {};
    for (const item of items) {
      newQtys[item.orderItemId] = item.quantity;
    }
    setRefundQuantities(newQtys);
  };

  const handleClear = () => {
    setRefundQuantities({});
  };

  const handleProcess = async () => {
    if (refundTotal <= 0) {
      toast.error("Izberite vsaj eno postavko za povračilo");
      return;
    }
    if (reason === "Drugo (opiši)" && !customReason.trim()) {
      toast.error("Opišite razlog za povračilo");
      return;
    }

    try {
      const result = await processRefund({
        orderId: order._id!,
        items,
        reason,
        customReason: reason === "Drugo (opiši)" ? customReason : undefined,
        restockItems,
        staffName: JSON.parse(localStorage.getItem("user") || "{}")?.name,
      });

      if (isFullRefund) {
        toast.success(
          `Povračilo obdelano: ${formatCurrency(result.refundAmount)} (polno)`,
        );
      } else {
        toast.success(
          `Povračilo obdelano: ${formatCurrency(refundTotal)} (${result.refundedItemCount} postavk)`,
        );
      }
      onOpenChange(false);
      setRefundQuantities({});
      setCustomReason("");
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-red-500" />
            Povračilo — Naročilo #{order._id?.slice(-6)}
          </DialogTitle>
        </DialogHeader>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Skupni znesek:</span>
            <span className="font-medium">{formatCurrency(orderTotal)}</span>
          </div>
          {(order.refund_amount ?? 0) > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Ža povrnjeno:</span>
              <span>{formatCurrency(order.refund_amount ?? 0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Znesek povračila:</span>
            <span className={isFullRefund ? "text-red-600" : "text-orange-600"}>
              {formatCurrency(refundTotal)}
            </span>
          </div>
        </div>

        {/* Items list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Postavke naročila:</p>
            <div className="flex gap-2">
              <button
                onClick={handleRefundAll}
                className="text-xs text-red-500 hover:underline"
              >
                Vse
              </button>
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:underline"
              >
                Počisti
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Ni postavk za povračilo (vse že preklicane).
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.orderItemId}
                className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.quantity}× {item.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(item.price)} / kos
                  </p>
                </div>
                {/* Refund quantity stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setRefundQty(
                        item.orderItemId,
                        Math.max(0, item.refundQuantity - 1),
                      )
                    }
                    className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-sm"
                  >
                    −
                  </button>
                  <span
                    className={cn(
                      "w-8 text-center text-sm font-medium",
                      item.refundQuantity > 0 && "text-red-600",
                    )}
                  >
                    {item.refundQuantity}
                  </span>
                  <button
                    onClick={() =>
                      setRefundQty(
                        item.orderItemId,
                        Math.min(item.quantity, item.refundQuantity + 1),
                      )
                    }
                    className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-sm"
                  >
                    +
                  </button>
                </div>
                {item.refundQuantity > 0 && (
                  <span className="text-xs text-red-500 font-medium w-16 text-right">
                    −{formatCurrency(item.price * item.refundQuantity)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reason selector */}
        <div className="space-y-2">
          <Label>Razlog za povračilo *</Label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
          >
            {REFUND_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {reason === "Drugo (opiši)" && (
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Opišite razlog..."
              rows={2}
              maxLength={300}
            />
          )}
        </div>

        {/* Restock toggle */}
        <label className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <div>
              <Label className="cursor-pointer">Vrni v zalogo</Label>
              <p className="text-xs text-gray-500">
                Sestavine vrne nazaj v inventory
              </p>
            </div>
          </div>
          <Switch
            checked={restockItems}
            onCheckedChange={setRestockItems}
          />
        </label>

        {/* Warning */}
        {refundTotal > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Povračilo je nepovratno</p>
              <p className="mt-0.5">
                Povrnjene postavke bodo označene kot preklicane in
                izključene iz nadaljnje prodaje. Za FURS mora biti
                izdan storno račun.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Prekliči
          </Button>
          <Button
            onClick={handleProcess}
            disabled={refundTotal <= 0 || isPending}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Obdelaj povračilo ({formatCurrency(refundTotal)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundDialog;
