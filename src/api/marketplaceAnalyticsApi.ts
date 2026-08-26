import { requestJson } from "@/api/client";

/**
 * The /admin/analytics/* family.
 *
 * Note what is deliberately NOT surfaced: category `growth_rate` is hardcoded
 * to 0.0 server-side ("Would need historical data"), so charting it would draw
 * a flat line and call it a trend. It is left out until the backend computes it.
 */

export type CategoryPerformance = {
  category: string;
  revenue: number;
  orders: number;
  avgRating: number;
};

export async function getCategoryPerformance(
  token: string,
  limit = 8,
): Promise<CategoryPerformance[]> {
  const payload = await requestJson<
    Array<{
      category: string;
      revenue: number;
      orders: number;
      growth_rate: number;
      avg_rating: number;
    }>
  >(`/admin/analytics/categories?limit=${limit}`, { token });

  return payload.map((row) => ({
    category: row.category,
    revenue: row.revenue,
    orders: row.orders,
    avgRating: row.avg_rating,
  }));
}

export type ProductMetrics = {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  avgRating: number;
  topProducts: Array<{ id: string; title: string; sales: number; revenue: number }>;
};

export async function getProductMetrics(token: string): Promise<ProductMetrics> {
  const payload = await requestJson<{
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
    avg_rating: number;
    top_products: Array<{ id: string; title: string; sales: number; revenue: number }>;
  }>("/admin/analytics/products", { token });

  return {
    totalProducts: payload.total_products,
    lowStockCount: payload.low_stock_count,
    outOfStockCount: payload.out_of_stock_count,
    avgRating: payload.avg_rating,
    topProducts: payload.top_products ?? [],
  };
}

export type CustomerMetrics = {
  totalCustomers: number;
  newCustomersToday: number;
  activeCustomers: number;
  retentionRate: number;
  averageLifetimeValue: number;
};

export async function getCustomerMetrics(token: string): Promise<CustomerMetrics> {
  const payload = await requestJson<{
    total_customers: number;
    new_customers_today: number;
    active_customers: number;
    retention_rate: number;
    average_lifetime_value: number;
  }>("/admin/analytics/customers", { token });

  return {
    totalCustomers: payload.total_customers,
    newCustomersToday: payload.new_customers_today,
    activeCustomers: payload.active_customers,
    retentionRate: payload.retention_rate,
    averageLifetimeValue: payload.average_lifetime_value,
  };
}
