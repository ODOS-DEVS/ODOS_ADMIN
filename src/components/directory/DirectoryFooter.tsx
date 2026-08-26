import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildPageNumberSlots } from "@/utils/paginationUi";

export const PAGE_SIZE_OPTIONS = [12, 25, 50, 100];

/**
 * Pagination plus rows-per-page.
 *
 * `loadedLabel` says how many records are in hand rather than claiming a total
 * the API never returns — the list pages forward and does not report a count,
 * so "180 loaded" is true where "out of 180" would be a guess.
 */
export function DirectoryFooter({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasMore,
  isLoading = false,
  loadedLabel,
}: {
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  hasMore: boolean;
  isLoading?: boolean;
  loadedLabel: string;
}) {
  const slots = buildPageNumberSlots(page, hasMore);
  const canPrev = page > 1 && !isLoading;
  const canNext = hasMore && !isLoading;

  return (
    <div className="flex flex-col gap-3 border-t border-line bg-surfaceMuted/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-[13px] text-textMuted">
        <span>Showing</span>
        {onPageSizeChange ? (
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-[13px] tabular-nums text-textStrong outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-medium tabular-nums text-textStrong">{pageSize}</span>
        )}
        <span className="tabular-nums">{loadedLabel}</span>
      </div>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={clsx(
            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition",
            canPrev
              ? "border-line bg-surface text-textMuted hover:border-accent/30 hover:text-textStrong"
              : "cursor-not-allowed border-line/60 bg-surfaceMuted text-textSubtle opacity-60",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </button>

        {slots.map((slot, index) =>
          slot === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex size-8 items-center justify-center text-sm text-textSubtle"
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
                "inline-flex min-w-8 items-center justify-center rounded-lg border px-2 py-1.5 text-[13px] font-medium tabular-nums transition",
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
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className={clsx(
            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition",
            canNext
              ? "border-line bg-surface text-textMuted hover:border-accent/30 hover:text-textStrong"
              : "cursor-not-allowed border-line/60 bg-surfaceMuted text-textSubtle opacity-60",
          )}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}
