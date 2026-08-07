import {
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
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsUi";
import {
  AdminHeaderActions,
  HeaderActionButton,
} from "@/components/admin/AdminShell";
import { AdminPageIntro } from "@/components/admin/PageIntro";
import {
  buildRecentOrderVolumeBars,
  DonutMixChart,
  FootprintTiles,
  MarketplaceHealthGrid,
  MiniBarTrend,
  TreasuryHighlightPanel,
} from "@/components/analytics/MarketplaceAnalyticsUi";
import { DataTable } from "@/components/tables/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminFinanceOverview, DashboardPayload, Order } from "@/types";
import {
  buildAnalyticsSnapshot,
  buildOrderStatusMix,
} from "@/utils/analyticsMetrics";
import { formatCurrency, formatDateTime } from "@/utils/format";

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

  const orderStatusMix = useMemo(
    () => (state ? buildOrderStatusMix(state.dashboard.recentOrders) : []),
    [state],
  );

  const volumeBars = useMemo(
    () => (state ? buildRecentOrderVolumeBars(state.dashboard.recentOrders) : []),
    [state],
  );

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
    <div className="space-y-5">
      <AdminPageIntro
        eyebrow="Insights"
        title="Analytics"
        description="Orders, revenue, and catalog counts from the dashboard snapshot."
        meta={`Updated ${formatDateTime(new Date().toISOString())}`}
        actions={
          <AdminHeaderActions>
            <HeaderActionButton
              variant="secondary"
              leftIcon={<RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />}
              onClick={() => void loadAnalytics(true)}
              disabled={isRefreshing}
            >
              Refresh
            </HeaderActionButton>
            <HeaderActionButton
              leftIcon={<ArrowRight className="size-4" />}
              onClick={() => navigate("/analytics/full")}
            >
              Full report
            </HeaderActionButton>
          </AdminHeaderActions>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Gross collected"
          value={formatCurrency(Math.round(grossCollected))}
          hint="Checkout value processed"
          icon={CircleDollarSign}
          tone="success"
          animationDelay={40}
        />
        <StatCard
          label="Paid orders"
          value={new Intl.NumberFormat("en-GH").format(paidOrders)}
          hint={`${stats.ordersToday} today`}
          icon={ShoppingCart}
          animationDelay={80}
          onClick={() => navigate("/orders/full")}
        />
        <StatCard
          label="Avg order value"
          value={formatCurrency(Math.round(snapshot.paidAverageOrderValue))}
          hint="Per paid checkout"
          icon={TrendingUp}
          tone="info"
          animationDelay={120}
        />
        <StatCard
          label="Commission"
          value={formatCurrency(Math.round(finance?.commissionBalance ?? 0))}
          hint="ODOS platform share"
          icon={Wallet}
          animationDelay={160}
          onClick={() => navigate("/finance/full")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="grid gap-4 md:grid-cols-2">
            {volumeBars.length > 0 ? (
              <MiniBarTrend
                title="Recent order volume"
                subtitle="Recent checkouts (GH₵)"
                bars={volumeBars}
                tone="accent"
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-line bg-surfaceMuted/40 p-6 text-center text-xs text-textMuted">
                Order volume chart fills in as new marketplace orders arrive.
              </div>
            )}
            <DonutMixChart
              title="Recent order pipeline"
              centerValue={String(dashboard.recentOrders.length)}
              centerLabel="orders"
              segments={orderStatusMix.slice(0, 4).map((item, index) => ({
                label: item.label,
                value: item.count,
                colorIndex: index,
              }))}
            />
          </div>

          <SectionCard compact title="Catalog" bodyClassName="pt-1">
            <FootprintTiles stats={stats} />
          </SectionCard>
        </div>

        <div className="xl:col-span-4">
          <TreasuryHighlightPanel finance={finance} onOpenFinance={() => navigate("/finance/full")} />
          <div className="mt-4">
            <SectionCard compact title="Queues">
              <MarketplaceHealthGrid snapshot={snapshot} stats={stats} />
            </SectionCard>
          </div>
        </div>
      </div>

      <SectionCard
        compact
        title="Latest marketplace orders"
        description="Most recent orders"
        action={
          <button
            type="button"
            onClick={() => navigate("/orders/full")}
            className="text-xs font-medium text-accent hover:underline"
          >
            View all orders
          </button>
        }
        bodyClassName="p-0"
      >
        <DataTable<Order>
          compact
          columns={[
            {
              key: "order",
              header: "Order",
              render: (order) => (
                <div>
                  <p className="font-medium text-textStrong">{order.orderNumber}</p>
                  <p className="text-xs text-textMuted">{order.customerName}</p>
                </div>
              ),
            },
            {
              key: "store",
              header: "Store",
              render: (order) => (
                <p className="line-clamp-1 text-sm text-textMuted">{order.storeName}</p>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (order) => (
                <div className="flex flex-wrap gap-1">
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.paymentStatus} />
                </div>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              className: "text-right",
              render: (order) => (
                <span className="font-semibold tabular-nums text-textStrong">
                  {formatCurrency(order.totalAmount)}
                </span>
              ),
            },
          ]}
          data={dashboard.recentOrders}
          keyExtractor={(order) => order.id}
        />
      </SectionCard>
    </div>
  );
}
