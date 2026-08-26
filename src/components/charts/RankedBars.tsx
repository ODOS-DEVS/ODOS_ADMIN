import { ChartEmpty } from "@/components/charts/ChartCard";
import { colorAt } from "@/components/charts/chartPalette";

export type RankedRow = {
  id: string;
  label: string;
  caption?: string;
  value: number;
  valueLabel: string;
};

/**
 * A leaderboard: label, bar, figure.
 *
 * Bars are scaled to the top row rather than to the total, because the question
 * here is "how do these compare to the best one", not "what share of everything
 * is each". Every row is labelled directly, so no legend is needed.
 *
 * One hue for every bar, deliberately. This is a single series — revenue —
 * and colouring by rank would both repaint the chart whenever the ordering
 * changed and imply a category difference that does not exist. Rank is already
 * carried by the number and the ordering.
 */
export function RankedBars({
  rows,
  color,
  emptyMessage = "No ranking data yet.",
}: {
  rows: RankedRow[];
  /** Defaults to the primary series hue. */
  color?: string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const max = Math.max(...rows.map((row) => row.value), 1);
  const barColor = color ?? colorAt(0);

  return (
    <ul className="space-y-3 px-2">
      {rows.map((row, index) => (
        <li key={row.id} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-textSubtle">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium text-textStrong">{row.label}</p>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-textStrong">
                {row.valueLabel}
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max((row.value / max) * 100, 2)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </span>
            </div>
            {row.caption ? (
              <p className="mt-1 truncate text-[11px] text-textMuted">{row.caption}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
