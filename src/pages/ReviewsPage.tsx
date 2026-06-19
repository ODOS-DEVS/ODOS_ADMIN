import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getReviews } from "@/api/reviewsApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildReviewSnapshot } from "@/utils/sectionMetrics";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { Star, Eye, EyeOff, MessageSquare } from "lucide-react";

export function ReviewsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.reviews} load={getReviews}>
      {(reviews) => {
        const s = buildReviewSnapshot(reviews);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Reviews" value={String(s.total)} icon={MessageSquare} animationDelay={60} />
              <StatCard label="Average rating" value={s.average > 0 ? s.average.toFixed(1) : "—"} icon={Star} tone="info" animationDelay={110} />
              <StatCard label="Visible" value={String(s.total - s.hidden)} icon={Eye} tone="success" animationDelay={160} />
              <StatCard label="Hidden" value={String(s.hidden)} icon={EyeOff} animationDelay={210} />
            </div>
            <SectionCard compact title="Moderation mix">
              <MetricBar label="Visible" value={s.total - s.hidden} max={s.total || 1} displayValue={String(s.total - s.hidden)} tone="emerald" />
              <MetricBar label="Hidden" value={s.hidden} max={s.total || 1} displayValue={String(s.hidden)} tone="amber" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
