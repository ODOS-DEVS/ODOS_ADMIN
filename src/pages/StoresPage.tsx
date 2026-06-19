import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getStores } from "@/api/storesApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildStoreSnapshot } from "@/utils/sectionMetrics";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { Store, CheckCircle2, PauseCircle, FileEdit } from "lucide-react";

export function StoresPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.stores} load={getStores}>
      {(stores) => {
        const s = buildStoreSnapshot(stores);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Stores" value={String(s.total)} icon={Store} animationDelay={60} />
              <StatCard label="Active" value={String(s.active)} icon={CheckCircle2} tone="success" animationDelay={110} />
              <StatCard label="Suspended" value={String(s.suspended)} icon={PauseCircle} tone="warning" animationDelay={160} />
              <StatCard label="Draft" value={String(s.draft)} icon={FileEdit} animationDelay={210} />
            </div>
            <SectionCard compact title="Store status mix">
              <MetricBar label="Active" value={s.active} max={s.total || 1} displayValue={String(s.active)} tone="emerald" />
              <MetricBar label="Suspended" value={s.suspended} max={s.total || 1} displayValue={String(s.suspended)} tone="amber" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
