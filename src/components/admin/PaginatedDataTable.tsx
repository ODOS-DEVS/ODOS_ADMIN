import type { ReactNode } from "react";

import { TablePagination } from "@/components/admin/TablePagination";
import { DataTable } from "@/components/tables/DataTable";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type PaginatedDataTableProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
  keyExtractor: (row: T) => string;
  rowClassName?: string;
  compact?: boolean;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoadingPage: boolean;
  onPageChange: (page: number) => void;
  listSummary?: string;
};

export function PaginatedDataTable<T>({
  page,
  pageSize,
  hasMore,
  isLoadingPage,
  onPageChange,
  listSummary,
  data,
  ...tableProps
}: PaginatedDataTableProps<T>) {
  return (
    <>
      <DataTable {...tableProps} data={data} />
      <TablePagination
        page={page}
        pageSize={pageSize}
        itemCount={data.length}
        hasMore={hasMore}
        onPageChange={onPageChange}
        isLoading={isLoadingPage}
        summary={listSummary}
      />
    </>
  );
}
