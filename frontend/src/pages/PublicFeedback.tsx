import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { submitFeedback } from "@/services/feedbackService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const StarRating = ({
  value,
  onChange,
  size = "text-4xl",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={cn(
          "transition-all hover:scale-110",
          size,
          star <= value ? "text-amber-400" : "text-gray-200",
        )}
      >
        ★
      </button>
    ))}
  </div>
);

const PublicFeedback = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [rating, setRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Prosimo, ocenite vašo izkušnjo");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitFeedback({
        orderId: orderId!,
        rating,
        foodRating: foodRating || undefined,
        serviceRating: serviceRating || undefined,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Napaka pri oddaji",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
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
          <h1 className="text-2xl font-bold mb-2">Hvala!</h1>
          <p className="text-gray-600 mb-6">
            Vaša povratna informacija nam pomaka izboljšati storitev.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-orange-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazaj na meni
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-12">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Ocenite izkušnjo</h1>
            <p className="text-xs text-gray-500">Vaše mnenje nas zanima</p>
          </div>
          <Link
            to={`/public/order/${orderId}`}
            className="text-sm text-orange-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazaj
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Overall rating */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Kako bi ocenili vašo izkušnjo?
            </p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Food quality */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Kakovost hrane
            </p>
            <StarRating value={foodRating} onChange={setFoodRating} size="text-2xl" />
          </div>

          {/* Service speed */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Hitrost strežbe
            </p>
            <StarRating value={serviceRating} onChange={setServiceRating} size="text-2xl" />
          </div>

          {/* Comment */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Komentar (neobvezno)
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Povejte nam več o vaši izkušnji..."
              rows={3}
              maxLength={500}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-orange-600 hover:bg-orange-700 gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" />
            )}
            Oddaj oceno
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicFeedback;
