import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { getFinanceOverview, getPaymentTransactions } from "@/api/financeApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildFinanceSnapshot } from "@/utils/sectionMetrics";
import { formatCurrency } from "@/utils/format";
import { Landmark, Wallet, CircleDollarSign, CreditCard } from "lucide-react";

async function loadFinanceBrief(token: string) {
  const [overview, payments] = await Promise.all([
    getFinanceOverview(token),
    getPaymentTransactions(token),
  ]);
  return { overview, payments };
}

export function FinancePage() {
  return (
    <BriefSectionPage config={ADMIN_BRIEF_SECTIONS.finance} load={loadFinanceBrief}>
      {({ overview, payments }) => {
        const s = buildFinanceSnapshot(overview, payments);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Current balance" value={formatCurrency(Math.round(s.balance))} icon={Landmark} tone="success" animationDelay={60} />
              <StatCard label="Gross collected" value={formatCurrency(Math.round(s.gross))} icon={CircleDollarSign} animationDelay={110} />
              <StatCard label="Commission" value={formatCurrency(Math.round(s.commission))} icon={Wallet} animationDelay={160} />
              <StatCard label="Payments tracked" value={String(s.payments)} icon={CreditCard} animationDelay={210} />
            </div>
            <SectionCard compact title="Treasury snapshot" description="Open the full treasury view for ledger entries and payout exposure.">
              <p className="text-sm text-textMuted">
                Vendor liability {formatCurrency(overview?.vendorLiabilityBalance ?? 0)} · Pending withdrawals{" "}
                {formatCurrency(overview?.pendingWithdrawalTotal ?? 0)}
              </p>
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
