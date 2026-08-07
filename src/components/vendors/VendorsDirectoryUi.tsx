import type { MouseEvent } from "react";
import { ArrowRight, Eye, PauseCircle, PlayCircle } from "lucide-react";

import {
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import type { Vendor } from "@/types";
import { DetailField } from "@/components/ui/DetailList";

function initialsFromBusiness(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function VendorMark({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "size-14 text-base" : "size-10 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-accentSoft font-semibold text-accent ring-1 ring-accent/10 ${sizeClass}`}
    >
      {initialsFromBusiness(name)}
    </span>
  );
}

export function VendorPerformanceGrid({ vendor }: { vendor: Vendor }) {
  return (
    <p className="text-sm text-textMuted">
      <span className="font-semibold tabular-nums text-textStrong">{vendor.totalStores}</span> stores ·{" "}
      <span className="font-semibold tabular-nums text-textStrong">{vendor.totalProducts}</span> products ·{" "}
      <span className="font-semibold tabular-nums text-textStrong">{vendor.totalOrders}</span> orders
    </p>
  );
}

export function VendorDetailRow({ label, value }: { label: string; value: string }) {
  return <DetailField label={label} value={value} />;
}

export function VendorTableActions({
  vendor,
  onPreview,
  onToggleStatus,
  onDossier,
}: {
  vendor: Vendor;
  onPreview: () => void;
  onToggleStatus: () => void;
  onDossier: () => void;
}) {
  const isActive = vendor.status === "active";

  const stop = (handler: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler();
  };

  return (
    <TableActionsCell>
      <TableActionBar>
        <TableActionBarItem label="Quick preview" onClick={stop(onPreview)}>
          <Eye className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        <TableActionBarItem
          label={isActive ? "Suspend vendor" : "Activate vendor"}
          tone={isActive ? "danger" : "success"}
          onClick={stop(onToggleStatus)}
        >
          {isActive ? (
            <PauseCircle className="size-4 shrink-0" strokeWidth={2} />
          ) : (
            <PlayCircle className="size-4 shrink-0" strokeWidth={2} />
          )}
        </TableActionBarItem>
        <TableActionBarItem label="Open vendor dossier" onClick={stop(onDossier)}>
          <ArrowRight className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
      </TableActionBar>
    </TableActionsCell>
  );
}
