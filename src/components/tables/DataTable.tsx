import clsx from "clsx";
import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
  keyExtractor: (row: T) => string;
  rowClassName?: string;
  compact?: boolean;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  compact = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-line bg-surfaceMuted/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  "text-left text-xs font-semibold uppercase tracking-wide text-textMuted",
                  compact ? "px-4 py-3" : "px-5 py-3.5",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={clsx("transition hover:bg-surfaceMuted/70", rowClassName)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    "align-middle text-sm text-textStrong",
                    compact ? "px-4 py-3.5" : "px-5 py-4",
                    column.className,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
