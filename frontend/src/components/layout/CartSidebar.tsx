import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OrderItem,
  OrderItemStatus,
  OrderStatus,
  Table,
  TableStatus,
  DEFAULT_TAX_CONFIG,
} from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OrderItemsCart from "../custom/order-items/OrderItemsCart";
import {
  useClearOrderItems,
  useFetchOrderItems,
  useUpdateOrderItem,
} from "@/services/orderItemsService";
import { useUpdateTable } from "@/services/tableService";
import { useFetchOrder, useUpdateOrder } from "@/services/orderService";
import { useDecrementStockForOrderItem } from "@/services/inventoryService";
import {
  useFetchFiscalConfig,
  useIssueFiscalInvoice,
} from "@/services/fiscalService";
import {
  useFetchActivePromotions,
  evaluatePromotions,
} from "@/services/promotionService";
import {
  useFindOrCreateCustomer,
  useFetchLoyaltyConfig,
} from "@/services/customerService";
import {
  useEarnPoints,
  useRedeemReward,
} from "@/services/loyaltyService";
import LoyaltyPhoneInput from "../custom/loyalty/LoyaltyPhoneInput";
import PrintOrderDetails from "../custom/orders/PrintOrderDetails";
import {
  computeGrandTotal,
  computeSubtotal,
  computeTaxBreakdown,
  computeTotalTax,
  round2,
} from "@/lib/helper";
import { Customer, LoyaltyReward, PaymentMethod } from "@/types";

interface CartSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  table: Table;
  orderId: string;
}

const CartSidebar = ({
  collapsed,
  setCollapsed,
  table,
  orderId,
}: CartSidebarProps) => {
  const { data: orderItems, isLoading, error } = useFetchOrderItems(orderId);
  const { data: order } = useFetchOrder(orderId);
  const updateOrderItemMut = useUpdateOrderItem();
  const clearOrderItems = useClearOrderItems();
  const updateOrderMut = useUpdateOrder();
  const updateTableMut = useUpdateTable();
  const decrementStock = useDecrementStockForOrderItem();
  const { data: fiscalConfigs } = useFetchFiscalConfig();
  const issueFiscalInvoice = useIssueFiscalInvoice();
  const findOrCreateCustomer = useFindOrCreateCustomer();
  const { data: loyaltyConfigs } = useFetchLoyaltyConfig();
  const earnPoints = useEarnPoints();
  const redeemReward = useRedeemReward();
  const navigate = useNavigate();

  // Loyalty state — managed by LoyaltyPhoneInput component.
  // All hooks must be called BEFORE any early returns to satisfy
  // React's Rules of Hooks.
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<Customer | null>(null);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [tipType, setTipType] = useState<"none" | "percentage" | "custom">(
    "none",
  );
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTipAmount, setCustomTipAmount] = useState("0");

  // Fetch active promotions for auto-apply
  const { data: activePromotions } = useFetchActivePromotions();

  // Compute totals (safe even when orderItems is undefined — returns 0)
  const taxBreakdown = computeTaxBreakdown(orderItems ?? []);
  const subtotal = computeSubtotal(orderItems ?? []);
  const totalTax = computeTotalTax(taxBreakdown);
  const grossTotal = computeGrandTotal(taxBreakdown);

  // Evaluate active promotions against current cart items
  const { applied: appliedPromotions, totalDiscount: promotionDiscount } =
    useMemo(
      () => evaluatePromotions(activePromotions, orderItems ?? []),
      [activePromotions, orderItems],
    );

  // Compute loyalty discount from selected reward
  const loyaltyDiscount = useMemo(() => {
    if (!selectedReward) return 0;
    if (selectedReward.discountType === "fixed") {
      return Math.min(selectedReward.discountValue, grossTotal);
    }
    if (selectedReward.discountType === "percent") {
      return round2((grossTotal * selectedReward.discountValue) / 100);
    }
    return 0; // 'item' type is manual — no automatic discount
  }, [selectedReward, grossTotal]);

  const afterDiscount = round2(grossTotal - loyaltyDiscount - promotionDiscount);

  // Compute tip based on the post-discount total
  const tipAmount = useMemo(() => {
    if (tipType === "percentage") {
      return round2((afterDiscount * tipPercentage) / 100);
    }
    if (tipType === "custom") {
      return round2(parseFloat(customTipAmount) || 0);
    }
    return 0;
  }, [tipType, tipPercentage, customTipAmount, afterDiscount]);

  const grandTotal = round2(afterDiscount + tipAmount);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  /**
   * Process checkout — now waits for ALL order item updates to settle
   * before navigating away, eliminating the previous race condition
   * where the UI reported "success" before mutations actually completed.
   */
  const processCheckout = async () => {
    if (!orderItems || orderItems.length === 0) {
      toast.error("Cart is empty", { position: "top-center" });
      return;
    }

    const inKitchenAndNewExist = orderItems.some(
      (orderItem) =>
        orderItem.status === OrderItemStatus.InKitchen ||
        orderItem.status === OrderItemStatus.New,
    );

    if (inKitchenAndNewExist) {
      toast.error(
        "Cannot checkout: there are pending (new / in-kitchen) order items.",
        {
          duration: 3000,
          style: {
            background: "#f87171",
            color: "#fff",
            fontWeight: "bold",
            padding: "16px",
            borderRadius: "4px",
          },
          position: "top-center",
          dismissible: true,
        },
      );
      return;
    }

    try {
      // 1. Update all non-cancelled order items to "completed" in parallel
      const itemUpdates = orderItems
        .filter((oi) => oi.status !== OrderItemStatus.Cancelled)
        .map((oi) =>
          updateOrderItemMut.mutateAsync({
            ...oi,
            status: OrderItemStatus.Completed,
          }),
        );
      await Promise.all(itemUpdates);

      // 2. Update order: status + payment method + tax breakdown + totals
      await updateOrderMut.mutateAsync({
        _id: table?.order?._id,
        customer: null,
        status: OrderStatus.Completed,
        total_amount: grandTotal,
        tax_amount: totalTax,
        tax_breakdown: taxBreakdown,
        payment_method: paymentMethod,
        tip_amount: tipAmount,
        tip_type: tipType,
        tip_percentage: tipType === "percentage" ? tipPercentage : undefined,
        served_by: JSON.parse(localStorage.getItem("user") || "{}")?.name,
      });

      // 3. Free up the table
      await updateTableMut.mutateAsync({
        _id: table?._id,
        status: TableStatus.Available,
        order: null,
      });

      // 4. Decrement inventory based on each item's recipe (best-effort,
      //    non-blocking — failures are logged but don't fail checkout)
      const userName = JSON.parse(localStorage.getItem("user") || "{}")?.name;
      const completedItems = orderItems.filter(
        (oi) => oi.status !== OrderItemStatus.Cancelled,
      );
      try {
        const stockPromises = completedItems
          .filter((oi) => oi.menu?._id)
          .map((oi) =>
            decrementStock.mutateAsync({
              menuId: oi.menu._id,
              menuName: oi.menu.name ?? "Unknown",
              quantity: oi.quantity ?? 1,
              user: userName,
            }),
          );
        const results = await Promise.allSettled(stockPromises);
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
          console.warn(
            `${failures.length} stock decrement(s) failed (non-blocking)`,
          );
        }
      } catch (err) {
        // Stock errors should NOT roll back checkout — order is already paid.
        console.error("Inventory decrement failed:", err);
      }

      // 5. Issue fiscal invoice (FURS — ZOI + EOR + QR)
      // Best-effort: if no fiscal config exists, skip silently.
      // If FURS submission fails, the invoice is still stored as "pending"
      // and must be retried within 48 hours per Slovenian law.
      const fiscalConfig = fiscalConfigs?.[0];
      if (fiscalConfig?._id && table?.order?._id) {
        try {
          const result = await issueFiscalInvoice.mutateAsync({
            orderId: table.order._id,
            totalAmount: grandTotal,
            taxesByRate: taxBreakdown,
            paymentMethod,
            config: fiscalConfig,
          });
          if (result.status === "submitted" && result.eor) {
            toast.success(
              `Fiscal invoice issued (EOR: ${result.eor.slice(0, 8)}...)`,
              { duration: 3000 },
            );
          } else if (result.status === "failed") {
            toast.warning(
              `Fiscal invoice stored but FURS submission failed — will retry`,
              { duration: 5000 },
            );
          }
        } catch (err) {
          console.error("Fiscal invoice issuance failed:", err);
          toast.error(
            `Fiscal invoice failed: ${err instanceof Error ? err.message : "Unknown"}. Order is still complete; issue invoice manually.`,
            { duration: 5000 },
          );
        }
      }

      // 6. Loyalty program: find-or-create customer, earn points, redeem reward
      // The LoyaltyPhoneInput component tracks the phone number via the
      // customer object it found. We use the customer's phone to find-or-create.
      if (loyaltyCustomer?.phone) {
        try {
          // If the customer was looked up by phone, we already have their ID.
          // If not found, find-or-create will create a new profile.
          const customerRecord = loyaltyCustomer._id
            ? loyaltyCustomer
            : await findOrCreateCustomer.mutateAsync({
                phone: loyaltyCustomer.phone,
                name: loyaltyCustomer.name || loyaltyCustomer.phone,
              });

          // Redeem reward if selected (deducts points, writes transaction)
          if (selectedReward?._id && customerRecord._id) {
            const redeemResult = await redeemReward.mutateAsync({
              customerId: customerRecord._id,
              reward: selectedReward,
              staff: JSON.parse(localStorage.getItem("user") || "{}")?.name,
            });
            if (redeemResult.success) {
              toast.success(
                `Redeemed ${selectedReward.name} (-${selectedReward.pointsCost} points)`,
              );
            } else {
              toast.warning(
                `Could not redeem reward: ${redeemResult.error}`,
              );
            }
          }

          // Earn points for this order (based on final grand total)
          if (customerRecord._id) {
            const loyaltyConfig = (loyaltyConfigs ?? [])[0] as
              | import("@/types").LoyaltyConfig
              | undefined;
            const earnResult = await earnPoints.mutateAsync({
              customerId: customerRecord._id,
              orderId: table.order._id,
              amountSpent: grandTotal,
              config: loyaltyConfig,
              staff: JSON.parse(localStorage.getItem("user") || "{}")?.name,
            });
            toast.success(
              `+${earnResult.earned} loyalty points earned`,
              { duration: 3000 },
            );
          }
        } catch (err) {
          console.error("Loyalty processing failed:", err);
          toast.warning(
            `Loyalty processing failed: ${err instanceof Error ? err.message : "Unknown"}. Order is still complete.`,
            { duration: 5000 },
          );
        }
      }

      toast.success("Checkout successful!", {
        duration: 3000,
        style: {
          background: "#4ade80",
          color: "#fff",
          fontWeight: "bold",
          padding: "16px",
          borderRadius: "4px",
        },
        position: "top-center",
        dismissible: true,
      });

      clearOrderItems(orderId);
      navigate("/");
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error(
        `Checkout failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        {
          duration: 4000,
          style: {
            background: "#f87171",
            color: "#fff",
            fontWeight: "bold",
          },
          position: "top-center",
        },
      );
    }
  };

  const sidebarVariants = {
    expanded: { width: 380, opacity: 1 },
    collapsed: { width: 0, opacity: 0 },
  };

  return (
    <>
      <motion.div
        className={cn(
          "h-[calc(100vh-4rem)] border-l border-border bg-white shadow-sm z-20",
          collapsed ? "hidden" : "block",
        )}
        initial="collapsed"
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-lg">Cart</h2>
            <span>Table : {table?.table_number}</span>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {orderItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-gray-400"
                >
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                  <p>Your cart is empty</p>
                </motion.div>
              ) : (
                orderItems.map((item, index) => (
                  <OrderItemsCart
                    orderId={orderId}
                    key={item?._id || index}
                    item={item}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 border-t border-border">
            {/* Loyalty phone input — shown above totals */}
            <div className="mb-3">
              <LoyaltyPhoneInput
                onCustomerChange={setLoyaltyCustomer}
                onRewardSelect={setSelectedReward}
                cartTotal={grossTotal}
              />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>

              {/* Tax (DDV) breakdown — one line per rate */}
              {taxBreakdown.length > 0 ? (
                taxBreakdown.map((entry) => (
                  <div
                    key={`tax-${entry.rate}`}
                    className="flex justify-between text-sm text-gray-500"
                  >
                    <span>DDV {entry.rate}%</span>
                    <span>€{entry.tax.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>DDV ({DEFAULT_TAX_CONFIG.defaultRate}%)</span>
                  <span>€0.00</span>
                </div>
              )}

              {/* Loyalty discount (if a reward is selected) */}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-purple-600 font-medium">
                  <span>
                    Loyalty discount
                    {selectedReward && ` (${selectedReward.name})`}
                  </span>
                  <span>-€{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Promotion discounts (auto-applied, if any active) */}
              {appliedPromotions.map((promo) => (
                <div
                  key={promo.promotionId}
                  className="flex justify-between text-sm text-pink-600 font-medium"
                >
                  <span>🎁 {promo.name}</span>
                  <span>-€{promo.discountAmount.toFixed(2)}</span>
                </div>
              ))}

              {/* Tip line (if tip > 0) */}
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Napitnina</span>
                  <span>+€{tipAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total{tipAmount > 0 ? " (z napitnino)" : ""}</span>
                <span>€{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Način plačila
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { value: "cash", label: "Gotovina" },
                    { value: "card", label: "Kartica" },
                    { value: "other", label: "Drugo" },
                  ] as const
                ).map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                      paymentMethod === pm.value
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tip selector */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Napitnina {tipAmount > 0 && `(€${tipAmount.toFixed(2)})`}
              </p>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { pct: 0, label: "Brez" },
                  { pct: 5, label: "5%" },
                  { pct: 10, label: "10%" },
                  { pct: 15, label: "15%" },
                ].map((opt) => (
                  <button
                    key={opt.pct}
                    type="button"
                    onClick={() => {
                      setTipType(opt.pct === 0 ? "none" : "percentage");
                      setTipPercentage(opt.pct);
                    }}
                    className={`px-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                      tipType === "percentage" && tipPercentage === opt.pct
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTipType("custom")}
                  className={`px-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                    tipType === "custom"
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  €
                </button>
              </div>
              {tipType === "custom" && (
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={customTipAmount}
                  onChange={(e) => setCustomTipAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center p-3 rounded-lg bg-gray-200 cursor-pointer text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                onClick={() => print()}
                disabled={orderItems.length === 0}
              >
                <Printer className="h-5 w-5 mr-2" />
                <span>Print Receipt</span>
              </button>
              <button
                className="flex items-center justify-center p-3 rounded-lg bg-secondary text-white hover:bg-secondary/90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={
                  orderItems.length === 0 ||
                  updateOrderMut.isPending ||
                  updateTableMut.isPending
                }
                onClick={processCheckout}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                <span>
                  {updateOrderMut.isPending || updateTableMut.isPending
                    ? "Processing..."
                    : "Checkout"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      {order && <PrintOrderDetails order={order} />}
    </>
  );
};

// Placeholder icon for empty cart
const ShoppingCart = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 6H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CartSidebar;
