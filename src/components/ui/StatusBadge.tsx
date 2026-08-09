import clsx from "clsx";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const toneMap: Record<string, string> = {
  active: "bg-success-soft text-success",
  approved: "bg-success-soft text-success",
  delivered: "bg-success-soft text-success",
  paid: "bg-success-soft text-success",
  exchanged: "bg-success-soft text-success",
  visible: "bg-success-soft text-success",
  credit: "bg-success-soft text-success",
  settled: "bg-success-soft text-success",
  eligible: "bg-info-soft text-info",
  not_eligible: "bg-neutralBadge-soft text-neutralBadge",
  not_dispatched: "bg-neutralBadge-soft text-neutralBadge",
  rescheduled: "bg-warning-soft text-warning",
  held: "bg-danger-soft text-danger",
  customer_problem: "bg-danger-soft text-danger",
  customer: "bg-neutralBadge-soft text-neutralBadge",
  vendor: "bg-info-soft text-info",
  admin: "bg-accentSoft text-accent",
  super_admin: "bg-accentSoft text-accent",
  pending: "bg-warning-soft text-warning",
  pending_payment: "bg-warning-soft text-warning",
  requested: "bg-warning-soft text-warning",
  limit_reached: "bg-warning-soft text-warning",
  partially_refunded: "bg-warning-soft text-warning",
  under_review: "bg-info-soft text-info",
  processing: "bg-info-soft text-info",
  ready: "bg-info-soft text-info",
  out_for_delivery: "bg-info-soft text-info",
  unread: "bg-info-soft text-info",
  scheduled: "bg-info-soft text-info",
  confirmed: "bg-info-soft text-info",
  blocked: "bg-danger-soft text-danger",
  rejected: "bg-danger-soft text-danger",
  suspended: "bg-danger-soft text-danger",
  cancelled: "bg-danger-soft text-danger",
  expired: "bg-danger-soft text-danger",
  failed: "bg-danger-soft text-danger",
  refunded: "bg-danger-soft text-danger",
  debit: "bg-danger-soft text-danger",
  hidden: "bg-neutralBadge-soft text-neutralBadge",
  disabled: "bg-neutralBadge-soft text-neutralBadge",
  inactive: "bg-neutralBadge-soft text-neutralBadge",
  draft: "bg-neutralBadge-soft text-neutralBadge",
  none: "bg-neutralBadge-soft text-neutralBadge",
};

function toLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = toneMap[status] ?? "bg-neutralBadge-soft text-neutralBadge";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      {toLabel(status)}
    </span>
  );
}
