import { Eye, RefreshCcw, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getReturnRequestsPage, updateReturnRequest } from "@/api/ordersApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { DetailField, DetailFields, DetailSection, DetailStack } from "@/components/ui/DetailList";
import { Modal } from "@/components/ui/Modal";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
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

export function FullReturnsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: requests,
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
    loadPage: getReturnRequestsPage,
    getId: (request) => request.id,
  });
  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    queueFilter,
  } = useQueueSearchParams({
    statusValues: [
      "requested",
      "under_review",
      "approved",
      "rejected",
      "refunded",
      "exchanged",
    ],
  });
  const [selectedRequest, setSelectedRequest] = useState<AdminReturnRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<AdminReturnRequest["status"]>("requested");
  const [draftAdminNote, setDraftAdminNote] = useState("");
  const [draftRefundAmount, setDraftRefundAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const openStatuses = new Set(["requested", "under_review", "approved"]);
    return requests.filter((request) => {
      const matchesQueue =
        queueFilter !== "open" ? true : openStatuses.has(request.status);
      const matchesStatus =
        statusFilter === "all" ? true : request.status === statusFilter;
      if (!matchesQueue || !matchesStatus) {
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
  }, [query, queueFilter, requests, statusFilter]);

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
      replaceItem(updated);
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

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Returns"
        title="Complete returns desk"
        description="Every return, refund, and exchange case across the platform."
        backRoute="/returns"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-textMuted">Total requests</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.total}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-textMuted">Open requests</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.openCount}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-textMuted">Resolved</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">{summary.resolvedCount}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
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
        <AdminInfiniteList
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/returns/full/${request.id}`)}
                    >
                      Open dossier
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => openRequest(request)}
                    >
                      View
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredRequests}
            keyExtractor={(request) => request.id}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            isLoadingPage={isLoadingPage}
            hasMore={hasMore}
            error={error}
            onPageChange={goToPage}
            onRetry={() => void refresh()}
            emptyTitle="No return requests yet"
            emptyDescription="Once customers submit return, refund, or exchange requests, they will show up here for review."
          />
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
          <DetailStack>
            <DetailSection title="Request summary">
              <DetailFields columns={2}>
                <DetailField label="Product" value={selectedRequest.productTitle} />
                <DetailField label="Store" value={selectedRequest.storeName} />
                <DetailField label="Customer" value={selectedRequest.customerName} />
                <DetailField label="Email" value={selectedRequest.customerEmail} />
                <DetailField label="Current status" value={selectedRequest.status.replace(/_/g, " ")} />
                <DetailField label="Reason" value={selectedRequest.reason} />
                <DetailField label="Requested on" value={formatDateTime(selectedRequest.createdAt)} />
                <DetailField
                  label="Resolved on"
                  value={selectedRequest.resolvedAt ? formatDateTime(selectedRequest.resolvedAt) : "Still open"}
                />
              </DetailFields>
            </DetailSection>

            {selectedRequest.productImageUrl || selectedRequest.evidenceImageUrls?.length ? (
              <DetailSection title="Visual evidence">
                {selectedRequest.productImageUrl ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-textMuted">Ordered item</p>
                    <img
                      src={resolveAdminMediaUrl(selectedRequest.productImageUrl) ?? undefined}
                      alt={selectedRequest.productTitle}
                      className="size-28 rounded-lg object-cover ring-1 ring-line/80"
                    />
                  </div>
                ) : null}

                {selectedRequest.evidenceImageUrls?.length ? (
                  <div className={selectedRequest.productImageUrl ? "mt-6 space-y-2" : "space-y-2"}>
                    <p className="text-xs font-medium text-textMuted">Customer uploads</p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedRequest.evidenceImageUrls.map((imageUrl, index) => (
                        <a
                          key={`${selectedRequest.id}-${index}`}
                          href={resolveAdminMediaUrl(imageUrl) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg ring-1 ring-line/80"
                        >
                          <img
                            src={resolveAdminMediaUrl(imageUrl) ?? undefined}
                            alt={`Evidence ${index + 1}`}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </DetailSection>
            ) : null}

            <DetailSection title="Customer context">
              <p className="text-sm leading-relaxed text-textStrong">
                {selectedRequest.details?.trim() || "No extra details were provided with this request."}
              </p>
            </DetailSection>

            <DetailSection title="Admin update" description="Notes, status, and refund amount for this case.">
              <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-textStrong">Admin note</label>
                  <textarea
                    className="app-textarea min-h-[140px]"
                    value={draftAdminNote}
                    onChange={(event) => setDraftAdminNote(event.target.value)}
                    placeholder="Capture the decision, any conditions, or the next step for the shopper and support team."
                  />
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-textStrong">Next status</label>
                    <select
                      className="app-select"
                      value={draftStatus}
                      onChange={(event) => setDraftStatus(event.target.value as AdminReturnRequest["status"])}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-panel">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-textStrong">Refund amount</label>
                    <input
                      className="app-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draftRefundAmount}
                      onChange={(event) => setDraftRefundAmount(event.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-xs leading-relaxed text-textMuted">
                      Set this when the case is being refunded. Leave it blank for exchange-only handling.
                    </p>
                  </div>
                </div>
              </div>
            </DetailSection>
          </DetailStack>
        ) : null}
      </Modal>
    </div>
  );
}
