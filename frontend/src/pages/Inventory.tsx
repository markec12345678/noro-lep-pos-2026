import { useState, FormEvent, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Search,
  Edit,
  Trash,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  XCircle,
  PackagePlus,
  ClipboardCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useFetchStockTransactions,
  useApplyStockMovement,
} from "@/services/inventoryService";
import {
  InventoryItem,
  InventoryUnit,
  StockTransactionType,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const UNIT_OPTIONS: InventoryUnit[] = ["kg", "g", "l", "ml", "pc", "box"];

interface ItemForm {
  _id?: string;
  name: string;
  sku: string;
  unit: InventoryUnit;
  quantity: string;
  threshold: string;
  cost: string;
  supplier: string;
}

const EMPTY_FORM: ItemForm = {
  name: "",
  sku: "",
  unit: "pc",
  quantity: "0",
  threshold: "5",
  cost: "0",
  supplier: "",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);

const Inventory = () => {
  const { data: items, isLoading } = useFetchInventoryItems();
  const { mutateAsync: createItem } = useCreateInventoryItem();
  const { mutateAsync: updateItem } = useUpdateInventoryItem();
  const { mutateAsync: deleteItem } = useDeleteInventoryItem();

  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  // Stock movement dialog state
  const [movementTarget, setMovementTarget] = useState<InventoryItem | null>(
    null,
  );
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(
    null,
  );

  // Quick stock count state
  const [quickCountOpen, setQuickCountOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return (items ?? []).filter((item) => {
      const matchesSearch =
        !searchQuery ||
        [item.name, item.sku ?? "", item.supplier ?? ""].some((text) =>
          text.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const matchesLowStock =
        !showLowStockOnly || item.quantity < item.threshold;
      return matchesSearch && matchesLowStock;
    });
  }, [items, searchQuery, showLowStockOnly]);

  const lowStockCount = useMemo(
    () => (items ?? []).filter((i) => i.quantity < i.threshold).length,
    [items],
  );

  const totalValue = useMemo(
    () =>
      (items ?? []).reduce(
        (sum, i) => sum + (i.cost ?? 0) * (i.quantity ?? 0),
        0,
      ),
    [items],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      _id: item._id,
      name: item.name,
      sku: item.sku ?? "",
      unit: item.unit,
      quantity: String(item.quantity ?? 0),
      threshold: String(item.threshold ?? 0),
      cost: String(item.cost ?? 0),
      supplier: item.supplier ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const payload: Partial<InventoryItem> = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      unit: form.unit,
      quantity: parseFloat(form.quantity) || 0,
      threshold: parseFloat(form.threshold) || 0,
      cost: parseFloat(form.cost) || 0,
      supplier: form.supplier.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateItem({ ...payload, _id: form._id });
        toast.success(`Updated ${form.name}`);
      } else {
        await createItem(payload);
        toast.success(`Created ${form.name}`);
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteItem(deleteTarget._id);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track stock levels, recipes, and supplier costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setQuickCountOpen(true)}
            className="gap-2"
          >
            <ClipboardCheck className="h-5 w-5" />
            Hitri popis
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Add Inventory Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Package}
          label="Total items"
          value={String(items?.length ?? 0)}
          color="#06b6d4"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock alerts"
          value={String(lowStockCount)}
          color={lowStockCount > 0 ? "#ef4444" : "#9ca3af"}
        />
        <StatCard
          icon={TrendingUp}
          label="Inventory value"
          value={formatCurrency(totalValue)}
          color="#10b981"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4 flex-wrap">
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, SKU, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-gray-700">
              Show low stock only ({lowStockCount})
            </span>
          </label>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Cost/unit</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const isLow = item.quantity < item.threshold;
                  const isOut = item.quantity <= 0;
                  const value = (item.cost ?? 0) * (item.quantity ?? 0);
                  return (
                    <TableRow key={item._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.supplier && (
                          <div className="text-xs text-gray-500">
                            {item.supplier}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {item.sku ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-500">
                        {item.threshold} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.cost ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(value)}
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge
                            variant="destructive"
                            className="gap-1"
                          >
                            <XCircle className="h-3 w-3" /> Out of stock
                          </Badge>
                        ) : isLow ? (
                          <Badge
                            variant="destructive"
                            className="gap-1 bg-amber-500 hover:bg-amber-500"
                          >
                            <AlertTriangle className="h-3 w-3" /> Low
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            <PackagePlus className="h-3 w-3" /> OK
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setMovementTarget(item)}
                            className="p-1.5 rounded text-cyan-600 hover:bg-cyan-50"
                            title="Adjust stock"
                            aria-label="Adjust stock"
                          >
                            <ArrowDownCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setHistoryTarget(item)}
                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
                            title="History"
                            aria-label="History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded text-secondary hover:bg-secondary/10"
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchQuery || showLowStockOnly
                        ? "No items match your filters."
                        : 'No inventory items yet. Click "Add Inventory Item" to create one.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Edit Inventory Item" : "Add Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mozzarella 1kg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. MOZ-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) =>
                    setForm({ ...form, unit: v as InventoryUnit })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Low-stock threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.threshold}
                  onChange={(e) =>
                    setForm({ ...form, threshold: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (€/unit)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={form.supplier}
                onChange={(e) =>
                  setForm({ ...form, supplier: e.target.value })
                }
                placeholder="e.g. Metro, Hofer"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : form._id
                    ? "Update Item"
                    : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete inventory item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong> and detach it from all
              recipes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock movement dialog */}
      {movementTarget && (
        <StockMovementDialog
          item={movementTarget}
          onClose={() => setMovementTarget(null)}
        />
      )}

      {/* History dialog */}
      {historyTarget && (
        <StockHistoryDialog
          item={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {/* Quick stock count dialog */}
      <QuickCountDialog
        open={quickCountOpen}
        onOpenChange={setQuickCountOpen}
        items={items ?? []}
        onApplyMovement={applyMovement}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Stat card                                                          */
/* ------------------------------------------------------------------ */

const StatCard = ({
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
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Stock movement dialog                                              */
/* ------------------------------------------------------------------ */

interface StockMovementDialogProps {
  item: InventoryItem;
  onClose: () => void;
}

const MOVEMENT_TYPES = [
  {
    value: StockTransactionType.Restock,
    label: "Restock (delivery)",
    icon: ArrowUpCircle,
    color: "text-green-600",
    sign: +1,
  },
  {
    value: StockTransactionType.Adjustment,
    label: "Adjustment (count correction)",
    icon: TrendingUp,
    color: "text-blue-600",
    sign: 0,
  },
  {
    value: StockTransactionType.Waste,
    label: "Waste / spoilage",
    icon: TrendingDown,
    color: "text-amber-600",
    sign: -1,
  },
] as const;

const StockMovementDialog = ({
  item,
  onClose,
}: StockMovementDialogProps) => {
  const { mutateAsync: applyMovement, isPending } = useApplyStockMovement();
  const [type, setType] = useState<StockTransactionType>(
    StockTransactionType.Restock,
  );
  const [amount, setAmount] = useState("0");
  const [reason, setReason] = useState("");

  const selectedType = MOVEMENT_TYPES.find((t) => t.value === type)!;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(amount);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    const delta = selectedType.sign === 0 ? qty : qty * selectedType.sign;
    // For adjustment, the user enters the new count; delta = new - current
    const finalDelta =
      selectedType.value === StockTransactionType.Adjustment
        ? qty - (item.quantity ?? 0)
        : delta;

    if (finalDelta === 0) {
      toast.info("No change — new quantity equals current");
      onClose();
      return;
    }

    try {
      const result = await applyMovement({
        inventoryItemId: item._id!,
        delta: finalDelta,
        type,
        reason: reason.trim() || selectedType.label,
        user: JSON.parse(localStorage.getItem("user") || "{}")?.name,
      });
      toast.success(
        `${item.name}: ${item.quantity} → ${result.newQuantity} ${item.unit}`,
      );
      onClose();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stock movement — {item.name}</DialogTitle>
        </DialogHeader>
        <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
          <span className="text-gray-500">Current stock:</span>
          <span className="font-medium">
            {item.quantity} {item.unit}
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Movement type</Label>
            <div className="grid grid-cols-1 gap-2">
              {MOVEMENT_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? "border-secondary bg-secondary/5"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${t.color}`} />
                    <span className="flex-1 text-left">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              {selectedType.value === StockTransactionType.Adjustment
                ? "New counted quantity"
                : "Amount"}
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {item.unit}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / note</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Weekly delivery, spillage, weekly count..."
              rows={2}
              maxLength={200}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Applying..." : "Apply movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/* Stock history dialog                                               */
/* ------------------------------------------------------------------ */

const StockHistoryDialog = ({
  item,
  onClose,
}: StockMovementDialogProps) => {
  const { data: transactions, isLoading } = useFetchStockTransactions(
    item._id,
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock history — {item.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (transactions ?? []).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No stock movements recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(transactions ?? []).map((tx) => {
              const isPositive = (tx.delta ?? 0) >= 0;
              return (
                <div
                  key={tx._id}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isPositive
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpCircle className="h-4 w-4" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {tx.reason}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date((tx._created ?? 0) * 1000).toLocaleString()}
                      {tx.user && ` · by ${tx.user}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {tx.delta} {item.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      bal: {tx.balanceAfter}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Inventory;

/* ------------------------------------------------------------------ */
/* Quick Stock Count Dialog — bulk quantity update                    */
/* ------------------------------------------------------------------ */

interface QuickCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onApplyMovement: (input: {
    inventoryItemId: string;
    delta: number;
    type: StockTransactionType;
    reason: string;
    user?: string;
  }) => Promise<{ previousQuantity: number; newQuantity: number }>;
}

/**
 * Quick Stock Count — bulk quantity update dialog.
 *
 * Instead of opening each item individually, the manager sees a table
 * of all inventory items with their current quantity and an input field
 * to enter the NEW counted quantity. On save, the system computes the
 * delta (new - current) and applies it as an adjustment movement with
 * an audit transaction for each item.
 *
 * Perfect for end-of-day or end-of-week physical inventory counts.
 */
const QuickCountDialog = ({
  open,
  onOpenChange,
  items,
  onApplyMovement,
}: QuickCountDialogProps) => {
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize counts when dialog opens
  useEffect(() => {
    if (open && items.length > 0) {
      const initial: Record<string, string> = {};
      for (const item of items) {
        if (item._id) initial[item._id] = String(item.quantity ?? 0);
      }
      setCounts(initial);
    }
  }, [open, items]);

  const handleSave = async () => {
    setIsSaving(true);
    let updated = 0;
    let errors = 0;
    const userName = JSON.parse(localStorage.getItem("user") || "{}")?.name;

    for (const item of items) {
      if (!item._id) continue;
      const newQty = parseFloat(counts[item._id] ?? "0");
      const oldQty = item.quantity ?? 0;
      const delta = newQty - oldQty;

      if (Math.abs(delta) < 0.001) continue; // no change

      try {
        await onApplyMovement({
          inventoryItemId: item._id,
          delta,
          type: StockTransactionType.Adjustment,
          reason: `Hitri popis: ${item.name} ${oldQty}→${newQty}${item.unit}`,
          user: userName,
        });
        updated++;
      } catch {
        errors++;
      }
    }

    setIsSaving(false);
    if (errors === 0) {
      toast.success(`Popis končan! ${updated} artiklov posodobljenih.`);
    } else {
      toast.warning(`Popis: ${updated} uspešnih, ${errors} napak.`);
    }
    onOpenChange(false);
  };

  const changedCount = items.filter((item) => {
    if (!item._id) return false;
    const newQty = parseFloat(counts[item._id] ?? "0");
    return Math.abs(newQty - (item.quantity ?? 0)) >= 0.001;
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-secondary" />
            Hitri popis zaloge
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-3">
          <p className="font-medium">Navodila:</p>
          <p className="text-xs mt-0.5">
            Preštejte fizično količino vsakega artikla in vnesite dejansko
            stanje. Sistem bo samodejno izračunal razliko in zapisal
            prilagoditev z audit sledjo.
          </p>
        </div>

        {/* Items table */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artikel</TableHead>
                <TableHead className="text-right">Trenutno</TableHead>
                <TableHead className="text-right">Prešteto</TableHead>
                <TableHead className="text-right">Razlika</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const newQty = parseFloat(counts[item._id ?? ""] ?? "0");
                const oldQty = item.quantity ?? 0;
                const diff = newQty - oldQty;
                const hasChange = Math.abs(diff) >= 0.001;

                return (
                  <TableRow
                    key={item._id}
                    className={hasChange ? "bg-amber-50" : ""}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-gray-400">{item.sku}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="text-gray-500">
                        {oldQty} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={counts[item._id ?? ""] ?? "0"}
                        onChange={(e) =>
                          setCounts((prev) => ({
                            ...prev,
                            [item._id ?? ""]: e.target.value,
                          }))
                        }
                        className="w-20 px-2 py-1 text-right rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {hasChange ? (
                        <span
                          className={
                            diff > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
                          }
                        >
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                    Ni artiklov v zalogi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {changedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 text-center">
            {changedCount} artiklov s spremembo količine
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Prekliči
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || changedCount === 0}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Shrani popis{changedCount > 0 && ` (${changedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
