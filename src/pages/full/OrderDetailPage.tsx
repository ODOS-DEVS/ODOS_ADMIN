import { useEffect, useState } from "react";
import { Ticket, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AdminDetailHeader,
  AdminDetailTile,
  AdminKpiGrid,
  AdminPageSkeleton,
  AdminTabNav,
  AdminTabPanel,
  HeaderActionButton,
} from "@/components/admin/AdminShell";
import { EntityTimeline, RelatedRecordsCard } from "@/components/admin/EntityOps";
import { getOrder, updateOrderStatus } from "@/api/ordersApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailFields, DetailStack } from "@/components/ui/DetailList";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { FormField } from "@/components/ui/FormField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useTabSection } from "@/hooks/useTabSection";
import { useToast } from "@/hooks/useToast";
import type { OrderStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { resolveAdminMediaUrl } from "@/utils/media";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "customer", label: "Customer" },
  { id: "items", label: "Items" },
  { id: "payment", label: "Payment" },
  { id: "delivery", label: "Delivery" },
  { id: "returns", label: "Returns" },
  { id: "actions", label: "Actions" },
  { id: "relationships", label: "Relationships" },
  { id: "timeline", label: "Timeline" },
] as const;

const DELIVERY_EVENT_LABELS: Record<string, string> = {
  DISPATCHED: "Dispatched",
  REDISPATCHED: "Redispatched",
  CUSTOMER_CONFIRMED: "Customer confirmed delivery",
  CUSTOMER_REPORTED_PROBLEM: "Customer reported a problem",
  RESCHEDULED: "Reschedule requested",
  AUTO_RELEASE_REMINDER: "Auto-release reminder sent",
  AUTO_RELEASED: "Auto-released (no customer response)",
  ADMIN_OVERRIDE: "Admin override",
};

function formatDeliveryEventLabel(eventType: string | undefined, status: string) {
  if (eventType && DELIVERY_EVENT_LABELS[eventType]) {
    return DELIVERY_EVENT_LABELS[eventType];
  }
  return status.replace(/_/g, " ");
}

export function OrderDetailPage() {
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { orderId = "" } = useParams();
  const { record: order, isLoading, isRefreshing, error, reload, setRecord } = useRecordDetail({
    id: orderId,
    loadDetail: getOrder,
  });
  const { activeSection, setActiveSection } = useTabSection<(typeof TABS)[number]["id"]>("overview");
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>("pending");
  const [overrideNote, setOverrideNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (order) setPendingStatus(order.status);
  }, [order]);

  // The backend always requires a reason to force-complete delivery from
  // here — the customer normally confirms it themselves — regardless of
  // whether the order was already out for delivery.
  const requiresOverrideReason = pendingStatus === "delivered";

  async function handleStatusUpdate() {
    if (!token || !order) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(token, order.id, pendingStatus, overrideNote.trim() || undefined);
      const refreshed = await getOrder(token, order.id);
      setRecord(refreshed);
      setOverrideNote("");
      showToast({
        title: "Order status updated",
        description: `${refreshed.orderNumber} is now ${refreshed.status}.`,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to update order",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) return <AdminPageSkeleton blocks={2} />;
  if (error || !order) {
    return <ErrorState description={error ?? "Order not found."} onRetry={() => void reload()} />;
  }

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
          <>
            <HeaderActionButton
              variant="secondary"
              leftIcon={<UserRound className="size-4" />}
              onClick={() => navigate(`/users/full/${order.customerId}`)}
            >
              Customer
            </HeaderActionButton>
            {order.voucherId ? (
              <HeaderActionButton
                variant="secondary"
                leftIcon={<Ticket className="size-4" />}
                onClick={() => navigate(`/vouchers/full/${order.voucherId}`)}
              >
                Voucher
              </HeaderActionButton>
            ) : null}
          </>
        }
      />
      <AdminTabNav
        sections={[...TABS]}
        activeId={activeSection}
        onSelect={(id) => setActiveSection(id as (typeof TABS)[number]["id"])}
      />
      <AdminTabPanel activeSection={activeSection} sectionId="overview">
        <SectionCard compact title="Order snapshot">
          <DetailStack className="gap-6">
          <AdminKpiGrid
            items={[
              { label: "Total", value: formatCurrency(order.totalAmount) },
              { label: "Subtotal", value: formatCurrency(order.subtotalAmount) },
              { label: "Shipping", value: formatCurrency(order.shippingAmount) },
              { label: "Discount", value: formatCurrency(order.discountAmount) },
              { label: "Status", value: order.status },
              { label: "Payment", value: order.paymentStatus },
              { label: "Items", value: String(order.items.length) },
              { label: "Returns", value: String(order.returnRequests.length) },
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={String(order.vendorStatus)} />
            <StatusBadge status={order.deliveryStatus} />
            <StatusBadge status={order.settlementStatus} />
          </div>
          <DetailFields columns={2} className="mt-4">
            <AdminDetailTile label="Source" value={order.source} />
            <AdminDetailTile label="Internal status" value={order.internalStatus} />
            <AdminDetailTile
              label="Progress"
              value={order.progress != null ? `${order.progress}%` : "—"}
            />
            <AdminDetailTile
              label="Delivered"
              value={order.deliveredAt ? formatDateTime(order.deliveredAt) : "—"}
            />
            <AdminDetailTile
              label="Refunded"
              value={order.refundedAt ? formatDateTime(order.refundedAt) : "—"}
            />
            <AdminDetailTile label="Cancellation reason" value={order.cancellationReason ?? "—"} />
          </DetailFields>
          </DetailStack>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="customer">
        <SectionCard compact title="Customer & delivery">
          <DetailFields columns={2}>
            <AdminDetailTile label="Customer" value={order.customerName} />
            <AdminDetailTile label="Email" value={order.customerEmail} />
            <AdminDetailTile label="Phone" value={order.customerPhoneNumber ?? "—"} />
            <AdminDetailTile label="Delivery method" value={order.deliveryMethodLabel} />
            <AdminDetailTile label="Tracking ETA" value={order.trackingEta ?? "—"} />
            <AdminDetailTile label="Delivery name" value={order.addressFullName} />
            <AdminDetailTile label="Delivery phone" value={order.addressPhone} />
            <AdminDetailTile
              label="Address"
              value={`${order.addressStreet}, ${order.addressCity}, ${order.addressRegion}`}
            />
          </DetailFields>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="items">
        <SectionCard compact title="Line items" bodyClassName="p-0">
          <DataTable
            compact
            columns={[
              {
                key: "item",
                header: "Product",
                render: (item) => (
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left"
                    onClick={() => navigate(`/products/full/${item.productId}`)}
                  >
                    {item.imageUrl ? (
                      <img
                        src={resolveAdminMediaUrl(item.imageUrl) ?? undefined}
                        alt=""
                        className="size-10 rounded-lg object-cover"
                      />
                    ) : null}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-textMuted">
                        Qty {item.quantity}
                        {item.selectedColor ? ` · ${item.selectedColor}` : ""}
                        {item.selectedSize ? ` · ${item.selectedSize}` : ""}
                      </p>
                    </div>
                  </button>
                ),
              },
              { key: "price", header: "Unit", render: (item) => formatCurrency(item.unitPrice) },
              {
                key: "total",
                header: "Line total",
                className: "text-right",
                render: (item) => formatCurrency(item.lineTotal),
              },
            ]}
            data={order.items}
            keyExtractor={(item) => item.id}
          />
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="payment">
        <SectionCard compact title="Payment details">
          <DetailFields columns={2}>
            <AdminDetailTile label="Provider" value={order.paymentProvider} />
            <AdminDetailTile label="Method" value={order.paymentLabel} />
            <AdminDetailTile label="Reference" value={order.paymentReference ?? "—"} />
            <AdminDetailTile label="Network" value={order.paymentNetwork ?? "—"} />
            <AdminDetailTile label="Phone" value={order.paymentPhone ?? "—"} />
            <AdminDetailTile label="Last 4" value={order.paymentLast4 ?? "—"} />
            <AdminDetailTile
              label="Paid at"
              value={order.paidAt ? formatDateTime(order.paidAt) : "—"}
            />
            <AdminDetailTile
              label="Voucher"
              value={
                order.voucherCode
                  ? `${order.voucherCode}${order.voucherTitle ? ` · ${order.voucherTitle}` : ""}`
                  : "None"
              }
            />
            <AdminDetailTile
              label="Cancelled"
              value={order.cancelledAt ? formatDateTime(order.cancelledAt) : "—"}
            />
          </DetailFields>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="delivery">
        <SectionCard compact title="Delivery & settlement">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.deliveryStatus} />
            <StatusBadge status={order.settlementStatus} />
          </div>
          <DetailFields columns={2} className="mt-4">
            <AdminDetailTile
              label="Dispatched at"
              value={order.dispatchedAt ? formatDateTime(order.dispatchedAt) : "—"}
            />
            <AdminDetailTile
              label="Auto-release scheduled"
              value={order.autoReleaseAt ? formatDateTime(order.autoReleaseAt) : "—"}
            />
            <AdminDetailTile
              label="Completion method"
              value={order.confirmationMethod ? order.confirmationMethod.replace(/_/g, " ") : "—"}
            />
            <AdminDetailTile
              label="Delivered at"
              value={order.deliveredAt ? formatDateTime(order.deliveredAt) : "—"}
            />
            <AdminDetailTile
              label="Problem reported at"
              value={order.deliveryProblemReportedAt ? formatDateTime(order.deliveryProblemReportedAt) : "—"}
            />
            <AdminDetailTile label="Problem reason" value={order.deliveryProblemReason ?? "—"} />
          </DetailFields>
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-textStrong">Delivery timeline</p>
            {order.timeline.length === 0 ? (
              <p className="text-sm text-textMuted">No delivery events recorded yet.</p>
            ) : (
              <ol className="space-y-3 border-l border-line pl-4">
                {[...order.timeline].reverse().map((event) => (
                  <li key={event.id}>
                    <p className="text-sm font-medium text-textStrong">
                      {formatDeliveryEventLabel(event.eventMetadata?.event_type, event.status)}
                    </p>
                    <p className="text-xs text-textMuted">
                      {formatDateTime(event.occurredAt)} · {event.actorRole}
                      {event.note ? ` · ${event.note}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="returns">
        <SectionCard compact title="Return requests">
          {order.returnRequests.length === 0 ? (
            <p className="text-sm text-textMuted">No return requests for this order.</p>
          ) : (
            order.returnRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => navigate(`/returns/full/${request.id}`)}
                className="mb-2 w-full rounded-xl border border-line p-3 text-left transition hover:border-accent/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{request.productTitle}</p>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-1 text-xs text-textMuted">{request.reason}</p>
              </button>
            ))
          )}
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="actions">
        <SectionCard
          compact
          title="Administrative actions"
          description="Update fulfillment status without leaving this dossier"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <FilterSelect
                value={pendingStatus}
                onChange={(event) => setPendingStatus(event.target.value as OrderStatus)}
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "Confirmed", value: "confirmed" },
                  { label: "Processing", value: "processing" },
                  { label: "Ready", value: "ready" },
                  { label: "Out for delivery", value: "out_for_delivery" },
                  { label: "Delivered", value: "delivered" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
              />
            </div>
            <Button
              isLoading={actionLoading}
              disabled={requiresOverrideReason && !overrideNote.trim()}
              onClick={() => void handleStatusUpdate()}
            >
              Save status
            </Button>
          </div>
          {requiresOverrideReason ? (
            <FormField
              label="Override reason"
              required
              helper="The customer normally confirms delivery themselves (or it auto-releases after 48h) — explain why you're force-completing it here instead."
              className="mt-3"
            >
              <textarea
                className="app-textarea"
                rows={2}
                value={overrideNote}
                onChange={(event) => setOverrideNote(event.target.value)}
                placeholder="e.g. Customer called support and confirmed receipt over the phone"
              />
            </FormField>
          ) : null}
          <p className="mt-3 text-xs text-textMuted">Current status: {order.status}</p>
        </SectionCard>
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="relationships">
        <RelatedRecordsCard
          title="Related records"
          records={[
            {
              id: order.customerId,
              label: order.customerName,
              meta: order.customerEmail,
              href: `/users/full/${order.customerId}`,
            },
            ...(order.voucherId
              ? [
                  {
                    id: order.voucherId,
                    label: order.voucherCode ?? "Voucher",
                    meta: order.voucherTitle ?? undefined,
                    href: `/vouchers/full/${order.voucherId}`,
                  },
                ]
              : []),
            ...order.items.slice(0, 6).map((item) => ({
              id: item.productId,
              label: item.title,
              meta: "Product",
              href: `/products/full/${item.productId}`,
            })),
            ...order.returnRequests.map((request) => ({
              id: request.id,
              label: `Return · ${request.productTitle}`,
              meta: request.status,
              href: `/returns/full/${request.id}`,
            })),
          ]}
        />
      </AdminTabPanel>
      <AdminTabPanel activeSection={activeSection} sectionId="timeline">
        <EntityTimeline entityType="order" entityId={order.id} actorId={order.customerId} />
      </AdminTabPanel>
    </div>
  );
}
