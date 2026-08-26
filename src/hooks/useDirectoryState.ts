import { useCallback, useMemo, useState } from "react";

import type { SortState } from "@/components/directory/DirectoryTable";

/**
 * Row selection and column sorting for a directory page.
 *
 * Both directories grew identical copies of this logic; keeping it here means a
 * fix to the select-all semantics lands everywhere at once. Sorting is a
 * comparator the page supplies, because only the page knows whether "amount"
 * means a number, a date or a name.
 */
export function useDirectoryState<T>({
  rows,
  getId,
  compare,
  initialSort = null,
}: {
  rows: T[];
  getId: (row: T) => string;
  /** Return a negative/zero/positive number, as Array.prototype.sort expects. */
  compare?: (left: T, right: T, key: string) => number;
  initialSort?: SortState;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>(initialSort);

  const sortedRows = useMemo(() => {
    if (!sort || !compare) return rows;
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => compare(left, right, sort.key) * direction);
  }, [compare, rows, sort]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((previous) => {
      // Header checkbox clears the page when the page is fully selected, and
      // adds to the selection otherwise — so paging through a list and ticking
      // each header does not silently drop earlier pages.
      const allSelected = ids.length > 0 && ids.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...ids]);
    });
  }, []);

  const changeSort = useCallback((key: string) => {
    setSort((previous) =>
      previous?.key === key
        ? { key, direction: previous.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(getId(row))),
    [getId, rows, selectedIds],
  );

  return {
    selectedIds,
    selectedRows,
    toggleRow,
    toggleAll,
    clearSelection,
    sort,
    changeSort,
    sortedRows,
  };
}
