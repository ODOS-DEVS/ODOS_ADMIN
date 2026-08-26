import { CheckCircle2, ClipboardList, Clock3, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  approveVendorApplication,
  getVendorApplicationsPage,
  rejectVendorApplication,
} from "@/api/vendorApplicationsApi";
import {
  ApplicationMark,
  ApplicationTableActions,
} from "@/components/vendor-applications/VendorApplicationsDirectoryUi";
import { VendorApplicationDetails } from "@/components/vendor/VendorApplicationDetails";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { DirectoryPage } from "@/components/directory/DirectoryPage";
import type { DirectoryColumn } from "@/components/directory/DirectoryTable";
import { SegmentedTabs } from "@/components/directory/SegmentedTabs";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { TABLE_ACTIONS_COLUMN_CLASS_WIDE } from "@/components/ui/IconButton";
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

  const columns = useMemo<Array<DirectoryColumn<VendorApplication>>>(
    () => [
      {
        key: "business",
        header: "Business",
        sortable: true,
        className: "min-w-[14rem]",
        render: (application) => (
          <div className="flex min-w-0 items-center gap-3">
            <ApplicationMark name={application.businessName} logoUrl={application.logoImageUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium text-textStrong">{application.businessName}</p>
              <p className="truncate text-xs text-textMuted">{application.storeName}</p>
            </div>
          </div>
        ),
      },
      {
        key: "applicant",
        header: "Applicant",
        className: "min-w-[11rem] max-w-[15rem]",
        render: (application) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-textStrong">{application.fullName}</p>
            <p className="truncate text-xs text-textMuted">{application.email}</p>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Contact",
        className: "min-w-[10rem]",
        render: (application) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-textStrong">{application.phoneNumber}</p>
            <p className="truncate text-xs text-textMuted">
              {application.city}, {application.region}
            </p>
          </div>
        ),
      },
      {
        key: "submitted",
        header: "Submitted",
        sortable: true,
        className: "min-w-[9rem] whitespace-nowrap",
        render: (application) => (
          <div>
            <p className="text-sm text-textStrong">{formatDate(application.submittedAt)}</p>
            <p className="mt-0.5 text-[11px] text-textSubtle">
              Updated {formatDate(application.updatedAt)}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[8.5rem]",
        render: (application) => (
          <StatePill
            label={labelForStatus(application.status)}
            tone={toneForStatus(application.status)}
          />
        ),
      },
      {
        key: "actions",
        header: "Action",
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
    ],
    [navigate],
  );

  return (
    <DirectoryPage
      eyebrow="Vendor applications"
      title="Complete application queue"
      description="Approve or reject vendor sign-ups, with full KYC in each dossier."
      backRoute="/vendor-applications"
      onRefresh={() => void refresh()}
      refreshing={isLoading}
      metrics={[
        {
          label: "Needs review",
          value: snapshot.needsReview.toLocaleString(),
          icon: Clock3,
          tone: "warning",
          caption: `${snapshot.pending} pending · ${snapshot.underReview} under review`,
        },
        {
          label: "Under review",
          value: snapshot.underReview.toLocaleString(),
          icon: ClipboardList,
          caption: "Being assessed now",
        },
        {
          label: "Approved",
          value: snapshot.approved.toLocaleString(),
          icon: CheckCircle2,
          tone: "success",
          caption: "Trading on ODOS",
        },
        {
          label: "Rejected",
          value: snapshot.rejected.toLocaleString(),
          icon: XCircle,
          tone: "danger",
          caption: "Declined applications",
        },
      ]}
      search={
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Applicant, business or store"
          className="h-10 py-0"
        />
      }
      filters={
        <FilterSelect
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={statusOptions}
          className="h-10"
        />
      }
      tabs={
        <SegmentedTabs
          ariaLabel="Filter applications"
          tabs={QUEUE_TABS.map((tab) => ({
            value: tab.id,
            label: tab.label,
            count: filterApplicationsByTab(applications, tab.id).length,
          }))}
          value={activeTab}
          onChange={(value) => setActiveTab(value as ApplicationQueueTab)}
        />
      }
      cardTitle={`${activeTabLabel} applications`}
      count={filteredApplications.length}
      listSummary={listSummary}
      columns={columns}
      data={filteredApplications}
      keyExtractor={(application) => application.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refresh()}
      emptyTitle="No applications match this filter"
      emptyDescription="Try another tab, status, or search term."
      pagination={{
        page,
        pageSize,
        onPageChange: goToPage,
        hasMore,
        isLoadingPage,
        loadedLabel: `per page · ${applications.length} loaded`,
      }}
    >
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
    </DirectoryPage>
  );
}
