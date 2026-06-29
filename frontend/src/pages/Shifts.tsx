import { useState, useMemo, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Edit,
  Trash,
  Clock,
  User,
  DollarSign,
  Calendar,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  Briefcase,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchShiftsByDateRange,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useClockIn,
  useClockOut,
  buildWeeklySummary,
  getWeekStart,
  getWeekEnd,
  getWeekDates,
  getDayName,
  formatDateShort,
  computeHours,
} from "@/services/shiftService";
import { Shift } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatHours = (hours: number) => {
  if (hours === 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const ROLES = [
  { value: "manager", label: "Manager" },
  { value: "waiter", label: "Natakar" },
  { value: "chef", label: "Kuhar" },
  { value: "bartender", label: "Barmen" },
  { value: "cleaner", label: "Čistilec" },
];

interface ShiftForm {
  _id?: string;
  staffName: string;
  role: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  hourlyWage: string;
  notes: string;
}

const today = new Date().toISOString().slice(0, 10);

const EMPTY_FORM: ShiftForm = {
  staffName: "",
  role: "waiter",
  date: today,
  scheduledStart: "10:00",
  scheduledEnd: "18:00",
  hourlyWage: "8",
  notes: "",
};

const Shifts = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const startDate = getWeekStart(weekDate);
  const endDate = getWeekEnd(weekDate);
  const weekDates = getWeekDates(weekDate);

  const { data: shifts, isLoading } = useFetchShiftsByDateRange(
    startDate,
    endDate,
  );
  const { mutateAsync: createShift } = useCreateShift();
  const { mutateAsync: updateShift } = useUpdateShift();
  const { mutateAsync: deleteShift } = useDeleteShift();
  const { mutateAsync: clockIn } = useClockIn();
  const { mutateAsync: clockOut } = useClockOut();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ShiftForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  // Weekly summary (grouped by staff)
  const summary = useMemo(
    () => buildWeeklySummary(shifts ?? []),
    [shifts],
  );

  // Aggregate stats
  const stats = useMemo(() => {
    let totalScheduled = 0;
    let totalActual = 0;
    let totalCost = 0;
    const staffCount = summary.length;
    for (const s of summary) {
      totalScheduled += s.scheduledHours;
      totalActual += s.actualHours;
      totalCost += s.laborCost;
    }
    return {
      staffCount,
      totalScheduled: Math.round(totalScheduled * 100) / 100,
      totalActual: Math.round(totalActual * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }, [summary]);

  // Group shifts by date for the weekly grid
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const date of weekDates) {
      map.set(date, []);
    }
    for (const shift of shifts ?? []) {
      const existing = map.get(shift.date) ?? [];
      existing.push(shift);
      map.set(shift.date, existing);
    }
    return map;
  }, [shifts, weekDates]);

  const openCreate = (date?: string) => {
    setForm({ ...EMPTY_FORM, date: date ?? today });
    setDialogOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setForm({
      _id: shift._id,
      staffName: shift.staffName ?? "",
      role: shift.role ?? "waiter",
      date: shift.date ?? today,
      scheduledStart: shift.scheduledStart ?? "10:00",
      scheduledEnd: shift.scheduledEnd ?? "18:00",
      hourlyWage: String(shift.hourlyWage ?? 8),
      notes: shift.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.staffName.trim()) {
      toast.error("Ime zaposlenega je obvezno");
      return;
    }
    const payload: Partial<Shift> = {
      staffName: form.staffName.trim(),
      role: form.role,
      date: form.date,
      scheduledStart: form.scheduledStart,
      scheduledEnd: form.scheduledEnd,
      hourlyWage: parseFloat(form.hourlyWage) || 0,
      notes: form.notes.trim() || undefined,
      isClockedIn: false,
      isCompleted: false,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateShift({ ...payload, _id: form._id });
        toast.success("Izmena posodobljena");
      } else {
        await createShift(payload);
        toast.success("Izmena ustvarjena");
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
      await deleteShift(deleteTarget._id);
      toast.success("Izmena izbrisana");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const handleClockIn = async (shiftId: string) => {
    try {
      await clockIn(shiftId);
      toast.success("Prijavljen");
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const handleClockOut = async (shiftId: string) => {
    try {
      await clockOut(shiftId);
      toast.success("Odjavljen");
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const isToday = (dateStr: string) => dateStr === today;
  const isThisWeek = weekOffset === 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-secondary" />
            Izmene in urnik
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Teden {formatDateShort(startDate)} – {formatDateShort(endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
          >
            Ta teden
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="gap-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => openCreate()} className="gap-2 ml-2">
            <PlusCircle className="h-5 w-5" />
            Nova izmena
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox
          icon={Users}
          label="Zaposleni"
          value={String(stats.staffCount)}
          color="text-purple-600"
        />
        <StatBox
          icon={Clock}
          label="Ur na urniku"
          value={formatHours(stats.totalScheduled)}
          color="text-blue-600"
        />
        <StatBox
          icon={TrendingUp}
          label="Dejansko delali"
          value={formatHours(stats.totalActual)}
          color="text-green-600"
        />
        <StatBox
          icon={DollarSign}
          label="Strošek dela"
          value={formatCurrency(stats.totalCost)}
          color="text-orange-600"
        />
      </div>

      {/* Weekly grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {weekDates.map((date) => (
                  <div
                    key={date}
                    className={`p-3 text-center border-r last:border-r-0 ${
                      isToday(date) ? "bg-secondary/10" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{getDayName(date)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateShort(date)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Shift cells */}
              <div className="grid grid-cols-7">
                {weekDates.map((date) => {
                  const dayShifts = shiftsByDate.get(date) ?? [];
                  return (
                    <div
                      key={date}
                      className={`min-h-[120px] p-2 border-r last:border-r-0 border-b ${
                        isToday(date) ? "bg-secondary/5" : ""
                      }`}
                    >
                      <div className="space-y-1.5">
                        {dayShifts.map((shift) => (
                          <ShiftCard
                            key={shift._id}
                            shift={shift}
                            onEdit={() => openEdit(shift)}
                            onDelete={() => setDeleteTarget(shift)}
                            onClockIn={() => handleClockIn(shift._id!)}
                            onClockOut={() => handleClockOut(shift._id!)}
                            showClockButtons={isToday(date)}
                          />
                        ))}
                        {dayShifts.length === 0 && (
                          <button
                            onClick={() => openCreate(date)}
                            className="w-full text-center text-xs text-gray-300 hover:text-gray-500 py-4"
                          >
                            + Dodaj
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Staff summary table */}
      {summary.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              Pregled po zaposlenih
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zaposleni
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vloga
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IZMEN
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ur na urniku
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Dejansko
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    €/ura
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Strošek
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.map((s) => (
                  <tr key={`${s.staffName}-${s.role}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.staffName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{s.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {s.shifts.length}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatHours(s.scheduledHours)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatHours(s.actualHours)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatCurrency(s.hourlyWage)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(s.laborCost)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold">
                  <td colSpan={2} className="px-4 py-3">
                    SKUPAJ
                  </td>
                  <td className="px-4 py-3 text-right">
                    {summary.reduce((sum, s) => sum + s.shifts.length, 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatHours(stats.totalScheduled)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatHours(stats.totalActual)}
                  </td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(stats.totalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Uredi izmeno" : "Nova izmena"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staffName">Ime zaposlenega *</Label>
              <Input
                id="staffName"
                value={form.staffName}
                onChange={(e) =>
                  setForm({ ...form, staffName: e.target.value })
                }
                placeholder="Janez Novak"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Vloga</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="scheduledStart">Začetek</Label>
                <Input
                  id="scheduledStart"
                  type="time"
                  value={form.scheduledStart}
                  onChange={(e) =>
                    setForm({ ...form, scheduledStart: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledEnd">Konec</Label>
                <Input
                  id="scheduledEnd"
                  type="time"
                  value={form.scheduledEnd}
                  onChange={(e) =>
                    setForm({ ...form, scheduledEnd: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyWage">€/uro</Label>
                <Input
                  id="hourlyWage"
                  type="number"
                  step="0.50"
                  min="0"
                  value={form.hourlyWage}
                  onChange={(e) =>
                    setForm({ ...form, hourlyWage: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Opombe</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Trening, nadomeščanje..."
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
                {form._id ? "Shrani" : "Ustvari"}
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
            <AlertDialogTitle>Izbriši izmeno?</AlertDialogTitle>
            <AlertDialogDescription>
              Izmena za{" "}
              <strong>
                {deleteTarget?.staffName} ({formatDateShort(deleteTarget?.date ?? "")}{" "}
                {deleteTarget?.scheduledStart}–{deleteTarget?.scheduledEnd})
              </strong>{" "}
              bo izbrisana.
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
/* Shift card (inside the weekly grid)                                 */
/* ------------------------------------------------------------------ */

const ShiftCard = ({
  shift,
  onEdit,
  onDelete,
  onClockIn,
  onClockOut,
  showClockButtons,
}: {
  shift: Shift;
  onEdit: () => void;
  onDelete: () => void;
  onClockIn: () => void;
  onClockOut: () => void;
  showClockButtons: boolean;
}) => {
  const scheduledHours = computeHours(
    shift.scheduledStart,
    shift.scheduledEnd,
  );

  return (
    <div
      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm ${
        shift.isCompleted
          ? "border-green-200 bg-green-50"
          : shift.isClockedIn
            ? "border-amber-200 bg-amber-50"
            : "border-gray-200 bg-white"
      }`}
      onClick={onEdit}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium truncate">{shift.staffName}</span>
        <span className="text-gray-400 text-[10px]">
          {formatHours(scheduledHours)}
        </span>
      </div>
      <div className="flex items-center gap-1 text-gray-500 mt-0.5">
        <Clock className="h-2.5 w-2.5" />
        <span>
          {shift.scheduledStart}–{shift.scheduledEnd}
        </span>
      </div>
      {shift.clockIn && (
        <div className="text-[10px] text-green-600 mt-0.5">
          ▶ {shift.clockIn}
          {shift.clockOut && ` → ■ ${shift.clockOut}`}
        </div>
      )}

      {/* Clock buttons (only for today's shifts) */}
      {showClockButtons && !shift.isCompleted && (
        <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
          {!shift.isClockedIn ? (
            <button
              onClick={onClockIn}
              className="flex-1 flex items-center justify-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium bg-green-500 text-white hover:bg-green-600"
            >
              <Play className="h-2.5 w-2.5" />
              In
            </button>
          ) : (
            <button
              onClick={onClockOut}
              className="flex-1 flex items-center justify-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium bg-red-500 text-white hover:bg-red-600"
            >
              <Square className="h-2.5 w-2.5" />
              Out
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-1 py-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <Trash className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Stat box                                                            */
/* ------------------------------------------------------------------ */

const StatBox = ({
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

export default Shifts;
