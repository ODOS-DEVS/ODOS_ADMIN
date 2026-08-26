import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  PackageX,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDashboardOverview,
  getKpiMetrics,
  getSalesChart,
  getTopVendors,
  type AdminKpiMetrics,
  type SalesChart,
  type TopVendor,
} from "@/api/dashboardApi";
import { getFinanceOverview } from "@/api/financeApi";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsUi";
import {
  AdminHeaderActions,
  HeaderActionButton,
} from "@/components/admin/AdminShell";
import { AdminPageIntro } from "@/components/admin/PageIntro";
import {
  getCategoryPerformance,
  getCustomerMetrics,
  getProductMetrics,
  type CategoryPerformance,
  type CustomerMetrics,
  type ProductMetrics,
} from "@/api/marketplaceAnalyticsApi";
import { BarChart } from "@/components/charts/BarChart";
import { BreakdownDonut } from "@/components/charts/BreakdownDonut";
import { StatusBar } from "@/components/charts/StatusBar";
import { ChartCard, ChartLegend, RangeControl } from "@/components/charts/ChartCard";
import { CATEGORICAL, withOverflow } from "@/components/charts/chartPalette";
import { RankedBars } from "@/components/charts/RankedBars";
import { TrendChart } from "@/components/charts/TrendChart";
import { MetricStat } from "@/components/directory/MetricStat";

import { DataTable } from "@/components/tables/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminFinanceOverview, DashboardPayload, Order } from "@/types";
import {
  buildAnalyticsSnapshot,
  buildOrderStatusMix,
} from "@/utils/analyticsMetrics";
import { formatCurrency, formatDateTime } from "@/utils/format";

/** Axis ticks: GH₵6k rather than GH₵6,000, so the plot keeps its width. */
function formatCompactGhs(value: number) {
  if (Math.abs(value) >= 1000) {
    return `GH₵${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `GH₵${Math.round(value)}`;
}

/** Axis/tooltip label for a daily bucket — "12 Aug", not an ISO timestamp. */
function formatChartDay(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(parsed);
}

type BriefAnalyticsState = {
  dashboard: DashboardPayload;
  finance: AdminFinanceOverview | null;
  kpi: AdminKpiMetrics | null;
  categories: CategoryPerformance[];
  products: ProductMetrics | null;
  customers: CustomerMetrics | null;
  sales: SalesChart | null;
  topVendors: TopVendor[];
};

const RANGE_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

export function AnalyticsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<BriefAnalyticsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(30);

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
        // The dashboard payload is the only hard requirement — the rest degrade
        // to an empty chart rather than taking the whole page down with them.
        const dashboard = await getDashboardOverview(token);
        const [finance, kpi, sales, topVendors, categories, products, customers] =
          await Promise.all([
            getFinanceOverview(token).catch(() => null),
            getKpiMetrics(token).catch(() => null),
            getSalesChart(token, rangeDays).catch(() => null),
            getTopVendors(token, { limit: 6, days: rangeDays }).catch(() => []),
            getCategoryPerformance(token, 8).catch(() => []),
            getProductMetrics(token).catch(() => null),
            getCustomerMetrics(token).catch(() => null),
          ]);
        setState({ dashboard, finance, kpi, sales, topVendors, categories, products, customers });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rangeDays, token],
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

  /**
   * Which days of the week actually carry the orders.
   *
   * Derived from the daily series rather than fetched: the question is about
   * staffing and dispatch rhythm, and averaging per weekday answers it without
   * another endpoint. Averages, not totals — a 90-day window contains more
   * Mondays than a 30-day one, so totals would just track the window length.
   */
  const weekdayRows = useMemo(() => {
    const points = state?.sales?.data ?? [];
    if (points.length === 0) return [];
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = names.map((label) => ({ label, total: 0, days: 0 }));
    for (const point of points) {
      const parsed = new Date(point.date);
      if (Number.isNaN(parsed.getTime())) continue;
      const bucket = buckets[parsed.getDay()];
      bucket.total += point.orders;
      bucket.days += 1;
    }
    // Monday-first reads better than the JS Sunday-first ordering.
    const ordered = [...buckets.slice(1), buckets[0]];
    return ordered.map((bucket) => ({
      label: bucket.label,
      value: bucket.days > 0 ? Number((bucket.total / bucket.days).toFixed(1)) : 0,
      caption: `${bucket.days} day${bucket.days === 1 ? "" : "s"} in range`,
    }));
  }, [state?.sales?.data]);

  const pipelineRows = useMemo(
    () => (state ? withOverflow(orderStatusMix.map((item) => ({ label: item.label, value: item.count }))) : []),
    [orderStatusMix, state],
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricStat
          label="Gross collected"
          value={formatCurrency(Math.round(grossCollected))}
          icon={CircleDollarSign}
          tone="success"
          delta={
            state.kpi
              ? { percent: state.kpi.revenueGrowthPercent, label: "vs last month" }
              : undefined
          }
          caption={state.kpi ? undefined : "Checkout value processed"}
          animationDelay={40}
        />
        <MetricStat
          label="Paid orders"
          value={new Intl.NumberFormat("en-GH").format(paidOrders)}
          icon={ShoppingCart}
          delta={
            state.kpi
              ? { percent: state.kpi.ordersGrowthPercent, label: "vs last month" }
              : undefined
          }
          caption={state.kpi ? undefined : `${stats.ordersToday} today`}
          animationDelay={80}
        />
        <MetricStat
          label="Avg order value"
          value={formatCurrency(Math.round(snapshot.paidAverageOrderValue))}
          icon={TrendingUp}
          tone="info"
          caption="Per paid checkout"
          animationDelay={120}
        />
        <MetricStat
          label="Commission"
          value={formatCurrency(Math.round(finance?.commissionBalance ?? 0))}
          icon={Wallet}
          caption="ODOS platform share"
          animationDelay={160}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Revenue"
          description="Paid and delivered orders per day."
          animationDelay={200}
          control={
            <RangeControl
              ariaLabel="Revenue period"
              options={RANGE_OPTIONS}
              value={rangeDays}
              onChange={setRangeDays}
            />
          }
          legend={
            state.sales ? (
              <ChartLegend
                items={[
                  {
                    label: "Revenue",
                    color: CATEGORICAL[0],
                    value: formatCurrency(Math.round(state.sales.totalRevenue)),
                  },
                ]}
              />
            ) : undefined
          }
        >
          <TrendChart
            data={state.sales?.data ?? []}
            xKey="date"
            series={[{ key: "revenue", label: "Revenue", colorIndex: 0 }]}
            formatValue={(value) => formatCurrency(Math.round(value))}
            formatTick={formatCompactGhs}
            formatX={formatChartDay}
            height={300}
            emptyMessage="No paid orders in this period yet."
          />
        </ChartCard>

        <ChartCard
          title="Order pipeline"
          description="Where recent orders currently sit."
          animationDelay={240}
        >
          <BreakdownDonut
            rows={pipelineRows}
            formatValue={(value) => `${value} order${value === 1 ? "" : "s"}`}
            centerLabel={{
              value: String(dashboard.recentOrders.length),
              caption: "recent orders",
            }}
            emptyMessage="No recent orders to break down."
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Orders per day"
          description="Volume alongside the revenue above — same period, its own axis so neither scale distorts the other."
          animationDelay={280}
        >
          <TrendChart
            data={state.sales?.data ?? []}
            xKey="date"
            series={[{ key: "orders", label: "Orders", colorIndex: 1 }]}
            formatValue={(value) => new Intl.NumberFormat("en-GH").format(value)}
            formatX={formatChartDay}
            height={200}
            emptyMessage="No orders in this period yet."
          />
        </ChartCard>

        <ChartCard
          title="Top stores"
          description={`By gross merchandise value, last ${rangeDays} days.`}
          animationDelay={320}
        >
          <RankedBars
            rows={(state.topVendors ?? []).map((vendor) => ({
              id: vendor.storeId,
              label: vendor.storeName,
              caption: `${vendor.orders} order${vendor.orders === 1 ? "" : "s"} · ${formatCurrency(
                Math.round(vendor.avgOrderValue),
              )} avg`,
              value: vendor.gmv,
              valueLabel: formatCurrency(Math.round(vendor.gmv)),
            }))}
            emptyMessage="No store has recorded a paid order in this period."
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Revenue by category"
          description="Which parts of the catalog actually earn, all time."
          animationDelay={360}
        >
          <BarChart
            rows={(state.categories ?? []).map((row) => ({
              label: row.category,
              value: row.revenue,
              caption: `${row.orders} order${row.orders === 1 ? "" : "s"}${
                row.avgRating > 0 ? ` · ${row.avgRating.toFixed(1)}★` : ""
              }`,
            }))}
            orientation="horizontal"
            formatValue={(value) => formatCurrency(Math.round(value))}
            formatTick={formatCompactGhs}
            emptyMessage="No category has recorded revenue yet."
          />
        </ChartCard>

        <ChartCard
          title="Catalog health"
          description="How much of the catalog is sellable right now."
          animationDelay={400}
        >
          {state.products ? (
            <StatusBar
              totalLabel="products listed"
              segments={[
                {
                  label: "In stock",
                  value: Math.max(
                    state.products.totalProducts -
                      state.products.lowStockCount -
                      state.products.outOfStockCount,
                    0,
                  ),
                  tone: "good",
                  icon: CheckCircle2,
                },
                {
                  label: "Low stock",
                  value: state.products.lowStockCount,
                  tone: "warning",
                  icon: AlertTriangle,
                },
                {
                  label: "Out of stock",
                  value: state.products.outOfStockCount,
                  tone: "critical",
                  icon: PackageX,
                },
              ]}
            />
          ) : (
            <p className="px-2 py-6 text-center text-sm text-textMuted">
              Catalog metrics are unavailable right now.
            </p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Orders by weekday"
          description="Average orders per day of the week — the dispatch rhythm to staff against."
          animationDelay={440}
        >
          <BarChart
            rows={weekdayRows}
            orientation="vertical"
            color={CATEGORICAL[1]}
            formatValue={(value) => `${value} order${value === 1 ? "" : "s"} avg`}
            formatTick={(value) => String(Math.round(value))}
            height={220}
            emptyMessage="Not enough history to show a weekday pattern."
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          title="Best-selling products"
          description="By revenue, all time."
          animationDelay={480}
        >
          <RankedBars
            rows={(state.products?.topProducts ?? []).map((product) => ({
              id: product.id,
              label: product.title,
              caption: `${product.sales} sold`,
              value: product.revenue,
              valueLabel: formatCurrency(Math.round(product.revenue)),
            }))}
            emptyMessage="No product has recorded a sale yet."
          />
        </ChartCard>
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
                  <StatePill label={labelForStatus(order.status)} tone={toneForStatus(order.status)} />
                  <StatePill label={labelForStatus(order.paymentStatus)} tone={toneForStatus(order.paymentStatus)} />
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
