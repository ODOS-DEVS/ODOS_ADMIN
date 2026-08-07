import clsx from "clsx";
import {
  ArrowRight,
  Eye,
  PauseCircle,
  PlayCircle,
  Store as StoreIcon,
  Warehouse,
} from "lucide-react";

import {
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";
import type { Store } from "@/types";

export type StoreDirectorySnapshot = {
  total: number;
  active: number;
  suspended: number;
  draft: number;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StoreMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="size-10 shrink-0 rounded-xl border border-line object-cover ring-1 ring-accent/10"
      />
    );
  }

  return (
    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-sm font-semibold text-accent ring-1 ring-accent/10">
      {initialsFromName(name)}
    </span>
  );
}

export function StoreTableActions({
  store,
  onPreview,
  onDossier,
  onToggleStatus,
}: {
  store: Store;
  onPreview: () => void;
  onDossier: () => void;
  onToggleStatus: () => void;
}) {
  const isSuspended = store.status === "suspended";

  return (
    <TableActionsCell>
      <TableActionBar>
        <TableActionBarItem label="Quick preview" onClick={onPreview}>
          <Eye className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        <TableActionBarItem
          label={isSuspended ? "Activate store" : "Suspend store"}
          tone={isSuspended ? "success" : "danger"}
          onClick={onToggleStatus}
        >
          {isSuspended ? (
            <PlayCircle className="size-4 shrink-0" strokeWidth={2} />
          ) : (
            <PauseCircle className="size-4 shrink-0" strokeWidth={2} />
          )}
        </TableActionBarItem>
        <TableActionBarItem label="Open store dossier" onClick={onDossier}>
          <ArrowRight className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
      </TableActionBar>
    </TableActionsCell>
  );
}

export function StoreLocationCell({ store }: { store: Store }) {
  return (
    <div className="min-w-[140px] space-y-0.5">
      <p className="truncate text-sm text-textStrong">{store.location ?? "Not set"}</p>
      <p className="truncate text-xs text-textMuted">
        {store.city}, {store.region}
      </p>
    </div>
  );
}

export function StoreMarketBadge({ name }: { name: string }) {
  const unassigned = name === "Unassigned";
  return (
    <span
      className={clsx(
        "inline-flex max-w-full truncate rounded-lg border px-2.5 py-1 text-xs font-medium",
        unassigned
          ? "border-line bg-surfaceMuted text-textMuted"
          : "border-accent/20 bg-accentSoft text-accent",
      )}
    >
      {name}
    </span>
  );
}

export function StoresDirectorySkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-24 rounded-xl" />
      <SkeletonGrid count={4} className="grid grid-cols-2 gap-3 lg:grid-cols-4" tileClassName="h-28 rounded-2xl" />
      <SkeletonBlock className="h-10 rounded-xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </div>
  );
}
