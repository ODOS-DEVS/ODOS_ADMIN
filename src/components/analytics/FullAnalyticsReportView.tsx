import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  DistributionList,
  MetricRow,
  ReportSectionNav,
  StatGrid,
} from "@/components/analytics/AnalyticsUi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { FullAnalyticsReport } from "@/types/fullAnalytics";
import type {
  AdminPaymentTransaction,
  AdminPlatformLedgerEntry,
  AdminReturnRequest,
  AdminReview,
  AdminVendorWithdrawalRequest,
  NotificationItem,
  Order,
  VendorApplication,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

const REPORT_SECTIONS = [
  { id: "executive", label: "Executive" },
  { id: "commerce", label: "Commerce" },
  { id: "treasury", label: "Treasury" },
  { id: "payments", label: "Payments" },
  { id: "ledger", label: "Ledger" },
  { id: "marketplace", label: "Marketplace" },
  { id: "vendors", label: "Vendors" },
  { id: "customers", label: "Customers" },
  { id: "marketing", label: "Marketing" },
  { id: "operations", label: "Operations" },
  { id: "intelligence", label: "Intelligence" },
  { id: "activity", label: "Activity" },
] as const;

type ReportSectionId = (typeof REPORT_SECTIONS)[number]["id"];

type FullAnalyticsReportViewProps = {
  report: FullAnalyticsReport;
};

export function FullAnalyticsReportView({ report }: FullAnalyticsReportViewProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ReportSectionId>("executive");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  const { dashboard, finance, snapshot, breakdowns } = report;
  const { stats } = dashboard;
  const grossCollected = finance?.grossCollectedTotal ?? stats.totalRevenue;
  const paidOrders = finance?.paidOrderCount ?? stats.totalOrders;

  const activeVouchers = useMemo(
    () => report.vouchers.filter((voucher) => voucher.isActive || voucher.status === "active").length,
    [report.vouchers],
  );

  const pendingVoucherApprovals = useMemo(
    () =>
      report.vouchers.filter(
        (voucher) => voucher.approvalStatus === "pending" || voucher.approvalStatus === "pending_review",
      ).length,
    [report.vouchers],
  );

  const activeFlashEvents = useMemo(
    () => report.flashEvents.filter((event) => event.status === "active").length,
    [report.flashEvents],
  );

  const openSupportThreads = useMemo(
    () => report.supportThreads.filter((thread) => thread.supportStatus !== "resolved").length,
    [report.supportThreads],
  );

  return (
    <div className="space-y-4">
      <ReportSectionNav
        sections={[...REPORT_SECTIONS]}
        activeId={activeSection}
        onSelect={(id) => setActiveSection(id as ReportSectionId)}
      />

      {report.errors.length > 0 ? (
        <SectionCard compact title="Partial data load" description="Some datasets could not be fetched.">
          <ul className="space-y-1 text-xs text-warning">
            {report.errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <div key={activeSection} className="animate-fade-up opacity-0" style={{ animationDelay: "0ms" }}>
      {activeSection === "executive" ? (
        <SectionCard
          compact
          title="Executive summary"
          description={`Platform-wide owner report · generated ${formatDateTime(report.loadedAt)}`}
        >
          <StatGrid
            items={[
              { label: "Gross collected", value: formatCurrency(Math.round(grossCollected)) },
              { label: "Paid orders", value: new Intl.NumberFormat("en-GH").format(paidOrders) },
              {
                label: "Total order volume",
                value: formatCurrency(Math.round(report.totalOrderVolume)),
                hint: `${report.orders.length} orders loaded`,
              },
              {
                label: "Avg paid order",
                value: formatCurrency(Math.round(snapshot.paidAverageOrderValue)),
              },
              { label: "Users", value: String(report.users.length) },
              { label: "Vendors", value: String(report.vendors.length) },
              { label: "Stores", value: String(report.stores.length) },
              { label: "Products", value: String(report.products.length) },
              { label: "Returns", value: String(report.returns.length) },
              { label: "Reviews", value: String(report.reviews.length) },
              { label: "Support threads", value: String(report.supportThreads.length) },
              { label: "Notifications", value: String(report.notifications.length) },
            ]}
          />
        </SectionCard>
      ) : null}

      {activeSection === "commerce" ? (
        <SectionCard
          compact
          title="Commerce & orders"
          description="Order pipeline, payment mix, and recent performance"
          action={
            <Button variant="ghost" onClick={() => navigate("/orders")}>
              Manage orders
            </Button>
          }
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <StatGrid
              columns={2}
              items={[
                { label: "Total orders", value: String(report.orders.length) },
                { label: "Pending fulfillment", value: String(stats.pendingOrders) },
                { label: "Completed flow", value: String(snapshot.completedOrders) },
                {
                  label: "Fulfillment rate",
                  value: `${Math.round(snapshot.completionRate)}%`,
                },
                {
                  label: "Pending order rate",
                  value: `${snapshot.pendingOrderRate.toFixed(1)}%`,
                },
                {
                  label: "Recent sample volume",
                  value: formatCurrency(Math.round(snapshot.recentOrderVolume)),
                  hint: `${dashboard.recentOrders.length} recent orders`,
                },
              ]}
            />
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
                  Order status distribution
                </p>
                <DistributionList
                  items={breakdowns.orderStatus}
                  emptyLabel="No orders recorded."
                  tone="accent"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
                  Payment status distribution
                </p>
                <DistributionList
                  items={breakdowns.paymentStatus}
                  emptyLabel="No payment statuses recorded."
                  tone="sky"
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
              Recent orders
            </p>
            <DataTable<Order>
              compact
              columns={[
                {
                  key: "order",
                  header: "Order",
                  render: (order) => (
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-textMuted">{order.customerName}</p>
                    </div>
                  ),
                },
                {
                  key: "store",
                  header: "Store",
                  render: (order) => (
                    <p className="line-clamp-1 text-xs text-textMuted">{order.storeName}</p>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (order) => (
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.paymentStatus} />
                    </div>
                  ),
                },
                {
                  key: "amount",
                  header: "Amount",
                  className: "text-right",
                  render: (order) => (
                    <div className="text-right font-medium tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  ),
                },
              ]}
              data={report.orders.slice(0, 12)}
              keyExtractor={(order) => order.id}
            />
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "treasury" ? (
        <SectionCard
          compact
          title="Treasury & finance"
          description="Balances, liabilities, fees, refunds, and payout exposure"
          action={
            <Button variant="ghost" onClick={() => navigate("/finance")}>
              Finance console
            </Button>
          }
        >
          {finance ? (
            <>
              <StatGrid
                items={[
                  { label: "Current balance", value: formatCurrency(finance.currentBalance) },
                  {
                    label: "Vendor liability",
                    value: formatCurrency(finance.vendorLiabilityBalance),
                  },
                  {
                    label: "Commission balance",
                    value: formatCurrency(finance.commissionBalance),
                  },
                  {
                    label: "Gross collected",
                    value: formatCurrency(finance.grossCollectedTotal),
                  },
                  {
                    label: "Processor fees",
                    value: formatCurrency(finance.processorFeeTotal),
                  },
                  { label: "Refunded total", value: formatCurrency(finance.refundedTotal) },
                  {
                    label: "Payouts sent",
                    value: formatCurrency(finance.totalPayoutsSent),
                  },
                  {
                    label: "Pending withdrawals",
                    value: formatCurrency(finance.pendingWithdrawalTotal),
                  },
                  {
                    label: "Approved withdrawals",
                    value: formatCurrency(finance.approvedWithdrawalTotal),
                  },
                  {
                    label: "Paid order volume",
                    value: formatCurrency(finance.paidOrderVolume),
                  },
                  { label: "Paid order count", value: String(finance.paidOrderCount) },
                  { label: "Currency", value: finance.currency.toUpperCase() },
                ]}
              />
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <MetricRow
                  label="Refund rate"
                  value={`${snapshot.refundRate.toFixed(2)}%`}
                  hint="Refunds vs gross collected"
                  tone="info"
                />
                <MetricRow
                  label="Processor fee rate"
                  value={`${snapshot.feeRate.toFixed(2)}%`}
                  hint="Fees vs gross collected"
                />
                <MetricRow
                  label="Commission rate"
                  value={`${snapshot.commissionRate.toFixed(2)}%`}
                  hint="Commission vs gross collected"
                  tone="success"
                />
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-xs text-textMuted">
              Finance overview unavailable. Treasury metrics appear once checkout payments are recorded.
            </p>
          )}
        </SectionCard>
      ) : null}

      {activeSection === "payments" ? (
        <SectionCard compact title="Payment transactions" description="Gateway activity and provider mix">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
                  Transaction status
                </p>
                <DistributionList
                  items={breakdowns.paymentTransactionStatus}
                  emptyLabel="No payment transactions."
                  tone="emerald"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
                  Paid provider mix
                </p>
                <DistributionList
                  items={breakdowns.paymentProviders}
                  emptyLabel="No paid provider activity."
                  tone="sky"
                />
              </div>
            </div>
            <StatGrid
              columns={2}
              items={[
                { label: "Transactions", value: String(report.payments.length) },
                {
                  label: "Total processed",
                  value: formatCurrency(
                    report.payments.reduce((sum, payment) => sum + payment.amount, 0),
                  ),
                },
                {
                  label: "Total processor fees",
                  value: formatCurrency(
                    report.payments.reduce((sum, payment) => sum + payment.processorFeeAmount, 0),
                  ),
                },
              ]}
            />
          </div>

          <div className="mt-5 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {report.payments.slice(0, 15).map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "ledger" ? (
        <SectionCard compact title="Platform ledger" description="Treasury movements by entry kind">
          <div className="grid gap-5 xl:grid-cols-2">
            <DistributionList
              items={breakdowns.ledgerKinds}
              emptyLabel="No ledger entries."
              tone="amber"
            />
            <StatGrid
              columns={2}
              items={[
                { label: "Ledger entries", value: String(report.ledger.length) },
                {
                  label: "Net movement",
                  value: formatCurrency(
                    report.ledger.reduce((sum, entry) => {
                      const signed = entry.direction === "credit" ? entry.amount : -entry.amount;
                      return sum + signed;
                    }, 0),
                  ),
                },
              ]}
            />
          </div>

          <div className="mt-5">
            <DataTable<AdminPlatformLedgerEntry>
              compact
              columns={[
                {
                  key: "title",
                  header: "Entry",
                  render: (entry) => (
                    <div>
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-xs text-textMuted">{entry.kind}</p>
                    </div>
                  ),
                },
                {
                  key: "direction",
                  header: "Direction",
                  render: (entry) => <StatusBadge status={entry.direction} />,
                },
                {
                  key: "amount",
                  header: "Amount",
                  className: "text-right",
                  render: (entry) => (
                    <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                  ),
                },
                {
                  key: "balance",
                  header: "Balance after",
                  className: "text-right",
                  render: (entry) => (
                    <span className="text-xs tabular-nums text-textMuted">
                      {formatCurrency(entry.currentBalanceAfter)}
                    </span>
                  ),
                },
              ]}
              data={report.ledger.slice(0, 12)}
              keyExtractor={(entry) => entry.id}
            />
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "marketplace" ? (
        <SectionCard
          compact
          title="Marketplace catalog"
          description="Users, stores, products, markets, and categories"
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <StatGrid
              columns={2}
              items={[
                { label: "Users", value: String(report.users.length) },
                { label: "Vendors", value: String(report.vendors.length) },
                { label: "Stores", value: String(report.stores.length) },
                { label: "Products", value: String(report.products.length) },
                { label: "Markets", value: String(report.markets.length) },
                { label: "Categories", value: String(report.categories.length) },
                {
                  label: "Products per store",
                  value: snapshot.productsPerStore.toFixed(1),
                },
              ]}
            />
            <div className="space-y-4">
              <DistributionBlock title="Account status" items={breakdowns.accountStatus} tone="sky" />
              <DistributionBlock title="Store status" items={breakdowns.storeStatus} tone="emerald" />
              <DistributionBlock title="Product status" items={breakdowns.productStatus} tone="fuchsia" />
            </div>
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "vendors" ? (
        <SectionCard
          compact
          title="Vendor operations"
          description="Applications, vendor status, and payout queue"
          action={
            <Button variant="ghost" onClick={() => navigate("/payouts")}>
              Payout queue
            </Button>
          }
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <StatGrid
              columns={2}
              items={[
                { label: "Vendor applications", value: String(report.applications.length) },
                {
                  label: "Pending applications",
                  value: String(stats.pendingVendorApplications),
                },
                { label: "Withdrawal requests", value: String(report.payouts.length) },
                {
                  label: "Approval pressure",
                  value: `${Math.round(snapshot.approvalPressure * 100)}%`,
                  hint: "Pending apps vs approved vendors",
                },
              ]}
            />
            <div className="space-y-4">
              <DistributionBlock
                title="Vendor status"
                items={breakdowns.vendorStatus}
                tone="emerald"
              />
              <DistributionBlock
                title="Application status"
                items={breakdowns.vendorApplicationStatus}
                tone="amber"
              />
              <DistributionBlock title="Payout status" items={breakdowns.payoutStatus} tone="accent" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <DataTable<VendorApplication>
              compact
              columns={[
                {
                  key: "business",
                  header: "Application",
                  render: (application) => (
                    <div>
                      <p className="font-medium">{application.businessName}</p>
                      <p className="text-xs text-textMuted">{application.email}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (application) => <StatusBadge status={application.status} />,
                },
              ]}
              data={report.applications.slice(0, 8)}
              keyExtractor={(application) => application.id}
            />
            <DataTable<AdminVendorWithdrawalRequest>
              compact
              columns={[
                {
                  key: "vendor",
                  header: "Vendor",
                  render: (payout) => (
                    <div>
                      <p className="font-medium">{payout.vendorName}</p>
                      <p className="text-xs text-textMuted">{payout.vendorEmail}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (payout) => <StatusBadge status={payout.status} />,
                },
                {
                  key: "amount",
                  header: "Amount",
                  className: "text-right",
                  render: (payout) => (
                    <span className="font-medium tabular-nums">{formatCurrency(payout.amount)}</span>
                  ),
                },
              ]}
              data={report.payouts.slice(0, 8)}
              keyExtractor={(payout) => payout.id}
            />
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "customers" ? (
        <SectionCard
          compact
          title="Customer experience"
          description="Returns, reviews, and support workload"
          action={
            <Button variant="ghost" onClick={() => navigate("/support-chats")}>
              Support inbox
            </Button>
          }
        >
          <StatGrid
            items={[
              { label: "Return requests", value: String(report.returns.length) },
              { label: "Reviews", value: String(report.reviews.length) },
              {
                label: "Average rating",
                value: report.reviewAverageRating.toFixed(2),
              },
              { label: "Hidden reviews", value: String(report.hiddenReviewCount) },
              { label: "Support threads", value: String(report.supportThreads.length) },
              { label: "Open support threads", value: String(openSupportThreads) },
            ]}
          />

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <DistributionBlock title="Return status" items={breakdowns.returnStatus} tone="amber" />
            <DistributionBlock title="Support status" items={breakdowns.supportStatus} tone="sky" />
            <DistributionBlock
              title="Notification types"
              items={breakdowns.notificationTypes}
              tone="fuchsia"
            />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <DataTable<AdminReturnRequest>
              compact
              columns={[
                {
                  key: "order",
                  header: "Return",
                  render: (item) => (
                    <div>
                      <p className="font-medium">{item.orderNumber}</p>
                      <p className="text-xs text-textMuted">{item.customerName}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => <StatusBadge status={item.status} />,
                },
              ]}
              data={report.returns.slice(0, 8)}
              keyExtractor={(item) => item.id}
            />
            <DataTable<AdminReview>
              compact
              columns={[
                {
                  key: "product",
                  header: "Review",
                  render: (review) => (
                    <div>
                      <p className="font-medium">{review.productName}</p>
                      <p className="text-xs text-textMuted">{review.userName}</p>
                    </div>
                  ),
                },
                {
                  key: "rating",
                  header: "Rating",
                  render: (review) => <span>{review.rating}/5</span>,
                },
                {
                  key: "hidden",
                  header: "Visibility",
                  render: (review) => (
                    <StatusBadge status={review.isHidden ? "hidden" : "visible"} />
                  ),
                },
              ]}
              data={report.reviews.slice(0, 8)}
              keyExtractor={(review) => review.id}
            />
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "marketing" ? (
        <SectionCard
          compact
          title="Marketing & promotions"
          description="Vouchers, promo banners, and flash sale events"
        >
          <StatGrid
            items={[
              { label: "Voucher campaigns", value: String(report.vouchers.length) },
              { label: "Active vouchers", value: String(activeVouchers) },
              { label: "Pending voucher approvals", value: String(pendingVoucherApprovals) },
              { label: "Promo banners", value: String(report.promoBanners.length) },
              { label: "Flash sale events", value: String(report.flashEvents.length) },
              { label: "Active flash events", value: String(activeFlashEvents) },
              {
                label: "Total voucher redemptions",
                value: String(
                  report.vouchers.reduce((sum, voucher) => sum + voucher.redemptionCount, 0),
                ),
              },
              {
                label: "Total discount given",
                value: formatCurrency(
                  report.vouchers.reduce((sum, voucher) => sum + voucher.totalDiscountAmount, 0),
                ),
              },
            ]}
          />

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <DistributionBlock
              title="Voucher approval status"
              items={breakdowns.voucherApproval}
              tone="accent"
            />
            <StatGrid
              columns={2}
              items={report.vouchers.slice(0, 6).map((voucher) => ({
                label: voucher.code,
                value: voucher.status,
                hint: `${voucher.redemptionCount} redemptions`,
              }))}
            />
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "operations" ? (
        <SectionCard compact title="Operations & signals" description="Notifications and admin workload">
          <StatGrid
            items={[
              { label: "Notifications", value: String(report.notifications.length) },
              { label: "Unread notifications", value: String(report.unreadNotifications) },
              {
                label: "Recent dashboard signals",
                value: String(dashboard.recentNotifications.length),
              },
              {
                label: "Recent vendor applications",
                value: String(dashboard.recentVendorApplications.length),
              },
            ]}
          />

          <div className="mt-5 max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {report.notifications.slice(0, 12).map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "intelligence" ? (
        <SectionCard
          compact
          title="Derived intelligence"
          description="Calculated KPIs and health indicators from live platform data"
        >
          <StatGrid
            items={[
              {
                label: "Fulfillment rate",
                value: `${Math.round(snapshot.completionRate)}%`,
                hint: `${snapshot.completedOrders} completed orders`,
              },
              {
                label: "Pending order rate",
                value: `${snapshot.pendingOrderRate.toFixed(1)}%`,
              },
              {
                label: "Catalog depth",
                value: snapshot.productsPerStore.toFixed(1),
                hint: "Products per store",
              },
              {
                label: "Refund exposure",
                value: `${snapshot.refundRate.toFixed(2)}%`,
              },
              {
                label: "Processor fee share",
                value: `${snapshot.feeRate.toFixed(2)}%`,
              },
              {
                label: "Commission share",
                value: `${snapshot.commissionRate.toFixed(2)}%`,
              },
              {
                label: "Approval pressure",
                value: `${Math.round(snapshot.approvalPressure * 100)}%`,
              },
              {
                label: "Average order value",
                value: formatCurrency(Math.round(snapshot.averageOrderValue)),
              },
            ]}
          />
        </SectionCard>
      ) : null}

      {activeSection === "activity" ? (
        <SectionCard
          compact
          title="Recent activity feeds"
          description="Latest orders, applications, and admin notifications from dashboard"
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable<Order>
              compact
              columns={[
                {
                  key: "order",
                  header: "Recent order",
                  render: (order) => (
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-textMuted">{formatDateTime(order.createdAt)}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (order) => <StatusBadge status={order.status} />,
                },
              ]}
              data={dashboard.recentOrders}
              keyExtractor={(order) => order.id}
            />
            <DataTable<VendorApplication>
              compact
              columns={[
                {
                  key: "business",
                  header: "Vendor application",
                  render: (application) => (
                    <div>
                      <p className="font-medium">{application.businessName}</p>
                      <p className="text-xs text-textMuted">{formatDateTime(application.createdAt)}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (application) => <StatusBadge status={application.status} />,
                },
              ]}
              data={dashboard.recentVendorApplications}
              keyExtractor={(application) => application.id}
            />
          </div>
        </SectionCard>
      ) : null}
      </div>
    </div>
  );
}

function DistributionBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ key: string; label: string; count: number }>;
  tone: "sky" | "amber" | "emerald" | "accent" | "fuchsia";
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">{title}</p>
      <DistributionList items={items} emptyLabel={`No ${title.toLowerCase()} data.`} tone={tone} />
    </div>
  );
}

function PaymentRow({ payment }: { payment: AdminPaymentTransaction }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-textStrong">{payment.orderNumber}</p>
          <p className="truncate text-xs text-textMuted">
            {payment.provider} · {payment.reference}
          </p>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-textMuted">
        <span className="font-medium tabular-nums text-textStrong">
          {formatCurrency(payment.amount)}
        </span>
        <span>{formatDateTime(payment.createdAt)}</span>
      </div>
    </div>
  );
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-textStrong">{notification.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-textMuted">
            {notification.message}
          </p>
        </div>
        <StatusBadge status={notification.read ? "active" : "unread"} />
      </div>
      <p className="mt-1.5 text-[11px] text-textMuted">{formatDateTime(notification.createdAt)}</p>
    </div>
  );
}
