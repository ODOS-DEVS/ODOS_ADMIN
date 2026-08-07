import clsx from "clsx";
import type { ReactNode } from "react";

import { InsightPill } from "@/components/analytics/AnalyticsUi";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";

export function UsersBriefSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-14 rounded-2xl" />
      <SkeletonGrid
        count={4}
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        tileClassName="h-28 rounded-2xl"
        variant="surface"
      />
      <SkeletonBlock variant="surface" className="h-56 rounded-2xl" />
    </div>
  );
}

export function UserDirectorySkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-20 rounded-2xl" />
      <SkeletonBlock className="h-10 rounded-xl" />
      <SkeletonBlock variant="surface" className="h-96 rounded-2xl" />
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-56 rounded-panel" />
      <SkeletonBlock className="h-10 rounded-xl" />
      <SkeletonGrid count={4} className="grid grid-cols-2 gap-3 xl:grid-cols-4" tileClassName="h-28 rounded-2xl" />
      <SkeletonBlock className="h-72 rounded-2xl" />
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
      <div className="flex min-w-max gap-1 rounded-2xl border border-line/80 bg-surfaceMuted/80 p-1.5 shadow-sm">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={clsx(
              "shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition",
              activeId === section.id
                ? "bg-accent text-accentForeground shadow-sm"
                : "text-textMuted hover:bg-surface hover:text-textStrong",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
import { DetailField } from "@/components/ui/DetailList";

export function DetailTile({ label, value }: { label: string; value: ReactNode }) {
  return <DetailField label={label} value={value} />;
}

export function getUserInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
