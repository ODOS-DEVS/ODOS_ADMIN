import clsx from "clsx";
import type { ReactNode } from "react";

/** Vertical rhythm for dossiers, modals, and detail panels. */
export function DetailStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("flex flex-col gap-10", className)}>{children}</div>;
}

export function DetailSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("space-y-4", className)}>
      <header className="border-b border-line/90 pb-2.5">
        <h3 className="text-sm font-semibold text-textStrong">{title}</h3>
        {description ? <p className="mt-1.5 text-xs leading-relaxed text-textMuted">{description}</p> : null}
      </header>
      <div className="pt-0.5">{children}</div>
    </section>
  );
}

const COLUMN_CLASS = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

export function DetailFields({
  children,
  columns = 1,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  if (columns === 1) {
    return (
      <dl className={clsx("divide-y divide-line/80 text-sm", className)}>{children}</dl>
    );
  }

  return (
    <dl
      className={clsx(
        "grid gap-x-10 gap-y-2 text-sm",
        COLUMN_CLASS[columns],
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function DetailField({
  label,
  value,
  className,
  emphasize,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  /** Slightly stronger value styling (totals, IDs). */
  emphasize?: boolean;
}) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(8.75rem,11rem)_minmax(0,1fr)] sm:items-start sm:gap-x-4 sm:py-3",
        className,
      )}
    >
      <dt className="text-xs font-medium leading-snug text-textMuted">{label}</dt>
      <dd
        className={clsx(
          "min-w-0 break-words text-sm leading-relaxed text-textStrong",
          emphasize ? "font-semibold tabular-nums" : "font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Compact headline block: title row + optional meta + field grid. */
export function DetailHero({
  title,
  meta,
  badges,
  children,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-4 border-b border-line pb-6", className)}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-lg font-semibold tracking-tight text-textStrong">{title}</div>
          {badges}
        </div>
        {meta ? <p className="text-sm text-textMuted">{meta}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** @deprecated Prefer DetailField */
export const DetailRow = DetailField;
