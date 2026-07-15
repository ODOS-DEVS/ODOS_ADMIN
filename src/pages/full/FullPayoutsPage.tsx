import { Eye, RefreshCcw, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  getVendorWithdrawalRequestsPage,
  updateVendorWithdrawalRequest,
} from "@/api/payoutsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { AdminVendorWithdrawalRequest, VendorWithdrawalStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

type StatusFilter = "all" | VendorWithdrawalStatus;

const statusOptions: Array<{ label: string; value: VendorWithdrawalStatus }> = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Processing", value: "processing" },
  { label: "Failed", value: "failed" },
  { label: "Rejected", value: "rejected" },
  { label: "Paid", value: "paid" },
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

function nextStatusOptions(
  request: AdminVendorWithdrawalRequest,
): Array<{ label: string; value: VendorWithdrawalStatus }> {
  if (request.status === "pending") {
    return [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" },
    ];
  }
  if (request.status === "approved") {
    return [
      { label: "Approved", value: "approved" },
      { label: "Start Paystack payout", value: "paid" },
      { label: "Rejected", value: "rejected" },
    ];
  }
  return [{ label: request.status.replace(/_/g, " "), value: request.status }];
}

export function FullPayoutsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const isMainPayoutsRoute =
    location.pathname === "/payouts" || location.pathname === "/payouts/full";
  const {
    items: requests,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getVendorWithdrawalRequestsPage,
    getId: (request) => request.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<AdminVendorWithdrawalRequest | null>(null);
  const [draftStatus, setDraftStatus] =
    useState<VendorWithdrawalStatus>("pending");
  const [draftAdminNote, setDraftAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);

  useEffect(() => {
    const requestedStatus = searchParams.get("status");
    if (
      requestedStatus === "pending" ||
      requestedStatus === "approved" ||
      requestedStatus === "paid"
    ) {
      setStatusFilter(requestedStatus);
    }
  }, [searchParams]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" ? true : request.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        request.vendorName,
        request.vendorEmail,
        request.storeName ?? "",
        request.payoutProvider ?? "",
        request.payoutAccountName,
        request.payoutAccountNumberMasked,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, requests, statusFilter]);

  const summary = useMemo(() => {
    const pendingCount = requests.filter(
      (request) => request.status === "pending",
    ).length;
    const paidTotal = requests.reduce((sum, request) => {
      if (request.status !== "paid") {
        return sum;
      }
      return sum + request.amount;
    }, 0);
    const pendingTotal = requests.reduce((sum, request) => {
      if (!["pending", "approved"].includes(request.status)) {
        return sum;
      }
      return sum + request.amount;
    }, 0);

    return {
      total: requests.length,
      pendingCount,
      paidTotal,
      pendingTotal,
    };
  }, [requests]);

  function openRequest(request: AdminVendorWithdrawalRequest) {
    setSelectedRequest(request);
    setDraftStatus(request.status);
    setDraftAdminNote(request.adminNote ?? "");
  }

  async function handleSave() {
    if (!token || !selectedRequest) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateVendorWithdrawalRequest(
        token,
        selectedRequest.id,
        {
          status: draftStatus,
          adminNote: draftAdminNote.trim() || null,
        },
      );
      replaceItem(updated);
      setSelectedRequest(updated);
      showToast({
        title: "Withdrawal updated",
        description: `${updated.vendorName} is now marked ${updated.status}.`,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to update withdrawal",
        description:
          updateError instanceof Error
            ? updateError.message
            : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleQuickUpdate(
    request: AdminVendorWithdrawalRequest,
    status: VendorWithdrawalStatus,
    options?: { confirmManualPayout?: boolean },
  ) {
    if (!token) {
      return;
    }

    setQuickActionId(request.id);
    try {
      const updated = await updateVendorWithdrawalRequest(token, request.id, {
        status,
        adminNote: request.adminNote ?? null,
        confirmManualPayout: options?.confirmManualPayout,
      });
      replaceItem(updated);
      if (selectedRequest?.id === request.id) {
        setSelectedRequest(updated);
        setDraftStatus(updated.status);
      }
      showToast({
        title: status === "approved" ? "Withdrawal approved" : "Withdrawal updated",
        description: `${updated.vendorName} is now marked ${updated.status}.`,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to update withdrawal",
        description:
          updateError instanceof Error
            ? updateError.message
            : "Please try again.",
        tone: "error",
      });
    } finally {
      setQuickActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Payouts"
        title="Vendor withdrawal queue"
        description="Review vendor cash-out requests, approve or reject them, then confirm payout once the vendor has been paid."
        backRoute={isMainPayoutsRoute ? "/dashboard" : "/payouts"}
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Total requests</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">
            {summary.total}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Pending review</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">
            {summary.pendingCount}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Awaiting payout</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">
            {formatCurrency(summary.pendingTotal)}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Paid out</p>
          <p className="mt-3 flex items-center gap-2 text-3xl font-semibold text-textStrong">
            <Wallet className="size-5 text-accent" />
            {formatCurrency(summary.paidTotal)}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-textStrong">
        <p className="font-medium text-amber-100">How vendor payouts work</p>
        <p className="mt-2 text-textMuted">
          Approve first, then pay the vendor. Use{" "}
          <span className="text-textStrong">Send via Paystack</span> only if your
          Paystack business is Registered and transfers are enabled. If Paystack
          shows a Starter-business error, send the money yourself through mobile
          money or bank transfer, then click{" "}
          <span className="text-textStrong">Confirm manual payout</span> so ODOS
          deducts the vendor wallet and records the payout.
        </p>
      </div>

      <SectionCard
        title="Withdrawal queue"
        description="Use this queue to move requests from review to approval and final payout while keeping clear notes on every vendor withdrawal."
        action={
          <div className="flex flex-col gap-3 xl:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vendor, store, provider, or account"
              className="xl:w-96"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
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
                key: "vendor",
                header: "Vendor",
                render: (request) => (
                  <div>
                    <p className="font-medium">{request.vendorName}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {request.vendorEmail}
                    </p>
                  </div>
                ),
              },
              {
                key: "store",
                header: "Store",
                render: (request) => request.storeName ?? "Store not linked",
              },
              {
                key: "amount",
                header: "Amount",
                render: (request) =>
                  `${request.currency} ${request.amount.toFixed(2)}`,
              },
              {
                key: "status",
                header: "Status",
                render: (request) => <StatusBadge status={request.status} />,
              },
              {
                key: "created",
                header: "Requested",
                render: (request) => formatDateTime(request.createdAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (request) => (
                  <div className="flex flex-wrap gap-2">
                    {request.status === "pending" ? (
                      <>
                        <Button
                          variant="primary"
                          isLoading={quickActionId === request.id}
                          onClick={() => void handleQuickUpdate(request, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          isLoading={quickActionId === request.id}
                          onClick={() => void handleQuickUpdate(request, "rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {request.status === "approved" ? (
                      <>
                        <Button
                          variant="primary"
                          isLoading={quickActionId === request.id}
                          onClick={() => void handleQuickUpdate(request, "paid")}
                        >
                          Send via Paystack
                        </Button>
                        <Button
                          variant="secondary"
                          isLoading={quickActionId === request.id}
                          onClick={() =>
                            void handleQuickUpdate(request, "paid", {
                              confirmManualPayout: true,
                            })
                          }
                        >
                          Confirm manual payout
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => openRequest(request)}
                    >
                      Review
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/payouts/${request.id}`)}
                    >
                      Details
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredRequests}
            keyExtractor={(request) => request.id}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={() => void loadMore()}
            onRetry={() => void refresh()}
            emptyTitle="No payout requests yet"
            emptyDescription="Vendor withdrawal requests will appear here as soon as vendors start moving money out of their ODOS wallet."
          />
      </SectionCard>

      <Modal
        open={Boolean(selectedRequest)}
        onClose={() => {
          if (!isSaving) {
            setSelectedRequest(null);
          }
        }}
        title={
          selectedRequest
            ? `Withdrawal · ${selectedRequest.vendorName}`
            : "Vendor withdrawal"
        }
        description="Review the payout details, current wallet balances, and the request note before updating the withdrawal status."
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setSelectedRequest(null)}
              disabled={isSaving}
            >
              Close
            </Button>
            <Button
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => void handleSave()}
              isLoading={isSaving}
              disabled={
                !selectedRequest ||
                ["paid", "processing", "rejected", "failed"].includes(
                  selectedRequest.status,
                )
              }
            >
              Save update
            </Button>
          </div>
        }
      >
        {selectedRequest ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Vendor" value={selectedRequest.vendorName} />
              <DetailRow label="Store" value={selectedRequest.storeName ?? "Store not linked"} />
              <DetailRow label="Requested amount" value={`${selectedRequest.currency} ${selectedRequest.amount.toFixed(2)}`} />
              <DetailRow label="Current status" value={selectedRequest.status.replace(/_/g, " ")} />
              <DetailRow label="Available balance" value={`${selectedRequest.currency} ${selectedRequest.walletAvailableBalance.toFixed(2)}`} />
              <DetailRow label="Held for withdrawals" value={`${selectedRequest.currency} ${selectedRequest.walletPendingWithdrawalBalance.toFixed(2)}`} />
              <DetailRow label="Payout method" value={selectedRequest.payoutMethodType.replace(/_/g, " ")} />
              <DetailRow label="Requested on" value={formatDateTime(selectedRequest.createdAt)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Account name" value={selectedRequest.payoutAccountName} />
              <DetailRow
                label="Account number"
                value={selectedRequest.payoutAccountNumberMasked}
              />
              <DetailRow
                label="Provider"
                value={selectedRequest.payoutProvider ?? "Not specified"}
              />
              <DetailRow
                label="Transfer reference"
                value={selectedRequest.paystackTransferReference ?? "Not started yet"}
              />
              <DetailRow
                label="Reviewed by"
                value={selectedRequest.reviewedByName ?? "Not reviewed yet"}
              />
            </div>

            {selectedRequest.paystackTransferCode ? (
              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow
                  label="Transfer code"
                  value={selectedRequest.paystackTransferCode}
                />
                <DetailRow
                  label="Transfer started"
                  value={
                    selectedRequest.transferInitiatedAt
                      ? formatDateTime(selectedRequest.transferInitiatedAt)
                      : "Not started yet"
                  }
                />
              </div>
            ) : null}

            {selectedRequest.note ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-textMuted">
                  Vendor note
                </p>
                <p className="mt-2 text-sm leading-6 text-textStrong">
                  {selectedRequest.note}
                </p>
              </div>
            ) : null}

            {selectedRequest.transferFailureReason ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                  Transfer failure reason
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-50">
                  {selectedRequest.transferFailureReason}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[220px,1fr]">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-textMuted">
                  Update status
                </label>
                <FilterSelect
                  value={draftStatus}
                  onChange={(event) =>
                    setDraftStatus(event.target.value as VendorWithdrawalStatus)
                  }
                  options={nextStatusOptions(selectedRequest)}
                  disabled={
                    ["paid", "processing", "rejected", "failed"].includes(
                      selectedRequest.status,
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-textMuted">
                  Admin note
                </label>
                <textarea
                  value={draftAdminNote}
                  onChange={(event) => setDraftAdminNote(event.target.value)}
                  rows={4}
                  className="app-textarea min-h-[120px]"
                  placeholder="Explain the approval, rejection, retry, or payout decision."
                  disabled={
                    ["paid", "processing", "rejected", "failed"].includes(
                      selectedRequest.status,
                    )
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
