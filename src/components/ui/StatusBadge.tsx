import clsx from "clsx";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const toneMap: Record<string, string> = {
  active: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  approved: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  delivered: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  paid: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  under_review: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  processing: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  ready: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  out_for_delivery: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  hidden: "border-slate-400/20 bg-slate-500/10 text-slate-200",
  unread: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  blocked: "border-red-400/30 bg-red-500/10 text-red-100",
  rejected: "border-red-400/30 bg-red-500/10 text-red-100",
  suspended: "border-red-400/30 bg-red-500/10 text-red-100",
  cancelled: "border-red-400/30 bg-red-500/10 text-red-100",
  failed: "border-red-400/30 bg-red-500/10 text-red-100",
  refunded: "border-red-400/30 bg-red-500/10 text-red-100",
  disabled: "border-slate-400/20 bg-slate-500/10 text-slate-200",
  inactive: "border-slate-400/20 bg-slate-500/10 text-slate-200",
  draft: "border-slate-400/20 bg-slate-500/10 text-slate-200",
  none: "border-slate-400/20 bg-slate-500/10 text-slate-200",
  confirmed: "border-violet-400/30 bg-violet-500/10 text-violet-100",
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
