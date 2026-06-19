import { mapAdminReview } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";
import type { AdminReview } from "@/types";

type BackendAdminReview = {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  store_name?: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  is_hidden: boolean;
  moderation_reason?: string | null;
  moderated_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewModerationInput = {
  isHidden: boolean;
  moderationReason?: string | null;
};

const reviewsListApi = createPaginatedAdminApi<BackendAdminReview, AdminReview>({
  path: "/admin/reviews",
  mapItem: mapAdminReview,
});

export const getReviewsPage = reviewsListApi.getPage;
export const getReviews = reviewsListApi.getAll;

export async function updateReviewModeration(
  token: string,
  reviewId: string,
  input: ReviewModerationInput,
) {
  const review = await requestJson<BackendAdminReview>(
    `/admin/reviews/${reviewId}/moderation`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({
        is_hidden: input.isHidden,
        moderation_reason: input.moderationReason?.trim() || null,
      }),
    },
  );
  return mapAdminReview(review);
}
