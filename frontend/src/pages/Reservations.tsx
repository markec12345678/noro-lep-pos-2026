import { useState, useMemo, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Check,
  X,
  UserX,
  Edit,
  Trash,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchReservationsByDate,
  useCreateReservation,
  useUpdateReservation,
  useUpdateReservationStatus,
  useDeleteReservation,
  generateConfirmationCode,
  DEFAULT_TIME_SLOTS,
} from "@/services/reservationService";
import { Reservation, ReservationStatus } from "@/types";
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

const formatDateLong = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getStatusInfo = (status: ReservationStatus) => {
  switch (status) {
    case ReservationStatus.Pending:
      return {
        label: "Na čakanju",
        color: "bg-amber-100 text-amber-700 hover:bg-amber-100",
      };
    case ReservationStatus.Confirmed:
      return {
        label: "Potrjena",
        color: "bg-green-100 text-green-700 hover:bg-green-100",
      };
    case ReservationStatus.Cancelled:
      return {
        label: "Preklicana",
        color: "bg-red-100 text-red-700 hover:bg-red-100",
      };
    case ReservationStatus.Completed:
      return {
        label: "Zaključena",
        color: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      };
    case ReservationStatus.NoShow:
      return {
        label: "Ni prišel",
        color: "bg-gray-200 text-gray-700 hover:bg-gray-200",
      };
    default:
      return { label: status, color: "bg-gray-100 text-gray-700" };
  }
};

const Reservations = () => {
  // Default to today
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all",
  );
  const { data: reservations, isLoading } =
    useFetchReservationsByDate(selectedDate);
  const { mutateAsync: createReservation } = useCreateReservation();
  const { mutateAsync: updateReservation } = useUpdateReservation();
  const { mutateAsync: updateStatus } = useUpdateReservationStatus();
  const { mutateAsync: deleteReservation } = useDeleteReservation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    date: today,
    time: "19:00",
    partySize: "2",
    notes: "",
  });

  const filteredReservations = useMemo(() => {
    return (reservations ?? []).filter((r) => {
      if (statusFilter === "all") return true;
      return r.status === statusFilter;
    });
  }, [reservations, statusFilter]);

  const stats = useMemo(() => {
    const all = reservations ?? [];
    return {
      total: all.length,
      pending: all.filter((r) => r.status === ReservationStatus.Pending).length,
      confirmed: all.filter((r) => r.status === ReservationStatus.Confirmed)
        .length,
      cancelled: all.filter((r) => r.status === ReservationStatus.Cancelled)
        .length,
      totalGuests: all
        .filter((r) => r.status !== ReservationStatus.Cancelled)
        .reduce((sum, r) => sum + (r.partySize ?? 0), 0),
    };
  }, [reservations]);

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const openCreate = () => {
    setEditingReservation(null);
    setForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      date: selectedDate,
      time: "19:00",
      partySize: "2",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setForm({
      customerName: reservation.customerName ?? "",
      customerPhone: reservation.customerPhone ?? "",
      customerEmail: reservation.customerEmail ?? "",
      date: reservation.date ?? today,
      time: reservation.time ?? "19:00",
      partySize: String(reservation.partySize ?? 2),
      notes: reservation.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      toast.error("Ime je obvezno");
      return;
    }
    if (!form.customerPhone.trim() || form.customerPhone.trim().length < 6) {
      toast.error("Veljavna telefonska številka je obvezna");
      return;
    }

    const userName = JSON.parse(localStorage.getItem("user") || "{}")?.name;
    const payload: Partial<Reservation> = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      date: form.date,
      time: form.time,
      partySize: parseInt(form.partySize, 10) || 1,
      notes: form.notes.trim() || undefined,
      staff: userName,
    };

    setIsSubmitting(true);
    try {
      if (editingReservation?._id) {
        await updateReservation({ ...payload, _id: editingReservation._id });
        toast.success("Rezervacija posodobljena");
      } else {
        await createReservation({
          ...payload,
          status: ReservationStatus.Confirmed,
          source: "staff",
          confirmationCode: generateConfirmationCode(),
        });
        toast.success("Rezervacija ustvarjena");
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

  const handleStatusChange = async (
    reservation: Reservation,
    newStatus: ReservationStatus,
  ) => {
    const userName = JSON.parse(localStorage.getItem("user") || "{}")?.name;
    try {
      await updateStatus({
        reservationId: reservation._id!,
        status: newStatus,
        staff: userName,
        date: reservation.date,
      });
      toast.success(`Status: ${getStatusInfo(newStatus).label}`);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteReservation(deleteTarget._id);
      toast.success("Rezervacija izbrisana");
      setDeleteTarget(null);
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
            <Calendar className="h-6 w-6 text-secondary" />
            Rezervacije
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upravljajte rezervacije miz
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Nova rezervacija
        </Button>
      </div>

      {/* Date navigator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateDate(-1)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prejšnji
        </Button>
        <div className="text-center">
          <p className="font-medium capitalize">{formatDateLong(selectedDate)}</p>
          {selectedDate === today && (
            <p className="text-xs text-gray-500">Danes</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(today)}
          >
            Danes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(1)}
            className="gap-1"
          >
            Naslednji
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Skupno" value={stats.total} color="text-gray-700" />
        <StatBox
          label="Na čakanju"
          value={stats.pending}
          color="text-amber-600"
        />
        <StatBox
          label="Potrjene"
          value={stats.confirmed}
          color="text-green-600"
        />
        <StatBox
          label="Skupno gostov"
          value={stats.totalGuests}
          color="text-blue-600"
        />
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter:</span>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as ReservationStatus | "all")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vsi statusi</SelectItem>
              <SelectItem value={ReservationStatus.Pending}>
                Na čakanju
              </SelectItem>
              <SelectItem value={ReservationStatus.Confirmed}>
                Potrjene
              </SelectItem>
              <SelectItem value={ReservationStatus.Cancelled}>
                Preklicane
              </SelectItem>
              <SelectItem value={ReservationStatus.Completed}>
                Zaključene
              </SelectItem>
              <SelectItem value={ReservationStatus.NoShow}>
                Ni prišel
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservations table */}
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
                  <TableHead>Čas</TableHead>
                  <TableHead>Gost</TableHead>
                  <TableHead className="text-center">Oseb</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Opombe</TableHead>
                  <TableHead>Koda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((r) => {
                  const statusInfo = getStatusInfo(r.status as ReservationStatus);
                  return (
                    <TableRow key={r._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {r.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{r.customerName}</p>
                          {r.source === "guest" && (
                            <p className="text-xs text-gray-400">Online</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {r.partySize}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {r.customerPhone}
                          </p>
                          {r.customerEmail && (
                            <p className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="h-3 w-3" />
                              {r.customerEmail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[200px]">
                        {r.notes ? (
                          <span className="line-clamp-2">{r.notes}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {r.confirmationCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick status actions */}
                          {r.status === ReservationStatus.Pending && (
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  r,
                                  ReservationStatus.Confirmed,
                                )
                              }
                              className="p-1.5 rounded text-green-600 hover:bg-green-50"
                              title="Potrdi"
                              aria-label="Potrdi"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {r.status !== ReservationStatus.Cancelled &&
                            r.status !== ReservationStatus.Completed && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      r,
                                      ReservationStatus.Cancelled,
                                    )
                                  }
                                  className="p-1.5 rounded text-red-500 hover:bg-red-50"
                                  title="Prekliči"
                                  aria-label="Prekliči"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      r,
                                      ReservationStatus.NoShow,
                                    )
                                  }
                                  className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
                                  title="Ni prišel"
                                  aria-label="Ni prišel"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          {r.status === ReservationStatus.Confirmed && (
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  r,
                                  ReservationStatus.Completed,
                                )
                              }
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                              title="Zaključi"
                              aria-label="Zaključi"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded text-secondary hover:bg-secondary/10"
                            title="Uredi"
                            aria-label="Uredi"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            title="Izbriši"
                            aria-label="Izbriši"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredReservations.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-gray-500"
                    >
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Ni rezervacij za ta dan.</p>
                      <p className="text-sm">
                        Kliknite "Nova rezervacija" za ustvarjanje.
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
              {editingReservation ? "Uredi rezervacijo" : "Nova rezervacija"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Ime gosta *</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="Janez Novak"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefon *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) =>
                    setForm({ ...form, customerPhone: e.target.value })
                  }
                  placeholder="031 234 567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) =>
                    setForm({ ...form, customerEmail: e.target.value })
                  }
                  placeholder="janez@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Čas</Label>
                <Select
                  value={form.time}
                  onValueChange={(v) => setForm({ ...form, time: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partySize">Oseb</Label>
                <Input
                  id="partySize"
                  type="number"
                  min="1"
                  max="20"
                  value={form.partySize}
                  onChange={(e) =>
                    setForm({ ...form, partySize: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Opombe</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Otroški stol, rojstni dan, alergije..."
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
                Prekliči
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                {editingReservation ? "Shrani" : "Ustvari"}
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
            <AlertDialogTitle>Izbriši rezervacijo?</AlertDialogTitle>
            <AlertDialogDescription>
              Rezervacija za{" "}
              <strong>
                {deleteTarget?.customerName} ({formatDateShort(
                  deleteTarget?.date ?? "",
                )}{" "}
                ob {deleteTarget?.time})
              </strong>{" "}
              bo trajno izbrisana.
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
    </div>
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

export default Reservations;
