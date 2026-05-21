import { Landmark, RefreshCcw, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getFinanceOverview,
  getPaymentTransactions,
  getPlatformLedgerEntries,
} from "@/api/financeApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type {
  AdminFinanceOverview,
  AdminPaymentTransaction,
  AdminPlatformLedgerEntry,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

type FinanceState = {
  overview: AdminFinanceOverview | null;
  payments: AdminPaymentTransaction[];
  ledger: AdminPlatformLedgerEntry[];
};

export function FinancePage() {
  const { token } = useAdminAuth();
  const [financeState, setFinanceState] = useState<FinanceState>({
    overview: null,
    payments: [],
    ledger: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinance = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [overview, payments, ledger] = await Promise.all([
        getFinanceOverview(token),
        getPaymentTransactions(token),
        getPlatformLedgerEntries(token),
      ]);
      setFinanceState({
        overview,
        payments,
        ledger,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load ODOS finance data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const recentPayments = useMemo(
    () => financeState.payments.slice(0, 8),
    [financeState.payments],
  );
  const recentLedgerEntries = useMemo(
    () => financeState.ledger.slice(0, 12),
    [financeState.ledger],
  );

  if (isLoading) {
    return <LoadingState label="Loading ODOS finance..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadFinance()} />;
  }

  if (!financeState.overview) {
    return (
      <EmptyState
        title="No treasury data yet"
        description="Once checkout payments start moving through the platform, the ODOS treasury view will appear here."
      />
    );
  }

  const overview = financeState.overview;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Treasury and payment controls"
        description="Track what ODOS has collected, what still belongs to vendors, and the exact ledger trail that explains every balance movement."
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCcw className="size-4" />}
            onClick={() => void loadFinance()}
          >
            Refresh
          </Button>
        }
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
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">
              Paid orders
            </p>
            <p className="mt-3 text-2xl font-semibold text-textStrong">
              {overview.paidOrderCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">
              Paid order volume
            </p>
            <p className="mt-3 text-2xl font-semibold text-textStrong">
              {formatCurrency(overview.paidOrderVolume, overview.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted">
              Vendor payouts sent
            </p>
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
        {recentPayments.length === 0 ? (
          <EmptyState
            title="No verified payments yet"
            description="Once a shopper completes checkout, the payment record will appear here."
          />
        ) : (
          <DataTable
            data={recentPayments}
            keyExtractor={(payment) => payment.id}
            columns={[
              {
                key: "order",
                header: "Order",
                render: (payment) => (
                  <div className="space-y-1">
                    <p className="font-semibold text-textStrong">
                      #{payment.orderNumber}
                    </p>
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
          />
        )}
      </SectionCard>

      <SectionCard
        title="Treasury ledger"
        description="This is the audit trail for how ODOS cash, vendor liability, and commission balances changed over time."
      >
        {recentLedgerEntries.length === 0 ? (
          <EmptyState
            title="No ledger entries yet"
            description="Once a payment, refund, or payout runs through the system, the ledger trail will appear here."
          />
        ) : (
          <DataTable
            data={recentLedgerEntries}
            keyExtractor={(entry) => entry.id}
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
                    <p>
                      Vendors {formatCurrency(entry.vendorLiabilityBalanceAfter, overview.currency)}
                    </p>
                    <p>
                      ODOS {formatCurrency(entry.commissionBalanceAfter, overview.currency)}
                    </p>
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
                  <span className="text-sm text-textMuted">
                    {formatDateTime(entry.createdAt)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
