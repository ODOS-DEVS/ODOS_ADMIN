/**
 * API client for promotional analytics.
 * Shows you how well your campaigns and vouchers are performing.
 */

export interface PromoAnalyticsDatapoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  click_through_rate?: number;
  conversion_rate?: number;
}

export interface PromoAnalyticsTimeseries {
  entity_type: string;
  entity_id?: string;
  data: PromoAnalyticsDatapoint[];
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
}

export interface PromoAnalyticsLeaderboardItem {
  entity_id: string;
  entity_label: string;
  impressions: number;
  clicks: number;
  conversions: number;
  click_through_rate: number;
  conversion_rate: number;
}

export interface PromoAnalyticsLeaderboard {
  entity_type: string;
  items: PromoAnalyticsLeaderboardItem[];
}

export async function getPromoAnalyticsTimeseries(
  token: string,
  params: {
    entityType: 'campaign' | 'voucher' | 'banner';
    entityId?: string;
    days: number;
  }
): Promise<PromoAnalyticsTimeseries> {
  const query = new URLSearchParams({
    entity_type: params.entityType,
    days: String(params.days),
    ...(params.entityId && { entity_id: params.entityId }),
  });

  const response = await fetch(
    `/api/admin/promotions/analytics/timeseries?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch analytics timeseries');
  }

  return response.json();
}

export async function getPromoAnalyticsLeaderboard(
  token: string,
  params: {
    entityType: 'campaign' | 'voucher' | 'banner';
    days: number;
    limit: number;
  }
): Promise<PromoAnalyticsLeaderboard> {
  const query = new URLSearchParams({
    entity_type: params.entityType,
    days: String(params.days),
    limit: String(params.limit),
  });

  const response = await fetch(
    `/api/admin/promotions/analytics/leaderboard?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch analytics leaderboard');
  }

  return response.json();
}
