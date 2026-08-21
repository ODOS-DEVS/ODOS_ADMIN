import React, { useState, useEffect } from 'react';
import {
  getPromoAnalyticsTimeseries,
  getPromoAnalyticsLeaderboard,
  PromoAnalyticsTimeseries,
  PromoAnalyticsLeaderboard,
} from '../../api/promoAnalyticsApi';

/**
 * Admin dashboard showing how your promotions are performing.
 *
 * Shows:
 * - How many people SAW each promotion (impressions)
 * - How many people CLICKED it (clicks)
 * - How many actually used it (conversions)
 * - Your best-performing promotions (leaderboard)
 */

type EntityType = 'campaign' | 'voucher' | 'banner';
type DateRange = 7 | 30 | 90;

export const FullPromoAnalyticsPage: React.FC<{ token: string }> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<EntityType>('campaign');
  const [dateRange, setDateRange] = useState<DateRange>(30);

  const [timeseries, setTimeseries] = useState<PromoAnalyticsTimeseries | null>(null);
  const [leaderboard, setLeaderboard] = useState<PromoAnalyticsLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when tab or date range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ts, lb] = await Promise.all([
          getPromoAnalyticsTimeseries(token, {
            entityType: activeTab,
            days: dateRange,
          }),
          getPromoAnalyticsLeaderboard(token, {
            entityType: activeTab,
            days: dateRange,
            limit: 10,
          }),
        ]);
        setTimeseries(ts);
        setLeaderboard(lb);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, dateRange, token]);

  const getTabLabel = (type: EntityType) => {
    switch (type) {
      case 'campaign':
        return 'Campaigns';
      case 'voucher':
        return 'Vouchers';
      case 'banner':
        return 'Banners';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Promotion Performance</h1>
      <p className="text-gray-600 mb-6">
        See how your campaigns, vouchers, and banners are performing. Track views, clicks, and
        actual purchases.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['campaign', 'voucher', 'banner'] as EntityType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === type
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {getTabLabel(type)}
          </button>
        ))}
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2 mb-6">
        <span className="text-sm font-medium text-gray-700 self-center">Last:</span>
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setDateRange(days as DateRange)}
            className={`px-3 py-1 text-sm rounded border ${
              dateRange === days
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            {days} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading analytics...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {timeseries && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded p-4">
                <div className="text-sm text-gray-600 mb-1">Total Views</div>
                <div className="text-3xl font-bold text-blue-600">
                  {timeseries.total_impressions.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded p-4">
                <div className="text-sm text-gray-600 mb-1">Total Clicks</div>
                <div className="text-3xl font-bold text-green-600">
                  {timeseries.total_clicks.toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 rounded p-4">
                <div className="text-sm text-gray-600 mb-1">Total Used</div>
                <div className="text-3xl font-bold text-purple-600">
                  {timeseries.total_conversions.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard && leaderboard.items.length > 0 && (
            <div className="bg-white rounded border p-4">
              <h2 className="text-lg font-bold mb-4">Top Performing {getTabLabel(activeTab)}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-center py-2 px-3">Views</th>
                      <th className="text-center py-2 px-3">Clicks</th>
                      <th className="text-center py-2 px-3">Used</th>
                      <th className="text-center py-2 px-3">Click Rate</th>
                      <th className="text-center py-2 px-3">Use Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.items.map((item) => (
                      <tr key={item.entity_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium">{item.entity_label}</td>
                        <td className="text-center py-3 px-3">
                          {item.impressions.toLocaleString()}
                        </td>
                        <td className="text-center py-3 px-3">{item.clicks.toLocaleString()}</td>
                        <td className="text-center py-3 px-3">
                          {item.conversions.toLocaleString()}
                        </td>
                        <td className="text-center py-3 px-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            {(item.click_through_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                            {(item.conversion_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {leaderboard && leaderboard.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data yet. Check back after customers interact with your promotions!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FullPromoAnalyticsPage;
