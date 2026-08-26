import clsx from "clsx";

export type StateTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const toneStyles: Record<StateTone, { pill: string; dot: string }> = {
  success: { pill: "bg-success-soft text-success", dot: "bg-success" },
  warning: { pill: "bg-warning-soft text-warning", dot: "bg-warning" },
  danger: { pill: "bg-danger-soft text-danger", dot: "bg-danger" },
  info: { pill: "bg-info-soft text-info", dot: "bg-info" },
  accent: { pill: "bg-accentSoft text-accent", dot: "bg-accent" },
  neutral: { pill: "bg-neutralBadge-soft text-neutralBadge", dot: "bg-neutralBadge" },
};

/**
 * Status pill with a leading dot.
 *
 * The dot carries the state at a glance when you are scanning a column of forty
 * rows; the word confirms it. Colour alone is never the only signal — the label
 * always spells the state out.
 */
export function StatePill({
  label,
  tone,
  className,
}: {
  label: string;
  tone: StateTone;
  className?: string;
}) {
  const styles = toneStyles[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium",
        styles.pill,
        className,
      )}
    >
      <span className={clsx("size-1.5 shrink-0 rounded-full", styles.dot)} aria-hidden />
      {label}
    </span>
  );
}
