import type { ReactNode } from "react";

import { AdminFullHeader } from "@/components/admin/AdminShell";
import { DirectorySection } from "@/components/directory/DirectorySection";
import type { DirectoryColumn, SortState } from "@/components/directory/DirectoryTable";
import { DirectoryToolbar } from "@/components/directory/DirectoryToolbar";
import { MetricStat } from "@/components/directory/MetricStat";

export type DirectoryMetric = {
  label: string;
  value: string;
  icon: Parameters<typeof MetricStat>[0]["icon"];
  tone?: Parameters<typeof MetricStat>[0]["tone"];
  caption?: string;
  delta?: Parameters<typeof MetricStat>[0]["delta"];
};

type DirectoryPageProps<T> = {
  // --- header ---
  eyebrow: string;
  title: string;
  description: string;
  backRoute: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  headerActions?: ReactNode;

  // --- KPI strip ---
  metrics?: DirectoryMetric[];

  /** Standing guidance shown under the KPI strip — e.g. how payouts work. */
  notice?: ReactNode;

  // --- filter bar ---
  search?: ReactNode;
  filters?: ReactNode;
  tabs?: ReactNode;

  // --- table card ---
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

  // --- states ---
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;

  // --- footer ---
  pagination?: {
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    hasMore: boolean;
    isLoadingPage?: boolean;
    loadedLabel: string;
  };

  /** Floating bulk-action bar, and any modals the page owns. */
  children?: ReactNode;
};

/**
 * The shared shell for every admin directory.
 *
 * Header → KPI strip → filter bar → table card → pagination, in that order on
 * every screen. Pages keep their own data loading and their own columns; only
 * the arrangement lives here, so Orders, Users and Payouts cannot drift into
 * three different-looking lists of rows.
 */
export function DirectoryPage<T>({
  eyebrow,
  title,
  description,
  backRoute,
  onRefresh,
  refreshing,
  headerActions,
  metrics,
  notice,
  search,
  filters,
  tabs,
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
  children,
}: DirectoryPageProps<T>) {
  return (
    <div className="space-y-4">
      <AdminFullHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        backRoute={backRoute}
        onRefresh={onRefresh}
        refreshing={refreshing}
        actions={headerActions}
      />

      {metrics && metrics.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricStat
              key={metric.label}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              tone={metric.tone}
              caption={metric.caption}
              delta={metric.delta}
              animationDelay={40 + index * 40}
            />
          ))}
        </div>
      ) : null}

      {notice}

      {search || filters || tabs ? (
        <DirectoryToolbar search={search} filters={filters} trailing={tabs} />
      ) : null}

      <DirectorySection
        cardTitle={cardTitle}
        count={count}
        listSummary={listSummary}
        cardAction={cardAction}
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        sort={sort}
        onSortChange={onSortChange}
        selectedIds={selectedIds}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        pagination={pagination}
      />

      {children}
    </div>
  );
}
