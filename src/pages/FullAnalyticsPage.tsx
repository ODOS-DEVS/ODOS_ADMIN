import { CircleDollarSign, RefreshCw, ShoppingCart, Store, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { loadFullAnalyticsReport } from "@/api/fullAnalyticsApi";
import { FullAnalyticsReportView } from "@/components/analytics/FullAnalyticsReportView";
import { FullAnalyticsSkeleton } from "@/components/analytics/AnalyticsUi";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatCard } from "@/components/ui/StatCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { FullAnalyticsReport } from "@/types/fullAnalytics";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function FullAnalyticsPage() {
  const { token } = useAdminAuth();
  const [report, setReport] = useState<FullAnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(
    async (background = false) => {
      if (!token) return;

      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const nextReport = await loadFullAnalyticsReport(token);
        setReport(nextReport);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load full analytics.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const headlineStats = useMemo(() => {
    if (!report) return null;
    const { dashboard, finance } = report;
    const gross = finance?.grossCollectedTotal ?? dashboard.stats.totalRevenue;
    return {
      gross,
      orders: finance?.paidOrderCount ?? dashboard.stats.totalOrders,
      users: report.users.length,
      stores: report.stores.length,
    };
  }, [report]);

  if (isLoading) {
    return <FullAnalyticsSkeleton />;
  }

  if (error || !report || !headlineStats) {
    return (
      <ErrorState
        description={error ?? "Full analytics report is unavailable right now."}
        onRetry={() => void loadReport()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Analytics"
        title="Full report"
        description={`Generated ${formatDateTime(report.loadedAt)} · treasury, vendors, orders, and support in one scroll.`}
        backRoute="/analytics"
        onRefresh={() => void loadReport(true)}
        refreshing={isRefreshing}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Gross collected"
          value={formatCurrency(Math.round(headlineStats.gross))}
          icon={CircleDollarSign}
          tone="success"
          animationDelay={40}
        />
        <StatCard
          label="Paid orders"
          value={String(headlineStats.orders)}
          icon={ShoppingCart}
          animationDelay={80}
        />
        <StatCard
          label="Users loaded"
          value={String(headlineStats.users)}
          icon={Users}
          tone="info"
          animationDelay={120}
        />
        <StatCard
          label="Stores loaded"
          value={String(headlineStats.stores)}
          icon={Store}
          animationDelay={160}
        />
      </div>

      <FullAnalyticsReportView report={report} />
    </div>
  );
}
