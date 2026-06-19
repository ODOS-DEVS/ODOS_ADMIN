import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getDashboardOverview } from "@/api/dashboardApi";
import { getFinanceOverview } from "@/api/financeApi";
import {
  AnalyticsSkeleton,
  InsightPill,
  MetricBar,
  MetricRow,
} from "@/components/analytics/AnalyticsUi";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminFinanceOverview, DashboardPayload } from "@/types";
import { buildAnalyticsSnapshot } from "@/utils/analyticsMetrics";
import { formatCurrency } from "@/utils/format";

type BriefAnalyticsState = {
  dashboard: DashboardPayload;
  finance: AdminFinanceOverview | null;
};

export function AnalyticsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<BriefAnalyticsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(
    async (background = false) => {
      if (!token) return;

      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const dashboard = await getDashboardOverview(token);
        const finance = await getFinanceOverview(token).catch(() => null);
        setState({ dashboard, finance });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const snapshot = useMemo(
    () => (state ? buildAnalyticsSnapshot(state.dashboard, state.finance) : null),
    [state],
  );

  const footprintMax = useMemo(() => {
    if (!state) return 1;
    const { stats } = state.dashboard;
    return Math.max(stats.totalUsers, stats.totalVendors, stats.totalStores, stats.totalProducts, 1);
  }, [state]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !state || !snapshot) {
    return (
      <ErrorState
        description={error ?? "Analytics are unavailable right now."}
        onRetry={() => void loadAnalytics()}
      />
    );
  }

  const { dashboard, finance } = state;
  const { stats } = dashboard;
  const grossCollected = finance?.grossCollectedTotal ?? stats.totalRevenue;
  const paidOrders = finance?.paidOrderCount ?? stats.totalOrders;

  return (
    <div className="space-y-4">
      <div className="animate-fade-up opacity-0" style={{ animationDelay: "0ms" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
              Analytics
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">
              At-a-glance performance
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-textMuted">
              Key commerce and treasury metrics. Open the full report for every breakdown,
              distribution, and operational signal across the platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={
                <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
              }
              onClick={() => void loadAnalytics(true)}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<ArrowRight className="size-4" />}
              onClick={() => navigate("/analytics/full")}
            >
              View full analytics report
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Gross collected"
          value={formatCurrency(Math.round(grossCollected))}
          hint="Total checkout value processed"
          icon={CircleDollarSign}
          tone="success"
          animationDelay={60}
        />
        <StatCard
          label="Paid orders"
          value={new Intl.NumberFormat("en-GH").format(paidOrders)}
          hint={finance ? "Verified successful payments" : "All platform orders"}
          icon={ShoppingCart}
          animationDelay={110}
          onClick={() => navigate("/orders")}
        />
        <StatCard
          label="Average order value"
          value={formatCurrency(Math.round(snapshot.paidAverageOrderValue))}
          hint="Revenue per paid order"
          icon={TrendingUp}
          tone="info"
          animationDelay={160}
        />
        <StatCard
          label="Platform commission"
          value={formatCurrency(Math.round(finance?.commissionBalance ?? 0))}
          hint="ODOS commission balance"
          icon={Wallet}
          animationDelay={210}
          onClick={() => navigate("/finance")}
        />
      </div>

      <div
        className="animate-fade-up opacity-0 grid grid-cols-2 gap-2 md:grid-cols-4"
        style={{ animationDelay: "260ms" }}
      >
        <InsightPill
          label="Fulfillment rate"
          value={`${Math.round(snapshot.completionRate)}%`}
          hint={`${snapshot.completedOrders} orders completed`}
        />
        <InsightPill
          label="Catalog depth"
          value={snapshot.productsPerStore.toFixed(1)}
          hint="Products per store"
        />
        <InsightPill
          label="Refund exposure"
          value={`${snapshot.refundRate.toFixed(1)}%`}
          hint="Refunds vs gross collected"
        />
        <InsightPill
          label="Processor fees"
          value={`${snapshot.feeRate.toFixed(1)}%`}
          hint="Payment processing cost share"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <SectionCard
          compact
          className="xl:col-span-7"
          animationDelay={320}
          title="Marketplace footprint"
          description="Scale across users, vendors, stores, and catalog"
        >
          <div className="space-y-3">
            {(
              [
                { label: "Users", value: stats.totalUsers, tone: "sky" as const },
                { label: "Vendors", value: stats.totalVendors, tone: "emerald" as const },
                { label: "Stores", value: stats.totalStores, tone: "amber" as const },
                { label: "Products", value: stats.totalProducts, tone: "fuchsia" as const },
              ] as const
            ).map((item, index) => (
              <MetricBar
                key={item.label}
                label={item.label}
                value={item.value}
                max={footprintMax}
                displayValue={new Intl.NumberFormat("en-GH").format(item.value)}
                tone={item.tone}
                animationDelay={340 + index * 40}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          compact
          className="xl:col-span-5"
          animationDelay={360}
          title="Treasury snapshot"
          description="Balances and payout exposure"
          action={
            <Button variant="ghost" onClick={() => navigate("/finance")}>
              Finance
            </Button>
          }
        >
          {finance ? (
            <div className="space-y-2">
              <MetricRow
                label="Current balance"
                value={formatCurrency(finance.currentBalance)}
                tone="success"
              />
              <MetricRow
                label="Vendor liability"
                value={formatCurrency(finance.vendorLiabilityBalance)}
              />
              <MetricRow
                label="Pending withdrawals"
                value={formatCurrency(finance.pendingWithdrawalTotal)}
                tone="warning"
              />
              <MetricRow
                label="Refunded total"
                value={formatCurrency(finance.refundedTotal)}
                tone="info"
              />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-xs leading-5 text-textMuted">
              Treasury metrics are unavailable until payments flow through checkout.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        compact
        animationDelay={420}
        title="Need the complete picture?"
        description="Orders, payments, ledger, vendors, returns, reviews, marketing, support, and more — all in one owner-level report."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textMuted">
            {stats.pendingVendorApplications > 0
              ? `${stats.pendingVendorApplications} vendor application${stats.pendingVendorApplications === 1 ? "" : "s"} pending · ${stats.pendingOrders} orders awaiting fulfillment`
              : `${stats.pendingOrders} orders awaiting fulfillment · ${stats.totalOrders} total orders tracked`}
          </p>
          <Button
            leftIcon={<ArrowRight className="size-4" />}
            onClick={() => navigate("/analytics/full")}
          >
            Open full analytics report
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
