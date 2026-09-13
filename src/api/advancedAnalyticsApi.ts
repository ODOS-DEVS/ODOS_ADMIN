import { requestJson } from "@/api/client";

export interface CustomerMetrics {
  total_customers: number;
  new_customers_today: number;
  active_customers: number;
  retention_rate: number;
  average_lifetime_value: number;
}

export interface RevenueMetrics {
  total_revenue: number;
  revenue_today: number;
  revenue_7d: number;
  revenue_30d: number;
  avg_order_value: number;
  orders_today: number;
}

export interface ProductMetrics {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  avg_rating: number;
  top_products: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
  }>;
}

export interface InventoryMetrics {
  total_value: number;
  total_units: number;
  stock_turnover_rate: number;
  excess_inventory_value: number;
  optimal_stock_count: number;
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  orders: number;
  growth_rate: number;
  avg_rating: number;
}

export interface VendorMetrics {
  total_vendors: number;
  active_vendors: number;
  top_vendor: {
    name: string;
    revenue: number;
  };
  avg_vendor_rating: number;
  avg_vendor_products: number;
}

export interface SegmentMetrics {
  segment: string;
  user_count: number;
  avg_lifetime_spend: number;
  avg_order_value: number;
  engagement_score: number;
}

// These previously used a Create-React-App era axios client that read
// process.env.REACT_APP_API_URL -- undefined under Vite -- and so fell back to
// http://localhost:8000/api in production, with the token under the wrong
// localStorage key. They now go through requestJson like every other module,
// which returns the parsed payload directly rather than an axios envelope.

export async function getCustomerMetrics(token: string) {
  return requestJson<CustomerMetrics>("/admin/analytics/customers", { token });
}

export async function getRevenueMetrics(token: string, days: number = 30) {
  return requestJson<RevenueMetrics>(`/admin/analytics/revenue?days=${days}`, { token });
}

export async function getProductMetrics(token: string) {
  return requestJson<ProductMetrics>("/admin/analytics/products", { token });
}

export async function getInventoryMetrics(token: string) {
  return requestJson<InventoryMetrics>("/admin/analytics/inventory", { token });
}

export async function getCategoryPerformance(token: string, limit: number = 10) {
  return requestJson<CategoryPerformance[]>(
    `/admin/analytics/categories?limit=${limit}`,
    { token },
  );
}

export async function getVendorMetrics(token: string) {
  return requestJson<VendorMetrics>("/admin/analytics/vendors", { token });
}

export async function getSegmentsOverview(token: string) {
  return requestJson<{ segments: SegmentMetrics[]; total_users: number }>(
    "/customer-segmentation/overview",
    { token },
  );
}

export async function getChurnRiskUsers(token: string, threshold: number = 0.7) {
  return requestJson<{
    users: Array<{
      user_id: string;
      email: string;
      name: string;
      churn_risk_score: number;
    }>;
    count: number;
  }>(`/customer-segmentation/churn-risk?threshold=${threshold}&limit=50`, { token });
}

export async function exportSegmentForCampaign(token: string, segment: string) {
  return requestJson<{
    segment: string;
    count: number;
    emails: string[];
    csv: string;
  }>(`/customer-segmentation/segment/${encodeURIComponent(segment)}/export`, { token });
}
