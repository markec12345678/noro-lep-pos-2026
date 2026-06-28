import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Edit,
  Trash,
  Gift,
  ToggleLeft,
  ToggleRight,
  Star,
  Percent,
  DollarSign,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchLoyaltyRewards,
  useCreateLoyaltyReward,
  useUpdateLoyaltyReward,
  useDeleteLoyaltyReward,
} from "@/services/loyaltyService";
import { LoyaltyReward } from "@/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RewardForm {
  _id?: string;
  name: string;
  description: string;
  pointsCost: string;
  discountType: "fixed" | "percent" | "item";
  discountValue: string;
  active: boolean;
}

const EMPTY_FORM: RewardForm = {
  name: "",
  description: "",
  pointsCost: "50",
  discountType: "fixed",
  discountValue: "0",
  active: true,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const LoyaltyRewards = () => {
  const { data: rewards, isLoading } = useFetchLoyaltyRewards();
  const { mutateAsync: createReward } = useCreateLoyaltyReward();
  const { mutateAsync: updateReward } = useUpdateLoyaltyReward();
  const { mutateAsync: deleteReward } = useDeleteLoyaltyReward();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<RewardForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<LoyaltyReward | null>(null);

  useEffect(() => {
    if (!dialogOpen) {
      setForm(EMPTY_FORM);
    }
  }, [dialogOpen]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (reward: LoyaltyReward) => {
    setForm({
      _id: reward._id,
      name: reward.name,
      description: reward.description ?? "",
      pointsCost: String(reward.pointsCost ?? 0),
      discountType: reward.discountType ?? "fixed",
      discountValue: String(reward.discountValue ?? 0),
      active: reward.active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Reward name is required");
      return;
    }
    const pointsCost = parseInt(form.pointsCost, 10);
    if (Number.isNaN(pointsCost) || pointsCost < 1) {
      toast.error("Points cost must be at least 1");
      return;
    }
    const discountValue = parseFloat(form.discountValue);
    if (Number.isNaN(discountValue) || discountValue < 0) {
      toast.error("Discount value must be a non-negative number");
      return;
    }

    const payload: Partial<LoyaltyReward> = {
      name: form.name.trim(),
      description: form.description.trim(),
      pointsCost,
      discountType: form.discountType,
      discountValue,
      active: form.active,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateReward({ ...payload, _id: form._id });
        toast.success(`Updated ${form.name}`);
      } else {
        await createReward(payload);
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
      await deleteReward(deleteTarget._id);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const toggleActive = async (reward: LoyaltyReward) => {
    try {
      await updateReward({
        _id: reward._id,
        active: !reward.active,
      });
      toast.success(`${reward.name} ${reward.active ? "disabled" : "enabled"}`);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const getDiscountLabel = (reward: LoyaltyReward) => {
    switch (reward.discountType) {
      case "fixed":
        return `${formatCurrency(reward.discountValue)} off`;
      case "percent":
        return `${reward.discountValue}% off`;
      case "item":
        return "Free item";
      default:
        return "—";
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case "fixed":
        return DollarSign;
      case "percent":
        return Percent;
      case "item":
        return Package;
      default:
        return Gift;
    }
  };

  const activeCount = (rewards ?? []).filter((r) => r.active).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-500" />
            Loyalty Rewards
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define rewards that customers can redeem with their points
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Add Reward
        </Button>
      </div>

      {/* Info card */}
      <Card className="bg-purple-50/50 border-purple-200">
        <CardContent className="p-4 text-sm text-gray-700">
          <p className="font-medium flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-purple-600" />
            How rewards work
          </p>
          <ul className="list-disc pl-5 space-y-0.5 text-xs">
            <li>Customers earn 1 point per €1 spent (configurable)</li>
            <li>At checkout, they can redeem points for rewards</li>
            <li>
              <strong>Fixed</strong>: deducts a fixed € amount from the order
            </li>
            <li>
              <strong>Percent</strong>: deducts a % from the order total
            </li>
            <li>
              <strong>Item</strong>: gives a specific menu item for free (manual)
            </li>
            <li>Disabled rewards are hidden from the redemption UI</li>
          </ul>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {rewards?.length ?? 0}
            </p>
            <p className="text-xs text-gray-500">total rewards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500">active rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Rewards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (rewards ?? []).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Gift className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">No rewards defined yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Click "Add Reward" to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(rewards ?? []).map((reward) => {
            const DiscountIcon = getDiscountIcon(reward.discountType);
            return (
              <motion.div
                key={reward._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                  reward.active
                    ? "border-purple-200"
                    : "border-gray-200 opacity-60"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        reward.active
                          ? "bg-purple-100 text-purple-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <DiscountIcon className="h-5 w-5" />
                    </div>
                    <button
                      onClick={() => toggleActive(reward)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={reward.active ? "Disable" : "Enable"}
                    >
                      {reward.active ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <h3 className="font-bold text-lg">{reward.name}</h3>
                  {reward.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {reward.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        Discount
                      </span>
                      <p className="font-medium">{getDiscountLabel(reward)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        Cost
                      </span>
                      <p className="flex items-center gap-1 font-bold text-purple-600">
                        <Star className="h-4 w-4 fill-current" />
                        {reward.pointsCost}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    {reward.active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-500 hover:bg-gray-100"
                      >
                        Disabled
                      </Badge>
                    )}
                    <button
                      onClick={() => openEdit(reward)}
                      className="p-1.5 rounded text-secondary hover:bg-secondary/10"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(reward)}
                      className="p-1.5 rounded text-red-500 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Edit Reward" : "Add Reward"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Reward name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Free Coffee, 10% Off, Free Dessert"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Shown to customers at checkout..."
                rows={2}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsCost">Points cost *</Label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                <Input
                  id="pointsCost"
                  type="number"
                  min="1"
                  value={form.pointsCost}
                  onChange={(e) =>
                    setForm({ ...form, pointsCost: e.target.value })
                  }
                  className="pl-9"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Points required to redeem this reward
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      discountType: v as "fixed" | "percent" | "item",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (€)</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                    <SelectItem value="item">Free item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  {form.discountType === "fixed"
                    ? "Amount (€)"
                    : form.discountType === "percent"
                      ? "Percentage (%)"
                      : "Item ID"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  disabled={form.discountType === "item"}
                  placeholder={
                    form.discountType === "item" ? "Manual" : "0"
                  }
                />
              </div>
            </div>
            <label className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Active</Label>
                <p className="text-xs text-gray-500">
                  Disabled rewards are hidden from redemption UI
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
            <AlertDialogTitle>Delete reward?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong>. Customers who have
              already redeemed this reward will keep their discount. This
              action cannot be undone.
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
    </div>
  );
};

export default LoyaltyRewards;
