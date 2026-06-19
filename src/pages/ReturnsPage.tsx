import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getReturnRequests } from "@/api/ordersApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildReturnSnapshot } from "@/utils/sectionMetrics";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { RefreshCcw, Clock, CheckCircle2, XCircle } from "lucide-react";

export function ReturnsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.returns} load={getReturnRequests} getMeta={(r) => `${buildReturnSnapshot(r).open} open cases`}>
      {(returns) => {
        const s = buildReturnSnapshot(returns);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Total cases" value={String(s.total)} icon={RefreshCcw} animationDelay={60} />
              <StatCard label="Open" value={String(s.open)} icon={Clock} tone="warning" animationDelay={110} />
              <StatCard label="Refunded" value={String(s.refunded)} icon={CheckCircle2} tone="success" animationDelay={160} />
              <StatCard label="Rejected" value={String(s.rejected)} icon={XCircle} animationDelay={210} />
            </div>
            <SectionCard compact title="Return resolution mix">
              <MetricBar label="Open cases" value={s.open} max={s.total || 1} displayValue={String(s.open)} tone="amber" />
              <MetricBar label="Refunded" value={s.refunded} max={s.total || 1} displayValue={String(s.refunded)} tone="emerald" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
