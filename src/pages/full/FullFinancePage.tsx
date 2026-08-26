import { CircleDollarSign, Landmark, Users, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  getFinanceOverview,
  getPaymentTransactionsPage,
  getPlatformLedgerEntriesPage,
} from "@/api/financeApi";
import { DirectorySection } from "@/components/directory/DirectorySection";
import { MetricStat } from "@/components/directory/MetricStat";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SectionCard } from "@/components/ui/SectionCard";
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
    page: paymentsPage,
    pageSize: paymentsPageSize,
    isLoadingPage: isPaymentsLoadingPage,
    hasMore: hasMorePayments,
    error: paymentsError,
    goToPage: goToPaymentsPage,
    refresh: refreshPayments,
  } = useInfiniteAdminList({
    loadPage: getPaymentTransactionsPage,
    getId: (payment) => payment.id,
  });

  const {
    items: ledger,
    isLoading: isLedgerLoading,
    page: ledgerPage,
    pageSize: ledgerPageSize,
    isLoadingPage: isLedgerLoadingPage,
    hasMore: hasMoreLedger,
    error: ledgerError,
    goToPage: goToLedgerPage,
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricStat
          label="Treasury cash"
          value={formatCurrency(overview.currentBalance, overview.currency)}
          icon={Landmark}
          caption="Held by ODOS after fees, refunds and payouts"
          animationDelay={40}
        />
        <MetricStat
          label="Vendor liability"
          value={formatCurrency(overview.vendorLiabilityBalance, overview.currency)}
          icon={Users}
          tone="warning"
          caption="Owed to vendors across all balances"
          animationDelay={80}
        />
        <MetricStat
          label="Paid order volume"
          value={formatCurrency(overview.paidOrderVolume, overview.currency)}
          icon={CircleDollarSign}
          tone="success"
          caption={`${overview.paidOrderCount} paid orders`}
          animationDelay={120}
        />
        <MetricStat
          label="Payouts sent"
          value={formatCurrency(overview.totalPayoutsSent, overview.currency)}
          icon={Wallet}
          tone="info"
          caption="Settled to vendor accounts"
          animationDelay={160}
        />
      </div>

      <SectionCard
        title="Collection snapshot"
        description="This shows the verified transaction stream coming in from the payment rail."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surfaceMuted p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Paid orders</p>
            <p className="mt-3 text-2xl font-semibold text-textStrong">{overview.paidOrderCount}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surfaceMuted p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Paid order volume</p>
            <p className="mt-3 text-2xl font-semibold text-textStrong">
              {formatCurrency(overview.paidOrderVolume, overview.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surfaceMuted p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Vendor payouts sent</p>
            <p className="mt-3 flex items-center gap-2 text-2xl font-semibold text-textStrong">
              <Wallet className="size-5 text-accent" />
              {formatCurrency(overview.totalPayoutsSent, overview.currency)}
            </p>
          </div>
        </div>
      </SectionCard>

      <DirectorySection
        cardTitle="Recent payments"
        count={payments.length}
        listSummary="Every verified checkout, with its provider reference and processing fee."
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
              render: (payment) => <StatePill label={labelForStatus(payment.status)} tone={toneForStatus(payment.status)} />,
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
            },]}
        data={payments}
        keyExtractor={(payment) => payment.id}
        isLoading={isPaymentsLoading}
        error={paymentsError}
        onRetry={() => void refreshPayments()}
        emptyTitle="No payments recorded yet"
        emptyDescription="Verified checkouts appear here as they come in."
        pagination={{
          page: paymentsPage,
          pageSize: paymentsPageSize,
          onPageChange: goToPaymentsPage,
          hasMore: hasMorePayments,
          isLoadingPage: isPaymentsLoadingPage,
          loadedLabel: `per page · ${payments.length} loaded`,
        }}
        animationDelay={200}
      />

      <DirectorySection
        cardTitle="Treasury ledger"
        count={ledger.length}
        listSummary="Every movement in and out of the ODOS treasury, newest first."
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
              render: (entry) => <StatePill label={labelForStatus(entry.direction)} tone={toneForStatus(entry.direction)} />,
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
            },]}
        data={ledger}
        keyExtractor={(entry) => entry.id}
        isLoading={isLedgerLoading}
        error={ledgerError}
        onRetry={() => void refreshLedger()}
        emptyTitle="No ledger entries yet"
        emptyDescription="Treasury movements appear here as money flows through the platform."
        pagination={{
          page: ledgerPage,
          pageSize: ledgerPageSize,
          onPageChange: goToLedgerPage,
          hasMore: hasMoreLedger,
          isLoadingPage: isLedgerLoadingPage,
          loadedLabel: `per page · ${ledger.length} loaded`,
        }}
        animationDelay={240}
      />
    </div>
  );
}
