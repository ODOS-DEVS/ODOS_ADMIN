import { UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AdminDetailHeader,
  AdminPageSkeleton,
  AdminTabNav,
  AdminTabPanel,
  HeaderActionButton,
} from "@/components/admin/AdminShell";
import { EntityTimeline, RelatedRecordsCard } from "@/components/admin/EntityOps";
import {
  buildVendorRelatedLinks,
  VendorDossier360Overview,
  VendorDossierPerformancePanel,
} from "@/components/vendors/VendorDossierUi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getVendor, updateVendorStatus } from "@/api/vendorsApi";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useTabSection } from "@/hooks/useTabSection";
import { useToast } from "@/hooks/useToast";
import type { Vendor } from "@/types";

const VENDOR_TABS = [
  { id: "overview", label: "360° overview" },
  { id: "performance", label: "Performance" },
  { id: "relationships", label: "Relationships" },
  { id: "timeline", label: "Timeline" },
] as const;

function VendorDetailShell({
  vendor,
  onRefresh,
  refreshing,
  actions,
  children,
}: {
  vendor: Vendor;
  onRefresh: () => void;
  refreshing: boolean;
  actions: ReactNode;
  children: (tab: string) => ReactNode;
}) {
  const { activeSection, setActiveSection } = useTabSection<string>("overview");

  return (
    <div className="space-y-6">
      <AdminDetailHeader
        eyebrow="Vendor dossier"
        title={vendor.businessName}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{vendor.email}</span>
            <StatusBadge status={vendor.status} />
            <span className="text-textSubtle">·</span>
            <span>{vendor.businessCategory}</span>
          </span>
        }
        backRoute="/vendors/full"
        onRefresh={onRefresh}
        refreshing={refreshing}
        actions={actions}
      />
      <AdminTabNav sections={[...VENDOR_TABS]} activeId={activeSection} onSelect={setActiveSection} />
      {VENDOR_TABS.map((tab) => (
        <AdminTabPanel key={tab.id} activeSection={activeSection} sectionId={tab.id}>
          {children(tab.id)}
        </AdminTabPanel>
      ))}
    </div>
  );
}

export function VendorDetailPage() {
  const navigate = useNavigate();
  const { vendorId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: vendorId,
    loadDetail: getVendor,
  });
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleStatusToggle() {
    if (!token || !record) return;
    const nextStatus: Vendor["status"] = record.status === "suspended" ? "active" : "suspended";
    setActionLoading(true);
    try {
      const updated = await updateVendorStatus(token, record.id, nextStatus);
      setRecord(updated);
      showToast({
        title: nextStatus === "suspended" ? "Vendor suspended" : "Vendor reactivated",
        description: `${updated.businessName} is now ${nextStatus}.`,
        tone: "success",
      });
      setConfirmSuspend(false);
    } catch (updateError) {
      showToast({
        title: "Unable to update vendor",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <AdminPageSkeleton blocks={3} />;
  }

  if (error || !record) {
    return (
      <ErrorState description={error ?? "Vendor not found."} onRetry={() => void reload()} />
    );
  }

  const vendor = record;
  const relatedRecords = buildVendorRelatedLinks(vendor).map((link) => ({
    id: link.id,
    label: link.label,
    meta: link.meta,
    href: link.href,
  }));

  return (
    <>
      <VendorDetailShell
        vendor={vendor}
        onRefresh={() => void reload(true)}
        refreshing={isRefreshing}
        actions={
          <>
            <HeaderActionButton
              variant="secondary"
              leftIcon={<UserRound className="size-4" />}
              onClick={() => navigate(`/users/full/${vendor.userId}`)}
            >
              Owner
            </HeaderActionButton>
            <HeaderActionButton
              variant={vendor.status === "suspended" ? "primary" : "danger"}
              onClick={() => setConfirmSuspend(true)}
            >
              {vendor.status === "suspended" ? "Reactivate" : "Suspend"}
            </HeaderActionButton>
          </>
        }
      >
        {(tab) =>
          tab === "overview" ? (
            <VendorDossier360Overview vendor={vendor} />
          ) : tab === "performance" ? (
            <VendorDossierPerformancePanel vendor={vendor} />
          ) : tab === "relationships" ? (
            <RelatedRecordsCard
              title="Related records"
              description="Linked user, catalog, and treasury objects"
              records={relatedRecords}
            />
          ) : (
            <EntityTimeline entityType="vendor" entityId={vendor.id} actorId={vendor.userId} />
          )
        }
      </VendorDetailShell>

      <ConfirmDialog
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={() => void handleStatusToggle()}
        title={vendor.status === "suspended" ? "Reactivate vendor" : "Suspend vendor"}
        description={
          vendor.status === "suspended"
            ? `Restore ${vendor.businessName} to active selling status.`
            : `Suspend ${vendor.businessName} from selling on ODOS.`
        }
        confirmLabel={vendor.status === "suspended" ? "Reactivate" : "Suspend"}
        confirmVariant={vendor.status === "suspended" ? "primary" : "danger"}
        isLoading={actionLoading}
      />
    </>
  );
}
