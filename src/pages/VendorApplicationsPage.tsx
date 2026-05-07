import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  approveVendorApplication,
  getVendorApplications,
  rejectVendorApplication,
} from "@/api/vendorApplicationsApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

export function VendorApplicationsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [approveTarget, setApproveTarget] = useState<VendorApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VendorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadApplications = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getVendorApplications(token);
      setApplications(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

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
        application.businessName,
        application.storeName,
        application.phoneNumber,
        application.city,
        application.region,
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
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
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
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      showToast({
        title: "Application rejected",
        description: "The rejection reason has been saved for the applicant.",
        tone: "success",
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

  if (isLoading) {
    return <LoadingState label="Loading vendor applications..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadApplications()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor review"
        title="Vendor applications"
        description="Review every new business carefully, approve high-quality stores, and reject weak submissions with clear feedback."
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
        description="Filter by status, inspect store details, then approve or reject with confidence."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search business or store"
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
        {filteredApplications.length === 0 ? (
          <EmptyState
            title="No applications match this filter"
            description="Try a different status or search term to find the submission you need."
          />
        ) : (
          <DataTable<VendorApplication>
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
                    <p>{formatDateTime(application.createdAt)}</p>
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
          />
        )}
      </SectionCard>

      <Modal
        open={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        title={selectedApplication?.businessName ?? "Application details"}
        description="Full business and store submission details."
      >
        {selectedApplication ? (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailRow label="Business category" value={selectedApplication.businessCategory} />
            <DetailRow label="Application status" value={selectedApplication.status} />
            <DetailRow label="Phone number" value={selectedApplication.phoneNumber} />
            <DetailRow
              label="WhatsApp number"
              value={selectedApplication.whatsappNumber ?? "Not provided"}
            />
            <DetailRow label="Region" value={selectedApplication.region} />
            <DetailRow label="City" value={selectedApplication.city} />
            <DetailRow label="Store name" value={selectedApplication.storeName} />
            <DetailRow
              label="Market ID"
              value={selectedApplication.marketId ?? "No market selected"}
            />
            <div className="md:col-span-2">
              <DetailRow
                label="Business description"
                value={selectedApplication.businessDescription}
              />
            </div>
            <div className="md:col-span-2">
              <DetailRow
                label="Store description"
                value={selectedApplication.storeDescription ?? "No store description added"}
              />
            </div>
            {selectedApplication.rejectionReason ? (
              <div className="md:col-span-2">
                <DetailRow label="Rejection reason" value={selectedApplication.rejectionReason} />
              </div>
            ) : null}
          </div>
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
