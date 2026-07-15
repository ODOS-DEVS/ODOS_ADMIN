import {
  ArrowRight,
  Bell,
  CircleDollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Store,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LiveEventFeed } from "@/components/audit/LiveEventFeed";
import { getDashboardOverview } from "@/api/dashboardApi";
import { getVendorWithdrawalRequests } from "@/api/payoutsApi";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type {
  AdminVendorWithdrawalRequest,
  DashboardPayload,
  NotificationItem,
  Order,
  VendorApplication,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

const heroStats = [
  {
    key: "totalRevenue",
    label: "Revenue",
    icon: CircleDollarSign,
    hint: "Gross platform revenue",
    tone: "success" as const,
    route: "/finance",
  },
  {
    key: "totalOrders",
    label: "Orders",
    icon: ShoppingCart,
    hint: "All-time order volume",
    tone: "default" as const,
    route: "/orders",
  },
  {
    key: "pendingOrders",
    label: "Pending orders",
    icon: Bell,
    hint: "Needs attention now",
    tone: "warning" as const,
    route: "/orders",
  },
  {
    key: "pendingVendorApplications",
    label: "Vendor applications",
    icon: WalletCards,
    hint: "Awaiting review",
    tone: "warning" as const,
    route: "/vendor-applications",
  },
] as const;

const secondaryStats = [
  { key: "totalUsers", label: "Users", icon: Users, route: "/users" },
  { key: "totalVendors", label: "Vendors", icon: UserCheck, route: "/vendors" },
  { key: "totalStores", label: "Stores", icon: Store, route: "/stores" },
  { key: "totalProducts", label: "Products", icon: Package, route: "/products" },
] as const;

type FeedTab = "applications" | "activity" | "audit";

function formatStatValue(key: string, value: number) {
  if (key === "totalRevenue") {
    return formatCurrency(value);
  }
  return new Intl.NumberFormat("en-GH").format(value);
}

export function DashboardPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<AdminVendorWithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>("applications");

  const loadOverview = useCallback(async (background = false) => {
    if (!token) return;
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const partialErrors: string[] = [];
    let payload: DashboardPayload | null = null;
    let withdrawals: AdminVendorWithdrawalRequest[] = [];

    try {
      payload = await getDashboardOverview(token);
    } catch (loadError) {
      partialErrors.push(
        loadError instanceof Error ? loadError.message : "Unable to load dashboard overview.",
      );
    }

    try {
      withdrawals = await getVendorWithdrawalRequests(token);
    } catch (loadError) {
      partialErrors.push(
        loadError instanceof Error ? loadError.message : "Unable to load payout requests.",
      );
    }

    if (payload) {
      setData(payload);
    }
    setPayoutRequests(withdrawals);

    if (!payload && partialErrors.length > 0) {
      setError(partialErrors[0]);
    } else if (payload && partialErrors.length > 0) {
      setError(null);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [token]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const payoutSummary = useMemo(() => {
    const pendingRequests = payoutRequests.filter((request) =>
      ["pending", "approved"].includes(request.status),
    );
    return {
      pendingCount: pendingRequests.length,
      pendingAmount: pendingRequests.reduce((sum, request) => sum + request.amount, 0),
      recent: payoutRequests.slice(0, 2),
    };
  }, [payoutRequests]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <ErrorState
        description={error ?? "Dashboard data is unavailable."}
        onRetry={() => void loadOverview()}
      />
    );
  }

  const pendingOrders = data.stats.pendingOrders;
  const pendingApplications = data.stats.pendingVendorApplications;

  return (
    <div className="space-y-4">
      {/* Compact command header */}
      <div
        className="animate-fade-up opacity-0"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
              Command center
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">
              Platform overview
            </h1>
            <p className="mt-1 text-sm text-textMuted">
              {pendingOrders > 0 || pendingApplications > 0 || payoutSummary.pendingCount > 0
                ? `${pendingOrders} pending order${pendingOrders === 1 ? "" : "s"} · ${pendingApplications} vendor review${pendingApplications === 1 ? "" : "s"} · ${payoutSummary.pendingCount} payout${payoutSummary.pendingCount === 1 ? "" : "s"}`
                : "Marketplace is running smoothly — no urgent queues."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={
                <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
              }
              onClick={() => void loadOverview(true)}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => navigate("/orders")}>
              Orders
            </Button>
            <Button variant="secondary" onClick={() => navigate("/payouts")}>
              Payouts
            </Button>
            <Button
              leftIcon={<ArrowRight className="size-4" />}
              onClick={() => navigate("/analytics")}
            >
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Hero KPIs — actionable metrics first */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {heroStats.map((item, index) => (
          <StatCard
            key={item.key}
            label={item.label}
            value={formatStatValue(item.key, data.stats[item.key])}
            hint={item.hint}
            icon={item.icon}
            tone={item.tone}
            animationDelay={60 + index * 50}
            onClick={() => navigate(item.route)}
          />
        ))}
      </div>

      {/* Secondary metrics — one dense strip */}
      <div
        className="animate-fade-up opacity-0 rounded-2xl border border-white/10 bg-white/[0.02] p-2"
        style={{ animationDelay: "280ms" }}
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {secondaryStats.map((item, index) => (
            <StatCard
              key={item.key}
              variant="compact"
              label={item.label}
              value={formatStatValue(item.key, data.stats[item.key])}
              icon={item.icon}
              animationDelay={300 + index * 40}
              onClick={() => navigate(item.route)}
            />
          ))}
        </div>
      </div>

      {/* Bento grid — orders + operations side by side */}
      <div className="grid gap-4 xl:grid-cols-12">
        <SectionCard
          compact
          className="xl:col-span-7"
          animationDelay={360}
          title="Recent orders"
          description="Latest transactions across the marketplace"
          action={
            <Button variant="ghost" onClick={() => navigate("/orders")}>
              View all
            </Button>
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
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-textMuted">{order.customerName}</p>
                  </div>
                ),
              },
              {
                key: "store",
                header: "Store",
                render: (order) => (
                  <div>
                    <p className="line-clamp-1">{order.storeName}</p>
                    <p className="text-xs text-textMuted">{formatDateTime(order.createdAt)}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (order) => (
                  <div className="flex flex-wrap items-center gap-1.5">
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
                  <div className="text-right font-medium tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </div>
                ),
              },
            ]}
            data={data.recentOrders}
            keyExtractor={(order) => order.id}
          />
        </SectionCard>

        <div className="space-y-4 xl:col-span-5">
          {/* Compact payout queue */}
          <SectionCard
            compact
            animationDelay={420}
            title="Payout queue"
            description="Vendor withdrawal approvals"
            action={
              <Button
                variant="ghost"
                leftIcon={<ArrowRight className="size-4" />}
                onClick={() => navigate("/payouts?status=pending")}
              >
                Open queue
              </Button>
            }
          >
            <div
              className={
                payoutSummary.pendingCount > 0
                  ? "rounded-xl border border-warning/30 bg-warning/[0.08] px-3.5 py-3"
                  : "rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-textMuted">
                    Awaiting action
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-textStrong">
                    {payoutSummary.pendingCount}{" "}
                    <span className="text-sm font-normal text-textMuted">requests</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-textMuted">Value</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-textStrong">
                    {formatCurrency(payoutSummary.pendingAmount)}
                  </p>
                </div>
              </div>
            </div>

            {payoutSummary.recent.length === 0 ? (
              <p className="mt-3 text-xs leading-5 text-textMuted">
                No withdrawal requests yet. They will appear here when vendors cash out.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {payoutSummary.recent.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => navigate("/payouts?status=pending")}
                    className="group w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-accent/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-textStrong">
                          {request.vendorName}
                        </p>
                        <p className="truncate text-xs text-textMuted">
                          {request.currency} {request.amount.toFixed(2)} ·{" "}
                          {formatDateTime(request.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Tabbed feed — applications + activity in one panel */}
          <SectionCard
            compact
            animationDelay={480}
            title="Operations feed"
            description="Reviews and marketplace signals"
            bodyClassName="pt-3"
          >
            <div className="mb-3 flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
              {(
                [
                  {
                    id: "applications" as const,
                    label: "Applications",
                    count: data.recentVendorApplications.length,
                  },
                  {
                    id: "activity" as const,
                    label: "Activity",
                    count: data.recentNotifications.length,
                  },
                  {
                    id: "audit" as const,
                    label: "Live audit",
                    count: 0,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFeedTab(tab.id)}
                  className={
                    feedTab === tab.id
                      ? "flex-1 rounded-lg bg-accent/15 px-3 py-2 text-xs font-semibold text-accentSoft transition"
                      : "flex-1 rounded-lg px-3 py-2 text-xs font-medium text-textMuted transition hover:bg-white/[0.04] hover:text-textStrong"
                  }
                >
                  {tab.label}
                  <span className="ml-1.5 tabular-nums opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
              {feedTab === "applications" ? (
                data.recentVendorApplications.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-textMuted">
                    No vendor applications in the queue.
                  </p>
                ) : (
                  data.recentVendorApplications.map((application: VendorApplication) => (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => navigate("/vendor-applications")}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-accent/25 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-textStrong">
                            {application.businessName}
                          </p>
                          <p className="truncate text-xs text-textMuted">
                            {application.storeName} · {application.city}
                          </p>
                        </div>
                        <StatusBadge status={application.status} />
                      </div>
                    </button>
                  ))
                )
              ) : feedTab === "audit" ? (
                <LiveEventFeed compact />
              ) : data.recentNotifications.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-textMuted">
                  No recent notifications.
                </p>
              ) : (
                data.recentNotifications.map((notification: NotificationItem) => (
                  <div
                    key={notification.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-textStrong">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-textMuted">
                          {notification.message}
                        </p>
                      </div>
                      <StatusBadge status={notification.read ? "active" : "unread"} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-textMuted">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(
                    feedTab === "applications"
                      ? "/vendor-applications"
                      : feedTab === "audit"
                        ? "/audit"
                        : "/notifications",
                  )
                }
              >
                View all{" "}
                {feedTab === "applications"
                  ? "applications"
                  : feedTab === "audit"
                    ? "audit log"
                    : "notifications"}
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
