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
import PrintOrderDetails from "../custom/orders/PrintOrderDetails";
import {
  computeGrandTotal,
  computeSubtotal,
  computeTaxBreakdown,
  computeTotalTax,
} from "@/lib/helper";

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
  const navigate = useNavigate();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const taxBreakdown = computeTaxBreakdown(orderItems ?? []);
  const subtotal = computeSubtotal(orderItems ?? []);
  const totalTax = computeTotalTax(taxBreakdown);
  const grandTotal = computeGrandTotal(taxBreakdown);

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

      // 2. Update order: status + snapshot of tax breakdown + totals
      await updateOrderMut.mutateAsync({
        _id: table?.order?._id,
        customer: null,
        status: OrderStatus.Completed,
        total_amount: grandTotal,
        tax_amount: totalTax,
        tax_breakdown: taxBreakdown,
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

              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total</span>
                <span>€{grandTotal.toFixed(2)}</span>
              </div>
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
