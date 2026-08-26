import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * The frame every chart sits in: title, optional control, optional legend row,
 * then the plot. Matches the directory card so a dashboard and a list page read
 * as the same product.
 */
export function ChartCard({
  title,
  description,
  control,
  legend,
  children,
  className,
  animationDelay = 0,
}: {
  title: string;
  description?: string;
  control?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
  animationDelay?: number;
}) {
  return (
    <section
      style={{ animationDelay: `${animationDelay}ms` }}
      className={clsx(
        "animate-fade-up flex flex-col rounded-2xl border border-line bg-surface opacity-0 shadow-card",
        className,
      )}
    >
      <header className="flex flex-col gap-3 px-4 pb-3 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-textStrong">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-textMuted">{description}</p>
          ) : null}
        </div>
        {control ? <div className="shrink-0">{control}</div> : null}
      </header>
      {legend ? <div className="px-4 pb-3">{legend}</div> : null}
      <div className="min-w-0 flex-1 px-2 pb-4">{children}</div>
    </section>
  );
}

/**
 * Legend for a multi-series chart.
 *
 * Always rendered when there are two or more series, so identity never rests on
 * colour alone — the swatch is beside a text label, and the label itself is in
 * muted ink rather than the series colour.
 */
export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string; value?: string }>;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="text-xs text-textMuted">{item.label}</span>
          {item.value ? (
            <span className="text-xs font-semibold tabular-nums text-textStrong">
              {item.value}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Range switcher shown above a time-series plot. */
export function RangeControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-xl border border-line bg-surfaceMuted/70 p-1"
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={clsx(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            option.value === value
              ? "bg-surface text-textStrong shadow-sm"
              : "text-textMuted hover:text-textStrong",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Shown in place of a plot when a series has nothing in it. */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center px-4 text-center">
      <p className="text-sm text-textMuted">{message}</p>
    </div>
  );
}
