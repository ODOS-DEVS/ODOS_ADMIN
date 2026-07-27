import clsx from "clsx";

type LoadingStateProps = {
  label?: string;
  size?: "md" | "sm";
};

export function LoadingState({ label = "Loading...", size = "md" }: LoadingStateProps) {
  const compact = size === "sm";

  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]",
        compact ? "min-h-[96px] px-4 py-6" : "min-h-[240px] rounded-3xl",
      )}
    >
      <div className={clsx("flex flex-col items-center", compact ? "gap-2" : "gap-3")}>
        <span
          className={clsx(
            "animate-spin rounded-full border-2 border-accent/40 border-t-accent",
            compact ? "size-6" : "size-9",
          )}
        />
        <p className={clsx("text-textMuted", compact ? "text-xs" : "text-sm")}>{label}</p>
      </div>
    </div>
  );
}
