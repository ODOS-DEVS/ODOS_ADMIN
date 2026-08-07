import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  variant?: "hero" | "compact";
  tone?: "default" | "warning" | "success" | "info";
  animationDelay?: number;
  onClick?: () => void;
};

const iconToneStyles = {
  default: "bg-accentSoft text-accent",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "hero",
  tone = "default",
  animationDelay = 0,
  onClick,
}: StatCardProps) {
  const interactive = Boolean(onClick);
  const Wrapper = interactive ? "button" : "div";

  if (variant === "compact") {
    return (
      <Wrapper
        type={interactive ? "button" : undefined}
        onClick={onClick}
        style={{ animationDelay: `${animationDelay}ms` }}
        className={clsx(
          "animate-fade-up opacity-0",
          "flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left shadow-card transition",
          interactive && "cursor-pointer hover:border-accent/25",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={clsx("rounded-full p-1.5", iconToneStyles[tone])}>
            <Icon className="size-3.5 shrink-0" />
          </span>
          <span className="truncate text-xs text-textMuted">{label}</span>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-textStrong">{value}</span>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={clsx(
        "animate-fade-up opacity-0",
        "rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition",
        interactive && "cursor-pointer hover:border-accent/25 hover:shadow-soft",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-textMuted">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-textStrong">{value}</p>
          {hint ? <p className="mt-2 text-xs text-textMuted">{hint}</p> : null}
        </div>
        <div className={clsx("rounded-full p-3", iconToneStyles[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
    </Wrapper>
  );
}
