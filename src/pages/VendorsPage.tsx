import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { getVendors } from "@/api/vendorsApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildVendorSnapshot } from "@/utils/sectionMetrics";
import { formatCurrency } from "@/utils/format";
import { Store, UserCheck, PauseCircle, CircleDollarSign } from "lucide-react";

export function VendorsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.vendors} load={getVendors} getMeta={(v) => `${buildVendorSnapshot(v).suspended} suspended`}>
      {(vendors) => {
        const s = buildVendorSnapshot(vendors);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Total vendors" value={String(s.total)} icon={Store} animationDelay={60} />
              <StatCard label="Active" value={String(s.active)} icon={UserCheck} tone="success" animationDelay={110} />
              <StatCard label="Suspended" value={String(s.suspended)} icon={PauseCircle} tone="warning" animationDelay={160} />
              <StatCard label="Total sales" value={formatCurrency(Math.round(s.sales))} icon={CircleDollarSign} animationDelay={210} />
            </div>
            <SectionCard compact title="Vendor status mix">
              <MetricBar label="Active" value={s.active} max={s.total || 1} displayValue={String(s.active)} tone="emerald" />
              <MetricBar label="Suspended" value={s.suspended} max={s.total || 1} displayValue={String(s.suspended)} tone="amber" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
