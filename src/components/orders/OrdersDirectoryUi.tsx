import { ArrowRight, Edit3, Eye } from "lucide-react";

import {
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";
import type { Order } from "@/types";
import { formatCurrency } from "@/utils/format";

export function OrderSummaryCell({ order }: { order: Order }) {
  return (
    <div className="min-w-[140px] space-y-0.5">
      <p className="font-semibold text-textStrong">{order.orderNumber}</p>
      <p className="truncate text-xs text-textMuted">{order.customerName}</p>
    </div>
  );
}

export function OrderTableActions({
  onQuickView,
  onOpenDetail,
  onUpdateStatus,
}: {
  onQuickView: () => void;
  onOpenDetail: () => void;
  onUpdateStatus: () => void;
}) {
  return (
    <TableActionsCell>
      <TableActionBar>
        <TableActionBarItem label="Quick view" onClick={onQuickView}>
          <Eye className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        <TableActionBarItem label="Full order" onClick={onOpenDetail}>
          <ArrowRight className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        <TableActionBarItem label="Change status" onClick={onUpdateStatus}>
          <Edit3 className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
      </TableActionBar>
    </TableActionsCell>
  );
}

export function OrderAmountCell({ order }: { order: Order }) {
  return (
    <span className="whitespace-nowrap font-medium tabular-nums text-textStrong">
      {formatCurrency(order.totalAmount)}
    </span>
  );
}

export function OrdersDirectorySkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-24 rounded-xl" />
      <SkeletonGrid count={4} className="grid grid-cols-2 gap-3 lg:grid-cols-4" tileClassName="h-28 rounded-2xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </div>
  );
}
