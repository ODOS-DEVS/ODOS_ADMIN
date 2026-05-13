import { Eye, EyeOff, MessageSquareText, RotateCcw, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getReviews, updateReviewModeration } from "@/api/reviewsApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { AdminReview } from "@/types";
import { formatDateTime } from "@/utils/format";

type VisibilityFilter = "all" | "visible" | "hidden";

type ModerationTarget = {
  review: AdminReview;
  nextHidden: boolean;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

function truncateComment(comment: string) {
  if (comment.length <= 120) {
    return comment;
  }
  return `${comment.slice(0, 117)}...`;
}

export function ReviewsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [moderationTarget, setModerationTarget] = useState<ModerationTarget | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!token) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getReviews(token);
      setReviews(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reviews.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchesVisibility =
        visibilityFilter === "all"
          ? true
          : visibilityFilter === "hidden"
            ? review.isHidden
            : !review.isHidden;
      if (!matchesVisibility) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        review.productName,
        review.storeName ?? "",
        review.userName,
        review.userEmail,
        review.orderNumber,
        review.comment,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, reviews, visibilityFilter]);

  const summary = useMemo(() => {
    const visibleCount = reviews.filter((review) => !review.isHidden).length;
    const hiddenCount = reviews.filter((review) => review.isHidden).length;
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    return {
      total: reviews.length,
      visibleCount,
      hiddenCount,
      averageRating,
    };
  }, [reviews]);

  async function handleModerationSave() {
    if (!token || !moderationTarget) {
      return;
    }

    setActionLoading(true);
    try {
      const updated = await updateReviewModeration(token, moderationTarget.review.id, {
        isHidden: moderationTarget.nextHidden,
        moderationReason,
      });
      setReviews((current) =>
        current.map((review) => (review.id === updated.id ? updated : review)),
      );
      setSelectedReview((current) => (current?.id === updated.id ? updated : current));
      showToast({
        title: moderationTarget.nextHidden ? "Review hidden" : "Review restored",
        description: moderationTarget.nextHidden
          ? "This review is now removed from shopper-facing product pages."
          : "This review is visible again on shopper-facing product pages.",
        tone: "success",
      });
      setModerationTarget(null);
      setModerationReason("");
    } catch (updateError) {
      showToast({
        title: "Unable to update review",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openModeration(review: AdminReview, nextHidden: boolean) {
    setModerationTarget({ review, nextHidden });
    setModerationReason(nextHidden ? review.moderationReason ?? "" : "");
  }

  if (isLoading) {
    return <LoadingState label="Loading customer reviews..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadReviews()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reviews"
        title="Review moderation"
        description="Keep shopper feedback trustworthy by reviewing what is public, what has been hidden, and why moderation decisions were made."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Total reviews</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.total}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Visible to shoppers</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.visibleCount}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Average rating</p>
          <p className="mt-3 flex items-center gap-2 text-3xl font-semibold text-textStrong">
            <Star className="size-5 text-accent" />
            {summary.averageRating.toFixed(1)}
          </p>
        </div>
      </div>

      <SectionCard
        title="Customer reviews"
        description="Search by product, shopper, order, store, or comment. Hide reviews that should not appear on public product pages."
        action={
          <div className="flex flex-col gap-3 xl:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, shopper, order, or comment"
              className="xl:w-96"
            />
            <FilterSelect
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
              options={[
                { label: "All reviews", value: "all" },
                { label: "Visible only", value: "visible" },
                { label: "Hidden only", value: "hidden" },
              ]}
            />
          </div>
        }
      >
        {filteredReviews.length === 0 ? (
          <EmptyState
            title="No reviews found"
            description="Try a different search or switch the visibility filter."
          />
        ) : (
          <DataTable<AdminReview>
            columns={[
              {
                key: "product",
                header: "Product",
                render: (review) => (
                  <div>
                    <p className="font-medium">{review.productName}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {review.storeName ?? "ODOS store"} · {review.orderNumber}
                    </p>
                  </div>
                ),
              },
              {
                key: "shopper",
                header: "Shopper",
                render: (review) => (
                  <div>
                    <p className="font-medium">{review.userName}</p>
                    <p className="mt-1 text-xs text-textMuted">{review.userEmail}</p>
                  </div>
                ),
              },
              {
                key: "rating",
                header: "Rating",
                render: (review) => (
                  <div className="flex items-center gap-2">
                    <Star className="size-4 text-accent" />
                    <span>{review.rating.toFixed(1)}</span>
                  </div>
                ),
              },
              {
                key: "comment",
                header: "Comment",
                render: (review) => (
                  <div className="max-w-sm">
                    <p>{truncateComment(review.comment)}</p>
                    {review.isHidden && review.moderationReason ? (
                      <p className="mt-2 text-xs text-textMuted">
                        Note: {review.moderationReason}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (review) => (
                  <StatusBadge status={review.isHidden ? "hidden" : "visible"} />
                ),
              },
              {
                key: "created",
                header: "Submitted",
                render: (review) => formatDateTime(review.createdAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (review) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => setSelectedReview(review)}
                    >
                      View
                    </Button>
                    <Button
                      variant={review.isHidden ? "secondary" : "danger"}
                      leftIcon={
                        review.isHidden ? (
                          <RotateCcw className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )
                      }
                      onClick={() => openModeration(review, !review.isHidden)}
                    >
                      {review.isHidden ? "Restore" : "Hide"}
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredReviews}
            keyExtractor={(review) => review.id}
          />
        )}
      </SectionCard>

      <Modal
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        title={selectedReview?.productName ?? "Review details"}
        description="Inspect the shopper, order context, rating, and moderation state for this review."
      >
        {selectedReview ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Shopper" value={selectedReview.userName} />
              <DetailRow label="Email" value={selectedReview.userEmail} />
              <DetailRow label="Store" value={selectedReview.storeName ?? "ODOS store"} />
              <DetailRow label="Order" value={selectedReview.orderNumber} />
              <DetailRow label="Rating" value={`${selectedReview.rating.toFixed(1)} / 5`} />
              <DetailRow
                label="Status"
                value={selectedReview.isHidden ? "Hidden from shoppers" : "Visible to shoppers"}
              />
              <DetailRow label="Created" value={formatDateTime(selectedReview.createdAt)} />
              <DetailRow label="Updated" value={formatDateTime(selectedReview.updatedAt)} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Comment</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-textStrong">
                {selectedReview.comment}
              </p>
            </div>

            {selectedReview.moderationReason ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Moderation note</p>
                <p className="mt-3 text-sm text-textStrong">{selectedReview.moderationReason}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(moderationTarget)}
        onClose={() => {
          if (!actionLoading) {
            setModerationTarget(null);
            setModerationReason("");
          }
        }}
        title={
          moderationTarget?.nextHidden
            ? `Hide ${moderationTarget.review.productName}`
            : `Restore ${moderationTarget?.review.productName ?? "review"}`
        }
        description={
          moderationTarget?.nextHidden
            ? "This removes the review from shopper-facing product pages and from public product rating calculations."
            : "This makes the review visible again on shopper-facing product pages."
        }
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              disabled={actionLoading}
              onClick={() => {
                setModerationTarget(null);
                setModerationReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={moderationTarget?.nextHidden ? "danger" : "primary"}
              isLoading={actionLoading}
              onClick={() => void handleModerationSave()}
            >
              {moderationTarget?.nextHidden ? "Hide review" : "Restore review"}
            </Button>
          </div>
        }
      >
        {moderationTarget ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 size-4 text-accentSoft" />
                <div>
                  <p className="font-medium text-textStrong">{moderationTarget.review.userName}</p>
                  <p className="mt-2 text-sm leading-6 text-textMuted">
                    {moderationTarget.review.comment}
                  </p>
                </div>
              </div>
            </div>

            {moderationTarget.nextHidden ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-textStrong">
                  Internal moderation note
                </label>
                <textarea
                  className="app-textarea min-h-[120px]"
                  placeholder="Optional note about why this review was hidden."
                  value={moderationReason}
                  onChange={(event) => setModerationReason(event.target.value)}
                />
                <p className="text-xs text-textMuted">
                  This note is for the ODOS team. It does not appear to shoppers.
                </p>
              </div>
            ) : moderationTarget.review.moderationReason ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-textMuted">
                Existing moderation note:{" "}
                <span className="text-textStrong">
                  {moderationTarget.review.moderationReason}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
