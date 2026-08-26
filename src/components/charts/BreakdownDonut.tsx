import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartEmpty } from "@/components/charts/ChartCard";
import { CHART_INK } from "@/components/charts/chartPalette";

export type BreakdownRow = { label: string; value: number; color: string };

/**
 * A share-of-total breakdown: donut plus the numbers beside it.
 *
 * The table is not decoration. Three of the six categorical hues sit under 3:1
 * against white — fine for a filled mark, not enough to carry meaning alone —
 * so the written label and value are what make the chart readable for someone
 * who cannot separate two of the wedges. It also gives the exact figures, which
 * no one can read off an arc.
 */
export function BreakdownDonut({
  rows,
  formatValue,
  height = 200,
  centerLabel,
  emptyMessage = "Nothing to break down yet.",
}: {
  rows: BreakdownRow[];
  formatValue: (value: number) => string;
  height?: number;
  centerLabel?: { value: string; caption: string };
  emptyMessage?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (rows.length === 0 || total <= 0) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="relative mx-auto shrink-0" style={{ height, width: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              // See TrendChart: charts render at their final geometry.
              isAnimationActive={false}
              data={rows}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              // A 2px gap of surface between wedges keeps two similar hues from
              // reading as one continuous block.
              paddingAngle={2}
              stroke={CHART_INK.surface}
              strokeWidth={2}
            >
              {rows.map((row) => (
                <Cell key={row.label} fill={row.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as BreakdownRow;
                return (
                  <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                        aria-hidden
                      />
                      <span className="text-xs text-textMuted">{row.label}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-textStrong">
                      {formatValue(row.value)}
                      <span className="ml-1.5 text-xs font-normal text-textMuted">
                        {share(row.value).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {centerLabel ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums tracking-tight text-textStrong">
              {centerLabel.value}
            </span>
            <span className="text-[11px] text-textMuted">{centerLabel.caption}</span>
          </div>
        ) : null}
      </div>

      <div className="min-w-0 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="pb-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-textMuted">
                Source
              </th>
              <th className="whitespace-nowrap pb-1.5 pl-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-textMuted">
                Value
              </th>
              <th className="whitespace-nowrap pb-1.5 pl-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-textMuted">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line/60 last:border-b-0">
                <td className="py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                    <span className="truncate text-sm text-textStrong">{row.label}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap py-2 pl-3 text-right text-sm font-medium tabular-nums text-textStrong">
                  {formatValue(row.value)}
                </td>
                <td className="whitespace-nowrap py-2 pl-3 text-right text-sm tabular-nums text-textMuted">
                  {share(row.value).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
