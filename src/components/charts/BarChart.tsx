import {
  Bar,
  BarChart as RechartsBar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmpty } from "@/components/charts/ChartCard";
import { CHART_INK, colorAt } from "@/components/charts/chartPalette";

export type BarRow = { label: string; value: number; caption?: string };

/**
 * Magnitude compared across a categorical dimension.
 *
 * `orientation` is a readability decision, not a style one: category names are
 * words ("Home & living"), and words set horizontally do not need rotating,
 * truncating or reading at 45°. Time buckets are short and ordered, so they go
 * vertical where left-to-right reads as forward in time.
 */
export function BarChart({
  rows,
  orientation = "horizontal",
  formatValue,
  formatTick,
  color,
  height = 260,
  emptyMessage = "Nothing to compare yet.",
}: {
  rows: BarRow[];
  orientation?: "horizontal" | "vertical";
  formatValue: (value: number) => string;
  formatTick?: (value: number) => string;
  /** Fixed hue for a single-series chart; defaults to the primary. */
  color?: string;
  height?: number;
  emptyMessage?: string;
}) {
  if (rows.length === 0 || rows.every((row) => row.value === 0)) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const tick = formatTick ?? formatValue;
  const barColor = color ?? colorAt(0);

  const tooltip = (
    <Tooltip
      cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const row = payload[0].payload as BarRow;
        return (
          <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
            <p className="text-xs text-textMuted">{row.label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-textStrong">
              {formatValue(row.value)}
            </p>
            {row.caption ? (
              <p className="mt-0.5 text-[11px] text-textMuted">{row.caption}</p>
            ) : null}
          </div>
        );
      }}
    />
  );

  if (orientation === "horizontal") {
    return (
      <div style={{ height: Math.max(height, rows.length * 34 + 24) }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBar
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
            barCategoryGap={10}
          >
            <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value: number) => tick(value)}
              tick={{ fill: CHART_INK.label, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: CHART_INK.label, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={132}
            />
            {tooltip}
            {/* 4px rounded end on the data side only — the baseline end stays
                square so every bar starts from the same hard edge. */}
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell key={row.label} fill={barColor} />
              ))}
            </Bar>
          </RechartsBar>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_INK.label, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
          />
          <YAxis
            tickFormatter={(value: number) => tick(value)}
            tick={{ fill: CHART_INK.label, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          {tooltip}
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.label} fill={barColor} />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
