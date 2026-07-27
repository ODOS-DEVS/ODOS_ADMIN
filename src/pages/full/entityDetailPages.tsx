import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AdminDetailHeader,
  AdminDetailTile,
  AdminKpiGrid,
  AdminPageSkeleton,
  AdminTabNav,
  AdminTabPanel,
} from "@/components/admin/AdminShell";
import { EntityTimeline, RelatedRecordsCard } from "@/components/admin/EntityOps";
import { getSupportChatMessages, getSupportChatThreads } from "@/api/chatApi";
import { getReturnRequest, updateReturnRequest } from "@/api/ordersApi";
import { getVendorWithdrawalRequests } from "@/api/payoutsApi";
import { VendorWithdrawalApprovalPanel } from "@/components/payouts/VendorWithdrawalApprovalPanel";
import { getProduct, updateProductStatus } from "@/api/productsApi";
import { getReviews, updateReviewModeration } from "@/api/reviewsApi";
import { getStore } from "@/api/storesApi";
import {
  approveVendorApplication,
  getVendorApplications,
  rejectVendorApplication,
} from "@/api/vendorApplicationsApi";
import { getVendor, updateVendorStatus } from "@/api/vendorsApi";
import { getVouchers, pauseVoucher, resumeVoucher } from "@/api/vouchersApi";
import { VendorApplicationDetails } from "@/components/vendor/VendorApplicationDetails";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useTabSection } from "@/hooks/useTabSection";
import { useToast } from "@/hooks/useToast";
import type { AdminReturnRequest, ProductStatus, Vendor } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { resolveAdminMediaUrl } from "@/utils/media";

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
  actions,
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
  actions?: ReactNode;
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
        actions={actions}
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

const STANDARD_OPS_TABS = {
  timeline: { id: "timeline", label: "Timeline" },
  relationships: { id: "relationships", label: "Relationships" },
} as const;

export function VendorDetailPage() {
  const navigate = useNavigate();
  const { vendorId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: vendorId,
    loadDetail: getVendor,
  });
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleStatusToggle() {
    if (!token || !record) return;
    const nextStatus: Vendor["status"] = record.status === "suspended" ? "active" : "suspended";
    setActionLoading(true);
    try {
      const updated = await updateVendorStatus(token, record.id, nextStatus);
      setRecord(updated);
      showToast({
        title: nextStatus === "suspended" ? "Vendor suspended" : "Vendor reactivated",
        description: `${updated.businessName} is now ${nextStatus}.`,
        tone: "success",
      });
      setConfirmSuspend(false);
    } catch (updateError) {
      showToast({
        title: "Unable to update vendor",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
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
            description={`${vendor.email} · ${vendor.status}`}
            backRoute="/vendors/full"
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "performance", label: "Performance" },
              STANDARD_OPS_TABS.relationships,
              STANDARD_OPS_TABS.timeline,
            ]}
            defaultTab="overview"
            onRefresh={() => void reload(true)}
            refreshing={isRefreshing}
            actions={
              <>
                <Button variant="secondary" onClick={() => navigate(`/users/full/${vendor.userId}`)}>
                  Open user
                </Button>
                <Button
                  variant={vendor.status === "suspended" ? "primary" : "danger"}
                  onClick={() => setConfirmSuspend(true)}
                >
                  {vendor.status === "suspended" ? "Reactivate" : "Suspend"}
                </Button>
              </>
            }
          >
            {(tab) =>
              tab === "overview" ? (
                <SectionCard compact title="Vendor profile" description="Marketplace seller identity">
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    <AdminDetailTile label="Category" value={vendor.businessCategory} />
                    <AdminDetailTile label="Status" value={<StatusBadge status={vendor.status} />} />
                    <AdminDetailTile label="Phone" value={vendor.phoneNumber ?? "—"} />
                    <AdminDetailTile label="Joined" value={formatDateTime(vendor.joinedAt)} />
                    <AdminDetailTile label="Vendor ID" value={vendor.id} />
                    <AdminDetailTile label="User ID" value={vendor.userId} />
                  </div>
                </SectionCard>
              ) : tab === "performance" ? (
                <SectionCard compact title="Performance" description="Catalog and commerce footprint">
                  <AdminKpiGrid
                    items={[
                      { label: "Stores", value: String(vendor.totalStores) },
                      { label: "Products", value: String(vendor.totalProducts) },
                      { label: "Orders", value: String(vendor.totalOrders) },
                      { label: "Sales", value: formatCurrency(vendor.totalSales) },
                    ]}
                  />
                </SectionCard>
              ) : tab === "relationships" ? (
                <RelatedRecordsCard
                  title="Related records"
                  description="Jump to linked marketplace entities"
                  records={[
                    {
                      id: vendor.userId,
                      label: "Owner account",
                      meta: vendor.email,
                      href: `/users/full/${vendor.userId}`,
                    },
                    {
                      id: "stores",
                      label: "Stores directory",
                      meta: `${vendor.totalStores} store(s)`,
                      href: `/stores/full?q=${encodeURIComponent(vendor.businessName)}`,
                    },
                    {
                      id: "products",
                      label: "Products directory",
                      meta: `${vendor.totalProducts} product(s)`,
                      href: `/products/full?q=${encodeURIComponent(vendor.businessName)}`,
                    },
                    {
                      id: "payouts",
                      label: "Payout queue",
                      meta: "Vendor withdrawals",
                      href: `/payouts?status=pending`,
                    },
                  ]}
                />
              ) : (
                <EntityTimeline entityType="vendor" entityId={vendor.id} actorId={vendor.userId} />
              )
            }
          </DetailShell>
        )}
      </DetailPageGate>
      <ConfirmDialog
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={() => void handleStatusToggle()}
        title={record?.status === "suspended" ? "Reactivate vendor" : "Suspend vendor"}
        description={
          record?.status === "suspended"
            ? `Restore ${record.businessName} to active selling status.`
            : `Suspend ${record?.businessName ?? "this vendor"} from selling on ODOS.`
        }
        confirmLabel={record?.status === "suspended" ? "Reactivate" : "Suspend"}
        confirmVariant={record?.status === "suspended" ? "primary" : "danger"}
        isLoading={actionLoading}
      />
    </>
  );
}

export function VendorApplicationDetailPage() {
  const navigate = useNavigate();
  const { applicationId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: applicationId,
    loadList: getVendorApplications,
  });
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function handleApprove() {
    if (!token || !record) return;
    setActionLoading(true);
    try {
      const updated = await approveVendorApplication(token, record.id);
      setRecord(updated);
      showToast({ title: "Application approved", description: updated.businessName, tone: "success" });
      setConfirmApprove(false);
    } catch (updateError) {
      showToast({
        title: "Unable to approve",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!token || !record) return;
    setActionLoading(true);
    try {
      const updated = await rejectVendorApplication(token, record.id, rejectionReason.trim() || "Rejected by admin");
      setRecord(updated);
      showToast({ title: "Application rejected", description: updated.businessName, tone: "success" });
      setConfirmReject(false);
      setRejectionReason("");
    } catch (updateError) {
      showToast({
        title: "Unable to reject",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  const canDecide = record && ["pending", "under_review"].includes(record.status);

  return (
    <>
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
            description={`${app.fullName} · ${app.email}`}
            backRoute="/vendor-applications/full"
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "documents", label: "Documents & KYC" },
              STANDARD_OPS_TABS.relationships,
              STANDARD_OPS_TABS.timeline,
            ]}
            defaultTab="overview"
            onRefresh={() => void reload(true)}
            refreshing={isRefreshing}
            actions={
              <>
                <Button variant="secondary" onClick={() => navigate(`/users/full/${app.userId}`)}>
                  Open applicant
                </Button>
                {canDecide ? (
                  <>
                    <Button onClick={() => setConfirmApprove(true)}>Approve</Button>
                    <Button variant="danger" onClick={() => setConfirmReject(true)}>
                      Reject
                    </Button>
                  </>
                ) : null}
              </>
            }
          >
            {(tab) =>
              tab === "overview" ? (
                <SectionCard compact title="Application snapshot">
                  <AdminKpiGrid
                    items={[
                      { label: "Status", value: app.status },
                      { label: "Category", value: app.businessCategory },
                      { label: "City", value: app.city },
                      { label: "Submitted", value: formatDateTime(app.submittedAt) },
                    ]}
                  />
                  <p className="mt-4 text-sm leading-6 text-textMuted">{app.businessDescription}</p>
                  {app.rejectionReason ? (
                    <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                      Rejection reason: {app.rejectionReason}
                    </p>
                  ) : null}
                </SectionCard>
              ) : tab === "documents" ? (
                <SectionCard compact title="Full application packet" bodyClassName="pt-2">
                  <VendorApplicationDetails application={app} />
                </SectionCard>
              ) : tab === "relationships" ? (
                <RelatedRecordsCard
                  title="Related records"
                  records={[
                    {
                      id: app.userId,
                      label: "Applicant user",
                      meta: app.email,
                      href: `/users/full/${app.userId}`,
                    },
                  ]}
                />
              ) : (
                <EntityTimeline entityType="vendor_application" entityId={app.id} actorId={app.userId} />
              )
            }
          </DetailShell>
        )}
      </DetailPageGate>

      <ConfirmDialog
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={() => void handleApprove()}
        title="Approve vendor application"
        description="This will approve the seller and activate their store workflow."
        confirmLabel="Approve"
        isLoading={actionLoading}
      />
      <ConfirmDialog
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        onConfirm={() => void handleReject()}
        title="Reject vendor application"
        description="Provide a reason that will be stored on the application record."
        confirmLabel="Reject"
        confirmVariant="danger"
        isLoading={actionLoading}
        extraContent={
          <textarea
            className="app-textarea mt-3 min-h-[96px]"
            placeholder="Rejection reason"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
        }
      />
    </>
  );
}

export function StoreDetailPage() {
  const navigate = useNavigate();
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
          description={`@${store.slug} · ${store.status}`}
          backRoute="/stores/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "products", label: "Products" },
            { id: "stats", label: "Stats" },
            STANDARD_OPS_TABS.relationships,
            STANDARD_OPS_TABS.timeline,
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
          actions={
            store.vendorId ? (
              <Button variant="secondary" onClick={() => navigate(`/vendors/full/${store.vendorId}`)}>
                Open vendor
              </Button>
            ) : null
          }
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Store profile">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <AdminDetailTile label="Status" value={<StatusBadge status={store.status} />} />
                  <AdminDetailTile label="Category" value={store.category} />
                  <AdminDetailTile label="Vendor" value={store.vendorName ?? "—"} />
                  <AdminDetailTile label="Vendor email" value={store.vendorEmail ?? "—"} />
                  <AdminDetailTile label="Vendor phone" value={store.vendorPhoneNumber ?? "—"} />
                  <AdminDetailTile label="Market" value={store.marketName ?? "—"} />
                  <AdminDetailTile
                    label="Location"
                    value={[store.location, store.city, store.region].filter(Boolean).join(", ") || "—"}
                  />
                </div>
                <p className="mt-4 text-sm text-textMuted">{store.description}</p>
              </SectionCard>
            ) : tab === "products" ? (
              <SectionCard compact title="Catalog">
                {store.products.length === 0 ? (
                  <p className="text-sm text-textMuted">No products in this store yet.</p>
                ) : (
                  store.products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => navigate(`/products/full/${product.id}`)}
                      className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-3 text-left transition hover:border-accent/30"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="text-xs text-textMuted">
                          {formatCurrency(product.price)} · stock {product.stock}
                        </span>
                      </span>
                      <StatusBadge status={product.status} />
                    </button>
                  ))
                )}
              </SectionCard>
            ) : tab === "stats" ? (
              <SectionCard compact title="Performance">
                <AdminKpiGrid
                  items={[
                    { label: "Products", value: String(store.stats.totalProducts) },
                    { label: "Active", value: String(store.stats.activeProducts) },
                    { label: "Pending", value: String(store.stats.pendingProducts) },
                    { label: "Hidden", value: String(store.stats.hiddenProducts) },
                    { label: "Orders", value: String(store.stats.totalOrders) },
                    { label: "Sales", value: formatCurrency(store.stats.totalSales) },
                  ]}
                />
              </SectionCard>
            ) : tab === "relationships" ? (
              <RelatedRecordsCard
                title="Related records"
                records={[
                  ...(store.vendorId
                    ? [
                        {
                          id: store.vendorId,
                          label: store.vendorName ?? "Vendor",
                          meta: store.vendorEmail ?? undefined,
                          href: `/vendors/full/${store.vendorId}`,
                        },
                      ]
                    : []),
                  {
                    id: "products",
                    label: "Product catalog filter",
                    meta: store.name,
                    href: `/products/full?q=${encodeURIComponent(store.name)}`,
                  },
                ]}
              />
            ) : (
              <EntityTimeline entityType="store" entityId={store.id} />
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: productId,
    loadDetail: getProduct,
  });
  const [pendingStatus, setPendingStatus] = useState<ProductStatus>("active");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (record) setPendingStatus(record.status);
  }, [record]);

  async function handleStatusUpdate() {
    if (!token || !record) return;
    setActionLoading(true);
    try {
      const updated = await updateProductStatus(token, record.id, pendingStatus);
      setRecord(updated);
      showToast({
        title: "Product updated",
        description: `${updated.name} is now ${updated.status}.`,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to update product",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

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
          description={`${product.storeName ?? "No store"} · ${product.status}`}
          backRoute="/products/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "media", label: "Media & variants" },
            { id: "catalog", label: "Catalog" },
            { id: "actions", label: "Actions" },
            STANDARD_OPS_TABS.relationships,
            STANDARD_OPS_TABS.timeline,
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
          actions={
            <Button
              variant="secondary"
              onClick={() => navigate(`/products/full/${product.id}/studio`)}
            >
              Open studio
            </Button>
          }
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Listing snapshot">
                <AdminKpiGrid
                  items={[
                    { label: "Price", value: formatCurrency(product.price) },
                    {
                      label: "Compare-at",
                      value: product.oldPrice != null ? formatCurrency(product.oldPrice) : "—",
                    },
                    { label: "Stock", value: String(product.stock) },
                    { label: "Status", value: product.status },
                    { label: "Rating", value: product.rating != null ? String(product.rating) : "—" },
                    { label: "Discount", value: product.discount ?? "—" },
                  ]}
                />
                <p className="mt-4 text-sm leading-6 text-textMuted">{product.description}</p>
              </SectionCard>
            ) : tab === "media" ? (
              <div className="space-y-4">
                <SectionCard compact title="Images">
                  {product.images.length === 0 ? (
                    <p className="text-sm text-textMuted">No images uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {product.images.map((image, index) => (
                        <img
                          key={`${image}-${index}`}
                          src={resolveAdminMediaUrl(image) ?? undefined}
                          alt=""
                          className="aspect-square rounded-xl border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>
                <SectionCard compact title="Variants & specs">
                  <div className="grid gap-2 md:grid-cols-2">
                    <AdminDetailTile
                      label="Colors"
                      value={product.colorOptions?.join(", ") || "—"}
                    />
                    <AdminDetailTile
                      label="Sizes"
                      value={product.sizeOptions?.join(", ") || "—"}
                    />
                    <AdminDetailTile
                      label="Specifications"
                      value={product.specifications?.join(" · ") || "—"}
                    />
                    <AdminDetailTile
                      label="Placement tags"
                      value={product.placementTags?.join(", ") || "—"}
                    />
                  </div>
                </SectionCard>
              </div>
            ) : tab === "catalog" ? (
              <SectionCard compact title="Taxonomy & ownership">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <AdminDetailTile label="Category" value={product.category} />
                  <AdminDetailTile label="Subcategory" value={product.subcategory ?? "—"} />
                  <AdminDetailTile label="Audience" value={product.audienceSlug ?? "—"} />
                  <AdminDetailTile label="Section" value={product.section ?? "—"} />
                  <AdminDetailTile label="Store" value={product.storeName ?? "—"} />
                  <AdminDetailTile label="Vendor" value={product.vendorName ?? "—"} />
                  <AdminDetailTile label="Vendor email" value={product.vendorEmail ?? "—"} />
                  <AdminDetailTile label="Created" value={formatDateTime(product.createdAt)} />
                  <AdminDetailTile label="Updated" value={formatDateTime(product.updatedAt)} />
                </div>
              </SectionCard>
            ) : tab === "actions" ? (
              <SectionCard compact title="Moderation actions" description="Change listing visibility without leaving this dossier">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[200px] flex-1">
                    <FilterSelect
                      value={pendingStatus}
                      onChange={(event) => setPendingStatus(event.target.value as ProductStatus)}
                      options={[
                        { label: "Pending", value: "pending" },
                        { label: "Active", value: "active" },
                        { label: "Hidden", value: "hidden" },
                        { label: "Suspended", value: "suspended" },
                      ]}
                    />
                  </div>
                  <Button isLoading={actionLoading} onClick={() => void handleStatusUpdate()}>
                    Save status
                  </Button>
                </div>
              </SectionCard>
            ) : tab === "relationships" ? (
              <RelatedRecordsCard
                title="Related records"
                records={[
                  ...(product.storeId
                    ? [
                        {
                          id: product.storeId,
                          label: product.storeName ?? "Store",
                          href: `/stores/full/${product.storeId}`,
                        },
                      ]
                    : []),
                  ...(product.vendorId
                    ? [
                        {
                          id: product.vendorId,
                          label: product.vendorName ?? "Vendor",
                          meta: product.vendorEmail ?? undefined,
                          href: `/vendors/full/${product.vendorId}`,
                        },
                      ]
                    : []),
                  {
                    id: "reviews",
                    label: "Reviews directory",
                    meta: product.name,
                    href: `/reviews/full?q=${encodeURIComponent(product.name)}`,
                  },
                ]}
              />
            ) : (
              <EntityTimeline entityType="product" entityId={product.id} />
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function PayoutDetailPage() {
  const navigate = useNavigate();
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
          description={`${formatCurrency(payout.amount)} · ${payout.status}`}
          backRoute="/payouts"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "account", label: "Payout account" },
            { id: "ops", label: "Operations" },
            STANDARD_OPS_TABS.relationships,
            STANDARD_OPS_TABS.timeline,
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
          actions={
            <Button
              variant="secondary"
              onClick={() => navigate(`/vendors/full/${payout.vendorUserId}`)}
            >
              Open vendor
            </Button>
          }
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Withdrawal request">
                <AdminKpiGrid
                  items={[
                    { label: "Status", value: payout.status },
                    { label: "Amount", value: formatCurrency(payout.amount) },
                    {
                      label: "Wallet available",
                      value: formatCurrency(payout.walletAvailableBalance),
                    },
                    {
                      label: "Pending hold",
                      value: formatCurrency(payout.walletPendingWithdrawalBalance),
                    },
                    { label: "Created", value: formatDateTime(payout.createdAt) },
                    {
                      label: "Paid at",
                      value: payout.paidAt ? formatDateTime(payout.paidAt) : "—",
                    },
                  ]}
                />
                {payout.note ? <p className="mt-3 text-sm text-textMuted">Vendor note: {payout.note}</p> : null}
                {payout.adminNote ? (
                  <p className="mt-2 text-sm text-textMuted">Admin note: {payout.adminNote}</p>
                ) : null}
                {payout.transferFailureReason ? (
                  <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    Transfer failure: {payout.transferFailureReason}
                  </p>
                ) : null}
              </SectionCard>
            ) : tab === "account" ? (
              <SectionCard compact title="Payout destination">
                <div className="grid gap-2 md:grid-cols-2">
                  <AdminDetailTile label="Method" value={payout.payoutMethodType} />
                  <AdminDetailTile label="Account name" value={payout.payoutAccountName} />
                  <AdminDetailTile label="Account" value={payout.payoutAccountNumberMasked} />
                  <AdminDetailTile label="Provider" value={payout.payoutProvider ?? "—"} />
                  <AdminDetailTile
                    label="Paystack reference"
                    value={payout.paystackTransferReference ?? "—"}
                  />
                  <AdminDetailTile
                    label="Transfer code"
                    value={payout.paystackTransferCode ?? "—"}
                  />
                  <AdminDetailTile
                    label="Reviewed by"
                    value={payout.reviewedByName ?? "—"}
                  />
                  <AdminDetailTile
                    label="Reviewed at"
                    value={payout.reviewedAt ? formatDateTime(payout.reviewedAt) : "—"}
                  />
                </div>
              </SectionCard>
            ) : tab === "ops" ? (
              <VendorWithdrawalApprovalPanel
                request={payout}
                onUpdated={(updated) => setRecord(updated)}
              />
            ) : tab === "relationships" ? (
              <RelatedRecordsCard
                title="Related records"
                records={[
                  {
                    id: payout.vendorUserId,
                    label: payout.vendorName,
                    meta: payout.vendorEmail,
                    href: `/vendors/full/${payout.vendorUserId}`,
                  },
                  {
                    id: "user",
                    label: "Owner user profile",
                    meta: payout.vendorEmail,
                    href: `/users/full/${payout.vendorUserId}`,
                  },
                ]}
              />
            ) : (
              <EntityTimeline entityType="vendor_withdrawal" entityId={payout.id} actorId={payout.vendorUserId} />
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function ReturnDetailPage() {
  const navigate = useNavigate();
  const { returnId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: returnId,
    loadDetail: getReturnRequest,
  });
  const [draftStatus, setDraftStatus] = useState<AdminReturnRequest["status"]>("requested");
  const [draftNote, setDraftNote] = useState("");
  const [draftRefund, setDraftRefund] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!record) return;
    setDraftStatus(record.status);
    setDraftNote(record.adminNote ?? "");
    setDraftRefund(record.refundAmount != null ? String(record.refundAmount) : "");
  }, [record]);

  async function handleSave() {
    if (!token || !record) return;
    setActionLoading(true);
    try {
      const updated = await updateReturnRequest(token, record.id, {
        status: draftStatus,
        adminNote: draftNote.trim() || null,
        refundAmount: draftRefund.trim() ? Number(draftRefund) : null,
      });
      setRecord(updated);
      showToast({ title: "Return updated", description: updated.orderNumber, tone: "success" });
    } catch (updateError) {
      showToast({
        title: "Unable to update return",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

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
          description={`${item.productTitle} · ${item.status}`}
          backRoute="/returns/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "evidence", label: "Evidence" },
            { id: "resolution", label: "Resolution" },
            STANDARD_OPS_TABS.relationships,
            STANDARD_OPS_TABS.timeline,
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
          actions={
            <Button variant="secondary" onClick={() => navigate(`/orders/full/${item.orderId}`)}>
              Open order
            </Button>
          }
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
                    { label: "Store", value: item.storeName },
                    { label: "Created", value: formatDateTime(item.createdAt) },
                  ]}
                />
                <p className="mt-4 text-sm">{item.reason}</p>
                {item.details ? <p className="mt-2 text-xs text-textMuted">{item.details}</p> : null}
              </SectionCard>
            ) : tab === "evidence" ? (
              <SectionCard compact title="Evidence images">
                {!item.evidenceImageUrls?.length ? (
                  <p className="text-sm text-textMuted">No evidence images attached.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {item.evidenceImageUrls.map((url, index) => (
                      <img
                        key={`${url}-${index}`}
                        src={resolveAdminMediaUrl(url) ?? undefined}
                        alt=""
                        className="aspect-square rounded-xl border border-white/10 object-cover"
                      />
                    ))}
                  </div>
                )}
              </SectionCard>
            ) : tab === "resolution" ? (
              <SectionCard compact title="Resolution & admin actions">
                <div className="grid gap-3 md:grid-cols-2">
                  <FilterSelect
                    value={draftStatus}
                    onChange={(event) =>
                      setDraftStatus(event.target.value as AdminReturnRequest["status"])
                    }
                    options={[
                      { label: "Requested", value: "requested" },
                      { label: "Under review", value: "under_review" },
                      { label: "Approved", value: "approved" },
                      { label: "Rejected", value: "rejected" },
                      { label: "Refunded", value: "refunded" },
                      { label: "Exchanged", value: "exchanged" },
                    ]}
                  />
                  <input
                    className="app-input"
                    placeholder="Refund amount"
                    value={draftRefund}
                    onChange={(event) => setDraftRefund(event.target.value)}
                  />
                </div>
                <textarea
                  className="app-textarea mt-3 min-h-[96px]"
                  placeholder="Admin note"
                  value={draftNote}
                  onChange={(event) => setDraftNote(event.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button isLoading={actionLoading} onClick={() => void handleSave()}>
                    Save resolution
                  </Button>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <AdminDetailTile label="Reviewed by" value={item.reviewedByName ?? "—"} />
                  <AdminDetailTile
                    label="Reviewed at"
                    value={item.reviewedAt ? formatDateTime(item.reviewedAt) : "—"}
                  />
                  <AdminDetailTile
                    label="Resolved at"
                    value={item.resolvedAt ? formatDateTime(item.resolvedAt) : "—"}
                  />
                </div>
              </SectionCard>
            ) : tab === "relationships" ? (
              <RelatedRecordsCard
                title="Related records"
                records={[
                  {
                    id: item.orderId,
                    label: item.orderNumber,
                    meta: "Parent order",
                    href: `/orders/full/${item.orderId}`,
                  },
                  {
                    id: item.userId,
                    label: item.customerName,
                    meta: item.customerEmail,
                    href: `/users/full/${item.userId}`,
                  },
                  {
                    id: item.productId,
                    label: item.productTitle,
                    meta: "Product",
                    href: `/products/full/${item.productId}`,
                  },
                ]}
              />
            ) : (
              <EntityTimeline entityType="return_request" entityId={item.id} actorId={item.userId} />
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function ReviewDetailPage() {
  const navigate = useNavigate();
  const { reviewId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: reviewId,
    loadList: getReviews,
  });
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function handleModeration(isHidden: boolean) {
    if (!token || !record) return;
    setActionLoading(true);
    try {
      const updated = await updateReviewModeration(token, record.id, {
        isHidden,
        moderationReason: reason.trim() || null,
      });
      setRecord(updated);
      showToast({
        title: isHidden ? "Review hidden" : "Review restored",
        description: updated.productName,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to moderate review",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

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
            STANDARD_OPS_TABS.relationships,
            STANDARD_OPS_TABS.timeline,
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
          actions={
            <Button variant="secondary" onClick={() => navigate(`/orders/full/${review.orderId}`)}>
              Open order
            </Button>
          }
        >
          {(tab) =>
            tab === "overview" ? (
              <SectionCard compact title="Review">
                <p className="text-sm leading-6">{review.comment}</p>
                {review.vendorReply ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Vendor reply</p>
                    <p className="mt-1 text-sm">{review.vendorReply}</p>
                  </div>
                ) : null}
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <AdminDetailTile label="Order" value={review.orderNumber} />
                  <AdminDetailTile label="Store" value={review.storeName ?? "—"} />
                  <AdminDetailTile label="User email" value={review.userEmail} />
                  <AdminDetailTile label="Created" value={formatDateTime(review.createdAt)} />
                </div>
              </SectionCard>
            ) : tab === "moderation" ? (
              <SectionCard compact title="Moderation actions">
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
                <textarea
                  className="app-textarea mt-3 min-h-[88px]"
                  placeholder="Moderation reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    isLoading={actionLoading}
                    onClick={() => void handleModeration(true)}
                  >
                    Hide review
                  </Button>
                  <Button
                    variant="secondary"
                    isLoading={actionLoading}
                    onClick={() => void handleModeration(false)}
                  >
                    Restore visibility
                  </Button>
                </div>
              </SectionCard>
            ) : tab === "relationships" ? (
              <RelatedRecordsCard
                title="Related records"
                records={[
                  {
                    id: review.orderId,
                    label: review.orderNumber,
                    href: `/orders/full/${review.orderId}`,
                  },
                  {
                    id: review.userId,
                    label: review.userName,
                    meta: review.userEmail,
                    href: `/users/full/${review.userId}`,
                  },
                  {
                    id: review.productId,
                    label: review.productName,
                    href: `/products/full/${review.productId}`,
                  },
                ]}
              />
            ) : (
              <EntityTimeline entityType="review" entityId={review.id} actorId={review.userId} />
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function VoucherDetailPage() {
  const { voucherId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { record, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: voucherId,
    loadList: getVouchers,
  });
  const [actionLoading, setActionLoading] = useState(false);

  async function handlePauseResume() {
    if (!token || !record) return;
    setActionLoading(true);
    try {
      const shouldResume = !record.isActive || record.status === "disabled";
      const updated = shouldResume
        ? await resumeVoucher(token, record.id)
        : await pauseVoucher(token, record.id);
      setRecord(updated);
      showToast({
        title: updated.isActive ? "Voucher resumed" : "Voucher paused",
        description: updated.code,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to update voucher",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

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
          description={`${voucher.title} · ${voucher.status}`}
          backRoute="/vouchers/full"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "rules", label: "Rules" },
            { id: "usage", label: "Usage" },
            STANDARD_OPS_TABS.relationships,
            STANDARD_OPS_TABS.timeline,
          ]}
          defaultTab="overview"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
            actions={
              <Button
                variant="secondary"
                isLoading={actionLoading}
                onClick={() => void handlePauseResume()}
              >
                {!voucher.isActive || voucher.status === "disabled" ? "Resume" : "Pause"}
              </Button>
            }
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
                    { label: "Owner", value: voucher.ownerType ?? "—" },
                    { label: "Issuer", value: voucher.issuerName ?? "—" },
                  ]}
                />
                {voucher.description ? (
                  <p className="mt-4 text-sm text-textMuted">{voucher.description}</p>
                ) : null}
              </SectionCard>
            ) : tab === "rules" ? (
              <SectionCard compact title="Eligibility & schedule">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <AdminDetailTile label="Availability" value={voucher.availability} />
                  <AdminDetailTile label="Store" value={voucher.storeName ?? "—"} />
                  <AdminDetailTile
                    label="Starts"
                    value={voucher.startsAt ? formatDateTime(voucher.startsAt) : "—"}
                  />
                  <AdminDetailTile
                    label="Ends"
                    value={voucher.endsAt ? formatDateTime(voucher.endsAt) : "—"}
                  />
                  <AdminDetailTile
                    label="Min order"
                    value={
                      voucher.minSubtotal > 0 ? formatCurrency(voucher.minSubtotal) : "—"
                    }
                  />
                  <AdminDetailTile
                    label="Usage limit"
                    value={voucher.usageLimit != null ? String(voucher.usageLimit) : "Unlimited"}
                  />
                  <AdminDetailTile
                    label="Per-user limit"
                    value={
                      voucher.perUserLimit != null ? String(voucher.perUserLimit) : "Unlimited"
                    }
                  />
                  <AdminDetailTile label="Review notes" value={voucher.reviewNotes ?? "—"} />
                </div>
              </SectionCard>
            ) : tab === "usage" ? (
              <SectionCard compact title="Usage analytics">
                <AdminKpiGrid
                  items={[
                    { label: "Redemptions", value: String(voucher.redemptionCount) },
                    { label: "Unique users", value: String(voucher.uniqueUserCount) },
                    {
                      label: "Total discount",
                      value: formatCurrency(voucher.totalDiscountAmount),
                    },
                    {
                      label: "Remaining",
                      value:
                        voucher.usageLimit != null
                          ? String(Math.max(voucher.usageLimit - voucher.redemptionCount, 0))
                          : "Unlimited",
                    },
                  ]}
                />
              </SectionCard>
            ) : tab === "relationships" ? (
              <RelatedRecordsCard
                title="Related records"
                records={[
                  ...(voucher.storeId
                    ? [
                        {
                          id: voucher.storeId,
                          label: voucher.storeName ?? "Store",
                          href: `/stores/full/${voucher.storeId}`,
                        },
                      ]
                    : []),
                  {
                    id: "orders",
                    label: "Orders using this code",
                    meta: voucher.code,
                    href: `/orders/full?q=${encodeURIComponent(voucher.code)}`,
                  },
                ]}
              />
            ) : (
              <EntityTimeline entityType="voucher" entityId={voucher.id} />
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}

export function SupportThreadDetailPage() {
  const navigate = useNavigate();
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
            STANDARD_OPS_TABS.relationships,
            STANDARD_OPS_TABS.timeline,
          ]}
          defaultTab="conversation"
          onRefresh={() => void reload(true)}
          refreshing={isRefreshing}
          actions={
            <Button
              variant="secondary"
              onClick={() => navigate(`/support-chats/full?status=${resolvedThread.supportStatus ?? "all"}`)}
            >
              Open inbox
            </Button>
          }
        >
          {(tab) =>
            tab === "conversation" ? (
              <SectionCard compact title="Messages">
                <div className="max-h-[480px] space-y-2 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-textMuted">No messages in this thread yet.</p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="rounded-xl border border-white/10 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-textMuted">{message.senderRole}</p>
                          <p className="text-[11px] text-textMuted">
                            {formatDateTime(message.time)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm">{message.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            ) : tab === "meta" ? (
              <SectionCard compact title="Thread metadata">
                <AdminKpiGrid
                  items={[
                    { label: "Status", value: resolvedThread.supportStatus ?? "—" },
                    { label: "Store", value: resolvedThread.store.title ?? "—" },
                    { label: "Unread", value: String(resolvedThread.unreadCount ?? 0) },
                    {
                      label: "Assigned admin",
                      value: resolvedThread.assignedAdminName ?? "Unassigned",
                    },
                    {
                      label: "Last message",
                      value: resolvedThread.lastMessageAt
                        ? formatDateTime(resolvedThread.lastMessageAt)
                        : "—",
                    },
                  ]}
                />
              </SectionCard>
            ) : tab === "relationships" ? (
              <RelatedRecordsCard
                title="Related records"
                records={[
                  {
                    id: resolvedThread.counterpart.userId,
                    label: resolvedThread.counterpart.name,
                    meta: resolvedThread.counterpart.role,
                    href: `/users/full/${resolvedThread.counterpart.userId}`,
                  },
                  ...(resolvedThread.store.id
                    ? [
                        {
                          id: resolvedThread.store.id,
                          label: resolvedThread.store.title,
                          href: `/stores/full/${resolvedThread.store.id}`,
                        },
                      ]
                    : []),
                ]}
              />
            ) : (
              <EntityTimeline
                entityType="support_thread"
                entityId={resolvedThread.id}
                actorId={resolvedThread.counterpart.userId}
              />
            )
          }
        </DetailShell>
      )}
    </DetailPageGate>
  );
}
