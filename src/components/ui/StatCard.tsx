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

const toneStyles = {
  default: "border-white/10 hover:border-white/20",
  warning: "border-warning/35 bg-warning/[0.06] hover:border-warning/50",
  success: "border-success/30 bg-success/[0.05] hover:border-success/45",
  info: "border-info/30 bg-info/[0.05] hover:border-info/45",
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
          "flex items-center justify-between gap-3 rounded-2xl border bg-white/[0.02] px-3.5 py-2.5 text-left transition",
          toneStyles[tone],
          interactive && "cursor-pointer hover:bg-white/[0.04]",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="rounded-xl border border-accent/20 bg-panel-gradient p-1.5 text-accent">
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
        "rounded-2xl border bg-panel/80 p-4 shadow-glow text-left transition",
        toneStyles[tone],
        interactive && "cursor-pointer hover:bg-panel/90 hover:shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-textMuted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-textStrong">{value}</p>
          {hint ? <p className="mt-2 line-clamp-1 text-xs text-textMuted">{hint}</p> : null}
        </div>
        <div className="rounded-xl border border-accent/20 bg-panel-gradient p-2.5 text-accent">
          <Icon className="size-4" />
        </div>
      </div>
    </Wrapper>
  );
}
