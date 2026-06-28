import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Star,
  Award,
  Gift,
  Loader2,
  Check,
  X,
  User,
} from "lucide-react";
import { useFetchCustomerByPhone } from "@/services/customerService";
import { useFetchActiveLoyaltyRewards } from "@/services/loyaltyService";
import { Customer, LoyaltyReward } from "@/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LoyaltyPhoneInputProps {
  /** Called when a customer is identified (or null if cleared). */
  onCustomerChange: (customer: Customer | null) => void;
  /** Called when a reward is selected for redemption (or null if none). */
  onRewardSelect: (reward: LoyaltyReward | null) => void;
  /** Current cart total (for discount calculation context). */
  cartTotal: number;
}

/**
 * Loyalty phone input component for the POS checkout.
 *
 * Flow:
 *   1. Cashier enters the customer's phone number
 *   2. Component looks up the customer (debounced)
 *   3. If found: shows points balance + available rewards
 *   4. Cashier can select a reward to apply at checkout
 *   5. Points for this order will be earned after checkout completes
 *
 * If the phone number is not found, the cashier can create a new
 * customer on the fly (handled by parent via find-or-create).
 */
const LoyaltyPhoneInput = ({
  onCustomerChange,
  onRewardSelect,
  cartTotal,
}: LoyaltyPhoneInputProps) => {
  const [phone, setPhone] = useState("");
  const [debouncedPhone, setDebouncedPhone] = useState("");
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  // Debounce phone input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPhone(phone.trim().length >= 6 ? phone.trim() : "");
    }, 400);
    return () => clearTimeout(timer);
  }, [phone]);

  const { data: customers, isLoading } = useFetchCustomerByPhone(
    debouncedPhone || undefined,
  );
  const { data: rewards } = useFetchActiveLoyaltyRewards();

  const customer = customers?.[0] ?? null;

  // Notify parent when customer changes
  useEffect(() => {
    onCustomerChange(customer);
  }, [customer, onCustomerChange]);

  // Notify parent when reward selection changes
  useEffect(() => {
    const reward = rewards?.find((r) => r._id === selectedRewardId) ?? null;
    onRewardSelect(reward);
  }, [selectedRewardId, rewards, onRewardSelect]);

  const handleClear = () => {
    setPhone("");
    setSelectedRewardId(null);
    onCustomerChange(null);
    onRewardSelect(null);
  };

  const canRedeem = (reward: LoyaltyReward): boolean => {
    if (!customer) return false;
    return (customer.points ?? 0) >= reward.pointsCost;
  };

  return (
    <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-900">
          Loyalty Program
        </span>
      </div>

      {/* Phone input */}
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Customer phone number..."
          className="pl-9 pr-9 bg-white"
        />
        {phone && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Customer found */}
      <AnimatePresence>
        {customer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {customer.visits ?? 0} visits · €
                      {(customer.totalSpent ?? 0).toFixed(2)} spent
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1 font-bold text-purple-600">
                    <Star className="h-4 w-4 fill-current" />
                    {customer.points ?? 0}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>

              {/* Will earn indicator */}
              {cartTotal > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 flex items-center gap-1.5">
                  <Gift className="h-3 w-3 text-green-600" />
                  Will earn{" "}
                  <strong className="text-green-600">
                    +{Math.floor(cartTotal)} points
                  </strong>{" "}
                  on this order
                </div>
              )}
            </div>

            {/* Available rewards */}
            {rewards && rewards.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  Redeem a reward (optional):
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {rewards.map((reward) => {
                    const redeemable = canRedeem(reward);
                    const isSelected = selectedRewardId === reward._id;
                    return (
                      <button
                        key={reward._id}
                        type="button"
                        disabled={!redeemable}
                        onClick={() =>
                          setSelectedRewardId(
                            isSelected ? null : reward._id ?? null,
                          )
                        }
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all",
                          isSelected
                            ? "border-purple-500 bg-purple-100"
                            : redeemable
                              ? "border-gray-200 bg-white hover:border-purple-300"
                              : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-purple-600" />
                          )}
                          <div className="text-left">
                            <p className="font-medium">{reward.name}</p>
                            <p className="text-xs text-gray-500">
                              {reward.discountType === "fixed"
                                ? `€${reward.discountValue.toFixed(2)} off`
                                : reward.discountType === "percent"
                                  ? `${reward.discountValue}% off`
                                  : "Free item"}
                            </p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-purple-600">
                          <Star className="h-3 w-3 fill-current" />
                          {reward.pointsCost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not found message */}
      {debouncedPhone && !customer && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500 italic"
        >
          No member found for {debouncedPhone}. A new profile will be
          created at checkout.
        </motion.div>
      )}
    </div>
  );
};

export default LoyaltyPhoneInput;
