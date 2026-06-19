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
      <table className="min-w-full divide-y divide-white/10">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  "text-left text-xs font-semibold uppercase tracking-[0.18em] text-textMuted",
                  compact ? "px-3 py-2" : "px-4 py-3",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={clsx("transition hover:bg-white/[0.03]", rowClassName)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    "align-middle text-sm text-textStrong",
                    compact ? "px-3 py-2.5" : "px-4 py-4 align-top",
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
