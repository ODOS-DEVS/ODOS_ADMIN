import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getMerchandisingCampaignsPage } from "@/api/merchandisingCampaignsApi";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { CheckCircle2, Megaphone, Sparkles } from "lucide-react";

async function loadCampaigns(token: string) {
  const page = await getMerchandisingCampaignsPage(token, { limit: 100, offset: 0 });
  return page.items;
}

export function MerchandisingCampaignsPage() {
  return (
    <BriefSectionPage
      config={ADMIN_BRIEF_SECTIONS.merchandisingCampaigns}
      load={loadCampaigns}
    >
      {(campaigns) => {
        const active = campaigns.filter((campaign) => campaign.status === "active").length;
        const featured = campaigns.filter((campaign) => campaign.isFeatured).length;
        return (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <StatCard
              label="Campaigns"
              value={String(campaigns.length)}
              icon={Megaphone}
              animationDelay={60}
            />
            <StatCard
              label="Active"
              value={String(active)}
              icon={CheckCircle2}
              tone="success"
              animationDelay={110}
            />
            <StatCard
              label="Featured"
              value={String(featured)}
              icon={Sparkles}
              animationDelay={160}
            />
          </div>
        );
      }}
    </BriefSectionPage>
  );
}
