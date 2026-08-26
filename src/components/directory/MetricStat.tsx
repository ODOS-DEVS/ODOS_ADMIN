import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

type Delta = {
  /** Percentage change. Negative renders as a decline. */
  percent: number;
  /** What the change is measured against, e.g. "vs last month". Never invent this. */
  label: string;
};

type MetricStatProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  delta?: Delta;
  /** Shown under the value when there is no delta to report. */
  caption?: string;
  animationDelay?: number;
};

const iconTone = {
  default: "bg-accentSoft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
} as const;

/**
 * A single figure in the directory KPI strip.
 *
 * The label is set in small caps because these read as column headings for the
 * page, not as sentences — it keeps four cards scanning as one row. A delta is
 * only ever rendered when the caller has a real comparison to pass; there is no
 * default, because a fabricated trend on an operations screen is worse than no
 * trend at all.
 */
export function MetricStat({
  label,
  value,
  icon: Icon,
  tone = "default",
  delta,
  caption,
  animationDelay = 0,
}: MetricStatProps) {
  const isDown = delta ? delta.percent < 0 : false;
  const DeltaIcon = isDown ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      style={{ animationDelay: `${animationDelay}ms` }}
      className="animate-fade-up rounded-2xl border border-line bg-surface p-4 opacity-0 shadow-card"
    >
      <div className="flex items-center gap-2">
        <span className={clsx("rounded-lg p-1.5", iconTone[tone])}>
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-textSubtle">
          {label}
        </p>
      </div>

      <p className="mt-3 text-[26px] font-bold leading-none tabular-nums tracking-tight text-textStrong">
        {value}
      </p>

      {delta ? (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              isDown ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
            )}
          >
            <DeltaIcon className="size-3" aria-hidden />
            {Math.abs(delta.percent).toFixed(1)}%
          </span>
          <span className="truncate text-[11px] text-textSubtle">{delta.label}</span>
        </div>
      ) : caption ? (
        <p className="mt-3 truncate text-[11px] text-textSubtle">{caption}</p>
      ) : null}
    </div>
  );
}
