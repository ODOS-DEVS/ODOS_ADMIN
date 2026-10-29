import clsx from "clsx";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

/**
 * Status as a dot and a word, not a coloured pill.
 *
 * BRIEF.md section 4: "7px dot + word. Text stays ink except Failed/Blocked
 * (danger text) and Deleted (muted)."
 *
 * A table of pills reads as a wall of colour where every row competes for
 * attention equally — which is the opposite of what status is for. A dot
 * carries the same information in a tenth of the ink and lets the row's text
 * stay the thing you read, so the eye lands on the few rows that are actually
 * in trouble.
 *
 * The keys below are unchanged, so all 16 call sites keep working: only what
 * a key resolves to has moved, from a pill class to a dot tone.
 */
type Tone = "success" | "danger" | "warning" | "accent" | "neutral";

const toneMap: Record<string, Tone> = {
  active: "success",
  approved: "success",
  delivered: "success",
  paid: "success",
  exchanged: "success",
  visible: "success",
  credit: "success",
  settled: "success",
  eligible: "accent",
  not_eligible: "neutral",
  not_dispatched: "neutral",
  rescheduled: "warning",
  held: "danger",
  customer_problem: "danger",
  customer: "neutral",
  vendor: "accent",
  admin: "accent",
  super_admin: "accent",
  pending: "warning",
  pending_payment: "warning",
  requested: "warning",
  limit_reached: "warning",
  partially_refunded: "warning",
  under_review: "accent",
  processing: "accent",
  ready: "accent",
  out_for_delivery: "accent",
  unread: "accent",
  scheduled: "accent",
  confirmed: "accent",
  blocked: "danger",
  rejected: "danger",
  suspended: "danger",
  cancelled: "danger",
  expired: "danger",
  failed: "danger",
  refunded: "danger",
  debit: "danger",
  hidden: "neutral",
  disabled: "neutral",
  inactive: "neutral",
  draft: "neutral",
  none: "neutral",
};

const dotClasses: Record<Tone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  accent: "bg-accent",
  neutral: "bg-neutral",
};

/** Only genuine failure states earn coloured text; everything else stays ink. */
const DANGER_TEXT = new Set(["failed", "blocked", "rejected", "suspended"]);
const MUTED_TEXT = new Set(["deleted", "inactive", "disabled", "none", "draft", "hidden"]);

function toLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = toneMap[status] ?? "neutral";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 text-[13.5px]",
        DANGER_TEXT.has(status)
          ? "text-danger-text"
          : MUTED_TEXT.has(status)
            ? "text-textMuted"
            : "text-textStrong",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx("size-[7px] shrink-0 rounded-full", dotClasses[tone])}
      />
      {toLabel(status)}
    </span>
  );
}
