import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getNotifications } from "@/api/notificationsApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildNotificationSnapshot } from "@/utils/sectionMetrics";
import { Bell, Mail, Hash } from "lucide-react";

export function NotificationsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.notifications} load={getNotifications} getMeta={(n) => `${buildNotificationSnapshot(n).unread} unread`}>
      {(notifications) => {
        const s = buildNotificationSnapshot(notifications);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              <StatCard label="Notifications" value={String(s.total)} icon={Bell} animationDelay={60} />
              <StatCard label="Unread" value={String(s.unread)} icon={Mail} tone="warning" animationDelay={110} />
              <StatCard label="Types" value={String(Object.keys(s.byType).length)} icon={Hash} animationDelay={160} />
            </div>
            <SectionCard compact title="Signal mix" description="Open the full feed to browse by type and mark items read.">
              <div className="flex flex-wrap gap-2">
                {Object.entries(s.byType).slice(0, 6).map(([type, count]) => (
                  <span key={type} className="rounded-full border border-white/10 px-3 py-1 text-xs text-textMuted">
                    {type.replace(/_/g, " ")} · {count}
                  </span>
                ))}
              </div>
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
