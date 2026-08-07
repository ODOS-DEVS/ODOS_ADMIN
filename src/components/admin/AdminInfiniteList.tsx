import type { ReactNode } from "react";

import { PaginatedDataTable } from "@/components/admin/PaginatedDataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type AdminInfiniteListProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
  keyExtractor: (row: T) => string;
  rowClassName?: string;
  compact?: boolean;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isLoadingPage: boolean;
  hasMore: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  listSummary?: string;
};

export function AdminInfiniteList<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  compact,
  page,
  pageSize,
  isLoading,
  isLoadingPage,
  hasMore,
  error,
  onPageChange,
  onRetry,
  emptyTitle,
  emptyDescription,
  listSummary,
}: AdminInfiniteListProps<T>) {
  if (isLoading) {
    return <LoadingState label="Loading records..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription ?? "Try adjusting your filters or search."}
      />
    );
  }

  return (
    <PaginatedDataTable
      columns={columns}
      data={data}
      keyExtractor={keyExtractor}
      rowClassName={rowClassName}
      compact={compact}
      page={page}
      pageSize={pageSize}
      hasMore={hasMore}
      isLoadingPage={isLoadingPage}
      onPageChange={onPageChange}
      listSummary={listSummary}
    />
  );
}
