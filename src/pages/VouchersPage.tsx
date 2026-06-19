import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getVouchers } from "@/api/vouchersApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildVoucherSnapshot } from "@/utils/sectionMetrics";
import { formatCurrency } from "@/utils/format";
import { TicketPercent, Zap, Hash, CircleDollarSign } from "lucide-react";

export function VouchersPage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.vouchers} load={getVouchers}>
      {(vouchers) => {
        const s = buildVoucherSnapshot(vouchers);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Campaigns" value={String(s.total)} icon={TicketPercent} animationDelay={60} />
              <StatCard label="Active" value={String(s.active)} icon={Zap} tone="success" animationDelay={110} />
              <StatCard label="Redemptions" value={String(s.redemptions)} icon={Hash} animationDelay={160} />
              <StatCard label="Discount given" value={formatCurrency(Math.round(s.discount))} icon={CircleDollarSign} animationDelay={210} />
            </div>
            <SectionCard compact title="Promo exposure" description="Total discount value issued across all voucher campaigns.">
              <p className="text-sm text-textMuted">{s.redemptions} total redemptions across {s.total} campaigns</p>
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
