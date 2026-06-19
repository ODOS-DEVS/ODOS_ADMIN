import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getMarkets } from "@/api/marketsApi";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildMarketSnapshot } from "@/utils/sectionMetrics";
import { Warehouse, CheckCircle2, PauseCircle } from "lucide-react";

export function MarketsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.markets} load={getMarkets}>
      {(markets) => {
        const s = buildMarketSnapshot(markets);
        return (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <StatCard label="Markets" value={String(s.total)} icon={Warehouse} animationDelay={60} />
            <StatCard label="Active" value={String(s.active)} icon={CheckCircle2} tone="success" animationDelay={110} />
            <StatCard label="Inactive" value={String(s.inactive)} icon={PauseCircle} animationDelay={160} />
          </div>
        );
      }}
    </BriefSectionPage>
  );
}
