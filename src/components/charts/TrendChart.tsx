import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmpty } from "@/components/charts/ChartCard";
import { CHART_INK, colorAt } from "@/components/charts/chartPalette";

export type TrendSeries = {
  key: string;
  label: string;
  /** Index into the fixed categorical order. */
  colorIndex: number;
};

type TrendPoint = Record<string, string | number>;

/**
 * Change over time, one or more series, sharing a single y-axis.
 *
 * Deliberately never a dual axis: two y-scales let you pick a zoom that makes
 * any two lines cross wherever you like, so the crossing stops meaning
 * anything. Series of different magnitude belong in separate charts — every
 * series drawn here is in the same unit.
 */
export function TrendChart({
  data,
  series,
  xKey,
  formatValue,
  formatTick,
  formatX,
  height = 260,
  emptyMessage = "No activity in this period.",
}: {
  data: TrendPoint[];
  series: TrendSeries[];
  xKey: string;
  formatValue: (value: number) => string;
  /** Shorter form for axis ticks; falls back to formatValue. */
  formatTick?: (value: number) => string;
  formatX?: (value: string) => string;
  height?: number;
  emptyMessage?: string;
}) {
  const hasValues = data.some((point) =>
    series.some((entry) => Number(point[entry.key] ?? 0) !== 0),
  );

  if (data.length === 0 || !hasValues) {
    return <ChartEmpty message={emptyMessage} />;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            {series.map((entry) => (
              <linearGradient
                key={entry.key}
                id={`trend-${entry.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={colorAt(entry.colorIndex)} stopOpacity={0.18} />
                <stop offset="100%" stopColor={colorAt(entry.colorIndex)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal rules only, and in the lightest ink that still reads —
              vertical rules would compete with the crosshair. */}
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />

          <XAxis
            dataKey={xKey}
            tickFormatter={formatX}
            tick={{ fill: CHART_INK.label, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => (formatTick ?? formatValue)(value)}
            tick={{ fill: CHART_INK.label, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={formatTick ? 48 : 64}
          />

          <Tooltip
            cursor={{ stroke: CHART_INK.axis, strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
                  <p className="text-xs font-medium text-textMuted">
                    {formatX ? formatX(String(label)) : String(label)}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {payload.map((item) => (
                      <li key={String(item.dataKey)} className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                          aria-hidden
                        />
                        <span className="text-xs text-textMuted">
                          {series.find((entry) => entry.key === item.dataKey)?.label ??
                            String(item.dataKey)}
                        </span>
                        <span className="ml-auto text-xs font-semibold tabular-nums text-textStrong">
                          {formatValue(Number(item.value ?? 0))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }}
          />

          {series.map((entry) => (
            <Area
              key={entry.key}
              // No mount animation: these plots appear only after a network
              // round-trip, and a further second of growing-in adds latency to
              // something the operator is already waiting on.
              isAnimationActive={false}
              type="monotone"
              dataKey={entry.key}
              stroke={colorAt(entry.colorIndex)}
              strokeWidth={2}
              fill={`url(#trend-${entry.key})`}
              // A dot per point turns a 90-day series into noise; the active dot
              // still appears under the crosshair.
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_INK.surface }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
