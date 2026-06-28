import { useState, FormEvent, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Search,
  Edit,
  Trash,
  FileText,
  Check,
  X,
  Truck,
  Calendar,
  Hash,
  Loader2,
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchInvoices,
  useFetchInvoiceItems,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useCreateInvoiceItem,
  useUpdateInvoiceItem,
  useDeleteInvoiceItem,
  useApproveInvoice,
  computeInvoiceTotals,
  LineItemDraft,
} from "@/services/supplierService";
import { useFetchActiveSuppliers } from "@/services/supplierService";
import { useFetchInventoryItems } from "@/services/inventoryService";
import { Invoice, InvoiceItem, InvoiceStatus, LinkModelType } from "@/types";
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("sl-SI");
};

const getInvoiceStatusBadge = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.Draft:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          Osnutek
        </Badge>
      );
    case InvoiceStatus.Received:
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          Prejeto
        </Badge>
      );
    case InvoiceStatus.Paid:
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Plačano
        </Badge>
      );
    case InvoiceStatus.Cancelled:
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
          Preklicano
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

interface InvoiceForm {
  _id?: string;
  invoiceNumber: string;
  supplierId: string;
  issueDate: string;
  dueDate: string;
  notes: string;
}

const EMPTY_FORM: InvoiceForm = {
  invoiceNumber: "",
  supplierId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  notes: "",
};

const Invoices = () => {
  const { data: invoices, isLoading } = useFetchInvoices();
  const { mutateAsync: createInvoice } = useCreateInvoice();
  const { mutateAsync: updateInvoice } = useUpdateInvoice();
  const { mutateAsync: deleteInvoice } = useDeleteInvoice();
  const { mutateAsync: approveInvoice, isPending: isApproving } =
    useApproveInvoice();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [detailTarget, setDetailTarget] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    return (invoices ?? []).filter((inv) => {
      const matchesSearch =
        !searchQuery ||
        inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const all = invoices ?? [];
    return {
      total: all.length,
      draft: all.filter((i) => i.status === InvoiceStatus.Draft).length,
      received: all.filter((i) => i.status === InvoiceStatus.Received).length,
      paid: all.filter((i) => i.status === InvoiceStatus.Paid).length,
      totalAmount: all
        .filter((i) => i.status !== InvoiceStatus.Cancelled)
        .reduce((sum, i) => sum + (i.totalAmount ?? 0), 0),
    };
  }, [invoices]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.invoiceNumber.trim()) {
      toast.error("Številka računa je obvezna");
      return;
    }
    if (!form.supplierId) {
      toast.error("Izberite dobavitelja");
      return;
    }

    const payload: Partial<Invoice> = {
      invoiceNumber: form.invoiceNumber.trim(),
      supplier: { _model: "supplier", _id: form.supplierId } as LinkModelType,
      issueDate: form.issueDate,
      dueDate: form.dueDate || undefined,
      notes: form.notes.trim() || undefined,
      totalAmount: 0, // will be computed from line items
      status: InvoiceStatus.Draft,
      staff: JSON.parse(localStorage.getItem("user") || "{}")?.name,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateInvoice({ ...payload, _id: form._id });
        toast.success("Račun posodobljen");
      } else {
        const created = await createInvoice(payload);
        toast.success("Račun ustvarjen — dodajte postavke");
        // Open detail to add line items
        setDetailTarget(created);
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteInvoice(deleteTarget._id);
      toast.success("Račun izbrisan");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const handleApprove = async (invoice: Invoice) => {
    // Fetch line items for this invoice
    try {
      const items = await fetch(
        `${import.meta.env.VITE_API_URL}/api/content/items/invoiceitem?populate=1&filter={invoice:"${invoice._id}"}`,
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": JSON.parse(localStorage.getItem("user") || "{}")
              ?.apiKey,
          },
        },
      ).then((r) => r.json());

      if (!items || items.length === 0) {
        toast.error("Račun nima postavk — dodajte jih pred odobritvijo");
        return;
      }

      const result = await approveInvoice.mutateAsync({
        invoice,
        items,
        staff: JSON.parse(localStorage.getItem("user") || "{}")?.name,
      });

      if (result.failedCount === 0) {
        toast.success(
          `Račun odobren — ${result.restockedCount} postavk knjiženih v zalogo`,
        );
      } else {
        toast.warning(
          `Račun odobren: ${result.restockedCount} uspešnih, ${result.failedCount} neuspešnih`,
        );
      }
    } catch (err) {
      toast.error(
        `Napaka pri odobritvi: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      await updateInvoice({
        _id: invoice._id,
        status: InvoiceStatus.Paid,
        paidDate: new Date().toISOString().slice(0, 10),
      });
      toast.success("Račun označen kot plačan");
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-secondary" />
            Računi dobaviteljev
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Knjižite dobavne račune in avtomatsko posodabljajte zalogo
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Nov račun
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Skupno" value={stats.total} color="text-gray-700" />
        <StatBox
          label="Osnutki"
          value={stats.draft}
          color="text-gray-500"
        />
        <StatBox
          label="Prejeto"
          value={stats.received}
          color="text-amber-600"
        />
        <StatBox
          label="Skupni znesek"
          value={formatCurrency(stats.totalAmount)}
          color="text-green-600"
          isCurrency
        />
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Iskanje po št. računa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as InvoiceStatus | "all")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vsi statusi</SelectItem>
              <SelectItem value={InvoiceStatus.Draft}>Osnutki</SelectItem>
              <SelectItem value={InvoiceStatus.Received}>Prejeto</SelectItem>
              <SelectItem value={InvoiceStatus.Paid}>Plačano</SelectItem>
              <SelectItem value={InvoiceStatus.Cancelled}>
                Preklicano
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Št. računa</TableHead>
                  <TableHead>Dobavitelj</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Znesek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const supplierName =
                    inv.supplier && typeof inv.supplier === "object"
                      ? (inv.supplier as { name?: string }).name
                      : "—";
                  return (
                    <TableRow
                      key={inv._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setDetailTarget(inv)}
                    >
                      <TableCell className="font-mono text-sm">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-gray-400" />
                          {supplierName}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(inv.issueDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.totalAmount ?? 0)}
                      </TableCell>
                      <TableCell>
                        {getInvoiceStatusBadge(inv.status as InvoiceStatus)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === InvoiceStatus.Draft && (
                            <button
                              onClick={() => handleApprove(inv)}
                              disabled={isApproving}
                              className="p-1.5 rounded text-green-600 hover:bg-green-50"
                              title="Odobri + knjiži v zalogo"
                              aria-label="Odobri"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {inv.status === InvoiceStatus.Received && (
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                              title="Označi kot plačano"
                              aria-label="Plačano"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(inv)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            aria-label="Izbriši"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-gray-500"
                    >
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Ni računov.</p>
                      <p className="text-sm">
                        Kliknite "Nov račun" za ustvarjanje.
                      </p>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Uredi račun" : "Nov račun"}
            </DialogTitle>
          </DialogHeader>
          <InvoiceFormDialog
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Izbriši račun?</AlertDialogTitle>
            <AlertDialogDescription>
              Račun <strong>{deleteTarget?.invoiceNumber}</strong> bo trajno
              izbrisan skupaj s postavkami.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Izbriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice detail with line items editor */}
      {detailTarget && (
        <InvoiceDetailDialog
          invoice={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Invoice form dialog                                                 */
/* ------------------------------------------------------------------ */

interface InvoiceFormDialogProps {
  form: InvoiceForm;
  setForm: (form: InvoiceForm) => void;
  onSubmit: (e: FormEvent) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const InvoiceFormDialog = ({
  form,
  setForm,
  onSubmit,
  isSubmitting,
  onCancel,
}: InvoiceFormDialogProps) => {
  const { data: suppliers } = useFetchActiveSuppliers();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invoiceNumber">Številka računa *</Label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="invoiceNumber"
            value={form.invoiceNumber}
            onChange={(e) =>
              setForm({ ...form, invoiceNumber: e.target.value })
            }
            placeholder="npr. 2026-001, R-12345"
            className="pl-9"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Dobavitelj *</Label>
        <Select
          value={form.supplierId}
          onValueChange={(v) => setForm({ ...form, supplierId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Izberi dobavitelja..." />
          </SelectTrigger>
          <SelectContent>
            {(suppliers ?? []).map((s) => (
              <SelectItem key={s._id} value={s._id!}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="issueDate">Datum izdaje</Label>
          <Input
            id="issueDate"
            type="date"
            value={form.issueDate}
            min={today}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Datum zapadlosti</Label>
          <Input
            id="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Opombe</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Poškodovane artikle, delna dobava..."
          rows={2}
          maxLength={500}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Prekliči
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : null}
          {form._id ? "Shrani" : "Ustvari"}
        </Button>
      </DialogFooter>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Invoice detail with line items editor                               */
/* ------------------------------------------------------------------ */

const InvoiceDetailDialog = ({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) => {
  const { data: items, isLoading } = useFetchInvoiceItems(invoice._id);
  const { mutateAsync: createItem } = useCreateInvoiceItem();
  const { mutateAsync: updateItem } = useUpdateInvoiceItem();
  const { mutateAsync: deleteItem } = useDeleteInvoiceItem();
  const { mutateAsync: updateInvoice } = useUpdateInvoice();
  const { data: inventoryItems } = useFetchInventoryItems();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    inventoryItemId: "",
    quantity: "1",
    unitPrice: "0",
    taxRate: "22",
  });

  const drafts: LineItemDraft[] = (items ?? []).map((i) => ({
    inventoryItemId:
      i.inventoryItem && typeof i.inventoryItem === "object"
        ? (i.inventoryItem as LinkModelType)._id ?? ""
        : "",
    itemName: i.itemName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    taxRate: i.taxRate,
  }));
  const totals = computeInvoiceTotals(drafts);

  // Auto-update invoice total when items change
  useEffect(() => {
    if (items && items.length > 0 && invoice._id) {
      const computedTotal = computeInvoiceTotals(drafts).totalAmount;
      if (Math.abs((invoice.totalAmount ?? 0) - computedTotal) > 0.01) {
        updateInvoice
          .mutateAsync({
            _id: invoice._id,
            totalAmount: computedTotal,
            netAmount: totals.netAmount,
            taxAmount: totals.taxAmount,
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItem.inventoryItemId) {
      toast.error("Izberi artikel");
      return;
    }
    const inv = (inventoryItems ?? []).find(
      (i) => i._id === newItem.inventoryItemId,
    );
    if (!inv) return;

    const qty = parseFloat(newItem.quantity);
    const price = parseFloat(newItem.unitPrice);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Količina mora biti pozitivna");
      return;
    }
    const taxRate = parseFloat(newItem.taxRate) || 0;
    const lineTotal = Math.round(qty * price * 100) / 100;

    try {
      await createItem({
        invoice: { _model: "invoice", _id: invoice._id } as LinkModelType,
        inventoryItem: {
          _model: "inventoryitem",
          _id: newItem.inventoryItemId,
        } as LinkModelType,
        itemName: inv.name,
        quantity: qty,
        unitPrice: price,
        taxRate,
        lineTotal,
        restocked: false,
      });
      toast.success(`Dodano: ${inv.name}`);
      setNewItem({ inventoryItemId: "", quantity: "1", unitPrice: "0", taxRate: "22" });
      setShowAddForm(false);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const handleDeleteItem = async (item: InvoiceItem) => {
    if (!window.confirm(`Izbriši postavko "${item.itemName}"?`)) return;
    try {
      await deleteItem(item._id!);
      toast.success("Postavka izbrisana");
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const supplierName =
    invoice.supplier && typeof invoice.supplier === "object"
      ? (invoice.supplier as { name?: string }).name
      : "—";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-secondary" />
            Račun {invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Invoice header info */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Dobavitelj:</span>
            <span className="font-medium">{supplierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Datum izdaje:</span>
            <span>{formatDate(invoice.issueDate)}</span>
          </div>
          {invoice.dueDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Datum zapadlosti:</span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span>{getInvoiceStatusBadge(invoice.status as InvoiceStatus)}</span>
          </div>
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              Postavke računa
            </h3>
            {invoice.status === InvoiceStatus.Draft && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-1"
              >
                {showAddForm ? (
                  <>
                    <Minus className="h-3.5 w-3.5" />
                    Skrij
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Dodaj postavko
                  </>
                )}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddItem}
                className="overflow-hidden border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50 space-y-3"
              >
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    <Label className="text-xs">Artikel</Label>
                    <Select
                      value={newItem.inventoryItemId}
                      onValueChange={(v) =>
                        setNewItem({ ...newItem, inventoryItemId: v })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Izberi..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(inventoryItems ?? []).map((i) => (
                          <SelectItem key={i._id} value={i._id!}>
                            {i.name} ({i.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-xs">Količina</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-xs">Cena/kos</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.unitPrice}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unitPrice: e.target.value })
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-xs">DDV %</Label>
                    <Select
                      value={newItem.taxRate}
                      onValueChange={(v) =>
                        setNewItem({ ...newItem, taxRate: v })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="22">22</SelectItem>
                        <SelectItem value="9.5">9.5</SelectItem>
                        <SelectItem value="0">0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex items-end">
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full h-8 gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (items ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ni postavk.</p>
              <p className="text-xs">
                {invoice.status === InvoiceStatus.Draft
                  ? 'Kliknite "Dodaj postavko" za začetek.'
                  : "Račun nima postavk."}
              </p>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikel</TableHead>
                    <TableHead className="text-right">Količina</TableHead>
                    <TableHead className="text-right">Cena/kos</TableHead>
                    <TableHead className="text-right">DDV</TableHead>
                    <TableHead className="text-right">Skupaj</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items ?? []).map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {item.itemName}
                          </p>
                          {item.restocked && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 hover:bg-green-100 text-xs mt-0.5"
                            >
                              <Check className="h-2.5 w-2.5 mr-0.5" />
                              Knjiženo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-500">
                        {item.taxRate}%
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status === InvoiceStatus.Draft &&
                          !item.restocked && (
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              aria-label="Izbriši"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Totals */}
        {(items ?? []).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Neto znesek:</span>
              <span>{formatCurrency(totals.netAmount)}</span>
            </div>
            {totals.byRate.map((row) => (
              <div
                key={row.rate}
                className="flex justify-between text-xs text-gray-500"
              >
                <span>DDV {row.rate}%:</span>
                <span>{formatCurrency(row.tax)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Skupaj:</span>
              <span>{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Warning for non-draft invoices */}
        {invoice.status !== InvoiceStatus.Draft && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Račun je že {invoice.status === InvoiceStatus.Received ? "prejet" : invoice.status === InvoiceStatus.Paid ? "plačan" : "preklican"} — postavk ni mogoče spreminjati.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Zapri
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/* Stat box                                                            */
/* ------------------------------------------------------------------ */

const StatBox = ({
  label,
  value,
  color,
  isCurrency,
}: {
  label: string;
  value: number | string;
  color: string;
  isCurrency?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
  >
    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
      {label}
    </p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>
      {isCurrency ? value : value}
    </p>
  </motion.div>
);

export default Invoices;
