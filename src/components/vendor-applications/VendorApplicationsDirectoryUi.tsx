import { ArrowRight, CheckCircle2, Eye, XCircle } from "lucide-react";

import {
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import type { VendorApplication } from "@/types";

function initialsFromBusiness(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ApplicationMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
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
      {initialsFromBusiness(name)}
    </span>
  );
}

export function ApplicationTableActions({
  application,
  onPreview,
  onDossier,
  onApprove,
  onReject,
}: {
  application: VendorApplication;
  onPreview: () => void;
  onDossier: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const showApprove = application.status !== "approved";
  const showReject = application.status !== "rejected";

  return (
    <TableActionsCell>
      <TableActionBar>
        <TableActionBarItem label="Quick preview" onClick={onPreview}>
          <Eye className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
        {showApprove ? (
          <TableActionBarItem label="Approve application" tone="success" onClick={onApprove}>
            <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
          </TableActionBarItem>
        ) : null}
        {showReject ? (
          <TableActionBarItem label="Reject application" tone="danger" onClick={onReject}>
            <XCircle className="size-4 shrink-0" strokeWidth={2} />
          </TableActionBarItem>
        ) : null}
        <TableActionBarItem label="Open application dossier" onClick={onDossier}>
          <ArrowRight className="size-4 shrink-0" strokeWidth={2} />
        </TableActionBarItem>
      </TableActionBar>
    </TableActionsCell>
  );
}
