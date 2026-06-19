import clsx from "clsx";
import type { ReactNode } from "react";

import { InsightPill } from "@/components/analytics/AnalyticsUi";

export function UsersBriefSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`users-kpi-${index}`}
            className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
    </div>
  );
}

export function UserDirectorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
    </div>
  );
}

export function UserStatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <InsightPill key={item.label} label={item.label} value={item.value} hint={item.hint} />
      ))}
    </div>
  );
}

export function UserSectionNav({
  sections,
  activeId,
  onSelect,
}: {
  sections: Array<{ id: string; label: string }>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1 rounded-xl border border-white/10 bg-surface/95 p-1 backdrop-blur-md">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={clsx(
              "rounded-lg px-3 py-2 text-xs font-medium transition",
              activeId === section.id
                ? "bg-accent/15 text-accentSoft"
                : "text-textMuted hover:bg-white/[0.04] hover:text-textStrong",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-textMuted">{label}</p>
      <div className="mt-1 text-sm text-textStrong">{value}</div>
    </div>
  );
}

export function getUserInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
