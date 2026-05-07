import {
  Activity,
  BarChart3,
  BellRing,
  CircleDollarSign,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getDashboardOverview } from "@/api/dashboardApi";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { DashboardPayload } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

type InsightMetric = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

export function AnalyticsPage() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const payload = await getDashboardOverview(token);
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const insights = useMemo<InsightMetric[]>(() => {
    if (!data) return [];

    const averageOrderValue =
      data.stats.totalOrders > 0 ? data.stats.totalRevenue / data.stats.totalOrders : 0;
    const vendorCoverage =
      data.stats.totalStores > 0 ? data.stats.totalProducts / data.stats.totalStores : 0;
    const approvalPressure =
      data.stats.totalVendors > 0
        ? data.stats.pendingVendorApplications / data.stats.totalVendors
        : data.stats.pendingVendorApplications > 0
          ? 1
          : 0;
    const orderAttention =
      data.stats.totalOrders > 0 ? data.stats.pendingOrders / data.stats.totalOrders : 0;

    return [
      {
        label: "Average order value",
        value: formatCurrency(Math.round(averageOrderValue)),
        hint: "Revenue spread across confirmed shopper demand.",
        icon: CircleDollarSign,
      },
      {
        label: "Products per store",
        value: vendorCoverage.toFixed(1),
        hint: "A quick read on storefront catalog depth.",
        icon: Package,
      },
      {
        label: "Approval pressure",
        value: `${Math.round(approvalPressure * 100)}%`,
        hint: "How much vendor review work is waiting in the queue.",
        icon: Users,
      },
      {
        label: "Orders needing action",
        value: `${Math.round(orderAttention * 100)}%`,
        hint: "Share of orders still moving through fulfillment.",
        icon: ShoppingCart,
      },
    ];
  }, [data]);

  const scaleMax = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      data.stats.totalUsers,
      data.stats.totalVendors,
      data.stats.totalStores,
      data.stats.totalProducts,
      1,
    );
  }, [data]);

  const footprintSeries = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Users", value: data.stats.totalUsers, color: "from-sky-400 to-cyan-300" },
      { label: "Vendors", value: data.stats.totalVendors, color: "from-emerald-400 to-lime-300" },
      { label: "Stores", value: data.stats.totalStores, color: "from-amber-400 to-orange-300" },
      { label: "Products", value: data.stats.totalProducts, color: "from-fuchsia-400 to-pink-300" },
    ];
  }, [data]);

  const notificationMix = useMemo(() => {
    if (!data) return [];
    const counts = data.recentNotifications.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});
    const maxCount = Math.max(...Object.values(counts), 1);

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      width: `${Math.max((count / maxCount) * 100, 24)}%`,
    }));
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading ODOS analytics..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        description={error ?? "Analytics are unavailable right now."}
        onRetry={() => void loadAnalytics()}
      />
    );
  }

  const completedOrders = Math.max(data.stats.totalOrders - data.stats.pendingOrders, 0);
  const completionRate =
    data.stats.totalOrders > 0 ? (completedOrders / data.stats.totalOrders) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="ODOS performance snapshot"
        description="Read the shape of the marketplace at a glance with richer visual cues for growth, fulfillment, and activity."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
            icon={item.icon}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Marketplace footprint"
          description="A quick visual balance of the people, storefronts, and catalog depth currently powering ODOS."
        >
          <div className="space-y-4">
            {footprintSeries.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-textMuted">{item.label}</span>
                  <span className="font-medium text-textStrong">
                    {new Intl.NumberFormat("en-GH").format(item.value)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    style={{ width: `${Math.max((item.value / scaleMax) * 100, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Fulfillment rhythm"
          description="How much of the current order volume is still moving through the operational pipeline."
        >
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-textMuted">Completed flow</p>
                <p className="mt-2 text-4xl font-semibold text-textStrong">
                  {Math.round(completionRate)}%
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-200">
                <Activity className="size-5" />
              </div>
            </div>
            <div className="mt-5 h-3 rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                style={{ width: `${Math.max(completionRate, 8)}%` }}
              />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-textMuted">Pending</p>
                <p className="mt-3 text-2xl font-semibold text-textStrong">
                  {new Intl.NumberFormat("en-GH").format(data.stats.pendingOrders)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-textMuted">Completed</p>
                <p className="mt-3 text-2xl font-semibold text-textStrong">
                  {new Intl.NumberFormat("en-GH").format(completedOrders)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Recent activity mix"
          description="The kinds of events reaching the admin desk most often right now."
        >
          <div className="space-y-4">
            {notificationMix.length ? (
              notificationMix.map((item) => (
                <div key={item.type}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="capitalize text-textMuted">{item.type}</span>
                    <span className="font-medium text-textStrong">{item.count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-amber-300"
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-textMuted">
                Recent activity will appear here as the notification stream grows.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Latest momentum"
          description="A compact pulse of the most recent orders and queue items reaching the platform."
        >
          <div className="space-y-3">
            {data.recentOrders.map((order, index) => (
              <div
                key={order.id}
                className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[auto_1fr_auto]"
              >
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/30 text-accentSoft">
                  {index === 0 ? <BarChart3 className="size-5" /> : <Store className="size-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-textStrong">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-textMuted">
                    {order.customerName} · {order.storeName}
                  </p>
                  <p className="mt-2 text-xs text-textMuted">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <p className="font-medium text-textStrong">{formatCurrency(order.totalAmount)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Revenue lens"
          description="How the gross marketplace revenue compares with catalog and vendor scale."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Gross revenue",
                value: formatCurrency(Math.round(data.stats.totalRevenue)),
                icon: CircleDollarSign,
              },
              {
                label: "Approved vendors",
                value: new Intl.NumberFormat("en-GH").format(data.stats.totalVendors),
                icon: Users,
              },
              {
                label: "Catalog size",
                value: new Intl.NumberFormat("en-GH").format(data.stats.totalProducts),
                icon: Package,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-textMuted">{card.label}</p>
                    <div className="rounded-2xl border border-accent/20 bg-accent/10 p-2 text-accentSoft">
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-textStrong">{card.value}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent signals"
          description="Notifications worth keeping an eye on while the marketplace scales."
        >
          <div className="space-y-3">
            {data.recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-2 text-amber-200">
                  <BellRing className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-textStrong">{notification.title}</p>
                    <StatusBadge status={notification.read ? "active" : "unread"} />
                  </div>
                  <p className="mt-2 text-sm text-textMuted">{notification.message}</p>
                  <p className="mt-3 text-xs text-textMuted">{formatDateTime(notification.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
