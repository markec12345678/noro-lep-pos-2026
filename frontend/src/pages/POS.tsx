import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ShoppingCart, SlidersHorizontal } from "lucide-react";
import {
  Menu,
  Order,
  OrderItem,
  OrderItemStatus,
  OrderStatus,
  OrderType,
  Table,
  TableStatus,
  MenuModifierSelection,
} from "@/types";
import { useParams } from "react-router-dom";
import CartSidebar from "@/components/layout/CartSidebar";
import { useCreateOrder } from "@/services/orderService";
import { useFetchTable, useUpdateTable } from "@/services/tableService";
import {
  useCreateOrderItem,
  useFetchOrderItems,
} from "@/services/orderItemsService";
import { useFetchMenus } from "@/services/menuService";
import { useFetchCategories } from "@/services/categoryService";
import { getImageUrl } from "@/lib/helper";
import { FadeInUp } from "@/components/motions/FadeInUp";
import { toast } from "sonner";
import MenuItemSelectionModal from "@/components/custom/menu-modifiers/MenuItemSelectionModal";

const POS = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderId, setOrderId] = useState<string>("");
  const { tableId } = useParams();
  const [cartCollapsed, setCartCollapsed] = useState(false);

  // Modal state: when set, the selection modal is open for this menu
  const [selectionModalMenu, setSelectionModalMenu] = useState<Menu | null>(
    null,
  );

  const { data: table } = useFetchTable(tableId);
  const { data: orderItems } = useFetchOrderItems(table?.order?._id);
  const { data: menus } = useFetchMenus();
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutate: updateTable } = useUpdateTable();
  const { mutateAsync: addOrderItem } = useCreateOrderItem();
  const { data: categories } = useFetchCategories();

  useEffect(() => {
    if (table?.order?._id) {
      setOrderId(table.order._id);
    }
  }, [table]);

  const filteredItems = menus
    ? menus.filter((item) => {
        const matchesCategory =
          !selectedCategory ||
          item.category?.some((cat) => cat._id === selectedCategory);

        const matchesSearch =
          !searchQuery ||
          [item.name, item.description].some((text) =>
            (text ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
          );

        return matchesCategory && matchesSearch;
      })
    : [];

  const createNewOrder = async (table: Table) => {
    const order = {
      table: {
        _model: "table",
        _id: table?._id,
      },
      status: OrderStatus.Pending,
      order_type: OrderType.DineIn,
      total_amount: 0,
      customer: null,
    };

    try {
      return await createOrder(order);
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const updateTableStatus = async (table: Table, order: Order) => {
    await updateTable({
      _id: table?._id,
      status: TableStatus.Occupied,
      order: {
        _model: "order",
        _id: order._id,
      },
    });
  };

  /**
   * Persist a new order item to the backend.
   * Accepts the full payload from the selection modal (or a default
   * payload when the menu has no modifiers and the modal was skipped).
   */
  const addNewOrderItem = async (
    menu: Menu,
    targetOrderId: string,
    payload: {
      quantity: number;
      specialInstruction: string;
      selectedModifiers: MenuModifierSelection[];
      unitPrice: number;
    },
  ) => {
    const orderItem: Partial<OrderItem> = {
      order: {
        _model: "order",
        _id: targetOrderId,
      },
      menu: {
        _model: "menu",
        _id: menu._id,
        // Include the menu snapshot so the kitchen / receipts can render
        // name + image without an extra round-trip.
        name: menu.name,
        price: menu.price,
        image: menu.image,
        tax_rate: menu.tax_rate,
        category: menu.category,
      },
      status: OrderItemStatus.New,
      price: payload.unitPrice,
      base_price: menu.price,
      quantity: payload.quantity,
      special_instruction: payload.specialInstruction,
      selectedModifiers: payload.selectedModifiers,
      tax_rate: menu.tax_rate,
    };

    await addOrderItem(orderItem);
  };

  /**
   * Click handler for a menu item in the grid.
   *
   * - If the menu has modifier groups attached, open the selection modal
   *   and let the waiter pick options / quantity / instructions.
   * - Otherwise, add directly to the cart with sensible defaults
   *   (qty 1, no instructions, no modifiers, unit price = base price).
   */
  const handleItemClick = (item: Menu) => {
    if (cartCollapsed) setCartCollapsed(false);

    const hasModifiers =
      Array.isArray(item.modifierGroups) && item.modifierGroups.length > 0;

    if (hasModifiers) {
      setSelectionModalMenu(item);
      return;
    }

    // Direct add for items without modifiers
    void addToCart(item, {
      quantity: 1,
      specialInstruction: "",
      selectedModifiers: [],
      unitPrice: item.price,
    });
  };

  /**
   * Core add-to-cart routine. Ensures an order exists for the table
   * before adding the order item.
   */
  const addToCart = async (
    item: Menu,
    payload: {
      quantity: number;
      specialInstruction: string;
      selectedModifiers: MenuModifierSelection[];
      unitPrice: number;
    },
  ) => {
    try {
      // If an order already exists for this table, just append the item
      if (orderItems && orderItems.length > 0 && orderId) {
        await addNewOrderItem(item, orderId, payload);
        toast.success(`Added ${item.name} × ${payload.quantity}`);
        return;
      }

      // First item on the table: create the order, link it to the table, then add the item
      const order = await createNewOrder(table!);
      if (!order?._id) {
        toast.error("Failed to create order");
        return;
      }
      await updateTableStatus(table!, order);
      await addNewOrderItem(item, order._id, payload);
      setOrderId(order._id);
      toast.success(`Added ${item.name} × ${payload.quantity}`);
    } catch (error) {
      console.error("addToCart failed:", error);
      toast.error(
        `Could not add ${item.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Handler passed to the selection modal
  const handleModalAdd = async (payload: {
    quantity: number;
    specialInstruction: string;
    selectedModifiers: MenuModifierSelection[];
    unitPrice: number;
  }) => {
    if (!selectionModalMenu) return;
    await addToCart(selectionModalMenu, payload);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold">Point of Sale</h2>
            <div className="text-sm text-gray-500">
              {filteredItems.length} items available
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative w-64">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all duration-200"
              />
            </div>
            <button
              onClick={() => setCartCollapsed(!cartCollapsed)}
              className="p-2 rounded-full hover:bg-gray-100 relative btn-hover flex gap-2"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {orderItems && orderItems.length > 0 && (
                <span className="bg-secondary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {orderItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-4 -mx-1 px-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
              selectedCategory === null
                ? "bg-secondary text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Items
          </motion.button>

          {categories &&
            categories.map((category) => (
              <motion.button
                key={category._id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category._id!)}
                className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category._id
                    ? "bg-secondary text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="h-6 w-6 rounded-full overflow-hidden mr-2">
                  <img
                    src={getImageUrl(category.image)}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {category.name}
              </motion.button>
            ))}
        </div>

        <div className="overflow-y-auto h-[calc(100vh-15rem)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <MenuItem
                key={item._id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
              <Filter className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg">No items found</p>
              <p className="text-sm">
                Try changing your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>

      {table && (
        <CartSidebar
          collapsed={cartCollapsed}
          setCollapsed={setCartCollapsed}
          table={table}
          orderId={orderId}
        />
      )}

      {/* Item selection modal (shown for menus with modifiers) */}
      <MenuItemSelectionModal
        open={selectionModalMenu !== null}
        onOpenChange={(open) => {
          if (!open) setSelectionModalMenu(null);
        }}
        menu={selectionModalMenu}
        onAddToCart={handleModalAdd}
      />
    </div>
  );
};

interface MenuItemProps {
  item: Menu;
  onClick: () => void;
}

const MenuItem = ({ item, onClick }: MenuItemProps) => {
  const hasModifiers =
    Array.isArray(item.modifierGroups) && item.modifierGroups.length > 0;

  return (
    <FadeInUp
      onClick={onClick}
      className={`bg-white cursor-pointer relative hover:border-secondary h-64 rounded-xl overflow-hidden shadow-sm border border-gray-100 card-hover ${item?.available === false ? "!opacity-50 pointer-events-none" : ""}`}
    >
      <div className="h-40 w-full overflow-hidden">
        <img
          src={getImageUrl(item?.image)}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>

      <div className="p-4">
        <h3 className="font-medium">{item.name}</h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold">€{item.price.toFixed(2)}</span>
          {hasModifiers && (
            <span className="flex items-center gap-1 text-xs text-secondary">
              <SlidersHorizontal className="h-3 w-3" />
              Customizable
            </span>
          )}
        </div>
      </div>
      {item?.available === false && (
        <span className="absolute top-[50%] right-[50%] translate-x-[50%] translate-y-[-50%] bg-gray-600 text-white px-2 py-1 rounded-full">
          Not Available
        </span>
      )}
    </FadeInUp>
  );
};

export default POS;
