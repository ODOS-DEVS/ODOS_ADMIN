import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-textMuted">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-textStrong">{value}</p>
        </div>
        <div className="rounded-2xl border border-accent/20 bg-panel-gradient p-3 text-accent">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-xs text-textMuted">{hint}</p>
    </div>
  );
}
