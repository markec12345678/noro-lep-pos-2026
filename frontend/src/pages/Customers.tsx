import { useState, FormEvent, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  PlusCircle,
  Edit,
  Trash,
  Phone,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  ShoppingBag,
  Star,
  Gift,
  ArrowLeft,
  History,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/services/customerService";
import { useFetchLoyaltyTransactions } from "@/services/loyaltyService";
import { Customer, LoyaltyTransaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const formatDate = (epoch?: number) => {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (epoch?: number) => {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface CustomerForm {
  _id?: string;
  phone: string;
  name: string;
  email: string;
  birthday: string;
  notes: string;
}

const EMPTY_FORM: CustomerForm = {
  phone: "",
  name: "",
  email: "",
  birthday: "",
  notes: "",
};

const Customers = () => {
  const { data: customers, isLoading } = useFetchCustomers();
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { mutateAsync: updateCustomer } = useUpdateCustomer();
  const { mutateAsync: deleteCustomer } = useDeleteCustomer();

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [detailTarget, setDetailTarget] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return (customers ?? []).filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        c.phone?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  const totalMembers = customers?.length ?? 0;
  const totalPoints = (customers ?? []).reduce(
    (sum, c) => sum + (c.points ?? 0),
    0,
  );
  const totalSpent = (customers ?? []).reduce(
    (sum, c) => sum + (c.totalSpent ?? 0),
    0,
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setForm({
      _id: customer._id,
      phone: customer.phone ?? "",
      name: customer.name ?? "",
      email: customer.email ?? "",
      birthday: customer.birthday ?? "",
      notes: customer.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const payload: Partial<Customer> = {
      phone: form.phone.trim(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      birthday: form.birthday || undefined,
      notes: form.notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateCustomer({ ...payload, _id: form._id });
        toast.success(`Updated ${form.name}`);
      } else {
        const now = Math.floor(Date.now() / 1000);
        await createCustomer({
          ...payload,
          points: 0,
          lifetimePoints: 0,
          totalSpent: 0,
          visits: 0,
          firstVisitAt: now,
          lastVisitAt: now,
        });
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
      await deleteCustomer(deleteTarget._id);
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
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Award className="h-6 w-6 text-secondary" />
            Customers & Loyalty
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage loyalty members and view their history
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Star}
          label="Total members"
          value={String(totalMembers)}
          color="#8b5cf6"
        />
        <StatCard
          icon={Award}
          label="Points outstanding"
          value={totalPoints.toLocaleString()}
          color="#f97316"
        />
        <StatCard
          icon={TrendingUp}
          label="Lifetime spend"
          value={formatCurrency(totalSpent)}
          color="#10b981"
        />
      </div>

      {/* Search + table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone, name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
        </div>

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
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Total spent</TableHead>
                  <TableHead>Last visit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDetailTarget(customer)}
                  >
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      {customer.email && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {customer.phone}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1">
                        <Award className="h-3 w-3" />
                        {customer.points ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {customer.visits ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(customer.totalSpent ?? 0)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(customer.lastVisitAt)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(customer)}
                          className="p-1.5 rounded text-secondary hover:bg-secondary/10"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(customer)}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50"
                          aria-label="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchQuery
                        ? "No customers match your search."
                        : 'No customers yet. Click "Add Customer" to create one.'}
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
              {form._id ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="031 234 567"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Janez Novak"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="janez@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday (optional)</Label>
              <Input
                id="birthday"
                type="date"
                value={form.birthday}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Staff notes about this customer..."
                rows={2}
                maxLength={500}
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
                    ? "Update"
                    : "Create"}
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
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong> ({deleteTarget?.phone})
              and all their loyalty history. This action cannot be undone.
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

      {/* Customer detail dialog */}
      {detailTarget && (
        <CustomerDetailDialog
          customer={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Customer detail dialog with transaction history                     */
/* ------------------------------------------------------------------ */

const CustomerDetailDialog = ({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) => {
  const { data: transactions, isLoading } = useFetchLoyaltyTransactions(
    customer._id,
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earn":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "redeem":
        return <Gift className="h-4 w-4 text-purple-600" />;
      case "adjust":
        return <Star className="h-4 w-4 text-blue-600" />;
      case "expire":
        return <Calendar className="h-4 w-4 text-gray-400" />;
      default:
        return <History className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            {customer.name}
          </DialogTitle>
        </DialogHeader>

        {/* Customer info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <Award className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-orange-700">
              {customer.points ?? 0}
            </p>
            <p className="text-xs text-gray-500">Current points</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Star className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">
              {customer.lifetimePoints ?? 0}
            </p>
            <p className="text-xs text-gray-500">Lifetime points</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <ShoppingBag className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{customer.visits ?? 0}</p>
            <p className="text-xs text-gray-500">Visits</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(customer.totalSpent ?? 0)}
            </p>
            <p className="text-xs text-gray-500">Total spent</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{customer.phone}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{customer.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>Member since {formatDate(customer.firstVisitAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>Last visit {formatDate(customer.lastVisitAt)}</span>
          </div>
        </div>

        {customer.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">Notes</p>
            <p className="text-xs">{customer.notes}</p>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-gray-500" />
            Points History
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (transactions ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No points transactions yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(transactions ?? []).map((tx: LoyaltyTransaction) => (
                <div
                  key={tx._id}
                  className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(tx._created)}
                      {tx.staff && ` · by ${tx.staff}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        (tx.points ?? 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(tx.points ?? 0) >= 0 ? "+" : ""}
                      {tx.points}
                    </p>
                    <p className="text-xs text-gray-500">
                      bal: {tx.balanceAfter}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
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

export default Customers;
