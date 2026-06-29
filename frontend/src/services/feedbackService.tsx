// services/feedbackService
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feedback, FeedbackSummary, LinkModelType } from "@/types";
import { fetcher, round2 } from "@/lib/helper";
import { emitPosEvent } from "@/hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL;
const PUBLIC_API_BASE = "/api/public";

/* ------------------------------------------------------------------ */
/* Feedback CRUD (authenticated — manager)                             */
/* ------------------------------------------------------------------ */

export const useFetchFeedback = () =>
  useQuery<Feedback[]>({
    queryKey: ["feedback"],
    queryFn: () =>
      fetcher<Feedback[]>(
        `${API_URL}/api/content/items/feedback?populate=1&sort={_created:-1}&limit=200`,
      ),
  });

export const useUpdateFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fb: Partial<Feedback>) =>
      fetcher<Feedback>(`${API_URL}/api/content/item/feedback`, {
        method: "POST",
        body: JSON.stringify({ data: fb }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });
};

export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/api/content/item/feedback/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Public feedback submission (no auth — guest)                        */
/* ------------------------------------------------------------------ */

export interface SubmitFeedbackInput {
  orderId: string;
  rating: number;
  foodRating?: number;
  serviceRating?: number;
  comment?: string;
}

export const submitFeedback = async (
  input: SubmitFeedbackInput,
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(
    `${PUBLIC_API_BASE}/feedback?XTransformPort=3005`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error ?? `Failed (${response.status})`);
  }
  return response.json();
};

/* ------------------------------------------------------------------ */
/* Aggregation helpers                                                 */
/* ------------------------------------------------------------------ */

export const buildFeedbackSummary = (
  feedback: Feedback[] | undefined,
): FeedbackSummary => {
  if (!feedback || feedback.length === 0) {
    return {
      totalFeedback: 0,
      averageRating: 0,
      averageFoodRating: 0,
      averageServiceRating: 0,
      distribution: [1, 2, 3, 4, 5].map((stars) => ({
        stars,
        count: 0,
        percentage: 0,
      })),
      recentComments: [],
    };
  }

  const total = feedback.length;
  const avgRating = round2(
    feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / total,
  );
  const foodRatings = feedback.filter((f) => f.foodRating != null);
  const serviceRatings = feedback.filter((f) => f.serviceRating != null);
  const avgFood = foodRatings.length > 0
    ? round2(foodRatings.reduce((s, f) => s + (f.foodRating ?? 0), 0) / foodRatings.length)
    : 0;
  const avgService = serviceRatings.length > 0
    ? round2(serviceRatings.reduce((s, f) => s + (f.serviceRating ?? 0), 0) / serviceRatings.length)
    : 0;

  const distribution = [1, 2, 3, 4, 5].map((stars) => {
    const count = feedback.filter((f) => f.rating === stars).length;
    return {
      stars,
      count,
      percentage: total > 0 ? round2((count / total) * 100) : 0,
    };
  });

  const recentComments = feedback
    .filter((f) => f.comment && f.comment.trim().length > 0)
    .slice(0, 10)
    .map((f) => ({
      _id: f._id ?? "",
      guestName: f.guestName,
      rating: f.rating ?? 0,
      comment: f.comment,
      tableNumber: f.tableNumber,
      created: (f._created ?? 0) * 1000,
    }));

  return {
    totalFeedback: total,
    averageRating: avgRating,
    averageFoodRating: avgFood,
    averageServiceRating: avgService,
    distribution,
    recentComments,
  };
};

/* ------------------------------------------------------------------ */
/* Star rendering helper                                                */
/* ------------------------------------------------------------------ */

export const renderStars = (rating: number, size: "sm" | "md" | "lg" = "sm") => {
  const sizeClass = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";
  return (
    <span className={`${sizeClass} text-amber-400`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-gray-200">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
};
