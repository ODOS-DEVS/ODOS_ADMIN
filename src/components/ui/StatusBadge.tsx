import clsx from "clsx";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

/** Map statuses onto design-system semantic tokens (success/warning/info/danger). */
const toneMap: Record<string, string> = {
  active: "border-success/30 bg-success/10 text-success",
  approved: "border-success/30 bg-success/10 text-success",
  delivered: "border-success/30 bg-success/10 text-success",
  paid: "border-success/30 bg-success/10 text-success",
  exchanged: "border-success/30 bg-success/10 text-success",
  visible: "border-success/30 bg-success/10 text-success",
  credit: "border-success/30 bg-success/10 text-success",
  pending: "border-warning/30 bg-warning/10 text-warning",
  pending_payment: "border-warning/30 bg-warning/10 text-warning",
  requested: "border-warning/30 bg-warning/10 text-warning",
  limit_reached: "border-warning/30 bg-warning/10 text-warning",
  partially_refunded: "border-warning/30 bg-warning/10 text-warning",
  under_review: "border-info/30 bg-info/10 text-info",
  processing: "border-info/30 bg-info/10 text-info",
  ready: "border-info/30 bg-info/10 text-info",
  out_for_delivery: "border-info/30 bg-info/10 text-info",
  unread: "border-info/30 bg-info/10 text-info",
  scheduled: "border-info/30 bg-info/10 text-info",
  confirmed: "border-info/30 bg-info/10 text-info",
  blocked: "border-danger/30 bg-danger/10 text-danger",
  rejected: "border-danger/30 bg-danger/10 text-danger",
  suspended: "border-danger/30 bg-danger/10 text-danger",
  cancelled: "border-danger/30 bg-danger/10 text-danger",
  expired: "border-danger/30 bg-danger/10 text-danger",
  failed: "border-danger/30 bg-danger/10 text-danger",
  refunded: "border-danger/30 bg-danger/10 text-danger",
  debit: "border-danger/30 bg-danger/10 text-danger",
  hidden: "border-white/10 bg-white/5 text-textMuted",
  disabled: "border-white/10 bg-white/5 text-textMuted",
  inactive: "border-white/10 bg-white/5 text-textMuted",
  draft: "border-white/10 bg-white/5 text-textMuted",
  none: "border-white/10 bg-white/5 text-textMuted",
};

function toLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = toneMap[status] ?? "border-white/10 bg-white/5 text-textMuted";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      {toLabel(status)}
    </span>
  );
}
