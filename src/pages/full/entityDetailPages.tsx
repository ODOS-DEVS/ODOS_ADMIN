import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";

import {
  AdminDetailHeader,
  AdminDetailTile,
  AdminKpiGrid,
  AdminPageSkeleton,
  AdminTabNav,
  AdminTabPanel,
} from "@/components/admin/AdminShell";
import { getSupportChatMessages, getSupportChatThreads } from "@/api/chatApi";
import { getReturnRequests } from "@/api/ordersApi";
import { getVendorWithdrawalRequests } from "@/api/payoutsApi";
import { VendorWithdrawalApprovalPanel } from "@/components/payouts/VendorWithdrawalApprovalPanel";
import { getProduct } from "@/api/productsApi";
import { getReviews } from "@/api/reviewsApi";
import { getStore } from "@/api/storesApi";
import { getVendorApplications } from "@/api/vendorApplicationsApi";
import { getVendors } from "@/api/vendorsApi";
import { getVouchers } from "@/api/vouchersApi";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useTabSection } from "@/hooks/useTabSection";
import { formatCurrency, formatDateTime } from "@/utils/format";

function DetailPageGate<T>({
  isLoading,
  error,
  record,
  notFoundLabel,
  onRetry,
  children,
}: {
  isLoading: boolean;
  error: string | null;
  record: T | null;
  notFoundLabel: string;
  onRetry: () => void;
  children: (record: T) => ReactNode;
}) {
  if (isLoading) return <AdminPageSkeleton blocks={2} />;
  if (error || !record) {
    return <ErrorState description={error ?? notFoundLabel} onRetry={onRetry} />;
  }
  return children(record);
}

function DetailShell({
  eyebrow,
  title,
  description,
  backRoute,
  tabs,
  defaultTab,
  onRefresh,
  refreshing,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backRoute: string;
  tabs: Array<{ id: string; label: string }>;
  defaultTab: string;
  onRefresh: () => void;
  refreshing: boolean;
  children: (active: string) => ReactNode;
}) {
  const { activeSection, setActiveSection } = useTabSection(defaultTab);
  return (
    <div className="space-y-4">
      <AdminDetailHeader
        eyebrow={eyebrow}
        title={title}
        description={description ?? ""}
        backRoute={backRoute}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <AdminTabNav sections={tabs} activeId={activeSection} onSelect={setActiveSection} />
      {tabs.map((tab) => (
        <AdminTabPanel key={tab.id} activeSection={activeSection} sectionId={tab.id}>
          {children(tab.id)}
        </AdminTabPanel>
      ))}
    </div>
  );
}

export function VendorDetailPage() {
  const { vendorId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: vendorId,
    loadList: getVendors,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Vendor not found."
      onRetry={() => void reload()}
    >
      {(vendor) => (
        <DetailShell
          eyebrow="Vendor dossier"
          title={vendor.businessName}
          description={vendor.email}
          backRoute="/vendors/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "performance", label: "Performance" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Vendor profile">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <AdminDetailTile label="Category" value={vendor.businessCategory} />
                  <AdminDetailTile label="Status" value={<StatusBadge status={vendor.status} />} />
                  <AdminDetailTile label="Phone" value={vendor.phoneNumber ?? "—"} />
                  <AdminDetailTile label="Joined" value={formatDateTime(vendor.joinedAt)} />
                  <AdminDetailTile label="User ID" value={vendor.userId} />
                </div>
              </SectionCard>
            ) : (
              <SectionCard compact title="Performance">
                <AdminKpiGrid
                  items={[
                    { label: "Stores", value: String(vendor.totalStores) },
                    { label: "Products", value: String(vendor.totalProducts) },
                    { label: "Orders", value: String(vendor.totalOrders) },
                    { label: "Sales", value: formatCurrency(vendor.totalSales) },
                  ]}
                />
              </SectionCard>
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function VendorApplicationDetailPage() {
  const { applicationId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: applicationId,
    loadList: getVendorApplications,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Application not found."
      onRetry={() => void reload()}
    >
      {(app) => (
        <DetailShell
          eyebrow="Application dossier"
          title={app.businessName}
          description={app.email}
          backRoute="/vendor-applications/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "store", label: "Store proposal" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
      {(tab) =>
        tab === "overview" ? (
          <SectionCard compact title="Application">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <AdminDetailTile label="Applicant" value={app.fullName} />
              <AdminDetailTile label="Status" value={<StatusBadge status={app.status} />} />
              <AdminDetailTile label="Category" value={app.businessCategory} />
              <AdminDetailTile label="Phone" value={app.phoneNumber} />
              <AdminDetailTile label="Submitted" value={formatDateTime(app.submittedAt)} />
            </div>
            <p className="mt-4 text-sm leading-6">{app.businessDescription}</p>
          </SectionCard>
        ) : (
          <SectionCard compact title="Store proposal">
            <AdminKpiGrid
              items={[
                { label: "Store name", value: app.storeName },
                { label: "City", value: app.city },
                { label: "Region", value: app.region },
                { label: "Location", value: app.storeLocation ?? "—" },
              ]}
            />
          </SectionCard>
        )
      }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function StoreDetailPage() {
  const { storeId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: storeId,
    loadDetail: getStore,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Store not found."
      onRetry={() => void reload()}
    >
      {(store) => (
        <DetailShell
          eyebrow="Store dossier"
          title={store.name}
          description={`@${store.slug}`}
          backRoute="/stores/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "products", label: "Products" },
            { id: "stats", label: "Stats" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
      {(tab) =>
        tab === "overview" ? (
          <SectionCard compact title="Store profile">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <AdminDetailTile label="Status" value={<StatusBadge status={store.status} />} />
              <AdminDetailTile label="Category" value={store.category} />
              <AdminDetailTile label="Vendor" value={store.vendorName ?? "—"} />
              <AdminDetailTile label="Market" value={store.marketName ?? "—"} />
              <AdminDetailTile
                label="Location"
                value={[store.location, store.city, store.region].filter(Boolean).join(", ")}
              />
            </div>
            <p className="mt-4 text-sm">{store.description}</p>
          </SectionCard>
        ) : tab === "products" ? (
          <SectionCard compact title="Catalog">
            {store.products.map((product) => (
              <div
                key={product.id}
                className="mb-2 flex items-center justify-between rounded-xl border border-white/10 p-3"
              >
                <span>{product.name}</span>
                <StatusBadge status={product.status} />
              </div>
            ))}
          </SectionCard>
        ) : (
          <SectionCard compact title="Performance">
            <AdminKpiGrid
              items={[
                { label: "Products", value: String(store.stats.totalProducts) },
                { label: "Active products", value: String(store.stats.activeProducts) },
                { label: "Orders", value: String(store.stats.totalOrders) },
                { label: "Sales", value: formatCurrency(store.stats.totalSales) },
              ]}
            />
          </SectionCard>
        )
      }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function ProductDetailPage() {
  const { productId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: productId,
    loadDetail: getProduct,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Product not found."
      onRetry={() => void reload()}
    >
      {(product) => (
        <DetailShell
          eyebrow="Product dossier"
          title={product.name}
          description={product.storeName ?? "No store"}
          backRoute="/products/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "catalog", label: "Catalog" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Listing">
                <AdminKpiGrid
                  items={[
                    { label: "Price", value: formatCurrency(product.price) },
                    { label: "Stock", value: String(product.stock) },
                    { label: "Status", value: product.status },
                    { label: "Rating", value: product.rating ? String(product.rating) : "—" },
                  ]}
                />
                <p className="mt-4 text-sm">{product.description}</p>
              </SectionCard>
            ) : (
              <SectionCard compact title="Taxonomy & store">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <AdminDetailTile label="Category" value={product.category} />
                  <AdminDetailTile label="Subcategory" value={product.subcategory ?? "—"} />
                  <AdminDetailTile label="Store" value={product.storeName ?? "—"} />
                  <AdminDetailTile label="Vendor" value={product.vendorName ?? "—"} />
                  <AdminDetailTile label="Updated" value={formatDateTime(product.updatedAt)} />
                </div>
              </SectionCard>
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function PayoutDetailPage() {
  const { payoutId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: payoutId,
    loadList: getVendorWithdrawalRequests,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Payout not found."
      onRetry={() => void reload()}
    >
      {(payout) => (
        <DetailShell
          eyebrow="Payout dossier"
          title={payout.vendorName}
          description={formatCurrency(payout.amount)}
          backRoute="/payouts"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "account", label: "Payout account" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
          {(tab) =>
            tab === "overview" ? (
              <>
                <SectionCard compact title="Withdrawal request">
                  <AdminKpiGrid
                    items={[
                      { label: "Status", value: payout.status },
                      { label: "Amount", value: formatCurrency(payout.amount) },
                      {
                        label: "Wallet available",
                        value: formatCurrency(payout.walletAvailableBalance),
                      },
                      { label: "Created", value: formatDateTime(payout.createdAt) },
                    ]}
                  />
                </SectionCard>
                <VendorWithdrawalApprovalPanel
                  request={payout}
                  onUpdated={(updated) => setRecord(updated)}
                />
              </>
            ) : (
              <SectionCard compact title="Payout destination">
                <div className="grid gap-2 md:grid-cols-2">
                  <AdminDetailTile label="Method" value={payout.payoutMethodType} />
                  <AdminDetailTile label="Account name" value={payout.payoutAccountName} />
                  <AdminDetailTile label="Account" value={payout.payoutAccountNumberMasked} />
                  <AdminDetailTile label="Provider" value={payout.payoutProvider ?? "—"} />
                </div>
              </SectionCard>
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function ReturnDetailPage() {
  const { returnId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: returnId,
    loadList: getReturnRequests,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Return not found."
      onRetry={() => void reload()}
    >
      {(item) => (
        <DetailShell
          eyebrow="Return dossier"
          title={item.orderNumber}
          description={item.productTitle}
          backRoute="/returns/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "resolution", label: "Resolution" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Return case">
                <AdminKpiGrid
                  items={[
                    { label: "Customer", value: item.customerName },
                    { label: "Type", value: item.requestType },
                    { label: "Status", value: item.status },
                    { label: "Quantity", value: String(item.quantity) },
                  ]}
                />
                <p className="mt-4 text-sm">{item.reason}</p>
                {item.details ? <p className="mt-2 text-xs text-textMuted">{item.details}</p> : null}
              </SectionCard>
            ) : (
              <SectionCard compact title="Resolution">
                <AdminKpiGrid
                  items={[
                    {
                      label: "Refund amount",
                      value: item.refundAmount != null ? formatCurrency(item.refundAmount) : "—",
                    },
                    { label: "Admin note", value: item.adminNote ?? "—" },
                    { label: "Updated", value: formatDateTime(item.updatedAt) },
                  ]}
                />
              </SectionCard>
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function ReviewDetailPage() {
  const { reviewId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: reviewId,
    loadList: getReviews,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Review not found."
      onRetry={() => void reload()}
    >
      {(review) => (
        <DetailShell
          eyebrow="Review dossier"
          title={review.productName}
          description={`${review.rating}/5 · ${review.userName}`}
          backRoute="/reviews/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "moderation", label: "Moderation" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Review">
                <p className="text-sm leading-6">{review.comment}</p>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <AdminDetailTile label="Order" value={review.orderNumber} />
                  <AdminDetailTile label="Store" value={review.storeName ?? "—"} />
                  <AdminDetailTile label="User email" value={review.userEmail} />
                  <AdminDetailTile label="Created" value={formatDateTime(review.createdAt)} />
                </div>
              </SectionCard>
            ) : (
              <SectionCard compact title="Moderation">
                <AdminKpiGrid
                  items={[
                    { label: "Visibility", value: review.isHidden ? "Hidden" : "Visible" },
                    { label: "Reason", value: review.moderationReason ?? "—" },
                    {
                      label: "Moderated",
                      value: review.moderatedAt ? formatDateTime(review.moderatedAt) : "—",
                    },
                  ]}
                />
              </SectionCard>
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function VoucherDetailPage() {
  const { voucherId = "" } = useParams();
  const { record, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: voucherId,
    loadList: getVouchers,
  });

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={record}
      notFoundLabel="Voucher not found."
      onRetry={() => void reload()}
    >
      {(voucher) => (
        <DetailShell
          eyebrow="Voucher dossier"
          title={voucher.code}
          description={voucher.title}
          backRoute="/vouchers/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "usage", label: "Usage" },
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Campaign">
                <AdminKpiGrid
                  items={[
                    { label: "Status", value: voucher.status },
                    { label: "Discount", value: voucher.rewardText },
                    { label: "Scope", value: voucher.scope },
                    { label: "Approval", value: voucher.approvalStatus ?? "—" },
                  ]}
                />
              </SectionCard>
            ) : (
              <SectionCard compact title="Usage">
                <AdminKpiGrid
                  items={[
                    { label: "Redemptions", value: String(voucher.redemptionCount) },
                    { label: "Unique users", value: String(voucher.uniqueUserCount) },
                    { label: "Total discount", value: formatCurrency(voucher.totalDiscountAmount) },
                    { label: "Usage limit", value: voucher.usageLimit ? String(voucher.usageLimit) : "Unlimited" },
                  ]}
                />
              </SectionCard>
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function SupportThreadDetailPage() {
  const { threadId = "" } = useParams();
  const { token } = useAdminAuth();
  const { record: thread, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: threadId,
    loadList: getSupportChatThreads,
  });
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof getSupportChatMessages>>>([]);

  useEffect(() => {
    if (!token || !threadId) return;
    void getSupportChatMessages(token, threadId).then(setMessages).catch(() => setMessages([]));
  }, [threadId, token]);

  return (
    <DetailPageGate
      isLoading={isLoading}
      error={error}
      record={thread}
      notFoundLabel="Support thread not found."
      onRetry={() => void reload()}
    >
      {(resolvedThread) => (
        <DetailShell
          eyebrow="Support thread"
          title={resolvedThread.subject ?? "Support conversation"}
          description={resolvedThread.counterpart.name}
          backRoute="/support-chats/full"
          tabs={[
            { id: "conversation", label: "Conversation" },
            { id: "meta", label: "Metadata" },
          ]}
          defaultTab="conversation"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
        >
          {(tab) =>
            tab === "conversation" ? (
              <SectionCard compact title="Messages">
                <div className="max-h-[480px] space-y-2 overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="rounded-xl border border-white/10 p-3">
                      <p className="text-xs text-textMuted">{message.senderRole}</p>
                      <p className="mt-1 text-sm">{message.text}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : (
              <SectionCard compact title="Thread metadata">
                <AdminKpiGrid
                  items={[
                    { label: "Status", value: resolvedThread.supportStatus ?? "—" },
                    { label: "Store", value: resolvedThread.store.title ?? "—" },
                    { label: "Unread", value: String(resolvedThread.unreadCount ?? 0) },
                    {
                      label: "Last message",
                      value: resolvedThread.lastMessageAt
                        ? formatDateTime(resolvedThread.lastMessageAt)
                        : "—",
                    },
                  ]}
                />
              </SectionCard>
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}
