import { useState, FormEvent, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Search,
  Edit,
  Trash,
  Truck,
  Phone,
  Mail,
  MapPin,
  FileText,
  Hash,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useFetchInvoicesBySupplier,
} from "@/services/supplierService";
import { Supplier, Invoice, InvoiceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface SupplierForm {
  _id?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  paymentTerms: string;
  notes: string;
  active: boolean;
}

const EMPTY_FORM: SupplierForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxNumber: "",
  paymentTerms: "30 dni",
  notes: "",
  active: true,
};

const Suppliers = () => {
  const { data: suppliers, isLoading } = useFetchSuppliers();
  const { mutateAsync: createSupplier } = useCreateSupplier();
  const { mutateAsync: updateSupplier } = useUpdateSupplier();
  const { mutateAsync: deleteSupplier } = useDeleteSupplier();

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [detailTarget, setDetailTarget] = useState<Supplier | null>(null);

  const filteredSuppliers = useMemo(() => {
    return (suppliers ?? []).filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        s.name?.toLowerCase().includes(q) ||
        s.contactPerson?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.taxNumber?.toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const activeCount = (suppliers ?? []).filter((s) => s.active).length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setForm({
      _id: supplier._id,
      name: supplier.name ?? "",
      contactPerson: supplier.contactPerson ?? "",
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
      taxNumber: supplier.taxNumber ?? "",
      paymentTerms: supplier.paymentTerms ?? "30 dni",
      notes: supplier.notes ?? "",
      active: supplier.active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Ime dobavitelja je obvezno");
      return;
    }
    const payload: Partial<Supplier> = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      taxNumber: form.taxNumber.trim() || undefined,
      paymentTerms: form.paymentTerms.trim() || undefined,
      notes: form.notes.trim() || undefined,
      active: form.active,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateSupplier({ ...payload, _id: form._id });
        toast.success(`Posodobljen: ${form.name}`);
      } else {
        await createSupplier(payload);
        toast.success(`Ustvarjen: ${form.name}`);
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
      await deleteSupplier(deleteTarget._id);
      toast.success(`Izbrisan: ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const toggleActive = async (supplier: Supplier) => {
    try {
      await updateSupplier({
        _id: supplier._id,
        active: !supplier.active,
      });
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
            <Truck className="h-6 w-6 text-secondary" />
            Dobavitelji
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upravljajte dobavitelje in njihove račune
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Nov dobavitelj
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox label="Skupno" value={suppliers?.length ?? 0} color="text-gray-700" />
        <StatBox label="Aktivni" value={activeCount} color="text-green-600" />
        <StatBox
          label="Neaktivni"
          value={(suppliers?.length ?? 0) - activeCount}
          color="text-gray-400"
        />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Iskanje po imenu, telefonu, davčni št..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime</TableHead>
                  <TableHead>Kontaktna oseba</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Davčna št.</TableHead>
                  <TableHead>Plačilni pogoji</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow
                    key={supplier._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDetailTarget(supplier)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-secondary" />
                        </div>
                        <span className="font-medium">{supplier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {supplier.contactPerson || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {supplier.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {supplier.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {supplier.taxNumber || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {supplier.paymentTerms || "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActive(supplier);
                        }}
                        className="p-1"
                        title={supplier.active ? "Deaktiviraj" : "Aktiviraj"}
                      >
                        {supplier.active ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(supplier)}
                          className="p-1.5 rounded text-secondary hover:bg-secondary/10"
                          aria-label="Uredi"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(supplier)}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50"
                          aria-label="Izbriši"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSuppliers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-gray-500"
                    >
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Ni najdenih dobaviteljev.</p>
                      <p className="text-sm">
                        Kliknite "Nov dobavitelj" za ustvarjanje.
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Uredi dobavitelja" : "Nov dobavitelj"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ime *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="npr. Hofer, Metro, Sadd"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Kontaktna oseba</Label>
                <Input
                  id="contactPerson"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                  placeholder="Janez Novak"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01 234 5678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="narocila@dobavitelj.si"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Davčna št.</Label>
                <Input
                  id="taxNumber"
                  value={form.taxNumber}
                  onChange={(e) =>
                    setForm({ ...form, taxNumber: e.target.value })
                  }
                  placeholder="SI12345678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Naslov</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Slovenska cesta 1, 1000 Ljubljana"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Plačilni pogoji</Label>
              <Input
                id="paymentTerms"
                value={form.paymentTerms}
                onChange={(e) =>
                  setForm({ ...form, paymentTerms: e.target.value })
                }
                placeholder="npr. 30 dni, 15 dni, predračun"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Opombe</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Dostave ponedeljek/sreda/petek, MOQ 100€..."
                rows={2}
                maxLength={500}
              />
            </div>
            <label className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Aktiven</Label>
                <p className="text-xs text-gray-500">
                  Neaktivni dobavitelji so skriti v spustnih menijih
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Prekliči
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Shranjam..." : form._id ? "Shrani" : "Ustvari"}
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
            <AlertDialogTitle>Izbriši dobavitelja?</AlertDialogTitle>
            <AlertDialogDescription>
              Dobavitelj{" "}
              <strong>{deleteTarget?.name}</strong> bo trajno izbrisan.
              Zgodovinski računi ostanejo.
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

      {/* Supplier detail dialog */}
      {detailTarget && (
        <SupplierDetailDialog
          supplier={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Supplier detail with invoice history                                */
/* ------------------------------------------------------------------ */

const SupplierDetailDialog = ({
  supplier,
  onClose,
}: {
  supplier: Supplier;
  onClose: () => void;
}) => {
  const { data: invoices, isLoading } = useFetchInvoicesBySupplier(
    supplier._id,
  );

  const totalSpent = (invoices ?? [])
    .filter((i) => i.status !== InvoiceStatus.Cancelled)
    .reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-secondary" />
            {supplier.name}
          </DialogTitle>
        </DialogHeader>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {supplier.contactPerson && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{supplier.contactPerson}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{supplier.email}</span>
            </div>
          )}
          {supplier.taxNumber && (
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <span>{supplier.taxNumber}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{supplier.address}</span>
            </div>
          )}
          {supplier.paymentTerms && (
            <div className="flex items-center gap-2 col-span-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Plačilni pogoji: {supplier.paymentTerms}</span>
            </div>
          )}
        </div>

        {supplier.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">Opombe</p>
            <p className="text-xs">{supplier.notes}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {invoices?.length ?? 0}
            </p>
            <p className="text-xs text-gray-500">računov</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-gray-500">skupna poraba</p>
          </div>
        </div>

        {/* Invoice history */}
        <div>
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Zgodovina računov
          </h3>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (invoices ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Ni računov od tega dobavitelja.
            </p>
          ) : (
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Št. računa</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Znesek</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoices ?? []).map((inv: Invoice) => (
                    <TableRow key={inv._id}>
                      <TableCell className="font-mono text-xs">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(inv.issueDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.totalAmount ?? 0)}
                      </TableCell>
                      <TableCell>{getInvoiceStatusBadge(inv.status as InvoiceStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Nazaj
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
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
  >
    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
      {label}
    </p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
  </motion.div>
);

export default Suppliers;
