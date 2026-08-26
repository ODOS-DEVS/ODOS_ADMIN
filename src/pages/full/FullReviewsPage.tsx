import { ArrowRight, Eye, EyeOff, MessageSquareText, RotateCcw, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getReviewsPage, updateReviewModeration } from "@/api/reviewsApi";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { DetailField, DetailFields, DetailSection, DetailStack } from "@/components/ui/DetailList";
import { Modal } from "@/components/ui/Modal";
import { DirectoryPage } from "@/components/directory/DirectoryPage";
import type { DirectoryColumn } from "@/components/directory/DirectoryTable";
import { StatePill } from "@/components/directory/StatePill";
import {
  TABLE_ACTIONS_COLUMN_CLASS_WIDE,
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { AdminReview } from "@/types";
import { formatDateTime } from "@/utils/format";

type VisibilityFilter = "all" | "visible" | "hidden";

type ModerationTarget = {
  review: AdminReview;
  nextHidden: boolean;
};

function truncateComment(comment: string) {
  if (comment.length <= 120) {
    return comment;
  }
  return `${comment.slice(0, 117)}...`;
}

export function FullReviewsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: reviews,
    isLoading,
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getReviewsPage,
    getId: (review) => review.id,
  });
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [moderationTarget, setModerationTarget] = useState<ModerationTarget | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
      replaceItem(updated);
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

  const columns = useMemo<Array<DirectoryColumn<AdminReview>>>(
    () => [
      {
        key: "product",
        header: "Product",
        sortable: true,
        className: "min-w-[13rem] max-w-[18rem]",
        render: (review) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-textStrong">{review.productName}</p>
            <p className="truncate text-xs text-textMuted">
              {review.storeName ?? "ODOS store"} · {review.orderNumber}
            </p>
          </div>
        ),
      },
      {
        key: "shopper",
        header: "Shopper",
        className: "min-w-[11rem] max-w-[15rem]",
        render: (review) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-textStrong">{review.userName}</p>
            <p className="truncate text-xs text-textMuted">{review.userEmail}</p>
          </div>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        sortable: true,
        className: "w-[6rem]",
        render: (review) => (
          <div className="flex items-center gap-1.5">
            <Star className="size-4 fill-amber-300 text-amber-300" aria-hidden />
            <span className="font-semibold tabular-nums text-textStrong">
              {review.rating.toFixed(1)}
            </span>
          </div>
        ),
      },
      {
        key: "comment",
        header: "Comment",
        className: "min-w-[15rem] max-w-[22rem]",
        render: (review) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-textBody">{truncateComment(review.comment)}</p>
            {review.isHidden && review.moderationReason ? (
              <p className="truncate text-xs text-textMuted">Note: {review.moderationReason}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "created",
        header: "Submitted",
        sortable: true,
        className: "w-[9rem] whitespace-nowrap text-sm text-textMuted",
        render: (review) => formatDateTime(review.createdAt),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[7.5rem]",
        render: (review) => (
          <StatePill
            label={review.isHidden ? "Hidden" : "Visible"}
            tone={review.isHidden ? "neutral" : "success"}
          />
        ),
      },
      {
        key: "actions",
        header: "Action",
        className: TABLE_ACTIONS_COLUMN_CLASS_WIDE,
        render: (review) => (
          <TableActionsCell>
            <TableActionBar>
              <TableActionBarItem label="Preview review" onClick={() => setSelectedReview(review)}>
                <Eye className="size-4 shrink-0" strokeWidth={2} />
              </TableActionBarItem>
              <TableActionBarItem
                label={review.isHidden ? "Restore review" : "Hide review"}
                onClick={() => openModeration(review, !review.isHidden)}
              >
                {review.isHidden ? (
                  <RotateCcw className="size-4 shrink-0" strokeWidth={2} />
                ) : (
                  <EyeOff className="size-4 shrink-0" strokeWidth={2} />
                )}
              </TableActionBarItem>
              <TableActionBarItem
                label="Open dossier"
                onClick={() => navigate(`/reviews/full/${review.id}`)}
              >
                <ArrowRight className="size-4 shrink-0" strokeWidth={2} />
              </TableActionBarItem>
            </TableActionBar>
          </TableActionsCell>
        ),
      },
    ],
    [navigate],
  );

  return (
    <DirectoryPage
      eyebrow="Reviews"
      title="Complete review moderation"
      description="Every product review, with the controls to hide anything that should not be public."
      backRoute="/reviews"
      onRefresh={() => void refresh()}
      refreshing={isLoading}
      metrics={[
        {
          label: "Total reviews",
          value: summary.total.toLocaleString(),
          icon: MessageSquareText,
          caption: "Across every product",
        },
        {
          label: "Visible",
          value: summary.visibleCount.toLocaleString(),
          icon: Eye,
          tone: "success",
          caption: `${summary.total - summary.visibleCount} hidden`,
        },
        {
          label: "Average rating",
          value: summary.averageRating.toFixed(1),
          icon: Star,
          tone: "warning",
          caption: "Out of 5",
        },
      ]}
      search={
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Product, shopper, order or comment"
          className="h-10 py-0"
        />
      }
      filters={
        <FilterSelect
          value={visibilityFilter}
          onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
          options={[
            { label: "All reviews", value: "all" },
            { label: "Visible only", value: "visible" },
            { label: "Hidden only", value: "hidden" },
          ]}
          className="h-10"
        />
      }
      cardTitle="Customer reviews"
      count={filteredReviews.length}
      columns={columns}
      data={filteredReviews}
      keyExtractor={(review) => review.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refresh()}
      emptyTitle="No reviews found"
      emptyDescription="Clear the filters or try another search."
      pagination={{
        page,
        pageSize,
        onPageChange: goToPage,
        hasMore,
        isLoadingPage,
        loadedLabel: `per page · ${reviews.length} loaded`,
      }}
    >
      <Modal
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        title={selectedReview?.productName ?? "Review details"}
        description="Inspect the shopper, order context, rating, and moderation state for this review."
      >
        {selectedReview ? (
          <DetailStack>
            <DetailSection title="Review details">
              <DetailFields columns={2}>
                <DetailField label="Shopper" value={selectedReview.userName} />
                <DetailField label="Email" value={selectedReview.userEmail} />
                <DetailField label="Store" value={selectedReview.storeName ?? "ODOS store"} />
                <DetailField label="Order" value={selectedReview.orderNumber} />
                <DetailField label="Rating" value={`${selectedReview.rating.toFixed(1)} / 5`} />
                <DetailField
                  label="Status"
                  value={selectedReview.isHidden ? "Hidden from shoppers" : "Visible to shoppers"}
                />
                <DetailField label="Created" value={formatDateTime(selectedReview.createdAt)} />
                <DetailField label="Updated" value={formatDateTime(selectedReview.updatedAt)} />
              </DetailFields>
            </DetailSection>

            <DetailSection title="Comment">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-textStrong">
                {selectedReview.comment}
              </p>
            </DetailSection>

            {selectedReview.vendorReply ? (
              <DetailSection title="Seller reply">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-textStrong">
                  {selectedReview.vendorReply}
                </p>
                {selectedReview.vendorRepliedAt ? (
                  <p className="mt-2 text-xs text-textMuted">
                    Replied {formatDateTime(selectedReview.vendorRepliedAt)}
                  </p>
                ) : null}
              </DetailSection>
            ) : null}

            {selectedReview.moderationReason ? (
              <DetailSection title="Moderation note">
                <p className="text-sm leading-relaxed text-textStrong">{selectedReview.moderationReason}</p>
              </DetailSection>
            ) : null}
          </DetailStack>
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
          <DetailStack className="gap-8">
            <DetailSection title="Review preview">
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 size-4 shrink-0 text-textMuted" />
                <div className="min-w-0 space-y-2">
                  <p className="font-medium text-textStrong">{moderationTarget.review.userName}</p>
                  <p className="text-sm leading-relaxed text-textMuted">{moderationTarget.review.comment}</p>
                </div>
              </div>
            </DetailSection>

            {moderationTarget.nextHidden ? (
              <DetailSection title="Internal moderation note">
                <div className="space-y-2">
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
              </DetailSection>
            ) : moderationTarget.review.moderationReason ? (
              <DetailSection title="Existing moderation note">
                <p className="text-sm leading-relaxed text-textStrong">
                  {moderationTarget.review.moderationReason}
                </p>
              </DetailSection>
            ) : null}
          </DetailStack>
        ) : null}
      </Modal>
    </DirectoryPage>
  );
}
