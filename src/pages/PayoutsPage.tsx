import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getVendorWithdrawalRequests } from "@/api/payoutsApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildPayoutSnapshot } from "@/utils/sectionMetrics";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { formatCurrency } from "@/utils/format";
import { Wallet, Clock, CheckCircle2, List } from "lucide-react";

export function PayoutsPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.payouts} load={getVendorWithdrawalRequests}>
      {(payouts) => {
        const s = buildPayoutSnapshot(payouts);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Requests" value={String(s.total)} icon={List} animationDelay={60} />
              <StatCard label="Pending" value={String(s.pending)} icon={Clock} tone="warning" animationDelay={110} />
              <StatCard label="Paid" value={String(s.paid)} icon={CheckCircle2} tone="success" animationDelay={160} />
              <StatCard label="Pending amount" value={formatCurrency(Math.round(s.pendingAmount))} icon={Wallet} animationDelay={210} />
            </div>
            <SectionCard compact title="Payout queue pressure">
              <MetricBar label="Pending / approved" value={s.pending} max={s.total || 1} displayValue={String(s.pending)} tone="amber" />
              <MetricBar label="Paid out" value={s.paid} max={s.total || 1} displayValue={String(s.paid)} tone="emerald" />
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
