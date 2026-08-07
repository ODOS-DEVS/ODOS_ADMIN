import clsx from "clsx";

type LiveIndicatorTone = "success" | "warning" | "danger";

const toneClasses: Record<LiveIndicatorTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const dotClasses: Record<LiveIndicatorTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Broadcast-style "on air" pulse used for realtime connection state. */
export function LiveIndicator({
  label,
  tone,
  pulse = true,
}: {
  label: string;
  tone: LiveIndicatorTone;
  pulse?: boolean;
}) {
  return (
    <div className={clsx("inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em]", toneClasses[tone])}>
      <span className="relative flex size-2">
        {pulse ? (
          <span className={clsx("absolute inline-flex size-full animate-ping rounded-full opacity-60", dotClasses[tone])} />
        ) : null}
        <span className={clsx("relative inline-flex size-2 rounded-full", dotClasses[tone])} />
      </span>
      {label}
    </div>
  );
}
