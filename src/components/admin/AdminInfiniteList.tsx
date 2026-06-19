import type { ReactNode } from "react";

import { InfiniteDataTable } from "@/components/admin/InfiniteDataTable";
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
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription?: string;
};

export function AdminInfiniteList<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  compact,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetry,
  emptyTitle,
  emptyDescription,
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
    <InfiniteDataTable
      columns={columns}
      data={data}
      keyExtractor={keyExtractor}
      rowClassName={rowClassName}
      compact={compact}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
    />
  );
}
