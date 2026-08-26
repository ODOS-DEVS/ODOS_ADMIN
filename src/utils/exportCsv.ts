/**
 * Download rows as a CSV file.
 *
 * Values are quoted and inner quotes doubled, so a product name containing a
 * comma or a customer note containing a quote cannot shift every later column.
 */
export function exportCsv<T>(
  filename: string,
  rows: T[],
  columns: Array<{ header: string; value: (row: T) => string | number | null | undefined }>,
) {
  if (rows.length === 0) return;

  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [
    columns.map((column) => escape(column.header)).join(","),
    ...rows.map((row) => columns.map((column) => escape(column.value(row))).join(",")),
  ];

  // ﻿ so Excel opens UTF-8 (₵, accented store names) without mangling it.
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
