import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getSupportChatThreads } from "@/api/chatApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildSupportSnapshot } from "@/utils/sectionMetrics";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { MessageSquareMore, Clock, Inbox, Mail } from "lucide-react";

export function SupportChatsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.supportChats} load={getSupportChatThreads} getMeta={(t) => `${buildSupportSnapshot(t).waitingAdmin} waiting on admin`}>
      {(threads) => {
        const s = buildSupportSnapshot(threads);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Threads" value={String(s.total)} icon={MessageSquareMore} animationDelay={60} />
              <StatCard label="Open" value={String(s.open)} icon={Inbox} tone="warning" animationDelay={110} />
              <StatCard label="Waiting admin" value={String(s.waitingAdmin)} icon={Clock} tone="warning" animationDelay={160} />
              <StatCard label="Unread" value={String(s.unread)} icon={Mail} animationDelay={210} />
            </div>
            <SectionCard compact title="Support workload">
              <MetricBar label="Open threads" value={s.open} max={s.total || 1} displayValue={String(s.open)} tone="amber" />
              <MetricBar label="Waiting on admin" value={s.waitingAdmin} max={s.total || 1} displayValue={String(s.waitingAdmin)} tone="accent" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
