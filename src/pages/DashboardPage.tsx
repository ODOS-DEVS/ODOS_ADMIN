import {
  ArrowRight,
  Bell,
  CircleDollarSign,
  Package,
  ShoppingCart,
  Store,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getDashboardOverview } from "@/api/dashboardApi";
import { getVendorWithdrawalRequests } from "@/api/payoutsApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
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

const statsMeta = [
  { key: "totalUsers", label: "Total users", icon: Users, hint: "Customer and admin accounts" },
  { key: "totalVendors", label: "Total vendors", icon: UserCheck, hint: "Approved vendor accounts" },
  {
    key: "pendingVendorApplications",
    label: "Pending applications",
    icon: WalletCards,
    hint: "Applications waiting for review",
  },
  { key: "totalStores", label: "Total stores", icon: Store, hint: "Live and draft storefronts" },
  { key: "totalProducts", label: "Total products", icon: Package, hint: "Catalog currently indexed" },
  { key: "totalOrders", label: "Total orders", icon: ShoppingCart, hint: "Platform-wide order volume" },
  { key: "pendingOrders", label: "Pending orders", icon: Bell, hint: "Orders needing immediate attention" },
  { key: "totalRevenue", label: "Total revenue", icon: CircleDollarSign, hint: "Gross platform revenue" },
] as const;

export function DashboardPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<AdminVendorWithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const [payload, withdrawals] = await Promise.all([
        getDashboardOverview(token),
        getVendorWithdrawalRequests(token),
      ]);
      setData(payload);
      setPayoutRequests(withdrawals);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const statCards = useMemo(() => {
    if (!data) return [];
    return statsMeta.map((item) => ({
      ...item,
      value:
        item.key === "totalRevenue"
          ? formatCurrency(data.stats[item.key])
          : new Intl.NumberFormat("en-GH").format(data.stats[item.key]),
    }));
  }, [data]);

  const payoutSummary = useMemo(() => {
    const pendingRequests = payoutRequests.filter((request) =>
      ["pending", "approved"].includes(request.status),
    );
    return {
      pendingCount: pendingRequests.length,
      pendingAmount: pendingRequests.reduce((sum, request) => sum + request.amount, 0),
      recent: payoutRequests.slice(0, 4),
    };
  }, [payoutRequests]);

  if (isLoading) {
    return <LoadingState label="Loading ODOS platform analytics..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        description={error ?? "Dashboard data is unavailable."}
        onRetry={() => void loadOverview()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Platform dashboard"
        description="A high-level view of vendor growth, catalog health, order flow, and operational alerts across ODOS."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <StatCard key={item.key} label={item.label} value={item.value} hint={item.hint} icon={item.icon} />
        ))}
      </div>

      <SectionCard
        title="Vendor payout approvals"
        description="Every vendor withdrawal request is approved by an admin from here before ODOS marks it paid out."
        action={
          <Button
            variant="secondary"
            leftIcon={<ArrowRight className="size-4" />}
            onClick={() => navigate("/payouts")}
          >
            Open payout queue
          </Button>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <p className="text-sm text-textMuted">Awaiting approval</p>
              <p className="mt-3 text-3xl font-semibold text-textStrong">
                {new Intl.NumberFormat("en-GH").format(payoutSummary.pendingCount)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-textMuted">Awaiting payout value</p>
              <p className="mt-2 text-2xl font-semibold text-textStrong">
                {formatCurrency(payoutSummary.pendingAmount)}
              </p>
            </div>
            <p className="text-sm leading-6 text-textMuted">
              Admin reviews the request details, approves or rejects it, then marks it
              paid only after the actual transfer has been completed.
            </p>
          </div>

          {payoutSummary.recent.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-textMuted">
              No vendor withdrawal requests yet. Once vendors start moving funds out of
              their in-app wallet, the queue will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {payoutSummary.recent.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => navigate("/payouts")}
                  className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-accent/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-textStrong">{request.vendorName}</p>
                      <p className="mt-1 text-sm text-textMuted">
                        {request.storeName ?? "Store not linked"} · {request.vendorEmail}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-textMuted">
                    <span className="font-medium text-textStrong">
                      {request.currency} {request.amount.toFixed(2)}
                    </span>
                    <span>{request.payoutMethodType.replace(/_/g, " ")}</span>
                    <span>{request.payoutAccountNumberMasked}</span>
                    <span>{formatDateTime(request.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Recent orders"
          description="Latest platform orders requiring attention or follow-up."
        >
          <DataTable<Order>
            columns={[
              {
                key: "order",
                header: "Order",
                render: (order) => (
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-textMuted">{order.customerName}</p>
                  </div>
                ),
              },
              {
                key: "store",
                header: "Store",
                render: (order) => (
                  <div>
                    <p>{order.storeName}</p>
                    <p className="mt-1 text-xs text-textMuted">{formatDateTime(order.createdAt)}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (order) => (
                  <div className="flex flex-col gap-2">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                className: "text-right",
                render: (order) => <div className="text-right font-medium">{formatCurrency(order.totalAmount)}</div>,
              },
            ]}
            data={data.recentOrders}
            keyExtractor={(order) => order.id}
          />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Recent vendor applications"
            description="Applications that may need fast approval."
          >
            <div className="space-y-3">
              {data.recentVendorApplications.map((application: VendorApplication) => (
                <div
                  key={application.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-textStrong">{application.businessName}</p>
                      <p className="mt-1 text-sm text-textMuted">
                        {application.storeName} · {application.city}, {application.region}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="mt-3 text-sm text-textMuted line-clamp-2">
                    {application.businessDescription}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Recent activity"
            description="Signals and notifications from the marketplace."
          >
            <div className="space-y-3">
              {data.recentNotifications.map((notification: NotificationItem) => (
                <div key={notification.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-textStrong">{notification.title}</p>
                      <p className="mt-1 text-sm text-textMuted">{notification.message}</p>
                    </div>
                    <StatusBadge status={notification.read ? "active" : "unread"} />
                  </div>
                  <p className="mt-3 text-xs text-textMuted">{formatDateTime(notification.createdAt)}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
