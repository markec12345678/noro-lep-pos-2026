import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  UtensilsCrossed,
  Phone,
  User,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useFetchPublicMenu, createGuestOrder } from "@/services/publicMenuService";
import { PublicMenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstruction?: string;
}

const PublicMenu = () => {
  const { tableToken } = useParams<{ tableToken: string }>();
  const navigate = useNavigate();
  const { data: menuData, isLoading, error } = useFetchPublicMenu(tableToken);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allItems = useMemo(() => {
    if (!menuData) return [];
    const categorized = menuData.categories.flatMap((g) => g.items);
    return [...categorized, ...menuData.uncategorizedItems];
  }, [menuData]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory =
        !selectedCategory ||
        (Array.isArray(item.category) &&
          item.category.some((c) => c._id === selectedCategory));
      const matchesSearch =
        !searchQuery ||
        [item.name, item.description].some((text) =>
          (text ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return matchesCategory && matchesSearch;
    });
  }, [allItems, selectedCategory, searchQuery]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const addToCart = (item: PublicMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuId === item._id);
      if (existing) {
        return prev.map((c) =>
          c.menuId === item._id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [
        ...prev,
        {
          menuId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
    // Pulse the cart button
    setCartOpen(false);
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuId === menuId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (menuId: string) => {
    setCart((prev) => prev.filter((c) => c.menuId !== menuId));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableToken) return;
    if (!customerName.trim()) {
      toast.error("Vnesite ime");
      return;
    }
    if (cart.length === 0) {
      toast.error("Košarica je prazna");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createGuestOrder({
        tableToken,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map((c) => ({
          menuId: c.menuId,
          quantity: c.quantity,
          specialInstruction: c.specialInstruction,
        })),
      });
      toast.success("Naročilo uspešno oddano!");
      navigate(`/public/order/${result.orderId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Napaka pri oddaji naročila",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500 mb-4" />
          <p className="text-gray-600">Nalagam meni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="text-center max-w-md">
          <X className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Mize ni mogoče najti
          </h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : "Neveljaven QR kod."}
          </p>
          <p className="text-sm text-gray-400">
            Prosimo, obvestite natakarja ali skenirajte QR kodo ponovno.
          </p>
        </div>
      </div>
    );
  }

  if (!menuData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Noro Lep POS
              </h1>
              <p className="text-sm text-gray-500">
                Miza {menuData.table.table_number ?? "?"}
                {menuData.table.location && ` · ${menuData.table.location}`}
              </p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-3 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
              aria-label="Košarica"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Iskanje jedi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Category pills */}
      {menuData.categories.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                selectedCategory === null
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Vse
            </button>
            {menuData.categories.map((g) => (
              <button
                key={g.category._id}
                onClick={() => setSelectedCategory(g.category._id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === g.category._id
                    ? "bg-orange-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {g.category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {selectedCategory === null && menuData.categories.length > 0 && !searchQuery ? (
          // Show grouped by category when no filter is active
          menuData.categories.map((group) => (
            <div key={group.category._id}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {group.category.name}
              </h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    onAdd={() => addToCart(item)}
                    cartQuantity={
                      cart.find((c) => c.menuId === item._id)?.quantity ?? 0
                    }
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat list when filtering/searching
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onAdd={() => addToCart(item)}
                cartQuantity={
                  cart.find((c) => c.menuId === item._id)?.quantity ?? 0
                }
              />
            ))}
          </div>
        )}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Ni najdenih jedi</p>
          </div>
        )}
      </div>

      {/* Cart bottom sheet */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg">
                  Košarica ({cartCount})
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Košarica je prazna</p>
                    <p className="text-sm">Dodajte jedi iz menija</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.menuId}
                      className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.menuId, -1)}
                          className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuId, 1)}
                          className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.menuId)}
                          className="ml-1 p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Skupaj</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    Nadaljuj na naročilo
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout dialog */}
      <AnimatePresence>
        {checkoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => !isSubmitting && setCheckoutOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-60 max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleCheckout} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xl">Oddaj naročilo</h2>
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={() => setCheckoutOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Order summary */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Povzetek naročila
                  </p>
                  {cart.map((item) => (
                    <div
                      key={item.menuId}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Skupaj</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {/* Customer info */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Ime *
                    </Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Vaše ime"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Telefon (neobvezno)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="031 234 567"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                  <p>
                    Naročilo bo poslano direktno v kuhinjo. Obvestili vas
                    bomo, ko bo pripravljeno.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Oddajam...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Oddaj naročilo ({formatCurrency(cartTotal)})
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating cart button (when items in cart and cart closed) */}
      {cartCount > 0 && !cartOpen && !checkoutOpen && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto bg-orange-600 text-white rounded-full shadow-lg p-4 flex items-center justify-between z-30"
        >
          <span className="flex items-center gap-2 font-medium">
            <ShoppingCart className="h-5 w-5" />
            {cartCount} {cartCount === 1 ? "jed" : "jedi"}
          </span>
          <span className="font-bold">{formatCurrency(cartTotal)}</span>
        </motion.button>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Menu item card                                                      */
/* ------------------------------------------------------------------ */

interface MenuItemCardProps {
  item: PublicMenuItem;
  onAdd: () => void;
  cartQuantity: number;
}

const MenuItemCard = ({ item, onAdd, cartQuantity }: MenuItemCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex"
    >
      <div className="flex-1 p-3">
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-orange-600">
            {formatCurrency(item.price)}
          </span>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 text-sm font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {cartQuantity > 0 ? `${cartQuantity} v košarici` : "Dodaj"}
          </button>
        </div>
      </div>
      {item.image?.path && (
        <div className="w-24 h-24 flex-shrink-0 bg-gray-100">
          <img
            src={`/storage/uploads${item.image.path}`}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default PublicMenu;
