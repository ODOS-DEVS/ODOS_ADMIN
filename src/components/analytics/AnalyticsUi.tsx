import clsx from "clsx";

import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";

type MetricBarProps = {
  label: string;
  value: number;
  max: number;
  displayValue: string;
  tone?: "sky" | "amber" | "emerald" | "accent" | "fuchsia";
  animationDelay?: number;
};

/** Tone keys map onto the app's semantic status tokens — no raw Tailwind palette colors. */
const toneClasses = {
  sky: "bg-info",
  amber: "bg-warning",
  emerald: "bg-success",
  accent: "bg-accent",
  fuchsia: "bg-danger",
};

export function MetricBar({
  label,
  value,
  max,
  displayValue,
  tone = "accent",
  animationDelay = 0,
}: MetricBarProps) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 6 : 0) : 0;

  return (
    <div
      className="animate-fade-up opacity-0"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="capitalize text-textMuted">{label}</span>
        <span className="shrink-0 font-medium tabular-nums text-textStrong">{displayValue}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line/80">
        <div
          className={clsx("h-full rounded-full transition-[width] duration-700 ease-out", toneClasses[tone])}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function MetricRow({
  label,
  value,
  hint,
  tone = "default",
  animationDelay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "info";
  animationDelay?: number;
}) {
  const toneBorder = {
    default: "border-line bg-surface",
    success: "border-success/25 bg-success-soft",
    warning: "border-warning/25 bg-warning-soft",
    info: "border-info/25 bg-info-soft",
  };

  return (
    <div
      className={clsx(
        "animate-fade-up opacity-0 rounded-xl border px-3 py-2.5",
        toneBorder[tone],
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-textMuted">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-textStrong">{value}</p>
      </div>
      {hint ? <p className="mt-1 text-[11px] leading-4 text-textMuted">{hint}</p> : null}
    </div>
  );
}

export function InsightPill({
  label,
  value,
  hint,
  animationDelay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  animationDelay?: number;
}) {
  return (
    <div
      className="animate-fade-up opacity-0 py-1"
      style={{ animationDelay: `${animationDelay}ms` }}
      title={hint}
    >
      <p className="text-xs text-textMuted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-textStrong">{value}</p>
      {hint ? <p className="mt-0.5 line-clamp-1 text-xs text-textSubtle">{hint}</p> : null}
    </div>
  );
}

export function DistributionList({
  items,
  emptyLabel,
  tone = "accent",
}: {
  items: Array<{ key: string; label: string; count: number }>;
  emptyLabel: string;
  tone?: MetricBarProps["tone"];
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-surfaceMuted px-3 py-5 text-center text-xs text-textMuted">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <MetricBar
          key={item.key}
          label={item.label}
          value={item.count}
          max={max}
          displayValue={String(item.count)}
          tone={tone}
          animationDelay={80 + index * 40}
        />
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-48 rounded-panel" />
      <SkeletonGrid count={4} className="grid grid-cols-2 gap-3 lg:grid-cols-4" tileClassName="h-28 rounded-2xl" />
      <div className="grid gap-4 xl:grid-cols-12">
        <SkeletonBlock className="h-72 rounded-2xl xl:col-span-8" />
        <SkeletonBlock className="h-72 rounded-2xl xl:col-span-4" />
      </div>
      <SkeletonBlock className="h-64 rounded-2xl" />
    </div>
  );
}

export function FullAnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-20 rounded-2xl" />
      <SkeletonBlock className="h-10 rounded-xl" />
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonBlock key={`full-analytics-section-${index}`} className="h-48 rounded-2xl" />
      ))}
    </div>
  );
}

export function StatGrid({
  items,
  columns = 4,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
  columns?: 2 | 3 | 4;
}) {
  const columnClass =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 3
        ? "md:grid-cols-2 xl:grid-cols-3"
        : "md:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={clsx("grid grid-cols-2 gap-2", columnClass)}>
      {items.map((item) => (
        <InsightPill key={item.label} label={item.label} value={item.value} hint={item.hint} />
      ))}
    </div>
  );
}

export function ReportSectionNav({
  groups,
  activeId,
  onSelect,
}: {
  groups: Array<{ label: string; sections: Array<{ id: string; label: string }> }>;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sticky top-0 z-20 overflow-hidden rounded-2xl border border-line/80 bg-surface/95 shadow-sm backdrop-blur-sm">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-1 p-2">
          {groups.map((group, groupIndex) => (
            <div key={group.label} className="flex items-center gap-1">
              {groupIndex > 0 ? (
                <div
                  className="mx-1 flex shrink-0 flex-col items-center gap-0.5 px-1"
                  aria-hidden
                >
                  <span className="h-8 w-px bg-line" />
                </div>
              ) : null}
              <span className="hidden shrink-0 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-textSubtle sm:inline">
                {group.label}
              </span>
              {group.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSelect(section.id)}
                  className={clsx(
                    "shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition",
                    activeId === section.id
                      ? "bg-accent text-accentForeground shadow-sm"
                      : "text-textMuted hover:bg-surfaceMuted hover:text-textStrong",
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
