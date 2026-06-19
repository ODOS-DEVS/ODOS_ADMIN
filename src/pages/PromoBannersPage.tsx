import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getPromoBanners } from "@/api/promoBannersApi";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildPromoBannerSnapshot } from "@/utils/sectionMetrics";
import { Megaphone, Zap, PauseCircle } from "lucide-react";

export function PromoBannersPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.promoBanners} load={getPromoBanners}>
      {(banners) => {
        const s = buildPromoBannerSnapshot(banners);
        return (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <StatCard label="Banners" value={String(s.total)} icon={Megaphone} animationDelay={60} />
            <StatCard label="Active" value={String(s.active)} icon={Zap} tone="success" animationDelay={110} />
            <StatCard label="Disabled" value={String(s.disabled)} icon={PauseCircle} animationDelay={160} />
          </div>
        );
      }}
    </BriefSectionPage>
  );
}
