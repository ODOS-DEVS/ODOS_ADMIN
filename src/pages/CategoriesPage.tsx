import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getCategories } from "@/api/categoriesApi";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildCategorySnapshot } from "@/utils/sectionMetrics";
import { Tags, CheckCircle2, PauseCircle } from "lucide-react";

export function CategoriesPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.categories} load={getCategories}>
      {(categories) => {
        const s = buildCategorySnapshot(categories);
        return (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <StatCard label="Categories" value={String(s.total)} icon={Tags} animationDelay={60} />
            <StatCard label="Active" value={String(s.active)} icon={CheckCircle2} tone="success" animationDelay={110} />
            <StatCard label="Inactive" value={String(s.inactive)} icon={PauseCircle} animationDelay={160} />
          </div>
        );
      }}
    </BriefSectionPage>
  );
}
