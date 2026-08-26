import clsx from "clsx";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

export type DirectoryColumn<T> = {
  key: string;
  header: string;
  className?: string;
  /** Set to make the header a sort control. The page owns the comparison. */
  sortable?: boolean;
  render: (row: T) => ReactNode;
};

export type SortState = { key: string; direction: "asc" | "desc" } | null;

type DirectoryTableProps<T> = {
  columns: Array<DirectoryColumn<T>>;
  data: T[];
  keyExtractor: (row: T) => string;
  /** Omit both selection props for a read-only table. */
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  sort?: SortState;
  onSortChange?: (key: string) => void;
  emptyState?: ReactNode;
};

function SortIcon({ state }: { state: "asc" | "desc" | null }) {
  if (state === "asc") return <ChevronUp className="size-3.5" aria-hidden />;
  if (state === "desc") return <ChevronDown className="size-3.5" aria-hidden />;
  return <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden />;
}

/**
 * The directory table.
 *
 * Separate from DataTable because that one is shared by fifteen read-only
 * screens and has no notion of selection or sorting; widening it would push
 * those concerns onto every caller. Selection lives here, sorting is delegated
 * to the page so each directory can sort its own domain fields correctly.
 */
export function DirectoryTable<T>({
  columns,
  data,
  keyExtractor,
  selectedIds,
  onToggleRow,
  onToggleAll,
  sort,
  onSortChange,
  emptyState,
}: DirectoryTableProps<T>) {
  const selectable = Boolean(selectedIds && onToggleRow);
  const rowIds = data.map(keyExtractor);
  const allSelected = selectable && rowIds.length > 0 && rowIds.every((id) => selectedIds!.has(id));
  const someSelected = selectable && rowIds.some((id) => selectedIds!.has(id)) && !allSelected;

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-line bg-surfaceMuted/70">
          <tr>
            {selectable ? (
              <th scope="col" className="w-11 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={allSelected ? "Clear selection" : "Select all rows on this page"}
                  checked={allSelected}
                  ref={(node) => {
                    if (node) node.indeterminate = someSelected;
                  }}
                  onChange={() => onToggleAll?.(rowIds)}
                  className="size-4 cursor-pointer rounded border-line text-accent accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              </th>
            ) : null}

            {columns.map((column) => {
              const sortState = sort?.key === column.key ? sort.direction : null;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sortState === "asc"
                      ? "ascending"
                      : sortState === "desc"
                        ? "descending"
                        : undefined
                  }
                  className={clsx(
                    "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-textMuted",
                    column.className,
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.key)}
                      className="inline-flex items-center gap-1 rounded transition hover:text-textStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    >
                      {column.header}
                      <SortIcon state={sortState} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-line bg-surface">
          {data.map((row) => {
            const id = keyExtractor(row);
            const isSelected = selectable && selectedIds!.has(id);
            return (
              <tr
                key={id}
                className={clsx(
                  "transition",
                  isSelected ? "bg-accentSoft/40" : "hover:bg-surfaceMuted/70",
                )}
              >
                {selectable ? (
                  <td className="w-11 px-4 py-3.5 align-middle">
                    <input
                      type="checkbox"
                      aria-label={isSelected ? "Deselect row" : "Select row"}
                      checked={isSelected}
                      onChange={() => onToggleRow?.(id)}
                      className="size-4 cursor-pointer rounded border-line text-accent accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    />
                  </td>
                ) : null}

                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx(
                      "px-4 py-3.5 align-middle text-sm text-textStrong",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
