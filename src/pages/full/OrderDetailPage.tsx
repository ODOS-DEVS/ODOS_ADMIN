import { useNavigate, useParams } from "react-router-dom";

import { AdminDetailHeader, AdminDetailTile, AdminKpiGrid, AdminPageSkeleton, AdminTabNav, AdminTabPanel } from "@/components/admin/AdminShell";
import { getOrder } from "@/api/ordersApi";
import { DataTable } from "@/components/tables/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useTabSection } from "@/hooks/useTabSection";
import type { AdminOrderDetail } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { resolveAdminMediaUrl } from "@/utils/media";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "customer", label: "Customer" },
  { id: "items", label: "Items" },
  { id: "payment", label: "Payment" },
  { id: "returns", label: "Returns" },
] as const;

export function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const { record: order, isLoading, isRefreshing, error, reload } = useRecordDetail({
    id: orderId,
    loadDetail: getOrder,
  });
  const { activeSection, setActiveSection } = useTabSection<(typeof TABS)[number]["id"]>("overview");

  if (isLoading) return <AdminPageSkeleton blocks={2} />;
  if (error || !order) return <ErrorState description={error ?? "Order not found."} onRetry={() => void reload()} />;

  return (
    <div className="space-y-4">
      <AdminDetailHeader
        eyebrow="Order dossier"
        title={order.orderNumber}
        description={`${order.storeName} · ${formatDateTime(order.placedAt)}`}
        backRoute="/orders/full"
        onRefresh={() => void reload(true)}
        refreshing={isRefreshing}
        actions={
          <button type="button" className="text-xs text-accentSoft underline" onClick={() => navigate(`/users/full/${order.customerId}`)}>
            View customer profile
          </button>
        }
      />
      <AdminTabNav sections={[...TABS]} activeId={activeSection} onSelect={(id) => setActiveSection(id as (typeof TABS)[number]["id"])} />
      <AdminTabPanel activeSection={activeSection} sectionId="overview">
        <SectionCard compact title="Order snapshot">
          <AdminKpiGrid items={[
            { label: "Total", value: formatCurrency(order.totalAmount) },
            { label: "Subtotal", value: formatCurrency(order.subtotalAmount) },
            { label: "Shipping", value: formatCurrency(order.shippingAmount) },
            { label: "Discount", value: formatCurrency(order.discountAmount) },
            { label: "Status", value: order.status },
            { label: "Payment", value: order.paymentStatus },
            { label: "Items", value: String(order.items.length) },
            { label: "Returns", value: String(order.returnRequests.length) },
          ]} />
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="customer">
        <SectionCard compact title="Customer & delivery">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <AdminDetailTile label="Customer" value={order.customerName} />
            <AdminDetailTile label="Email" value={order.customerEmail} />
            <AdminDetailTile label="Phone" value={order.customerPhoneNumber ?? "—"} />
            <AdminDetailTile label="Delivery method" value={order.deliveryMethodLabel} />
            <AdminDetailTile label="Tracking ETA" value={order.trackingEta ?? "—"} />
            <AdminDetailTile label="Delivery name" value={order.addressFullName} />
            <AdminDetailTile label="Delivery phone" value={order.addressPhone} />
            <AdminDetailTile label="Address" value={`${order.addressStreet}, ${order.addressCity}, ${order.addressRegion}`} />
          </div>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="items">
        <SectionCard compact title="Line items" bodyClassName="p-0">
          <DataTable
            compact
            columns={[
              { key: "item", header: "Product", render: (item) => (
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={resolveAdminMediaUrl(item.imageUrl) ?? undefined}
                      alt=""
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : null}
                  <div><p className="font-medium">{item.title}</p><p className="text-xs text-textMuted">Qty {item.quantity}</p></div>
                </div>
              )},
              { key: "price", header: "Unit", render: (item) => formatCurrency(item.unitPrice) },
              { key: "total", header: "Line total", className: "text-right", render: (item) => formatCurrency(item.lineTotal) },
            ]}
            data={order.items}
            keyExtractor={(item) => item.id}
          />
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="payment">
        <SectionCard compact title="Payment details">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <AdminDetailTile label="Provider" value={order.paymentProvider} />
            <AdminDetailTile label="Method" value={order.paymentLabel} />
            <AdminDetailTile label="Reference" value={order.paymentReference ?? "—"} />
            <AdminDetailTile label="Paid at" value={order.paidAt ? formatDateTime(order.paidAt) : "—"} />
            <AdminDetailTile label="Voucher" value={order.voucherCode ?? "None"} />
            <AdminDetailTile label="Cancelled" value={order.cancelledAt ? formatDateTime(order.cancelledAt) : "—"} />
          </div>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="returns">
        <SectionCard compact title="Return requests">
          {order.returnRequests.length === 0 ? (
            <p className="text-sm text-textMuted">No return requests for this order.</p>
          ) : (
            order.returnRequests.map((request) => (
              <div key={request.id} className="mb-2 rounded-xl border border-white/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{request.productTitle}</p>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-1 text-xs text-textMuted">{request.reason}</p>
              </div>
            ))
          )}
        </SectionCard>
      </AdminTabPanel>
    </div>
  );
}
