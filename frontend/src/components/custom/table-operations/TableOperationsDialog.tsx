import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  GitMerge,
  Split,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTransferOrder,
  useMergeTables,
  useSplitBill,
  computeSplitGroups,
} from "@/services/tableOperationsService";
import { useFetchTables } from "@/services/tableService";
import { useFetchOrderItems } from "@/services/orderItemsService";
import { Table, OrderItemStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { round2 } from "@/lib/helper";

const formatCurrencyValue = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

type OperationMode = "transfer" | "merge" | "split";

interface TableOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTable: Table;
  orderId: string;
}

const TableOperationsDialog = ({
  open,
  onOpenChange,
  sourceTable,
  orderId,
}: TableOperationsDialogProps) => {
  const [mode, setMode] = useState<OperationMode>("transfer");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Operacije z mizo — Miza {sourceTable.table_number}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <TabButton active={mode === "transfer"} onClick={() => setMode("transfer")} icon={ArrowRight} label="Prenesi" />
          <TabButton active={mode === "merge"} onClick={() => setMode("merge")} icon={GitMerge} label="Združi" />
          <TabButton active={mode === "split"} onClick={() => setMode("split")} icon={Split} label="Razdeli račun" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
            {mode === "transfer" && <TransferPanel sourceTable={sourceTable} orderId={orderId} onClose={() => onOpenChange(false)} />}
            {mode === "merge" && <MergePanel sourceTable={sourceTable} orderId={orderId} onClose={() => onOpenChange(false)} />}
            {mode === "split" && <SplitPanel sourceTable={sourceTable} orderId={orderId} onClose={() => onOpenChange(false)} />}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) => (
  <button onClick={onClick} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all", active ? "border-secondary bg-secondary/10 text-secondary" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300")}>
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const TransferPanel = ({ sourceTable, orderId, onClose }: { sourceTable: Table; orderId: string; onClose: () => void }) => {
  const { data: tables } = useFetchTables();
  const { mutateAsync: transfer, isPending } = useTransferOrder();
  const [selectedTableId, setSelectedTableId] = useState("");

  const availableTables = (tables ?? []).filter((t) => t._id !== sourceTable._id && (t.status === "available"));
  const handleTransfer = async () => {
    if (!selectedTableId) { toast.error("Izberite ciljno mizo"); return; }
    try {
      await transfer({ sourceTableId: sourceTable._id!, targetTableId: selectedTableId, orderId });
      toast.success("Naročilo preneseno"); onClose();
    } catch (err) { toast.error(`Napaka: ${err instanceof Error ? err.message : "Neznana"}`); }
  };
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <p className="font-medium">Prenesi naročilo</p>
        <p className="text-xs mt-0.5">Gost se prestavi na drugo mizo. Kuhinja ne zazna spremembe.</p>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Izberi ciljno mizo:</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {availableTables.map((t) => (
            <button key={t._id} onClick={() => setSelectedTableId(t._id!)} className={cn("p-3 rounded-lg border-2 text-center transition-all", selectedTableId === t._id ? "border-secondary bg-secondary/10" : "border-gray-200 hover:border-gray-300")}>
              <p className="font-medium">{t.table_number}</p><p className="text-xs text-gray-400">{t.seats} sedišč</p>
            </button>
          ))}
          {availableTables.length === 0 && <p className="col-span-full text-sm text-gray-400 text-center py-4">Ni prostih miz.</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Prekliči</Button>
        <Button onClick={handleTransfer} disabled={!selectedTableId || isPending} className="gap-2">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Prenesi</Button>
      </div>
    </div>
  );
};

const MergePanel = ({ sourceTable, orderId, onClose }: { sourceTable: Table; orderId: string; onClose: () => void }) => {
  const { data: tables } = useFetchTables();
  const { mutateAsync: merge, isPending } = useMergeTables();
  const [selectedTableId, setSelectedTableId] = useState("");
  const occupiedTables = (tables ?? []).filter((t) => t._id !== sourceTable._id && t.order?._id && t.status === "occupied");
  const handleMerge = async () => {
    if (!selectedTableId) { toast.error("Izberite mizo"); return; }
    const target = occupiedTables.find((t) => t._id === selectedTableId);
    if (!target?.order?._id) { toast.error("Ciljna miza nima naročila"); return; }
    try {
      const result = await merge({ sourceTableId: sourceTable._id!, targetTableId: selectedTableId, sourceOrderId: orderId, targetOrderId: target.order._id });
      toast.success(`Združeno: ${result.movedItemCount} postavk`); onClose();
    } catch (err) { toast.error(`Napaka: ${err instanceof Error ? err.message : "Neznana"}`); }
  };
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
        <p className="font-medium">Združi mizi</p>
        <p className="text-xs mt-0.5">Vse postavke preidejo na izbrano mizo. Ta miza postane prosta.</p>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Izberi ciljno mizo (z naročilom):</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {occupiedTables.map((t) => (
            <button key={t._id} onClick={() => setSelectedTableId(t._id!)} className={cn("p-3 rounded-lg border-2 text-center transition-all", selectedTableId === t._id ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300")}>
              <p className="font-medium">{t.table_number}</p><p className="text-xs text-green-500">Zasedena</p>
            </button>
          ))}
          {occupiedTables.length === 0 && <p className="col-span-full text-sm text-gray-400 text-center py-4">Ni zasedenih miz.</p>}
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Po združitvi bo miza {sourceTable.table_number} prosta. Operacije ni mogoče razveljaviti.</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Prekliči</Button>
        <Button onClick={handleMerge} disabled={!selectedTableId || isPending} className="gap-2 bg-purple-600 hover:bg-purple-700">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}Združi</Button>
      </div>
    </div>
  );
};

const SplitPanel = ({ sourceTable, orderId, onClose }: { sourceTable: Table; orderId: string; onClose: () => void }) => {
  const { data: tables } = useFetchTables();
  const { data: orderItems } = useFetchOrderItems(orderId, true);
  const { mutateAsync: splitBill, isPending } = useSplitBill();
  const [itemGroups, setItemGroups] = useState<Record<string, number>>({});
  const [groupTables, setGroupTables] = useState<Record<number, string>>({});
  const availableTables = (tables ?? []).filter((t) => t._id !== sourceTable._id && t.status === "available");
  const activeItems = (orderItems ?? []).filter((item) => item.status !== OrderItemStatus.Cancelled);
  const splitItems = activeItems.map((item) => ({ orderItemId: item._id ?? "", name: item.menu?.name ?? "Unknown", quantity: item.quantity ?? 1, price: item.price ?? 0, splitGroup: itemGroups[item._id ?? ""] ?? 0 }));
  const groups = computeSplitGroups(splitItems, sourceTable.table_number);
  const maxGroupId = Math.max(0, ...Object.values(itemGroups));

  const setItemGroup = (itemId: string, group: number) => setItemGroups((prev) => ({ ...prev, [itemId]: group }));
  const addNewSplit = () => {
    const newGroupId = maxGroupId + 1;
    const firstAvailable = availableTables[0];
    if (firstAvailable?._id) setGroupTables((prev) => ({ ...prev, [newGroupId]: firstAvailable._id! }));
  };

  const handleSplit = async () => {
    const splits: Array<{ tableId: string; itemIds: string[] }> = [];
    for (const groupId of Object.keys(groupTables).map(Number)) {
      if (groupId === 0) continue;
      const tableId = groupTables[groupId]; if (!tableId) continue;
      const itemIds = splitItems.filter((i) => i.splitGroup === groupId).map((i) => i.orderItemId);
      if (itemIds.length > 0) splits.push({ tableId, itemIds });
    }
    if (splits.length === 0) { toast.error("Dodelite postavke novim računom"); return; }
    try {
      const result = await splitBill({ sourceTableId: sourceTable._id!, sourceOrderId: orderId, splits });
      toast.success(`Račun razdeljen na ${result.splits.length} novih`); onClose();
    } catch (err) { toast.error(`Napaka: ${err instanceof Error ? err.message : "Neznana"}`); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
        <p className="font-medium">Razdeli račun</p>
        <p className="text-xs mt-0.5">Dodeli postavke novim računom na drugih mizah. Vsak račun lahko plača posebej.</p>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activeItems.map((item) => {
          const group = itemGroups[item._id ?? ""] ?? 0;
          return (
            <div key={item._id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.quantity}× {item.menu?.name ?? "Unknown"}</p><p className="text-xs text-gray-400">{formatCurrencyValue(item.price ?? 0)}</p></div>
              <div className="flex gap-1">
                <button onClick={() => setItemGroup(item._id!, 0)} className={cn("px-2 py-1 rounded text-xs font-medium border", group === 0 ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 text-gray-500")}>Original</button>
                {Array.from({ length: maxGroupId }, (_, i) => i + 1).map((g) => (<button key={g} onClick={() => setItemGroup(item._id!, g)} className={cn("px-2 py-1 rounded text-xs font-medium border", group === g ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-500")}>R{g}</button>))}
              </div>
            </div>
          );
        })}
        {activeItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Ni postavk.</p>}
      </div>
      <Button variant="outline" size="sm" onClick={addNewSplit} disabled={availableTables.length === 0} className="gap-2 w-full"><Split className="h-4 w-4" />Dodaj nov račun (R{maxGroupId + 1})</Button>
      {groups.filter((g) => g.id > 0).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Novi računi:</p>
          {groups.filter((g) => g.id > 0).map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
              <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded font-bold">R{g.id}</span>
              <span className="text-sm">{g.items.length} postavk</span><span className="font-medium">{formatCurrencyValue(g.subtotal)}</span>
              <select value={groupTables[g.id] ?? ""} onChange={(e) => setGroupTables((prev) => ({ ...prev, [g.id]: e.target.value }))} className="ml-auto text-xs border border-gray-200 rounded px-2 py-1">
                <option value="">Izberi mizo...</option>
                {availableTables.map((t) => (<option key={t._id} value={t._id!}>Miza {t.table_number}</option>))}
              </select>
            </div>
          ))}
        </div>
      )}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
        {groups.map((g) => (<div key={g.id} className="flex justify-between"><span className={g.id === 0 ? "text-blue-600" : "text-orange-600"}>{g.label}</span><span className="font-medium">{formatCurrencyValue(g.subtotal)}</span></div>))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Prekliči</Button>
        <Button onClick={handleSplit} disabled={isPending} className="gap-2 bg-orange-600 hover:bg-orange-700">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Split className="h-4 w-4" />}Razdeli</Button>
      </div>
    </div>
  );
};

export default TableOperationsDialog;
