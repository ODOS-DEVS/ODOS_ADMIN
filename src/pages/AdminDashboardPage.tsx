import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { requestJson } from "@/api/client";
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface SalesData {
  date: string;
  orders: number;
  revenue: number;
}

interface SalesChartResponse {
  period_days: number;
  data: SalesData[];
  summary: {
    total_revenue: number;
    total_orders: number;
    avg_daily_revenue: number;
    avg_order_value: number;
  };
}

interface TopVendor {
  rank: number;
  store_id: string;
  store_name: string;
  store_image: string | null;
  orders: number;
  gmv: number;
  avg_order_value: number;
}

interface KPIMetrics {
  today: {
    orders: number;
    revenue: number;
  };
  this_month: {
    orders: number;
    revenue: number;
    avg_order_value: number;
    growth_vs_last_month: {
      orders_percent: number;
      revenue_percent: number;
    };
  };
  platform: {
    total_users: number;
    active_vendors: number;
    unique_customers: number;
    conversion_rate: number;
  };
}

export default function AdminDashboardPage() {
  const [salesData, setSalesData] = useState<SalesChartResponse | null>(null);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDays, setChartDays] = useState(7);
  const { token } = useAdminAuth();

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartDays, token]);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      // The routes live under /admin/dashboard, not /dashboard -- the old
      // axios client pointed at localhost and never got far enough to 404.
      const [salesRes, vendorsRes, kpiRes] = await Promise.all([
        requestJson<any>(`/admin/dashboard/sales-chart?days=${chartDays}`, { token }),
        requestJson<any>(`/admin/dashboard/top-vendors?limit=10&days=30`, { token }),
        requestJson<any>("/admin/dashboard/kpi-metrics", { token }),
      ]);

      setSalesData(salesRes);
      setTopVendors(vendorsRes);
      setKpiMetrics(kpiRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time marketplace metrics and insights</p>
        </div>

        {/* KPI Cards */}
        {kpiMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Today's Revenue */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">₵{kpiMetrics.today.revenue.toFixed(2)}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Today's Orders */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpiMetrics.today.orders}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpiMetrics.platform.conversion_rate.toFixed(2)}%</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Vendors */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpiMetrics.platform.active_vendors}</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Growth Metrics */}
          {kpiMetrics && (
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-3">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Month-over-Month Growth</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">This Month Revenue</p>
                  <p className="text-xl font-bold text-gray-900">₵{kpiMetrics.this_month.revenue.toFixed(2)}</p>
                  <p className={`text-sm mt-2 ${kpiMetrics.this_month.growth_vs_last_month.revenue_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpiMetrics.this_month.growth_vs_last_month.revenue_percent >= 0 ? '+' : ''}{kpiMetrics.this_month.growth_vs_last_month.revenue_percent.toFixed(1)}% vs last month
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">This Month Orders</p>
                  <p className="text-xl font-bold text-gray-900">{kpiMetrics.this_month.orders}</p>
                  <p className={`text-sm mt-2 ${kpiMetrics.this_month.growth_vs_last_month.orders_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpiMetrics.this_month.growth_vs_last_month.orders_percent >= 0 ? '+' : ''}{kpiMetrics.this_month.growth_vs_last_month.orders_percent.toFixed(1)}% vs last month
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">AOV (Avg Order Value)</p>
                  <p className="text-xl font-bold text-gray-900">₵{kpiMetrics.this_month.avg_order_value.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">{kpiMetrics.platform.total_users.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-2">{kpiMetrics.platform.unique_customers.toLocaleString()} active</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sales Chart */}
        {salesData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Sales Trend</h2>
              <select
                value={chartDays}
                onChange={(e) => setChartDays(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={salesData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue (₵)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">₵{salesData.summary.total_revenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-lg font-bold text-gray-900">{salesData.summary.total_orders}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Daily Average</p>
                <p className="text-lg font-bold text-gray-900">₵{salesData.summary.avg_daily_revenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Order Value</p>
                <p className="text-lg font-bold text-gray-900">₵{salesData.summary.avg_order_value.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Vendors */}
        {topVendors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Vendors (Last 30 Days)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Store</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Orders</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">GMV</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">AOV</th>
                  </tr>
                </thead>
                <tbody>
                  {topVendors.map((vendor) => (
                    <tr key={vendor.store_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-900 font-semibold">{vendor.rank}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {vendor.store_image && (
                            <img
                              src={vendor.store_image}
                              alt={vendor.store_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <span className="text-gray-900">{vendor.store_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-900">{vendor.orders}</td>
                      <td className="py-4 px-4 text-right text-gray-900 font-semibold">₵{vendor.gmv.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-gray-900">₵{vendor.avg_order_value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
