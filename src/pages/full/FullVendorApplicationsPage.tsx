import { CheckCircle2, ClipboardList, Clock3, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  approveVendorApplication,
  getVendorApplicationsPage,
  rejectVendorApplication,
} from "@/api/vendorApplicationsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import {
  ApplicationMark,
  ApplicationTableActions,
} from "@/components/vendor-applications/VendorApplicationsDirectoryUi";
import { VendorApplicationDetails } from "@/components/vendor/VendorApplicationDetails";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { UserSectionNav } from "@/components/users/UsersUi";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ListToolbar, ListToolbarField } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { TABLE_ACTIONS_COLUMN_CLASS_WIDE } from "@/components/ui/IconButton";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { VendorApplication } from "@/types";
import { formatDate, formatDateTime } from "@/utils/format";
import { formatPaginationRange } from "@/utils/paginationUi";
import {
  buildApplicationQueueSnapshot,
  filterApplicationsByTab,
  type ApplicationQueueTab,
} from "@/utils/vendorApplicationMetrics";

const QUEUE_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "under_review", label: "Under review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Under review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const TOOLBAR_CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm shadow-sm";

export function FullVendorApplicationsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: applications,
    isLoading,
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getVendorApplicationsPage,
    getId: (application) => application.id,
  });
  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
  } = useQueueSearchParams({
    statusValues: ["pending", "under_review", "approved", "rejected"],
  });
  const [activeTab, setActiveTab] = useState<ApplicationQueueTab>("all");
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [approveTarget, setApproveTarget] = useState<VendorApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VendorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const snapshot = useMemo(
    () => buildApplicationQueueSnapshot(applications),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const tabbed = filterApplicationsByTab(applications, activeTab);
    return tabbed.filter((application) => {
      const matchesStatus = statusFilter === "all" ? true : application.status === statusFilter;
      const haystack = [
        application.fullName,
        application.email,
        application.businessName,
        application.storeName,
        application.phoneNumber,
        application.city,
        application.region,
        application.businessCategory,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [activeTab, applications, query, statusFilter]);

  async function handleApprove() {
    if (!token || !approveTarget) return;
    setActionLoading(true);
    try {
      const updated = await approveVendorApplication(token, approveTarget.id);
      replaceItem({ ...approveTarget, ...updated });
      setSelectedApplication((current) =>
        current?.id === updated.id ? { ...current, ...updated } : current,
      );
      showToast({
        title: "Application approved",
        description: `${approveTarget.businessName} now has vendor access.`,
        tone: "success",
      });
      setApproveTarget(null);
    } catch (approveError) {
      showToast({
        title: "Approval failed",
        description:
          approveError instanceof Error ? approveError.message : "Please try again shortly.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!token || !rejectTarget || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const updated = await rejectVendorApplication(token, rejectTarget.id, rejectionReason.trim());
      replaceItem({ ...rejectTarget, ...updated });
      setSelectedApplication((current) =>
        current?.id === updated.id ? { ...current, ...updated } : current,
      );
      showToast({
        title: "Application rejected",
        description: "The rejection reason has been saved for the applicant.",
        tone: "info",
      });
      setRejectTarget(null);
      setRejectionReason("");
    } catch (rejectError) {
      showToast({
        title: "Rejection failed",
        description:
          rejectError instanceof Error ? rejectError.message : "Please try again shortly.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredApplications.length })}${
    hasMore ? " · more pages available" : ""
  }`;

  const activeTabLabel = QUEUE_TABS.find((tab) => tab.id === activeTab)?.label ?? "All";

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Vendor applications"
        title="Complete application queue"
        description={`${snapshot.needsReview} need review on this page · approve or reject with full KYC visible in each dossier.`}
        backRoute="/vendor-applications"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:items-start">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Pending"
            value={String(snapshot.pending)}
            hint={`${snapshot.underReview} under review`}
            icon={Clock3}
            tone="warning"
            animationDelay={40}
          />
          <StatCard
            label="Under review"
            value={String(snapshot.underReview)}
            icon={ClipboardList}
            animationDelay={80}
          />
          <StatCard
            label="Approved"
            value={String(snapshot.approved)}
            icon={CheckCircle2}
            tone="success"
            animationDelay={120}
          />
          <StatCard
            label="Rejected"
            value={String(snapshot.rejected)}
            icon={XCircle}
            tone="warning"
            animationDelay={160}
          />
        </div>

        {snapshot.total > 0 ? (
          <SectionCard compact title="Queue mix" description="Status share on this page">
            <div className="space-y-4">
              <MetricBar
                label="Needs review"
                value={snapshot.needsReview}
                max={snapshot.total}
                displayValue={String(snapshot.needsReview)}
                tone="amber"
              />
              <MetricBar
                label="Approved"
                value={snapshot.approved}
                max={snapshot.total}
                displayValue={String(snapshot.approved)}
                tone="emerald"
              />
            </div>
          </SectionCard>
        ) : null}
      </div>

      <UserSectionNav
        sections={QUEUE_TABS.map((tab) => ({
          id: tab.id,
          label: `${tab.label} (${filterApplicationsByTab(applications, tab.id).length})`,
        }))}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as ApplicationQueueTab)}
      />

      <SectionCard
        compact
        title={`${activeTabLabel} applications`}
        description="Search the queue, preview KYC inline, or open the full application dossier."
        action={
          <ListToolbar>
            <ListToolbarField className="sm:min-w-[16rem]">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search applicant, business, store"
                className={`${TOOLBAR_CONTROL_CLASS} py-0`}
              />
            </ListToolbarField>
            <ListToolbarField className="sm:min-w-[11rem]">
              <FilterSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={statusOptions}
                className={`${TOOLBAR_CONTROL_CLASS} outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10`}
              />
            </ListToolbarField>
          </ListToolbar>
        }
        bodyClassName="p-0"
      >
        <AdminInfiniteList
          compact
          listSummary={listSummary}
          columns={[
            {
              key: "business",
              header: "Business",
              className: "min-w-[220px]",
              render: (application) => (
                <div className="flex items-center gap-3">
                  <ApplicationMark
                    name={application.businessName}
                    logoUrl={application.logoImageUrl}
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate font-semibold text-textStrong">{application.businessName}</p>
                    <p className="truncate text-xs text-textMuted">{application.storeName}</p>
                    <p className="truncate text-[11px] text-textSubtle">{application.businessCategory}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "applicant",
              header: "Applicant",
              className: "min-w-[160px]",
              render: (application) => (
                <div className="space-y-0.5">
                  <p className="truncate text-sm font-medium text-textStrong">{application.fullName}</p>
                  <p className="truncate text-xs text-textMuted">{application.email}</p>
                </div>
              ),
            },
            {
              key: "contact",
              header: "Contact",
              className: "min-w-[140px]",
              render: (application) => (
                <div className="space-y-0.5">
                  <p className="text-sm text-textStrong">{application.phoneNumber}</p>
                  <p className="text-xs text-textMuted">
                    {application.city}, {application.region}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              className: "w-[7.5rem]",
              render: (application) => <StatusBadge status={application.status} />,
            },
            {
              key: "submitted",
              header: "Submitted",
              className: "min-w-[9rem] whitespace-nowrap",
              render: (application) => (
                <div className="space-y-0.5">
                  <p className="text-sm text-textStrong">{formatDate(application.submittedAt)}</p>
                  <p className="text-[11px] text-textSubtle">
                    Updated {formatDate(application.updatedAt)}
                  </p>
                </div>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: TABLE_ACTIONS_COLUMN_CLASS_WIDE,
              render: (application) => (
                <ApplicationTableActions
                  application={application}
                  onPreview={() => setSelectedApplication(application)}
                  onDossier={() => navigate(`/vendor-applications/full/${application.id}`)}
                  onApprove={() => setApproveTarget(application)}
                  onReject={() => setRejectTarget(application)}
                />
              ),
            },
          ]}
          data={filteredApplications}
          keyExtractor={(application) => application.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={isLoadingPage}
          hasMore={hasMore}
          error={error}
          onPageChange={goToPage}
          onRetry={() => void refresh()}
          emptyTitle="No applications match this filter"
          emptyDescription="Try another tab, status, or search term."
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        title={selectedApplication?.businessName ?? "Application preview"}
        description="Full submission packet before opening the dossier."
        size="xl"
        footer={
          selectedApplication ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                className="min-h-10 w-full sm:min-w-[8.5rem] sm:w-auto"
                onClick={() => setSelectedApplication(null)}
              >
                Close
              </Button>
              <Button
                className="min-h-10 w-full sm:min-w-[10.5rem] sm:w-auto"
                onClick={() => navigate(`/vendor-applications/full/${selectedApplication.id}`)}
              >
                Open dossier
              </Button>
            </div>
          ) : null
        }
      >
        {selectedApplication ? (
          <VendorApplicationDetails application={selectedApplication} />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => void handleApprove()}
        title="Approve vendor application"
        description={
          approveTarget
            ? `Approve ${approveTarget.businessName} and grant vendor access on ODOS.`
            : ""
        }
        confirmLabel="Approve application"
        isLoading={actionLoading}
      />

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => {
          if (!actionLoading) {
            setRejectTarget(null);
            setRejectionReason("");
          }
        }}
        title={rejectTarget ? `Reject ${rejectTarget.businessName}` : "Reject application"}
        description="Provide a clear reason so the applicant knows what to fix before reapplying."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="min-h-10 w-full sm:min-w-[8.5rem] sm:w-auto"
              onClick={() => {
                setRejectTarget(null);
                setRejectionReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="min-h-10 w-full sm:min-w-[10.5rem] sm:w-auto"
              onClick={() => void handleReject()}
              isLoading={actionLoading}
              disabled={!rejectionReason.trim()}
            >
              Reject application
            </Button>
          </div>
        }
      >
        <textarea
          className="app-textarea min-h-32"
          placeholder="Explain why this application is being rejected."
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
        />
      </Modal>
    </div>
  );
}
