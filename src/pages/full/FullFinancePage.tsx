import { Landmark, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  getFinanceOverview,
  getPaymentTransactionsPage,
  getPlatformLedgerEntriesPage,
} from "@/api/financeApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import type { AdminFinanceOverview } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function FullFinancePage() {
  const { token } = useAdminAuth();
  const [overview, setOverview] = useState<AdminFinanceOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const {
    items: payments,
    isLoading: isPaymentsLoading,
    isLoadingMore: isPaymentsLoadingMore,
    hasMore: hasMorePayments,
    error: paymentsError,
    loadMore: loadMorePayments,
    refresh: refreshPayments,
  } = useInfiniteAdminList({
    loadPage: getPaymentTransactionsPage,
    getId: (payment) => payment.id,
  });

  const {
    items: ledger,
    isLoading: isLedgerLoading,
    isLoadingMore: isLedgerLoadingMore,
    hasMore: hasMoreLedger,
    error: ledgerError,
    loadMore: loadMoreLedger,
    refresh: refreshLedger,
  } = useInfiniteAdminList({
    loadPage: getPlatformLedgerEntriesPage,
    getId: (entry) => entry.id,
  });

  const loadOverview = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsOverviewLoading(true);
    setOverviewError(null);
    try {
      setOverview(await getFinanceOverview(token));
    } catch (loadError) {
      setOverviewError(
        loadError instanceof Error ? loadError.message : "Unable to load ODOS finance overview.",
      );
    } finally {
      setIsOverviewLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleRefresh() {
    await Promise.all([loadOverview(), refreshPayments(), refreshLedger()]);
  }

  if (isOverviewLoading && !overview) {
    return <LoadingState label="Loading ODOS finance..." />;
  }

  if (overviewError && !overview) {
    return <ErrorState description={overviewError} onRetry={() => void loadOverview()} />;
  }

  if (!overview) {
    return (
      <EmptyState
        title="No treasury data yet"
        description="Once checkout payments start moving through the platform, the ODOS treasury view will appear here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Finance"
        title="Treasury command center"
        description="Balances, payments, ledger entries, and platform money flow."
        backRoute="/finance"
        onRefresh={() => void handleRefresh()}
        refreshing={isOverviewLoading || isPaymentsLoading || isLedgerLoading}
      />

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Treasury cash</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">
            {formatCurrency(overview.currentBalance, overview.currency)}
          </p>
          <p className="mt-2 text-xs text-textMuted">
            Cash still controlled by ODOS after processor fees, refunds, and vendor payouts.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Vendor liability</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">
            {formatCurrency(overview.vendorLiabilityBalance, overview.currency)}
          </p>
          <p className="mt-2 text-xs text-textMuted">
            Money ODOS still owes vendors across held and withdrawable balances.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">ODOS commission</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">
            {formatCurrency(overview.commissionBalance, overview.currency)}
          </p>
          <p className="mt-2 text-xs text-textMuted">
            Platform commission retained before any separate business expense accounting.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-sm text-textMuted">Gross collected</p>
          <p className="mt-3 text-3xl font-semibold text-textStrong">
            {formatCurrency(overview.grossCollectedTotal, overview.currency)}
          </p>
          <p className="mt-2 text-xs text-textMuted">
            Total verified order value collected through the payment rail.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-textMuted">Processor fees</p>
          <p className="mt-3 text-2xl font-semibold text-textStrong">
            {formatCurrency(overview.processorFeeTotal, overview.currency)}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-textMuted">Refunded</p>
          <p className="mt-3 text-2xl font-semibold text-textStrong">
            {formatCurrency(overview.refundedTotal, overview.currency)}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-textMuted">Pending withdrawals</p>
          <p className="mt-3 text-2xl font-semibold text-textStrong">
            {formatCurrency(overview.pendingWithdrawalTotal, overview.currency)}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-textMuted">Approved awaiting payout</p>
          <p className="mt-3 text-2xl font-semibold text-textStrong">
            {formatCurrency(overview.approvedWithdrawalTotal, overview.currency)}
          </p>
        </div>
      </div>

      <SectionCard
        title="Collection snapshot"
        description="This shows the verified transaction stream coming in from the payment rail."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Paid orders</p>
            <p className="mt-3 text-2xl font-semibold text-textStrong">{overview.paidOrderCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Paid order volume</p>
            <p className="mt-3 text-2xl font-semibold text-textStrong">
              {formatCurrency(overview.paidOrderVolume, overview.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Vendor payouts sent</p>
            <p className="mt-3 flex items-center gap-2 text-2xl font-semibold text-textStrong">
              <Wallet className="size-5 text-accent" />
              {formatCurrency(overview.totalPayoutsSent, overview.currency)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Recent payments"
        description="Every verified checkout is recorded here with its provider reference and processing fee."
      >
        <AdminInfiniteList
          columns={[
            {
              key: "order",
              header: "Order",
              render: (payment) => (
                <div className="space-y-1">
                  <p className="font-semibold text-textStrong">#{payment.orderNumber}</p>
                  <p className="text-xs text-textMuted">{payment.customerEmail}</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (payment) => <StatusBadge status={payment.status} />,
            },
            {
              key: "channel",
              header: "Channel",
              render: (payment) => (
                <span className="text-sm text-textMuted">
                  {payment.preferredChannel
                    ? payment.preferredChannel.replace(/_/g, " ")
                    : payment.provider}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              render: (payment) => (
                <div className="space-y-1">
                  <p className="font-semibold text-textStrong">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-xs text-textMuted">
                    Fee {formatCurrency(payment.processorFeeAmount, payment.currency)}
                  </p>
                </div>
              ),
            },
            {
              key: "reference",
              header: "Reference",
              render: (payment) => (
                <div className="space-y-1">
                  <p className="text-xs text-textStrong">{payment.reference}</p>
                  <p className="text-xs text-textMuted">
                    {payment.providerTransactionId ?? "Awaiting provider id"}
                  </p>
                </div>
              ),
            },
            {
              key: "verifiedAt",
              header: "Verified",
              render: (payment) => (
                <span className="text-sm text-textMuted">
                  {payment.verifiedAt
                    ? formatDateTime(payment.verifiedAt)
                    : formatDateTime(payment.createdAt)}
                </span>
              ),
            },
          ]}
          data={payments}
          keyExtractor={(payment) => payment.id}
          isLoading={isPaymentsLoading}
          isLoadingMore={isPaymentsLoadingMore}
          hasMore={hasMorePayments}
          error={paymentsError}
          onLoadMore={() => void loadMorePayments()}
          onRetry={() => void refreshPayments()}
          emptyTitle="No verified payments yet"
          emptyDescription="Once a shopper completes checkout, the payment record will appear here."
        />
      </SectionCard>

      <SectionCard
        title="Treasury ledger"
        description="This is the audit trail for how ODOS cash, vendor liability, and commission balances changed over time."
      >
        <AdminInfiniteList
          columns={[
            {
              key: "kind",
              header: "Entry",
              render: (entry) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Landmark className="size-4 text-accent" />
                    <p className="font-semibold text-textStrong">{entry.title}</p>
                  </div>
                  <p className="text-xs text-textMuted">
                    {entry.description ?? entry.kind.replace(/_/g, " ")}
                  </p>
                </div>
              ),
            },
            {
              key: "direction",
              header: "Direction",
              render: (entry) => <StatusBadge status={entry.direction} />,
            },
            {
              key: "amount",
              header: "Amount",
              render: (entry) => (
                <span className="font-semibold text-textStrong">
                  {formatCurrency(entry.amount, overview.currency)}
                </span>
              ),
            },
            {
              key: "balance",
              header: "Treasury After",
              render: (entry) => (
                <div className="space-y-1 text-xs text-textMuted">
                  <p>Cash {formatCurrency(entry.currentBalanceAfter, overview.currency)}</p>
                  <p>Vendors {formatCurrency(entry.vendorLiabilityBalanceAfter, overview.currency)}</p>
                  <p>ODOS {formatCurrency(entry.commissionBalanceAfter, overview.currency)}</p>
                </div>
              ),
            },
            {
              key: "reference",
              header: "Reference",
              render: (entry) => (
                <div className="space-y-1 text-xs text-textMuted">
                  <p>{entry.orderNumber ? `#${entry.orderNumber}` : "No order"}</p>
                  <p>{entry.paymentReference ?? "No payment ref"}</p>
                </div>
              ),
            },
            {
              key: "created",
              header: "Recorded",
              render: (entry) => (
                <span className="text-sm text-textMuted">{formatDateTime(entry.createdAt)}</span>
              ),
            },
          ]}
          data={ledger}
          keyExtractor={(entry) => entry.id}
          isLoading={isLedgerLoading}
          isLoadingMore={isLedgerLoadingMore}
          hasMore={hasMoreLedger}
          error={ledgerError}
          onLoadMore={() => void loadMoreLedger()}
          onRetry={() => void refreshLedger()}
          emptyTitle="No ledger entries yet"
          emptyDescription="Once a payment, refund, or payout runs through the system, the ledger trail will appear here."
        />
      </SectionCard>
    </div>
  );
}
