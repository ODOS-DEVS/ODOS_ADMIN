import { ArrowLeft, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loadFullAnalyticsReport } from "@/api/fullAnalyticsApi";
import { FullAnalyticsReportView } from "@/components/analytics/FullAnalyticsReportView";
import { FullAnalyticsSkeleton } from "@/components/analytics/AnalyticsUi";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { FullAnalyticsReport } from "@/types/fullAnalytics";
import { formatDateTime } from "@/utils/format";

export function FullAnalyticsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
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

  if (isLoading) {
    return <FullAnalyticsSkeleton />;
  }

  if (error || !report) {
    return (
      <ErrorState
        description={error ?? "Full analytics report is unavailable right now."}
        onRetry={() => void loadReport()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="animate-fade-up opacity-0" style={{ animationDelay: "0ms" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
              Full analytics report
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">
              Owner-level platform intelligence
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-textMuted">
              Comprehensive breakdown of commerce, treasury, marketplace, vendors, customers,
              marketing, operations, and derived signals — aggregated from all admin datasets.
            </p>
            <p className="mt-2 text-xs text-textMuted">
              Last refreshed {formatDateTime(report.loadedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="size-4" />}
              onClick={() => navigate("/analytics")}
            >
              Brief overview
            </Button>
            <Button
              variant="secondary"
              leftIcon={
                <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
              }
              onClick={() => void loadReport(true)}
              disabled={isRefreshing}
            >
              Refresh report
            </Button>
          </div>
        </div>
      </div>

      <FullAnalyticsReportView report={report} />
    </div>
  );
}
