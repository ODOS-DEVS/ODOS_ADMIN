import { apiClient } from '@/utils/apiClient';

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

// Fetch customer metrics
export async function getCustomerMetrics() {
  return apiClient.get<CustomerMetrics>('/admin/analytics/customers');
}

// Fetch revenue metrics
export async function getRevenueMetrics(days: number = 30) {
  return apiClient.get<RevenueMetrics>(`/admin/analytics/revenue?days=${days}`);
}

// Fetch product metrics
export async function getProductMetrics() {
  return apiClient.get<ProductMetrics>('/admin/analytics/products');
}

// Fetch inventory metrics
export async function getInventoryMetrics() {
  return apiClient.get<InventoryMetrics>('/admin/analytics/inventory');
}

// Fetch category performance
export async function getCategoryPerformance(limit: number = 10) {
  return apiClient.get<CategoryPerformance[]>(
    `/admin/analytics/categories?limit=${limit}`
  );
}

// Fetch vendor metrics
export async function getVendorMetrics() {
  return apiClient.get<VendorMetrics>('/admin/analytics/vendors');
}

// Fetch customer segments overview
export async function getSegmentsOverview() {
  return apiClient.get<{
    segments: SegmentMetrics[];
    total_users: number;
  }>('/customer-segmentation/overview');
}

// Fetch churn risk users
export async function getChurnRiskUsers(threshold: number = 0.7) {
  return apiClient.get<{
    users: Array<{
      user_id: string;
      email: string;
      name: string;
      churn_risk_score: number;
    }>;
    count: number;
  }>(`/customer-segmentation/churn-risk?threshold=${threshold}&limit=50`);
}

// Export segment for campaign
export async function exportSegmentForCampaign(segment: string) {
  return apiClient.get<{
    segment: string;
    count: number;
    emails: string[];
    csv: string;
  }>(`/customer-segmentation/segment/${segment}/export`);
}
