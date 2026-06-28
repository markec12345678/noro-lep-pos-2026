import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Star,
  Award,
  Gift,
  Loader2,
  ArrowLeft,
  TrendingUp,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Customer, LoyaltyReward } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (epoch?: number) => {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Public loyalty balance check page.
 *
 * Guests visit /public/loyalty, enter their phone number, and see
 * their points balance + available rewards. No authentication required.
 *
 * This page is intentionally separate from the public menu so guests
 * can check their balance without placing an order.
 */
const PublicLoyalty = () => {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 6) {
      setError("Vnesite veljavno telefonsko številko");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCustomer(null);
    setRewards([]);

    try {
      // Call the pos-public mini-service (no auth required)
      // Phone is URL-encoded to handle special characters
      const response = await fetch(
        `/api/public/loyalty/${encodeURIComponent(phone.trim())}?XTransformPort=3005`,
      );
      if (response.status === 404) {
        setError(
          "Vaše telefonske številke ni v naši bazi. Naslednjič, ko boste naročili, vnesite svojo številko in samodejno se boste pridružili.",
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Napaka (${response.status})`);
      }
      const data = await response.json();
      setCustomer(data.customer);
      setRewards(data.rewards ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Napaka pri iskanju. Poskusite kasneje.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const availableRewards = rewards.filter(
    (r) => (customer?.points ?? 0) >= r.pointsCost,
  );
  const nextReward = rewards.find(
    (r) => (customer?.points ?? 0) < r.pointsCost,
  );
  const pointsToNext = nextReward
    ? nextReward.pointsCost - (customer?.points ?? 0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Zvestobni program
            </h1>
            <p className="text-xs text-gray-500">
              Preverite stanje svojih točk
            </p>
          </div>
          <Link
            to="/"
            className="text-sm text-purple-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Meni
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Phone input form */}
        {!customer && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleLookup}
            className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
          >
            <div className="text-center mb-2">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Star className="h-8 w-8 text-purple-600 fill-current" />
              </div>
              <h2 className="font-bold text-lg">Pridružite se nagradam</h2>
              <p className="text-sm text-gray-500 mt-1">
                Za vsak evro, ki ga porabite, prejmete 1 točko. Zberite
                točke in jih zamenjajte za nagrade.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                Telefonska številka
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="031 234 567"
                className="text-lg"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || phone.length < 6}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iskanje...
                </>
              ) : (
                "Preveri stanje"
              )}
            </Button>
          </motion.form>
        )}

        {/* Customer dashboard */}
        {customer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Points balance card */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-sm opacity-90">Vaše točke</p>
              <p className="text-5xl font-bold mt-1 mb-2">
                {customer.points ?? 0}
              </p>
              <p className="text-sm opacity-90">
                Pozdravljeni, {customer.name}!
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                <p className="text-lg font-bold">
                  {customer.lifetimePoints ?? 0}
                </p>
                <p className="text-xs text-gray-500">Skupaj točk</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <ShoppingBag className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold">{customer.visits ?? 0}</p>
                <p className="text-xs text-gray-500">Obiskov</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-lg font-bold">
                  {formatCurrency(customer.totalSpent ?? 0)}
                </p>
                <p className="text-xs text-gray-500">Porabljeno</p>
              </div>
            </div>

            {/* Member since */}
            <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-gray-600 text-center">
              <Calendar className="h-4 w-4 inline mr-1 text-gray-400" />
              Član od {formatDate(customer.firstVisitAt)}
              {customer.lastVisitAt && (
                <>
                  {" · "}
                  zadnji obisk {formatDate(customer.lastVisitAt)}
                </>
              )}
            </div>

            {/* Next reward progress */}
            {nextReward && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Do naslednje nagrade
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{nextReward.name}</span>
                  <span className="text-sm font-medium text-purple-600">
                    še {pointsToNext} točk
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((customer.points ?? 0) / nextReward.pointsCost) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Available rewards */}
            {rewards.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                  <Gift className="h-4 w-4 text-purple-600" />
                  Razpoložljive nagrade
                </p>
                <div className="space-y-2">
                  {rewards.map((reward) => {
                    const canRedeem =
                      (customer.points ?? 0) >= reward.pointsCost;
                    return (
                      <div
                        key={reward._id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          canRedeem
                            ? "border-purple-200 bg-purple-50/50"
                            : "border-gray-100 opacity-60"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{reward.name}</p>
                          {reward.description && (
                            <p className="text-xs text-gray-500">
                              {reward.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {reward.discountType === "fixed"
                              ? `€${reward.discountValue.toFixed(2)} popust`
                              : reward.discountType === "percent"
                                ? `${reward.discountValue}% popust`
                                : "Brezplačna jed"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 font-bold">
                          <Star className="h-4 w-4 fill-current" />
                          {reward.pointsCost}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Nagrade lahko unovčite pri naslednjem naročilu v restavraciji.
                </p>
              </div>
            )}

            {availableRewards.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm text-green-700 font-medium">
                  🎉 Imate {availableRewards.length} razpoložljivih nagrad!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Pri naslednjem obisku vprašajte natakarja za unovčitev.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setCustomer(null);
                setPhone("");
              }}
              className="w-full"
            >
              Preveri drugo številko
            </Button>
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Vprašanja? Obvestite natakarja.
        </p>
      </div>
    </div>
  );
};

export default PublicLoyalty;
