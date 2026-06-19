import type { AdminFinanceOverview, DashboardPayload, Order } from "@/types";

export type DistributionItem = {
  key: string;
  label: string;
  count: number;
};

export type AnalyticsSnapshot = {
  averageOrderValue: number;
  paidAverageOrderValue: number;
  completionRate: number;
  pendingOrderRate: number;
  productsPerStore: number;
  approvalPressure: number;
  refundRate: number;
  feeRate: number;
  commissionRate: number;
  completedOrders: number;
  recentOrderVolume: number;
};

function countBy<T>(
  items: T[],
  selector: (item: T) => string,
): DistributionItem[] {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = selector(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: key.replace(/_/g, " "),
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

export function buildDistribution<T>(
  items: T[],
  selector: (item: T) => string,
): DistributionItem[] {
  return countBy(items, selector);
}

export function buildAnalyticsSnapshot(
  dashboard: DashboardPayload,
  finance: AdminFinanceOverview | null,
): AnalyticsSnapshot {
  const { stats, recentOrders } = dashboard;
  const completedOrders = Math.max(stats.totalOrders - stats.pendingOrders, 0);
  const averageOrderValue =
    stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
  const paidAverageOrderValue =
    finance && finance.paidOrderCount > 0
      ? finance.paidOrderVolume / finance.paidOrderCount
      : averageOrderValue;

  const grossBase = finance?.grossCollectedTotal ?? stats.totalRevenue;

  return {
    averageOrderValue,
    paidAverageOrderValue,
    completionRate:
      stats.totalOrders > 0 ? (completedOrders / stats.totalOrders) * 100 : 0,
    pendingOrderRate:
      stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0,
    productsPerStore:
      stats.totalStores > 0 ? stats.totalProducts / stats.totalStores : 0,
    approvalPressure:
      stats.totalVendors > 0
        ? stats.pendingVendorApplications / stats.totalVendors
        : stats.pendingVendorApplications > 0
          ? 1
          : 0,
    refundRate: grossBase > 0 ? ((finance?.refundedTotal ?? 0) / grossBase) * 100 : 0,
    feeRate:
      grossBase > 0 ? ((finance?.processorFeeTotal ?? 0) / grossBase) * 100 : 0,
    commissionRate:
      grossBase > 0 ? ((finance?.commissionBalance ?? 0) / grossBase) * 100 : 0,
    completedOrders,
    recentOrderVolume: recentOrders.reduce((sum, order) => sum + order.totalAmount, 0),
  };
}

export function buildOrderStatusMix(orders: Order[]): DistributionItem[] {
  return countBy(orders, (order) => order.status);
}

export function buildPaymentStatusMix(orders: Order[]): DistributionItem[] {
  return countBy(orders, (order) => order.paymentStatus);
}

export function buildNotificationMix(
  notifications: DashboardPayload["recentNotifications"],
): DistributionItem[] {
  return countBy(notifications, (notification) => notification.type);
}

export function buildPaymentProviderMix(
  payments: Array<{ provider: string; status: string }>,
): DistributionItem[] {
  return countBy(
    payments.filter((payment) => payment.status === "paid" || payment.status === "success"),
    (payment) => payment.provider,
  );
}
