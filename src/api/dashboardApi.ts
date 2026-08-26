import type { DashboardPayload } from "@/types";
import { mapDashboard } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getDashboardOverview(token: string) {
  const payload = await requestJson<{
    stats: {
      total_users: number;
      total_vendors: number;
      pending_vendor_applications: number;
      total_stores: number;
      total_products: number;
      total_orders: number;
      pending_orders: number;
      total_revenue: number;
      revenue_today?: number;
      orders_today?: number;
      pending_products?: number;
      low_stock_products?: number;
      open_return_requests?: number;
      support_waiting_on_admin?: number;
      pending_withdrawals?: number;
    };
    recent_orders: Array<{
      id: string;
      order_number: string;
      customer_name: string;
      store_name: string;
      total_amount: number;
      status: DashboardPayload["recentOrders"][number]["status"];
      payment_status: DashboardPayload["recentOrders"][number]["paymentStatus"];
      created_at: string;
    }>;
    recent_vendor_applications: Array<{
      id: string;
      user_id: string;
      business_name: string;
      business_category: string;
      business_description: string;
      phone_number: string;
      whatsapp_number?: string | null;
      region: string;
      city: string;
      market_id?: string | null;
      store_name: string;
      store_description?: string | null;
      status: DashboardPayload["recentVendorApplications"][number]["status"];
      rejection_reason?: string | null;
      submitted_at?: string;
      created_at: string;
      updated_at: string;
    }>;
    recent_notifications: Array<{
      id: string;
      type: DashboardPayload["recentNotifications"][number]["type"];
      title: string;
      message: string;
      read: boolean;
      created_at: string;
    }>;
  }>("/admin/dashboard", { token });
  return mapDashboard(payload);
}

export type AdminKpiMetrics = {
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  avgOrderValue: number;
  ordersGrowthPercent: number;
  revenueGrowthPercent: number;
  totalUsers: number;
  activeVendors: number;
  uniqueCustomers: number;
  conversionRate: number;
};

/**
 * Month-to-date figures with a real month-over-month comparison.
 *
 * The growth percentages are computed server-side against last month's totals;
 * the directory KPI cards only show a delta because this endpoint supplies one.
 */
export async function getKpiMetrics(token: string): Promise<AdminKpiMetrics> {
  const payload = await requestJson<{
    today: { orders: number; revenue: number };
    this_month: {
      orders: number;
      revenue: number;
      avg_order_value: number;
      growth_vs_last_month: { orders_percent: number; revenue_percent: number };
    };
    platform: {
      total_users: number;
      active_vendors: number;
      unique_customers: number;
      conversion_rate: number;
    };
  }>("/admin/dashboard/kpi-metrics", { token });

  return {
    todayOrders: payload.today.orders,
    todayRevenue: payload.today.revenue,
    monthOrders: payload.this_month.orders,
    monthRevenue: payload.this_month.revenue,
    avgOrderValue: payload.this_month.avg_order_value,
    ordersGrowthPercent: payload.this_month.growth_vs_last_month.orders_percent,
    revenueGrowthPercent: payload.this_month.growth_vs_last_month.revenue_percent,
    totalUsers: payload.platform.total_users,
    activeVendors: payload.platform.active_vendors,
    uniqueCustomers: payload.platform.unique_customers,
    conversionRate: payload.platform.conversion_rate,
  };
}

export type SalesChartPoint = { date: string; orders: number; revenue: number };

export type SalesChart = {
  periodDays: number;
  data: SalesChartPoint[];
  totalRevenue: number;
  totalOrders: number;
  avgDailyRevenue: number;
  avgOrderValue: number;
};

/**
 * Daily paid/delivered order revenue.
 *
 * `days` is clamped to 7–90 server-side; the range control offers only values
 * inside that window so a request can never come back 422.
 */
export async function getSalesChart(token: string, days = 30): Promise<SalesChart> {
  const payload = await requestJson<{
    period_days: number;
    data: Array<{ date: string | null; orders: number; revenue: number }>;
    summary: {
      total_revenue: number;
      total_orders: number;
      avg_daily_revenue: number;
      avg_order_value: number;
    };
  }>(`/admin/dashboard/sales-chart?days=${days}`, { token });

  return {
    periodDays: payload.period_days,
    // A null bucket date cannot be placed on a time axis, so it is dropped
    // rather than rendered at an arbitrary position.
    data: payload.data
      .filter((point): point is { date: string; orders: number; revenue: number } =>
        Boolean(point.date),
      )
      .map((point) => ({
        date: point.date,
        orders: point.orders,
        revenue: point.revenue,
      })),
    totalRevenue: payload.summary.total_revenue,
    totalOrders: payload.summary.total_orders,
    avgDailyRevenue: payload.summary.avg_daily_revenue,
    avgOrderValue: payload.summary.avg_order_value,
  };
}

export type TopVendor = {
  rank: number;
  storeId: string;
  storeName: string;
  storeImage: string | null;
  orders: number;
  gmv: number;
  avgOrderValue: number;
};

export async function getTopVendors(
  token: string,
  { limit = 6, days = 30 }: { limit?: number; days?: number } = {},
): Promise<TopVendor[]> {
  const payload = await requestJson<
    Array<{
      rank: number;
      store_id: string;
      store_name: string;
      store_image: string | null;
      orders: number;
      gmv: number;
      avg_order_value: number;
    }>
  >(`/admin/dashboard/top-vendors?limit=${limit}&days=${days}`, { token });

  return payload.map((vendor) => ({
    rank: vendor.rank,
    storeId: vendor.store_id,
    storeName: vendor.store_name,
    storeImage: vendor.store_image,
    orders: vendor.orders,
    gmv: vendor.gmv,
    avgOrderValue: vendor.avg_order_value,
  }));
}
