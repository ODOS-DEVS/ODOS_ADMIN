import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getVendorApplications } from "@/api/vendorApplicationsApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildVendorApplicationSnapshot } from "@/utils/sectionMetrics";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react";

export function VendorApplicationsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.vendorApplications} load={getVendorApplications} getMeta={(a) => `${buildVendorApplicationSnapshot(a).pending} pending review`}>
      {(apps) => {
        const s = buildVendorApplicationSnapshot(apps);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Applications" value={String(s.total)} icon={ClipboardList} animationDelay={60} />
              <StatCard label="Pending" value={String(s.pending)} icon={Clock} tone="warning" animationDelay={110} />
              <StatCard label="Approved" value={String(s.approved)} icon={CheckCircle2} tone="success" animationDelay={160} />
              <StatCard label="Rejected" value={String(s.rejected)} icon={XCircle} animationDelay={210} />
            </div>
            <SectionCard compact title="Application pipeline">
              <MetricBar label="Pending" value={s.pending} max={s.total || 1} displayValue={String(s.pending)} tone="amber" />
              <MetricBar label="Approved" value={s.approved} max={s.total || 1} displayValue={String(s.approved)} tone="emerald" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
