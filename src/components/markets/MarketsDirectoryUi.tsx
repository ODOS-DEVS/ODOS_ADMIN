import { Edit3, Trash2 } from "lucide-react";

import {
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";
import type { Market } from "@/types";
import { formatDate } from "@/utils/format";

export type MarketDirectorySnapshot = {
  total: number;
  active: number;
  disabled: number;
};

export function MarketMark({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="size-11 shrink-0 rounded-xl border border-line object-cover ring-1 ring-accent/10"
      />
    );
  }

  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-sm font-semibold text-accent ring-1 ring-accent/10">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function MarketTableActions({
  market,
  onEdit,
  onDisable,
}: {
  market: Market;
  onEdit: () => void;
  onDisable: () => void;
}) {
  const isDisabled = market.status === "disabled";

  return (
    <TableActionsCell>
      <TableActionBar>
        <TableActionBarItem label="Edit market" onClick={onEdit}>
          <Edit3 className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        <TableActionBarItem
          label={isDisabled ? "Already disabled" : "Disable market"}
          tone="danger"
          onClick={onDisable}
          disabled={isDisabled}
        >
          <Trash2 className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
      </TableActionBar>
    </TableActionsCell>
  );
}

export function MarketNameCell({ market }: { market: Market }) {
  const imageUrl = market.imageUrl ?? market.image;
  return (
    <div className="flex min-w-[200px] items-center gap-3">
      <MarketMark name={market.name} imageUrl={imageUrl} />
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-semibold text-textStrong">{market.name}</p>
        <p className="truncate text-xs text-textMuted">@{market.slug}</p>
        <p className="text-[11px] text-textSubtle">Added {formatDate(market.createdAt)}</p>
      </div>
    </div>
  );
}

export function MarketsDirectorySkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-24 rounded-xl" />
      <SkeletonGrid count={3} className="grid grid-cols-2 gap-3 lg:grid-cols-3" tileClassName="h-28 rounded-2xl" />
      <SkeletonBlock className="h-10 rounded-xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </div>
  );
}
