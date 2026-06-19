import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getProducts } from "@/api/productsApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildProductSnapshot } from "@/utils/sectionMetrics";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { Package, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export function ProductsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.products} load={getProducts} getMeta={(p) => `${buildProductSnapshot(p).lowStock} low stock`}>
      {(products) => {
        const s = buildProductSnapshot(products);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Products" value={String(s.total)} icon={Package} animationDelay={60} />
              <StatCard label="Active" value={String(s.active)} icon={CheckCircle2} tone="success" animationDelay={110} />
              <StatCard label="Pending" value={String(s.pending)} icon={Clock} tone="warning" animationDelay={160} />
              <StatCard label="Low stock" value={String(s.lowStock)} icon={AlertTriangle} animationDelay={210} />
            </div>
            <SectionCard compact title="Catalog health">
              <MetricBar label="Active listings" value={s.active} max={s.total || 1} displayValue={String(s.active)} tone="emerald" />
              <MetricBar label="Pending approval" value={s.pending} max={s.total || 1} displayValue={String(s.pending)} tone="amber" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
