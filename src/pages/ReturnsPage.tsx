import { Eye, RefreshCcw, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getReturnRequests, updateReturnRequest } from "@/api/ordersApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
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
import type { AdminReturnRequest } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { resolveAdminMediaUrl } from "@/utils/media";

type ReturnStatusFilter =
  | "all"
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "refunded"
  | "exchanged";

const statusOptions: Array<{ label: string; value: AdminReturnRequest["status"] }> = [
  { label: "Requested", value: "requested" },
  { label: "Under review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Refunded", value: "refunded" },
  { label: "Exchanged", value: "exchanged" },
];

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

export function ReturnsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<AdminReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatusFilter>("all");
  const [selectedRequest, setSelectedRequest] = useState<AdminReturnRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<AdminReturnRequest["status"]>("requested");
  const [draftAdminNote, setDraftAdminNote] = useState("");
  const [draftRefundAmount, setDraftRefundAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getReturnRequests(token);
      setRequests(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load returns.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" ? true : request.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        request.orderNumber,
        request.productTitle,
        request.storeName,
        request.customerName,
        request.customerEmail,
        request.reason,
        request.details ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, requests, statusFilter]);

  const summary = useMemo(() => {
    const openCount = requests.filter((request) =>
      ["requested", "under_review", "approved"].includes(request.status),
    ).length;
    const resolvedCount = requests.filter((request) =>
      ["rejected", "refunded", "exchanged"].includes(request.status),
    ).length;
    const refundedTotal = requests.reduce(
      (sum, request) => sum + (request.status === "refunded" ? request.refundAmount ?? 0 : 0),
      0,
    );

    return {
      total: requests.length,
      openCount,
      resolvedCount,
      refundedTotal,
    };
  }, [requests]);

  function openRequest(request: AdminReturnRequest) {
    setSelectedRequest(request);
    setDraftStatus(request.status);
    setDraftAdminNote(request.adminNote ?? "");
    setDraftRefundAmount(
      request.refundAmount !== null && request.refundAmount !== undefined
        ? String(request.refundAmount)
        : "",
    );
  }

  async function handleSave() {
    if (!token || !selectedRequest) {
      return;
    }

    const nextRefundAmount =
      draftRefundAmount.trim().length > 0 ? Number(draftRefundAmount) : null;
    if (nextRefundAmount !== null && Number.isNaN(nextRefundAmount)) {
      showToast({
        title: "Invalid refund amount",
        description: "Enter a valid number before saving this request.",
        tone: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const updated = await updateReturnRequest(token, selectedRequest.id, {
        status: draftStatus,
        adminNote: draftAdminNote.trim() || null,
        refundAmount: nextRefundAmount,
      });
      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request)),
      );
      setSelectedRequest(updated);
      showToast({
        title: "Return request updated",
        description: `${updated.productTitle} is now marked ${updated.status.replace(/_/g, " ")}.`,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to update request",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading return requests..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadRequests()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Returns"
        title="Returns and refunds"
        description="Review item-level return, refund, and exchange requests from delivered orders, then move each case through the right resolution state."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Total requests</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.total}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Open requests</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.openCount}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Resolved</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.resolvedCount}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Refunded total</p>
          <p className="mt-3 flex items-center gap-2 text-3xl font-semibold text-textStrong">
            <Wallet className="size-5 text-accent" />
            {formatCurrency(summary.refundedTotal)}
          </p>
        </div>
      </div>

      <SectionCard
        title="Return queue"
        description="Search by order, product, shopper, or store. Use the queue to move requests through review, approval, refund, or exchange completion."
        action={
          <div className="flex flex-col gap-3 xl:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, product, shopper, or reason"
              className="xl:w-96"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReturnStatusFilter)}
              options={[
                { label: "All statuses", value: "all" },
                ...statusOptions,
              ]}
            />
          </div>
        }
      >
        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No return requests yet"
            description="Once customers submit return, refund, or exchange requests, they will show up here for review."
          />
        ) : (
          <DataTable<AdminReturnRequest>
            columns={[
              {
                key: "request",
                header: "Request",
                render: (request) => (
                  <div>
                    <p className="font-medium">{request.productTitle}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {request.orderNumber} · {request.requestType} · Qty {request.quantity}
                    </p>
                  </div>
                ),
              },
              {
                key: "customer",
                header: "Customer",
                render: (request) => (
                  <div>
                    <p>{request.customerName}</p>
                    <p className="mt-1 text-xs text-textMuted">{request.customerEmail}</p>
                  </div>
                ),
              },
              {
                key: "store",
                header: "Store",
                render: (request) => request.storeName,
              },
              {
                key: "status",
                header: "Status",
                render: (request) => <StatusBadge status={request.status} />,
              },
              {
                key: "created",
                header: "Created",
                render: (request) => formatDateTime(request.createdAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (request) => (
                  <Button
                    variant="secondary"
                    leftIcon={<Eye className="size-4" />}
                    onClick={() => openRequest(request)}
                  >
                    View
                  </Button>
                ),
              },
            ]}
            data={filteredRequests}
            keyExtractor={(request) => request.id}
          />
        )}
      </SectionCard>

      <Modal
        open={Boolean(selectedRequest)}
        onClose={() => {
          if (!actionLoading) {
            setSelectedRequest(null);
          }
        }}
        title={selectedRequest ? `${selectedRequest.requestType} · ${selectedRequest.orderNumber}` : "Return request"}
        description="Review the request context, then update the case status, note, and refund amount if needed."
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setSelectedRequest(null)}
              disabled={actionLoading}
            >
              Close
            </Button>
            <Button
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => void handleSave()}
              isLoading={actionLoading}
            >
              Save update
            </Button>
          </div>
        }
      >
        {selectedRequest ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Product" value={selectedRequest.productTitle} />
              <DetailRow label="Store" value={selectedRequest.storeName} />
              <DetailRow label="Customer" value={selectedRequest.customerName} />
              <DetailRow label="Email" value={selectedRequest.customerEmail} />
              <DetailRow label="Current status" value={selectedRequest.status.replace(/_/g, " ")} />
              <DetailRow label="Reason" value={selectedRequest.reason} />
              <DetailRow label="Requested on" value={formatDateTime(selectedRequest.createdAt)} />
              <DetailRow
                label="Resolved on"
                value={selectedRequest.resolvedAt ? formatDateTime(selectedRequest.resolvedAt) : "Still open"}
              />
            </div>

            {selectedRequest.productImageUrl || selectedRequest.evidenceImageUrls?.length ? (
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-semibold text-textStrong">Visual evidence</h3>

                {selectedRequest.productImageUrl ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-textMuted">
                      Ordered item
                    </p>
                    <img
                      src={resolveAdminMediaUrl(selectedRequest.productImageUrl) ?? undefined}
                      alt={selectedRequest.productTitle}
                      className="h-32 w-32 rounded-2xl border border-white/10 object-cover"
                    />
                  </div>
                ) : null}

                {selectedRequest.evidenceImageUrls?.length ? (
                  <div className="mt-5">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-textMuted">
                      Customer uploads
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedRequest.evidenceImageUrls.map((imageUrl, index) => (
                        <a
                          key={`${selectedRequest.id}-${index}`}
                          href={resolveAdminMediaUrl(imageUrl) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
                        >
                          <img
                            src={resolveAdminMediaUrl(imageUrl) ?? undefined}
                            alt={`Evidence ${index + 1}`}
                            className="h-40 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold text-textStrong">Customer context</h3>
              <p className="mt-3 text-sm leading-6 text-textMuted">
                {selectedRequest.details?.trim() || "No extra details were provided with this request."}
              </p>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <label className="block text-sm font-medium text-textStrong">Admin note</label>
                <textarea
                  className="app-textarea mt-3 min-h-[140px]"
                  value={draftAdminNote}
                  onChange={(event) => setDraftAdminNote(event.target.value)}
                  placeholder="Capture the decision, any conditions, or the next step for the shopper and support team."
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <label className="block text-sm font-medium text-textStrong">Next status</label>
                <select
                  className="app-select mt-3"
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as AdminReturnRequest["status"])}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-panel">
                      {option.label}
                    </option>
                  ))}
                </select>

                <label className="mt-4 block text-sm font-medium text-textStrong">
                  Refund amount
                </label>
                <input
                  className="app-input mt-3"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftRefundAmount}
                  onChange={(event) => setDraftRefundAmount(event.target.value)}
                  placeholder="0.00"
                />
                <p className="mt-2 text-xs leading-5 text-textMuted">
                  Set this when the case is being refunded. Leave it blank for exchange-only handling.
                </p>
              </div>
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
