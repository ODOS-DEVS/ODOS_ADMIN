export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-col items-center gap-3">
        <span className="size-9 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
        <p className="text-sm text-textMuted">{label}</p>
      </div>
    </div>
  );
}
