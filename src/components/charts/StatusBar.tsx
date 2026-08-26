import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export type StatusSegment = {
  label: string;
  value: number;
  tone: "good" | "warning" | "critical";
  icon: LucideIcon;
};

const TONE = {
  good: { fill: "bg-success", text: "text-success", soft: "bg-success-soft" },
  warning: { fill: "bg-warning", text: "text-warning", soft: "bg-warning-soft" },
  critical: { fill: "bg-danger", text: "text-danger", soft: "bg-danger-soft" },
} as const;

/**
 * Parts of a whole where the parts mean good / at-risk / broken.
 *
 * Uses the reserved status colours rather than the categorical palette, because
 * "out of stock" is a state, not a category — and every segment carries an icon
 * and a written label, so the state never rests on colour alone.
 */
export function StatusBar({
  segments,
  totalLabel,
}: {
  segments: StatusSegment[];
  totalLabel: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return (
      <div className="px-2 py-6 text-center text-sm text-textMuted">
        Nothing in the catalog yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 px-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-textStrong">
          {total.toLocaleString()}
        </span>
        <span className="text-xs text-textMuted">{totalLabel}</span>
      </div>

      {/* A 2px surface gap between segments keeps adjacent fills from reading as
          one continuous block. */}
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.label}
              className={clsx("block h-full first:rounded-l-full last:rounded-r-full", TONE[segment.tone].fill)}
              style={{ width: `${(segment.value / total) * 100}%` }}
              aria-hidden
            />
          ))}
      </div>

      <ul className="space-y-1.5">
        {segments.map((segment) => {
          const Icon = segment.icon;
          const share = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <li key={segment.label} className="flex items-center gap-2.5">
              <span className={clsx("rounded-md p-1", TONE[segment.tone].soft, TONE[segment.tone].text)}>
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-textStrong">
                {segment.label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-textStrong">
                {segment.value.toLocaleString()}
              </span>
              <span className="w-12 text-right text-xs tabular-nums text-textMuted">
                {share.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
