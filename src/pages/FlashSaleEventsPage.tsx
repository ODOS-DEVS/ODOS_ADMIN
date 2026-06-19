import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getFlashSaleEvents } from "@/api/flashSaleEventsApi";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildFlashEventSnapshot } from "@/utils/sectionMetrics";
import { Zap, CheckCircle2, Package } from "lucide-react";

export function FlashSaleEventsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.flashSaleEvents} load={getFlashSaleEvents}>
      {(events) => {
        const s = buildFlashEventSnapshot(events);
        return (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <StatCard label="Events" value={String(s.total)} icon={Zap} animationDelay={60} />
            <StatCard label="Active" value={String(s.active)} icon={CheckCircle2} tone="success" animationDelay={110} />
            <StatCard label="Featured products" value={String(s.products)} icon={Package} animationDelay={160} />
          </div>
        );
      }}
    </BriefSectionPage>
  );
}
