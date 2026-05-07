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
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
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
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-textMuted",
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
                <td key={column.key} className="px-4 py-4 align-top text-sm text-textStrong">
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
