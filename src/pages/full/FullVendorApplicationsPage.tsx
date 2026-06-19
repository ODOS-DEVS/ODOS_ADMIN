import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  approveVendorApplication,
  getVendorApplicationsPage,
  rejectVendorApplication,
} from "@/api/vendorApplicationsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { VendorApplicationDetails } from "@/components/vendor/VendorApplicationDetails";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { VendorApplication, VendorStatus } from "@/types";
import { formatDateTime } from "@/utils/format";

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Under review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export function FullVendorApplicationsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: applications,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getVendorApplicationsPage,
    getId: (application) => application.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [approveTarget, setApproveTarget] = useState<VendorApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VendorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const summary = useMemo(() => {
    const counts: Record<VendorStatus, number> = {
      none: 0,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    };

    applications.forEach((application) => {
      counts[application.status] += 1;
    });

    return counts;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
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
  }, [applications, query, statusFilter]);

  async function handleApprove() {
    if (!token || !approveTarget) return;
    setActionLoading(true);
    try {
      const updated = await approveVendorApplication(token, approveTarget.id);
      replaceItem({ ...(approveTarget ?? rejectTarget ?? updated), ...updated });
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
      replaceItem({ ...(approveTarget ?? rejectTarget ?? updated), ...updated });
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

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Vendor applications"
        title="Complete application queue"
        description="Review, approve, or reject every vendor onboarding submission."
        backRoute="/vendor-applications"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Pending", summary.pending.toString()],
          ["Under review", summary.under_review.toString()],
          ["Approved", summary.approved.toString()],
          ["Rejected", summary.rejected.toString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
            <p className="text-sm text-textMuted">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-textStrong">{value}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Review queue"
        description="Filter by status, inspect the full submission, then approve or reject with confidence."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applicant, business, or store"
              className="sm:w-72"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={statusOptions}
            />
          </div>
        }
      >
        <AdminInfiniteList
            columns={[
              {
                key: "business",
                header: "Business",
                render: (application) => (
                  <div>
                    <p className="font-medium">{application.businessName}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {application.storeName} · {application.businessCategory}
                    </p>
                  </div>
                ),
              },
              {
                key: "applicant",
                header: "Applicant",
                render: (application) => (
                  <div>
                    <p>{application.fullName}</p>
                    <p className="mt-1 text-xs text-textMuted">{application.email}</p>
                  </div>
                ),
              },
              {
                key: "contact",
                header: "Contact",
                render: (application) => (
                  <div>
                    <p>{application.phoneNumber}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {application.city}, {application.region}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (application) => <StatusBadge status={application.status} />,
              },
              {
                key: "submitted",
                header: "Submitted",
                render: (application) => (
                  <div>
                    <p>{formatDateTime(application.submittedAt)}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      Updated {formatDateTime(application.updatedAt)}
                    </p>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (application) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/vendor-applications/full/${application.id}`)}
                    >
                      Open dossier
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => setSelectedApplication(application)}
                    >
                      View
                    </Button>
                    {application.status !== "approved" ? (
                      <Button
                        leftIcon={<CheckCircle2 className="size-4" />}
                        onClick={() => setApproveTarget(application)}
                      >
                        Approve
                      </Button>
                    ) : null}
                    {application.status !== "rejected" ? (
                      <Button
                        variant="danger"
                        leftIcon={<XCircle className="size-4" />}
                        onClick={() => setRejectTarget(application)}
                      >
                        Reject
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
            data={filteredApplications}
            keyExtractor={(application) => application.id}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={() => void loadMore()}
            onRetry={() => void refresh()}
            emptyTitle="No applications match this filter"
            emptyDescription="Try a different status or search term to find the submission you need."
          />
      </SectionCard>

      <Modal
        open={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        title={selectedApplication?.businessName ?? "Application details"}
        description="Everything the vendor submitted in their ODOS application."
        size="xl"
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
            ? `Approve ${approveTarget.businessName} and grant vendor access to the same ODOS account.`
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
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
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
