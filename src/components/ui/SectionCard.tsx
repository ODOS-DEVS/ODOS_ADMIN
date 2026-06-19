import clsx from "clsx";
import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  className?: string;
  bodyClassName?: string;
  animationDelay?: number;
};

export function SectionCard({
  title,
  description,
  action,
  children,
  compact = false,
  className,
  bodyClassName,
  animationDelay = 0,
}: SectionCardProps) {
  return (
    <section
      style={{ animationDelay: `${animationDelay}ms` }}
      className={clsx(
        "animate-fade-up opacity-0",
        "rounded-2xl border border-white/10 bg-panel/80 shadow-glow",
        className,
      )}
    >
      {title || description || action ? (
        <div
          className={clsx(
            "flex flex-col gap-2 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between",
            compact ? "px-4 py-3" : "px-5 py-4",
          )}
        >
          <div className="min-w-0">
            {title ? (
              <h2 className={clsx("font-semibold text-textStrong", compact ? "text-base" : "text-lg")}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className={clsx("text-textMuted", compact ? "mt-0.5 text-xs" : "mt-1 text-sm")}>
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={clsx(compact ? "p-4" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
