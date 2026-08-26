import { BarChart3, MousePointerClick, Percent, Ticket } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getPromoAnalyticsLeaderboard,
  getPromoAnalyticsOverview,
  getPromoAnalyticsTimeseries,
  type PromoAnalyticsLeaderboard,
  type PromoAnalyticsLeaderboardItem,
  type PromoAnalyticsOverview,
  type PromoAnalyticsTimeseries,
  type PromoEntityType,
} from "@/api/promoAnalyticsApi";
import { AdminPageIntro } from "@/components/admin/PageIntro";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsUi";
import { MiniBarTrend } from "@/components/analytics/MarketplaceAnalyticsUi";
import { DataTable } from "@/components/tables/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatCurrency } from "@/utils/format";

/**
 * How the marketplace's promotions are performing.
 *
 * The funnel is impression → click → conversion, reported per promo surface
 * (merchandising campaigns, vouchers, home banners). Vouchers additionally show
 * real money, because a voucher redemption records the discount actually given
 * — campaigns and banners have no equivalent figure.
 */

const ENTITY_TABS: Array<{ value: PromoEntityType; label: string }> = [
  { value: "campaign", label: "Campaigns" },
  { value: "voucher", label: "Vouchers" },
  { value: "banner", label: "Banners" },
];

const RANGES = [7, 30, 90] as const;

type PromoAnalyticsState = {
  overview: PromoAnalyticsOverview;
  timeseries: PromoAnalyticsTimeseries;
  leaderboard: PromoAnalyticsLeaderboard;
};

/** Rates arrive from the API already scaled to percent — never multiply again. */
function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function FullPromoAnalyticsPage() {
  const { token } = useAdminAuth();
  const [entityType, setEntityType] = useState<PromoEntityType>("campaign");
  const [days, setDays] = useState<number>(30);
  const [state, setState] = useState<PromoAnalyticsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [overview, timeseries, leaderboard] = await Promise.all([
        getPromoAnalyticsOverview(token, { days }),
        getPromoAnalyticsTimeseries(token, { entityType, days }),
        getPromoAnalyticsLeaderboard(token, { entityType, days, limit: 10 }),
      ]);
      setState({ overview, timeseries, leaderboard });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promo analytics");
    } finally {
      setIsLoading(false);
    }
  }, [days, entityType, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const channel = useMemo(
    () => state?.overview.channels.find((item) => item.entityType === entityType),
    [entityType, state],
  );

  const trendBars = useMemo(() => {
    if (!state) return [];
    // A 90-day window is far too many bars to read, so show the tail.
    const points = state.timeseries.data.slice(-30);
    return points.map((point) => ({
      label: point.date.slice(5),
      value: point.impressions,
    }));
  }, [state]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Promotion",
        render: (row: PromoAnalyticsLeaderboardItem) => (
          <span className="font-medium">{row.entityLabel}</span>
        ),
      },
      {
        key: "impressions",
        header: "Views",
        render: (row: PromoAnalyticsLeaderboardItem) => row.impressions.toLocaleString(),
      },
      {
        key: "clicks",
        header: "Clicks",
        render: (row: PromoAnalyticsLeaderboardItem) => row.clicks.toLocaleString(),
      },
      {
        key: "conversions",
        header: "Used",
        render: (row: PromoAnalyticsLeaderboardItem) => row.conversions.toLocaleString(),
      },
      {
        key: "ctr",
        header: "Click rate",
        render: (row: PromoAnalyticsLeaderboardItem) => formatPercent(row.clickThroughRate),
      },
      {
        key: "cvr",
        header: "Use rate",
        render: (row: PromoAnalyticsLeaderboardItem) => formatPercent(row.conversionRate),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      <AdminPageIntro
        eyebrow="Promotions"
        title="Promotion performance"
        description="Views, clicks and redemptions across campaigns, vouchers and banners."
        meta={state ? `Last ${state.overview.days} days` : undefined}
      />

      <div className="flex flex-wrap items-center gap-2">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setEntityType(tab.value)}
            className={
              entityType === tab.value
                ? "rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-line px-4 py-1.5 text-sm text-muted hover:text-body"
            }
          >
            {tab.label}
          </button>
        ))}

        <span className="ml-auto text-sm text-muted">Last</span>
        {RANGES.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setDays(range)}
            className={
              days === range
                ? "rounded-full bg-surfaceMuted px-3 py-1.5 text-sm font-medium text-body"
                : "rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:text-body"
            }
          >
            {range}d
          </button>
        ))}
      </div>

      {isLoading && !state ? (
        <AnalyticsSkeleton />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : state ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="Views"
              value={(channel?.impressions ?? 0).toLocaleString()}
              icon={BarChart3}
              animationDelay={60}
            />
            <StatCard
              label="Clicks"
              value={(channel?.clicks ?? 0).toLocaleString()}
              hint={`${formatPercent(channel?.clickThroughRate ?? 0)} click rate`}
              icon={MousePointerClick}
              tone="info"
              animationDelay={110}
            />
            <StatCard
              label="Used"
              value={(channel?.conversions ?? 0).toLocaleString()}
              hint={`${formatPercent(channel?.conversionRate ?? 0)} of clicks`}
              icon={Percent}
              tone="success"
              animationDelay={160}
            />
            <StatCard
              label="Discount given"
              value={formatCurrency(state.overview.totalDiscountGiven)}
              hint={`${state.overview.totalRedemptions.toLocaleString()} voucher redemptions`}
              icon={Ticket}
              animationDelay={210}
            />
          </div>

          <SectionCard
            title="Daily views"
            description={`Impressions per day for ${
              ENTITY_TABS.find((tab) => tab.value === entityType)?.label.toLowerCase()
            }. Days with no activity are shown as zero.`}
          >
            {trendBars.length > 0 ? (
              <MiniBarTrend title="Impressions" bars={trendBars} />
            ) : (
              <p className="text-sm text-muted">No activity recorded in this window.</p>
            )}
          </SectionCard>

          <SectionCard
            title={`Top ${ENTITY_TABS.find((tab) => tab.value === entityType)?.label.toLowerCase()}`}
            description="Ranked by redemptions, then by clicks."
          >
            {state.leaderboard.items.length > 0 ? (
              <DataTable
                columns={columns}
                data={state.leaderboard.items}
                keyExtractor={(row) => row.entityId}
                compact
              />
            ) : (
              <p className="text-sm text-muted">
                Nothing tracked yet. Figures appear once shoppers see and tap these promotions in
                the app.
              </p>
            )}
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

export default FullPromoAnalyticsPage;
