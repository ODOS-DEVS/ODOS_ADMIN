import type { ReactNode } from "react";

import { InfiniteScrollSentinel } from "@/components/admin/InfiniteScrollSentinel";
import { DataTable } from "@/components/tables/DataTable";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type InfiniteDataTableProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
  keyExtractor: (row: T) => string;
  rowClassName?: string;
  compact?: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

export function InfiniteDataTable<T>({
  hasMore,
  isLoadingMore,
  onLoadMore,
  ...tableProps
}: InfiniteDataTableProps<T>) {
  return (
    <>
      <DataTable {...tableProps} />
      <InfiniteScrollSentinel
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
      />
    </>
  );
}
