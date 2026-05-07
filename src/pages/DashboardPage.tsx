import {
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

import { getDashboardOverview } from "@/api/dashboardApi";
import { DataTable } from "@/components/tables/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { DashboardPayload, NotificationItem, Order, VendorApplication } from "@/types";
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
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const payload = await getDashboardOverview(token);
      setData(payload);
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
