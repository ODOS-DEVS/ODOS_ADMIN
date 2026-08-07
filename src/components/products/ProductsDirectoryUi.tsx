import { ArrowRight, Edit3, Tag } from "lucide-react";

import {
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

export function ProductMark({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
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
    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surfaceMuted text-xs text-textMuted">
      —
    </span>
  );
}

export function ProductNameCell({ product }: { product: Product }) {
  const categoryLabel =
    (product.categorySlugs?.length ?? 0) > 1
      ? `${product.category} + ${(product.categorySlugs?.length ?? 1) - 1} more`
      : product.category;

  return (
    <div className="flex min-w-[200px] items-center gap-3">
      <ProductMark name={product.name} imageUrl={product.images[0]} />
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-semibold text-textStrong">{product.name}</p>
        <p className="truncate text-xs text-textMuted">{categoryLabel}</p>
        <p className="truncate text-[11px] text-textSubtle">
          {product.subcategory ?? "No subcategory"}
        </p>
      </div>
    </div>
  );
}

export function ProductTableActions({
  product,
  onEdit,
  onOpenDetail,
  onStatus,
}: {
  product: Product;
  onEdit: () => void;
  onOpenDetail: () => void;
  onStatus: () => void;
}) {
  const statusLabel =
    product.status === "pending" ? "Review status" : "Change status";

  return (
    <TableActionsCell>
      <TableActionBar>
        <TableActionBarItem label="Edit product" onClick={onEdit}>
          <Edit3 className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        <TableActionBarItem label="Product details" onClick={onOpenDetail}>
          <ArrowRight className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        <TableActionBarItem label={statusLabel} onClick={onStatus}>
          <Tag className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
      </TableActionBar>
    </TableActionsCell>
  );
}

export function ProductsDirectorySkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-24 rounded-xl" />
      <SkeletonGrid count={4} className="grid grid-cols-2 gap-3 lg:grid-cols-4" tileClassName="h-28 rounded-2xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </div>
  );
}
