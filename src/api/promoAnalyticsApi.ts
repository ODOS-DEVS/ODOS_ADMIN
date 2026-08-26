/**
 * API client for promotional analytics.
 *
 * Answers "are our promotions working?" for all three promo surfaces —
 * merchandising campaigns, vouchers and home banners — from the
 * impression/click/conversion events the mobile apps report.
 */

import { requestJson } from "@/api/client";

export type PromoEntityType = "campaign" | "voucher" | "banner";

export type PromoAnalyticsDatapoint = {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
};

export type PromoAnalyticsTimeseries = {
  entityType: string;
  entityId?: string | null;
  data: PromoAnalyticsDatapoint[];
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
};

export type PromoAnalyticsLeaderboardItem = {
  entityId: string;
  entityLabel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
};

export type PromoAnalyticsLeaderboard = {
  entityType: string;
  items: PromoAnalyticsLeaderboardItem[];
};

export type PromoChannelSummary = {
  entityType: PromoEntityType;
  trackedEntities: number;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
};

export type PromoPerformer = {
  entityId: string;
  entityLabel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  redemptionCount: number;
  uniqueUserCount: number;
  totalDiscountAmount: number;
};

export type PromoAnalyticsOverview = {
  days: number;
  generatedAt: string;
  scope: string;
  channels: PromoChannelSummary[];
  totalDiscountGiven: number;
  totalRedemptions: number;
  topPerformers: PromoPerformer[];
};

type BackendDatapoint = {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  click_through_rate?: number | null;
  conversion_rate?: number | null;
};

type BackendLeaderboardItem = {
  entity_id: string;
  entity_label: string;
  impressions: number;
  clicks: number;
  conversions: number;
  click_through_rate: number;
  conversion_rate: number;
};

type BackendPerformer = BackendLeaderboardItem & {
  redemption_count: number;
  unique_user_count: number;
  total_discount_amount: number;
};

function mapDatapoint(point: BackendDatapoint): PromoAnalyticsDatapoint {
  return {
    date: point.date,
    impressions: point.impressions,
    clicks: point.clicks,
    conversions: point.conversions,
    clickThroughRate: point.click_through_rate ?? 0,
    conversionRate: point.conversion_rate ?? 0,
  };
}

function mapLeaderboardItem(item: BackendLeaderboardItem): PromoAnalyticsLeaderboardItem {
  return {
    entityId: item.entity_id,
    entityLabel: item.entity_label,
    impressions: item.impressions,
    clicks: item.clicks,
    conversions: item.conversions,
    clickThroughRate: item.click_through_rate,
    conversionRate: item.conversion_rate,
  };
}

export async function getPromoAnalyticsOverview(
  token: string,
  params: { days: number },
): Promise<PromoAnalyticsOverview> {
  const query = new URLSearchParams({ days: String(params.days) });
  const payload = await requestJson<{
    days: number;
    generated_at: string;
    scope: string;
    channels: Array<{
      entity_type: PromoEntityType;
      tracked_entities: number;
      impressions: number;
      clicks: number;
      conversions: number;
      click_through_rate: number;
      conversion_rate: number;
    }>;
    total_discount_given: number;
    total_redemptions: number;
    top_performers: BackendPerformer[];
  }>(`/admin/promo-analytics/overview?${query}`, { token });

  return {
    days: payload.days,
    generatedAt: payload.generated_at,
    scope: payload.scope,
    channels: payload.channels.map((channel) => ({
      entityType: channel.entity_type,
      trackedEntities: channel.tracked_entities,
      impressions: channel.impressions,
      clicks: channel.clicks,
      conversions: channel.conversions,
      clickThroughRate: channel.click_through_rate,
      conversionRate: channel.conversion_rate,
    })),
    totalDiscountGiven: payload.total_discount_given,
    totalRedemptions: payload.total_redemptions,
    topPerformers: payload.top_performers.map((performer) => ({
      ...mapLeaderboardItem(performer),
      redemptionCount: performer.redemption_count,
      uniqueUserCount: performer.unique_user_count,
      totalDiscountAmount: performer.total_discount_amount,
    })),
  };
}

export async function getPromoAnalyticsTimeseries(
  token: string,
  params: { entityType: PromoEntityType; entityId?: string; days: number },
): Promise<PromoAnalyticsTimeseries> {
  const query = new URLSearchParams({
    entity_type: params.entityType,
    days: String(params.days),
    ...(params.entityId ? { entity_id: params.entityId } : {}),
  });

  const payload = await requestJson<{
    entity_type: string;
    entity_id?: string | null;
    data: BackendDatapoint[];
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
  }>(`/admin/promo-analytics/timeseries?${query}`, { token });

  return {
    entityType: payload.entity_type,
    entityId: payload.entity_id,
    data: payload.data.map(mapDatapoint),
    totalImpressions: payload.total_impressions,
    totalClicks: payload.total_clicks,
    totalConversions: payload.total_conversions,
  };
}

export async function getPromoAnalyticsLeaderboard(
  token: string,
  params: { entityType: PromoEntityType; days: number; limit: number },
): Promise<PromoAnalyticsLeaderboard> {
  const query = new URLSearchParams({
    entity_type: params.entityType,
    days: String(params.days),
    limit: String(params.limit),
  });

  const payload = await requestJson<{
    entity_type: string;
    items: BackendLeaderboardItem[];
  }>(`/admin/promo-analytics/leaderboard?${query}`, { token });

  return {
    entityType: payload.entity_type,
    items: payload.items.map(mapLeaderboardItem),
  };
}
