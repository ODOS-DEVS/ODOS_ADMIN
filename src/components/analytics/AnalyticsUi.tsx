import clsx from "clsx";

type MetricBarProps = {
  label: string;
  value: number;
  max: number;
  displayValue: string;
  tone?: "sky" | "amber" | "emerald" | "accent" | "fuchsia";
  animationDelay?: number;
};

const toneClasses = {
  sky: "bg-gradient-to-r from-sky-400/90 to-cyan-300/90",
  amber: "bg-gradient-to-r from-amber-400/90 to-orange-300/90",
  emerald: "bg-gradient-to-r from-emerald-400/90 to-lime-300/90",
  accent: "bg-gradient-to-r from-accent/90 to-amber-300/90",
  fuchsia: "bg-gradient-to-r from-fuchsia-400/90 to-pink-300/90",
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
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
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
    default: "border-white/10",
    success: "border-success/25 bg-success/[0.04]",
    warning: "border-warning/25 bg-warning/[0.04]",
    info: "border-info/25 bg-info/[0.04]",
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
      className="animate-fade-up opacity-0 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
      style={{ animationDelay: `${animationDelay}ms` }}
      title={hint}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-textMuted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-textStrong">{value}</p>
      {hint ? <p className="mt-1 line-clamp-1 text-[11px] text-textMuted">{hint}</p> : null}
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
      <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-textMuted">
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
    <div className="space-y-4">
      <div className="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`analytics-kpi-${index}`}
            className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`analytics-pill-${index}`} className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] xl:col-span-8" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] xl:col-span-4" />
        <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] xl:col-span-7" />
        <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] xl:col-span-5" />
      </div>
    </div>
  );
}

export function FullAnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`full-analytics-section-${index}`}
          className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
        />
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
  sections,
  activeId,
  onSelect,
}: {
  sections: Array<{ id: string; label: string }>;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max gap-1 rounded-xl border border-white/10 bg-surface/95 p-1 backdrop-blur-md">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={clsx(
              "rounded-lg px-3 py-2 text-xs font-medium transition",
              activeId === section.id
                ? "bg-accent/15 text-accentSoft"
                : "text-textMuted hover:bg-white/[0.04] hover:text-textStrong",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
