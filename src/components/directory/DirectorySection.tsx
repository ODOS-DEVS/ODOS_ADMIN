import type { ReactNode } from "react";

import { DirectoryFooter } from "@/components/directory/DirectoryFooter";
import {
  DirectoryTable,
  type DirectoryColumn,
  type SortState,
} from "@/components/directory/DirectoryTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";

export type DirectorySectionProps<T> = {
  cardTitle: string;
  count: number;
  listSummary?: string;
  cardAction?: ReactNode;
  columns: Array<DirectoryColumn<T>>;
  data: T[];
  keyExtractor: (row: T) => string;
  sort?: SortState;
  onSortChange?: (key: string) => void;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  pagination?: {
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    hasMore: boolean;
    isLoadingPage?: boolean;
    loadedLabel: string;
  };
  animationDelay?: number;
};

/**
 * One titled table card: heading with a live count, the table, and pagination.
 *
 * Split out of DirectoryPage so screens that legitimately show two lists —
 * flash sales and their nominations, campaigns and their opt-ins, the finance
 * ledger and its payments — can stack two of these and still match the
 * single-list directories exactly.
 */
export function DirectorySection<T>({
  cardTitle,
  count,
  listSummary,
  cardAction,
  columns,
  data,
  keyExtractor,
  sort,
  onSortChange,
  selectedIds,
  onToggleRow,
  onToggleAll,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  pagination,
  animationDelay = 0,
}: DirectorySectionProps<T>) {
  return (
    <section
      style={{ animationDelay: `${animationDelay}ms` }}
      className="animate-fade-up rounded-2xl border border-line bg-surface opacity-0 shadow-card"
    >
      <header className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-textStrong">
            {cardTitle} <span className="font-normal tabular-nums text-textMuted">({count})</span>
          </h2>
          {listSummary ? <p className="mt-0.5 text-xs text-textMuted">{listSummary}</p> : null}
        </div>
        {cardAction ? <div className="shrink-0">{cardAction}</div> : null}
      </header>

      {error ? (
        <div className="p-4">
          <ErrorState description={error} onRetry={onRetry} />
        </div>
      ) : isLoading ? (
        <div className="p-4">
          <LoadingState label="Loading records..." />
        </div>
      ) : (
        <>
          <DirectoryTable
            columns={columns}
            data={data}
            keyExtractor={keyExtractor}
            selectedIds={selectedIds}
            onToggleRow={onToggleRow}
            onToggleAll={onToggleAll}
            sort={sort}
            onSortChange={onSortChange}
            emptyState={
              <div className="p-4">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription ?? "Try adjusting your filters or search."}
                />
              </div>
            }
          />
          {pagination ? (
            <DirectoryFooter
              page={pagination.page}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              hasMore={pagination.hasMore}
              isLoading={pagination.isLoadingPage}
              loadedLabel={pagination.loadedLabel}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
