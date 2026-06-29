import { useState, FormEvent, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Edit,
  Trash,
  Tag,
  Clock,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Percent,
  DollarSign,
  Gift,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchPromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  isPromotionActiveNow,
  formatPromotionType,
  formatPromotionSchedule,
  PROMOTION_DAY_NAMES,
} from "@/services/promotionService";
import { Promotion, PromotionType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";

interface PromoForm {
  _id?: string;
  name: string;
  description: string;
  type: PromotionType;
  value: string;
  startTime: string;
  endTime: string;
  days: number[];
  startDate: string;
  endDate: string;
  active: boolean;
}

const EMPTY_FORM: PromoForm = {
  name: "",
  description: "",
  type: "percentage",
  value: "20",
  startTime: "17:00",
  endTime: "19:00",
  days: [1, 2, 3, 4, 5],
  startDate: "",
  endDate: "",
  active: true,
};

const Promotions = () => {
  const { data: promotions, isLoading } = useFetchPromotions();
  const { mutateAsync: createPromo } = useCreatePromotion();
  const { mutateAsync: updatePromo } = useUpdatePromotion();
  const { mutateAsync: deletePromo } = useDeletePromotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<PromoForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const activeNowCount = useMemo(
    () => (promotions ?? []).filter((p) => isPromotionActiveNow(p)).length,
    [promotions],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setForm({
      _id: promo._id,
      name: promo.name ?? "",
      description: promo.description ?? "",
      type: promo.type ?? "percentage",
      value: String(promo.value ?? 0),
      startTime: promo.startTime ?? "17:00",
      endTime: promo.endTime ?? "19:00",
      days: Array.isArray(promo.days) ? promo.days : [],
      startDate: promo.startDate ?? "",
      endDate: promo.endDate ?? "",
      active: promo.active ?? true,
    });
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Ime akcije je obvezno");
      return;
    }
    if (form.days.length === 0) {
      toast.error("Izberite vsaj en dan");
      return;
    }
    const value = parseFloat(form.value);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Vrednost mora biti pozitivna");
      return;
    }

    const payload: Partial<Promotion> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      value,
      startTime: form.startTime,
      endTime: form.endTime,
      days: form.days,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      active: form.active,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updatePromo({ ...payload, _id: form._id });
        toast.success("Akcija posodobljena");
      } else {
        await createPromo(payload);
        toast.success("Akcija ustvarjena");
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
      await deletePromo(deleteTarget._id);
      toast.success("Akcija izbrisana");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      await updatePromo({ _id: promo._id, active: !promo.active });
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
            <Tag className="h-6 w-6 text-pink-500" />
            Akcije in promocije
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Časovno omejene akcije (happy hour, kosilo posebna...)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Nova akcija
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox label="Skupno akcij" value={promotions?.length ?? 0} color="text-gray-700" />
        <StatBox label="Trenutno aktivne" value={activeNowCount} color="text-green-600" />
        <StatBox
          label="Neaktivne"
          value={(promotions?.length ?? 0) - activeNowCount}
          color="text-gray-400"
        />
      </div>

      {/* Info banner */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-sm text-pink-700">
        <p className="font-medium flex items-center gap-2 mb-1">
          <Tag className="h-4 w-4" />
          Kako delujejo akcije?
        </p>
        <ul className="list-disc pl-5 space-y-0.5 text-xs">
          <li>Akcije se samodejno aplicirajo na checkout v aktivnem času</li>
          <li>Tipi: odstotek (%), fiksni (€), 2+1 gratis</li>
          <li>Določite dneve in ure veljavnosti (npr. Pon-Pet 17:00-19:00)</li>
          <li>Brez kategorije/izdelkov = velja za vse</li>
          <li>Več akcij lahko velja hkrati (ne stackajo se — vsaka iz osnove)</li>
        </ul>
      </div>

      {/* Promotion cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (promotions ?? []).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Tag className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">Ni akcij.</p>
          <p className="text-sm text-gray-400 mt-1">
            Ustvarite prvo akcijo za privabljanje gostov.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(promotions ?? []).map((promo) => {
            const isActiveNow = isPromotionActiveNow(promo);
            return (
              <motion.div
                key={promo._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-xl border shadow-sm overflow-hidden",
                  isActiveNow
                    ? "border-green-300 ring-1 ring-green-200"
                    : promo.active
                      ? "border-gray-200"
                      : "border-gray-200 opacity-60",
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center",
                        promo.type === "percentage"
                          ? "bg-pink-100 text-pink-600"
                          : promo.type === "fixed"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-purple-100 text-purple-600",
                      )}
                    >
                      {promo.type === "percentage" ? (
                        <Percent className="h-5 w-5" />
                      ) : promo.type === "fixed" ? (
                        <DollarSign className="h-5 w-5" />
                      ) : (
                        <Gift className="h-5 w-5" />
                      )}
                    </div>
                    <button
                      onClick={() => toggleActive(promo)}
                      className="p-1"
                      title={promo.active ? "Deaktiviraj" : "Aktiviraj"}
                    >
                      {promo.active ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <h3 className="font-bold text-lg">{promo.name}</h3>
                  {promo.description && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {promo.description}
                    </p>
                  )}

                  <div className="mt-3 space-y-1">
                    <p className="font-medium text-pink-600">
                      {formatPromotionType(promo.type, promo.value)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatPromotionSchedule(promo)}
                    </p>
                    {(promo.startDate || promo.endDate) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {promo.startDate ? formatDate(promo.startDate) : "—"}
                        {" → "}
                        {promo.endDate ? formatDate(promo.endDate) : "∞"}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                    {isActiveNow ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Aktivna zdaj
                      </Badge>
                    ) : promo.active ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                        V čakanju
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-400">
                        Izklopljena
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(promo)}
                        className="p-1.5 rounded text-secondary hover:bg-secondary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(promo)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Uredi akcijo" : "Nova akcija"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ime akcije *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="npr. Happy Hour Koktajli"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Vsi koktajli 20% ceneje!"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tip popusta</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as PromotionType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Odstotek (%)</SelectItem>
                    <SelectItem value="fixed">Fiksni (€)</SelectItem>
                    <SelectItem value="buy_one_get_one">2+1 gratis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  {form.type === "percentage"
                    ? "Odstotek %"
                    : form.type === "fixed"
                      ? "Znesek €"
                      : "—"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: e.target.value })
                  }
                  disabled={form.type === "buy_one_get_one"}
                  placeholder={form.type === "buy_one_get_one" ? "Auto" : "20"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">Od ure</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Do ure</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dnevi v tednu</Label>
              <div className="flex gap-1">
                {PROMOTION_DAY_NAMES.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                      form.days.includes(idx)
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-gray-200 text-gray-400",
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Velja od (neobvezno)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Velja do (neobvezno)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <label className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Aktivna</Label>
                <p className="text-xs text-gray-500">
                  Izklopljene akcije se ne aplicirajo
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
            <AlertDialogTitle>Izbriši akcijo?</AlertDialogTitle>
            <AlertDialogDescription>
              Akcija <strong>{deleteTarget?.name}</strong> bo izbrisana.
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

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "short",
  });

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

export default Promotions;
