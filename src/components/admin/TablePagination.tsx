import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildPageNumberSlots, formatPaginationRange } from "@/utils/paginationUi";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  itemCount: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  summary?: string;
};

export function TablePagination({
  page,
  pageSize,
  itemCount,
  hasMore,
  onPageChange,
  isLoading = false,
  summary,
}: TablePaginationProps) {
  const pageSlots = buildPageNumberSlots(page, hasMore);
  const rangeLabel = summary ?? formatPaginationRange({ page, pageSize, itemCount });
  const canGoPrev = page > 1 && !isLoading;
  const canGoNext = hasMore && !isLoading;

  if (pageSlots.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t border-line bg-surfaceMuted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
      <p className="text-sm tabular-nums text-textMuted">{rangeLabel}</p>

      <nav className="flex items-center justify-end gap-1.5" aria-label="Pagination">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onPageChange(page - 1)}
          className={clsx(
            "inline-flex size-9 items-center justify-center rounded-lg border text-textMuted transition",
            canGoPrev
              ? "border-line bg-surface hover:border-accent/30 hover:text-textStrong"
              : "cursor-not-allowed border-line/60 bg-surfaceMuted opacity-50",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pageSlots.map((slot, index) =>
          slot === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex size-9 items-center justify-center text-sm text-textSubtle"
            >
              …
            </span>
          ) : (
            <button
              key={slot}
              type="button"
              disabled={isLoading}
              onClick={() => onPageChange(slot)}
              aria-current={slot === page ? "page" : undefined}
              className={clsx(
                "inline-flex min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium tabular-nums transition",
                slot === page
                  ? "border-accent bg-accent text-accentForeground shadow-sm"
                  : "border-line bg-surface text-textMuted hover:border-accent/30 hover:text-textStrong",
                isLoading && "pointer-events-none opacity-60",
              )}
            >
              {slot}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
          className={clsx(
            "inline-flex size-9 items-center justify-center rounded-lg border text-textMuted transition",
            canGoNext
              ? "border-line bg-surface hover:border-accent/30 hover:text-textStrong"
              : "cursor-not-allowed border-line/60 bg-surfaceMuted opacity-50",
          )}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}
