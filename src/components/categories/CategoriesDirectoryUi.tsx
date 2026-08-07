import { Edit3, PauseCircle, RotateCcw, Trash2 } from "lucide-react";

import {
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";
import type { Category } from "@/types";

export function CategoryMark({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="size-10 shrink-0 rounded-xl border border-line object-cover"
      />
    );
  }

  return (
    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surfaceMuted text-xs font-semibold text-textMuted">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function CategoryNameCell({ category }: { category: Category }) {
  const subCount = category.subcategories?.length ?? 0;
  return (
    <div className="flex min-w-[200px] items-center gap-3">
      <CategoryMark name={category.name} imageUrl={category.imageUrl} />
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-semibold text-textStrong">{category.name}</p>
        <p className="truncate text-xs text-textMuted">@{category.slug}</p>
        <p className="text-[11px] text-textSubtle">
          {subCount} subcategor{subCount === 1 ? "y" : "ies"}
        </p>
      </div>
    </div>
  );
}

export function CategoryTableActions({
  category,
  isBusy,
  onEdit,
  onDisable,
  onEnable,
  onDeletePermanently,
}: {
  category: Category;
  isBusy?: boolean;
  onEdit: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onDeletePermanently: () => void;
}) {
  const isDisabled = category.status === "disabled";

  return (
    <TableActionsCell>
      <TableActionBar>
        <TableActionBarItem label="Edit category" onClick={onEdit} disabled={isBusy}>
          <Edit3 className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        {isDisabled ? (
          <>
            <TableActionBarItem
              label="Enable category"
              tone="success"
              onClick={onEnable}
              disabled={isBusy}
            >
              <RotateCcw className="size-4 shrink-0" strokeWidth={2} />
            </TableActionBarItem>
            <TableActionBarItem
              label="Delete permanently"
              tone="danger"
              onClick={onDeletePermanently}
              disabled={isBusy}
            >
              <Trash2 className="size-4 shrink-0" strokeWidth={2} />
            </TableActionBarItem>
          </>
        ) : (
          <TableActionBarItem
            label="Disable category"
            tone="danger"
            onClick={onDisable}
            disabled={isBusy}
          >
            <PauseCircle className="size-4 shrink-0" strokeWidth={2} />
          </TableActionBarItem>
        )}
      </TableActionBar>
    </TableActionsCell>
  );
}

export function CategoriesDirectorySkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-24 rounded-xl" />
      <SkeletonGrid count={3} className="grid grid-cols-2 gap-3 lg:grid-cols-3" tileClassName="h-28 rounded-2xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </div>
  );
}
