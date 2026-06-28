import { useState, FormEvent, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Edit,
  Trash,
  MapPin,
  Building2,
  Phone,
  Mail,
  Hash,
  Coins,
  ToggleLeft,
  ToggleRight,
  Check,
  ArrowLeft,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useActiveLocation,
} from "@/services/locationService";
import { Location } from "@/types";
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

interface LocationForm {
  _id?: string;
  name: string;
  code: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  taxNumber: string;
  businessPremiseId: string;
  defaultTaxRate: string;
  currency: string;
  active: boolean;
  timezone: string;
  notes: string;
}

const EMPTY_FORM: LocationForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  postalCode: "",
  phone: "",
  email: "",
  taxNumber: "",
  businessPremiseId: "",
  defaultTaxRate: "22",
  currency: "EUR",
  active: true,
  timezone: "Europe/Ljubljana",
  notes: "",
};

const Locations = () => {
  const { data: locations, isLoading } = useFetchLocations();
  const { mutateAsync: createLocation } = useCreateLocation();
  const { mutateAsync: updateLocation } = useUpdateLocation();
  const { mutateAsync: deleteLocation } = useDeleteLocation();
  const { activeLocationId, setActiveLocationId } = useActiveLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<LocationForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const activeCount = (locations ?? []).filter((l) => l.active).length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (location: Location) => {
    setForm({
      _id: location._id,
      name: location.name ?? "",
      code: location.code ?? "",
      address: location.address ?? "",
      city: location.city ?? "",
      postalCode: location.postalCode ?? "",
      phone: location.phone ?? "",
      email: location.email ?? "",
      taxNumber: location.taxNumber ?? "",
      businessPremiseId: location.businessPremiseId ?? "",
      defaultTaxRate: String(location.defaultTaxRate ?? 22),
      currency: location.currency ?? "EUR",
      active: location.active ?? true,
      timezone: location.timezone ?? "Europe/Ljubljana",
      notes: location.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Ime lokacije je obvezno");
      return;
    }
    if (!form.code.trim()) {
      toast.error("Koda lokacije je obvezna");
      return;
    }
    if (!form.taxNumber.trim() || form.taxNumber.trim().length < 8) {
      toast.error("Davčna številka mora imeti vsaj 8 znakov");
      return;
    }

    const payload: Partial<Location> = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      address: form.address.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      taxNumber: form.taxNumber.trim(),
      businessPremiseId: form.businessPremiseId.trim().toUpperCase(),
      defaultTaxRate: parseFloat(form.defaultTaxRate) || 22,
      currency: form.currency,
      active: form.active,
      timezone: form.timezone,
      notes: form.notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateLocation({ ...payload, _id: form._id });
        toast.success(`Lokacija posodobljena: ${form.name}`);
      } else {
        const created = await createLocation(payload);
        toast.success(`Lokacija ustvarjena: ${form.name}`);
        // Auto-select the first location if none is active
        if (!activeLocationId && created?._id) {
          setActiveLocationId(created._id);
        }
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
    if ((locations ?? []).length <= 1) {
      toast.error("Brisanje zadnje lokacije ni dovoljeno");
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteLocation(deleteTarget._id);
      toast.success(`Lokacija izbrisana: ${deleteTarget.name}`);
      // If we deleted the active location, switch to the first remaining
      if (activeLocationId === deleteTarget._id) {
        const remaining = (locations ?? []).filter(
          (l) => l._id !== deleteTarget._id,
        );
        if (remaining.length > 0) {
          setActiveLocationId(remaining[0]._id ?? null);
        }
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const toggleActive = async (location: Location) => {
    try {
      await updateLocation({
        _id: location._id,
        active: !location.active,
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
            <Store className="h-6 w-6 text-secondary" />
            Lokacije
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upravljajte več lokacij restavracije (chain management)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Nova lokacija
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-medium flex items-center gap-2 mb-1">
          <Store className="h-4 w-4" />
          Kako deluje multi-location?
        </p>
        <ul className="list-disc pl-5 space-y-0.5 text-xs">
          <li>Vsaka lokacija ima svoje mize, menije, zalogo, naročila</li>
          <li>V header-ju preklopite aktivno lokacijo (dropdown zgoraj desno)</li>
          <li>Vsi podatki se filtrirajo po aktivni lokaciji</li>
          <li>
            FURS: vsaka lokacija mora biti registrirana posebej pri FURS-u
            (lastna businessPremiseId + davčna številka)
          </li>
          <li>Reports stran prikazuje skupne statuse za vse lokacije</li>
        </ul>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox
          label="Skupno lokacij"
          value={locations?.length ?? 0}
          color="text-gray-700"
        />
        <StatBox
          label="Aktivne"
          value={activeCount}
          color="text-green-600"
        />
        <StatBox
          label="Neaktivne"
          value={(locations?.length ?? 0) - activeCount}
          color="text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime</TableHead>
                  <TableHead>Koda</TableHead>
                  <TableHead>Naslov</TableHead>
                  <TableHead>Davčna št.</TableHead>
                  <TableHead>FURS premise</TableHead>
                  <TableHead>Valuta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(locations ?? []).map((loc) => {
                  const isActiveLocation = loc._id === activeLocationId;
                  return (
                    <TableRow key={loc._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium">{loc.name}</p>
                            {isActiveLocation && (
                              <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/10 text-xs">
                                <Check className="h-2.5 w-2.5 mr-0.5" />
                                Aktivna
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {loc.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>
                            {loc.address}, {loc.postalCode} {loc.city}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {loc.taxNumber}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {loc.businessPremiseId || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {loc.currency}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActive(loc)}
                          className="p-1"
                          title={loc.active ? "Deaktiviraj" : "Aktiviraj"}
                        >
                          {loc.active ? (
                            <ToggleRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isActiveLocation && loc.active && (
                            <button
                              onClick={() =>
                                setActiveLocationId(loc._id ?? null)
                              }
                              className="px-2 py-1 text-xs rounded text-secondary border border-secondary/30 hover:bg-secondary/10"
                              title="Nastavi kot aktivno"
                            >
                              Aktiven
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(loc)}
                            className="p-1.5 rounded text-secondary hover:bg-secondary/10"
                            aria-label="Uredi"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(loc)}
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
                {(!locations || locations.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-gray-500"
                    >
                      <Store className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Ni lokacij.</p>
                      <p className="text-sm">
                        Ustvarite prvo lokacijo za začetek.
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Uredi lokacijo" : "Nova lokacija"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Osnovni podatki
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Ime *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Noro Lep Center"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Koda *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="CENTER"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Naslov
              </h3>
              <div className="space-y-2">
                <Label htmlFor="address">Ulica in hišna številka</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Slovenska cesta 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Poštna številka</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Mesto</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                    placeholder="Ljubljana"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Kontakt
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="01 234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="center@norolep.si"
                  />
                </div>
              </div>
            </div>

            {/* Fiscal */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Fiskalni podatki
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Davčna številka *</Label>
                  <Input
                    id="taxNumber"
                    value={form.taxNumber}
                    onChange={(e) =>
                      setForm({ ...form, taxNumber: e.target.value })
                    }
                    placeholder="SI12345678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPremiseId">FURS business premise ID</Label>
                  <Input
                    id="businessPremiseId"
                    value={form.businessPremiseId}
                    onChange={(e) =>
                      setForm({ ...form, businessPremiseId: e.target.value })
                    }
                    placeholder="PRE"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Nastavitve
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate">Privzeti DDV %</Label>
                  <Select
                    value={form.defaultTaxRate}
                    onValueChange={(v) =>
                      setForm({ ...form, defaultTaxRate: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22">22%</SelectItem>
                      <SelectItem value="9.5">9.5%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Valuta</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) =>
                      setForm({ ...form, currency: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Časovni pas</Label>
                  <Input
                    id="timezone"
                    value={form.timezone}
                    onChange={(e) =>
                      setForm({ ...form, timezone: e.target.value })
                    }
                    placeholder="Europe/Ljubljana"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Opombe</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Delovni čas, posebnosti..."
                rows={2}
                maxLength={500}
              />
            </div>

            <label className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Aktivna</Label>
                <p className="text-xs text-gray-500">
                  Neaktivne lokacije so skrite v preklopniku
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
            <AlertDialogTitle>Izbriši lokacijo?</AlertDialogTitle>
            <AlertDialogDescription>
              Lokacija <strong>{deleteTarget?.name}</strong> bo izbrisana.
              Zgodovinski podatki (naročila, računi) ostanejo, a se ne bodo
              več prikazovali v nobeni aktivni lokaciji.
              {(locations ?? []).length <= 1 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Opomba: to je zadnja lokacija — brisanje ni priporočljivo.
                </span>
              )}
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

export default Locations;
