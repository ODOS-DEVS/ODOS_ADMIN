import { ShoppingBag, Truck, CircleDollarSign, Clock } from "lucide-react";

import { BriefSectionPage } from "@/components/admin/BriefSectionPage";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { getOrders } from "@/api/ordersApi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ADMIN_BRIEF_SECTIONS } from "@/utils/adminSections";
import { buildOrderSnapshot } from "@/utils/sectionMetrics";
import { formatCurrency } from "@/utils/format";

export function OrdersPage() {
  return (
    <BriefSectionPage
      config={ADMIN_BRIEF_SECTIONS.orders}
      load={getOrders}
      getMeta={(orders) => {
        const s = buildOrderSnapshot(orders);
        return `${s.pending} orders in pipeline · ${s.delivered} delivered`;
      }}
    >
      {(orders) => {
        const snapshot = buildOrderSnapshot(orders);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Total orders" value={String(snapshot.total)} icon={ShoppingBag} animationDelay={60} />
              <StatCard label="In pipeline" value={String(snapshot.pending)} icon={Clock} tone="warning" animationDelay={110} />
              <StatCard label="Delivered" value={String(snapshot.delivered)} icon={Truck} tone="success" animationDelay={160} />
              <StatCard label="Paid volume" value={formatCurrency(Math.round(snapshot.volume))} icon={CircleDollarSign} animationDelay={210} />
            </div>
            <SectionCard compact title="Fulfillment mix" description="Share of delivered vs in-flight orders">
              <div className="space-y-3">
                <MetricBar label="Delivered" value={snapshot.delivered} max={snapshot.total || 1} displayValue={String(snapshot.delivered)} tone="emerald" />
                <MetricBar label="In pipeline" value={snapshot.pending} max={snapshot.total || 1} displayValue={String(snapshot.pending)} tone="amber" />
              </div>
            </SectionCard>
          </>
        );
      }}
    </BriefSectionPage>
  );
}
