import { useState, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  User,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useFetchReservationSlots,
  createPublicReservation,
} from "@/services/reservationService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formatDateLong = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const today = new Date().toISOString().slice(0, 10);
const maxDate = new Date();
maxDate.setDate(maxDate.getDate() + 60);
const maxDateStr = maxDate.toISOString().slice(0, 10);

interface BookingForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  partySize: string;
  notes: string;
}

const EMPTY_FORM: BookingForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  date: today,
  time: "",
  partySize: "2",
  notes: "",
};

const PublicReservation = () => {
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    confirmationCode: string;
    date: string;
    time: string;
    partySize: number;
    customerName: string;
  } | null>(null);

  const partySizeNum = parseInt(form.partySize, 10) || 1;
  const { data: slotsData, isLoading: slotsLoading } =
    useFetchReservationSlots(form.date, partySizeNum);

  const availableSlots = useMemo(() => {
    return (slotsData?.slots ?? []).filter((s) => s.available);
  }, [slotsData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      toast.error("Vnesite ime");
      return;
    }
    if (form.customerPhone.trim().length < 6) {
      toast.error("Vnesite veljavno telefonsko številko");
      return;
    }
    if (!form.time) {
      toast.error("Izberite čas");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPublicReservation({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        date: form.date,
        time: form.time,
        partySize: partySizeNum,
        notes: form.notes.trim() || undefined,
      });
      setConfirmation({
        confirmationCode: result.confirmationCode,
        date: result.date,
        time: result.time,
        partySize: result.partySize,
        customerName: form.customerName,
      });
      toast.success("Rezervacija poslana!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Napaka pri rezervaciji",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation screen
  if (confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Rezervacija prejeta!
          </h1>
          <p className="text-gray-600 mb-6">
            Hvala, {confirmation.customerName}. Vaša rezervacija čaka na
            potrditev. Poklicali vas bomo čim prej.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Datum:</span>
              <span className="font-medium capitalize">
                {formatDateLong(confirmation.date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Čas:</span>
              <span className="font-medium">{confirmation.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Število oseb:</span>
              <span className="font-medium">{confirmation.partySize}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-500">Potrditvena koda:</span>
              <span className="font-mono font-bold text-blue-600">
                {confirmation.confirmationCode}
              </span>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <p>
              Shrani potrditveno kodo. Če želite spremeniti ali preklicati
              rezervacijo, nas pokličite in navedite kodo.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazaj na meni
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Rezervacija mize
            </h1>
            <p className="text-xs text-gray-500">
              Rezervirajte svojo mizo v nekaj korakih
            </p>
          </div>
          <Link
            to="/"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Meni
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm p-6 space-y-5"
        >
          {/* Date picker */}
          <div className="space-y-2">
            <Label icon={Calendar}>Datum</Label>
            <Input
              type="date"
              value={form.date}
              min={today}
              max={maxDateStr}
              onChange={(e) => {
                setForm({ ...form, date: e.target.value, time: "" });
              }}
              required
            />
          </div>

          {/* Party size */}
          <div className="space-y-2">
            <Label icon={Users}>Število oseb</Label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, partySize: String(n) })}
                  className={`h-10 w-10 rounded-full border text-sm font-medium transition-all ${
                    form.partySize === String(n)
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min="9"
                max="20"
                value={
                  parseInt(form.partySize, 10) > 8 ? form.partySize : ""
                }
                onChange={(e) =>
                  setForm({ ...form, partySize: e.target.value || "2" })
                }
                placeholder="9+"
                className="w-16 h-10 rounded-full border border-gray-200 text-center text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {parseInt(form.partySize, 10) > 8 && (
              <p className="text-xs text-amber-600">
                Za skupine nad 8 oseb vas bomo poklicali za potrditev.
              </p>
            )}
          </div>

          {/* Time slot picker */}
          <div className="space-y-2">
            <Label icon={Clock}>Termin</Label>
            {slotsLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">
                Ni prostih terminov za izbrani dan.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setForm({ ...form, time: slot.time })}
                    className={`h-10 rounded-lg border text-sm font-medium transition-all ${
                      form.time === slot.time
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium text-gray-700">
              Vaši podatki
            </p>
            <div className="space-y-2">
              <Label icon={User} small>
                Ime in priimek *
              </Label>
              <Input
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="Janez Novak"
                required
              />
            </div>
            <div className="space-y-2">
              <Label icon={Phone} small>
                Telefon *
              </Label>
              <Input
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
              <Label icon={Mail} small>
                Email (neobvezno)
              </Label>
              <Input
                type="email"
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
                placeholder="janez@email.com"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label small>Opombe (neobvezno)</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Otroški stol, alergije, priložnost..."
              rows={2}
              maxLength={300}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !form.time ||
              !form.customerName ||
              form.customerPhone.length < 6
            }
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pošiljam...
              </>
            ) : (
              "Rezerviraj"
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Rezervacija je predhodna — poklicali vas bomo za potrditev.
          </p>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Small label component                                               */
/* ------------------------------------------------------------------ */

const Label = ({
  children,
  icon: Icon,
  small,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
  small?: boolean;
}) => (
  <label
    className={`flex items-center gap-1.5 ${small ? "text-xs" : "text-sm"} font-medium text-gray-700`}
  >
    {Icon && <Icon className={small ? "h-3 w-3" : "h-4 w-4"} />}
    {children}
  </label>
);

export default PublicReservation;
