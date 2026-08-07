import clsx from "clsx";

type SkeletonBlockProps = {
  className?: string;
  delayMs?: number;
  variant?: "muted" | "surface";
};

/** A single pulsing placeholder block. Pass sizing and radius via className — compose into page skeletons. */
export function SkeletonBlock({ className, delayMs = 0, variant = "muted" }: SkeletonBlockProps) {
  return (
    <div
      className={clsx(
        "animate-pulse border border-line",
        variant === "surface" ? "bg-surface shadow-card" : "bg-surfaceMuted",
        className,
      )}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    />
  );
}

/** A row of evenly sized skeleton tiles, e.g. a KPI strip. */
export function SkeletonGrid({
  count,
  className,
  tileClassName,
  variant = "surface",
}: {
  count: number;
  className?: string;
  tileClassName?: string;
  variant?: "muted" | "surface";
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock
          key={index}
          variant={variant}
          delayMs={index * 80}
          className={tileClassName}
        />
      ))}
    </div>
  );
}
