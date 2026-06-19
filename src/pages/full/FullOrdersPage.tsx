import { CreditCard, Edit3, Eye, MapPin, Package2, UserRound } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { getOrder, getOrdersPage, updateOrderStatus } from "@/api/ordersApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { AdminOrderDetail, Order, OrderStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { resolveAdminMediaUrl } from "@/utils/media";

function OrderDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-textStrong">{title}</h3>
        {description ? <p className="mt-1 text-xs text-textMuted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

const orderStatusOptions: Array<{ label: string; value: OrderStatus }> = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Ready", value: "ready" },
  { label: "Out for delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export function FullOrdersPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: orders,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getOrdersPage,
    getId: (order) => order.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrderSummary, setSelectedOrderSummary] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>("pending");
  const [actionLoading, setActionLoading] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const haystack = [order.orderNumber, order.customerName, order.storeName]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      const matchesPayment = paymentFilter === "all" ? true : order.paymentStatus === paymentFilter;
      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [orders, paymentFilter, query, statusFilter]);

  const handleViewOrder = useCallback(
    async (order: Order) => {
      if (!token) return;
      setSelectedOrderSummary(order);
      setSelectedOrder(null);
      setOrderDetailError(null);
      setIsDetailLoading(true);
      try {
        const detail = await getOrder(token, order.id);
        setSelectedOrder(detail);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load order details.";
        setOrderDetailError(message);
        showToast({
          title: "Unable to load order",
          description: message,
          tone: "error",
        });
      } finally {
        setIsDetailLoading(false);
      }
    },
    [showToast, token],
  );

  async function handleStatusUpdate() {
    if (!token || !editingOrder) return;
    setActionLoading(true);
    try {
      const updated = await updateOrderStatus(token, editingOrder.id, pendingStatus);
      replaceItem(updated);
      showToast({
        title: "Order updated",
        description: `${editingOrder.orderNumber} is now ${pendingStatus}.`,
        tone: "success",
      });
      setEditingOrder(null);
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

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Orders"
        title="Complete order directory"
        description="Search, filter, update status, and open any order for the full dossier."
        backRoute="/orders"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <SectionCard
        title="Orders"
        description="Search by order number or customer, then filter by operational and payment states."
        action={
          <div className="flex flex-col gap-3 xl:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order number or customer"
              className="xl:w-80"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[{ label: "All statuses", value: "all" }].concat(
                orderStatusOptions.map((option) => ({ label: option.label, value: option.value })),
              )}
            />
            <FilterSelect
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              options={[
                { label: "All payments", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Paid", value: "paid" },
                { label: "Failed", value: "failed" },
                { label: "Partially refunded", value: "partially_refunded" },
                { label: "Refunded", value: "refunded" },
              ]}
            />
          </div>
        }
      >
        <AdminInfiniteList
          columns={[
            {
              key: "order",
              header: "Order",
              render: (order) => (
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-textMuted">{order.customerName}</p>
                </div>
              ),
            },
            {
              key: "store",
              header: "Store",
              render: (order) => order.storeName,
            },
            {
              key: "amount",
              header: "Amount",
              render: (order) => formatCurrency(order.totalAmount),
            },
            {
              key: "status",
              header: "Status",
              render: (order) => (
                <div className="flex flex-col gap-2">
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.paymentStatus} />
                </div>
              ),
            },
            {
              key: "created",
              header: "Created",
              render: (order) => formatDateTime(order.createdAt),
            },
            {
              key: "actions",
              header: "Actions",
              render: (order) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/orders/full/${order.id}`)}
                  >
                    Open dossier
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<Eye className="size-4" />}
                    onClick={() => void handleViewOrder(order)}
                  >
                    View
                  </Button>
                  <Button
                    leftIcon={<Edit3 className="size-4" />}
                    onClick={() => {
                      setEditingOrder(order);
                      setPendingStatus(order.status);
                    }}
                  >
                    Update status
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredOrders}
          keyExtractor={(order) => order.id}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={() => void loadMore()}
          onRetry={() => void refresh()}
          emptyTitle="No orders found"
          emptyDescription="Clear the filters or search for a different order reference."
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedOrderSummary)}
        onClose={() => {
          setSelectedOrderSummary(null);
          setSelectedOrder(null);
          setOrderDetailError(null);
          setIsDetailLoading(false);
        }}
        title={selectedOrder?.orderNumber ?? selectedOrderSummary?.orderNumber ?? "Order details"}
        description="Customer, items, delivery, payment, and voucher details for this order."
        size="xl"
      >
        {isDetailLoading ? (
          <LoadingState label="Loading order details..." />
        ) : orderDetailError ? (
          <ErrorState
            description={orderDetailError}
            onRetry={() => selectedOrderSummary && void handleViewOrder(selectedOrderSummary)}
          />
        ) : selectedOrder ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/30 p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-semibold text-textStrong">
                      {selectedOrder.orderNumber}
                    </h3>
                    <StatusBadge status={selectedOrder.status} />
                    <StatusBadge status={selectedOrder.paymentStatus} />
                  </div>
                  <p className="mt-3 text-sm text-textMuted">
                    {selectedOrder.storeName} · placed {formatDateTime(selectedOrder.placedAt)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <OrderDetailRow
                    label="Total"
                    value={formatCurrency(selectedOrder.totalAmount)}
                  />
                  <OrderDetailRow
                    label="Shipping"
                    value={formatCurrency(selectedOrder.shippingAmount)}
                  />
                  <OrderDetailRow
                    label="Discount"
                    value={formatCurrency(selectedOrder.discountAmount)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <DetailSection title="Customer" description="The account and delivery contact tied to this order.">
                <div className="grid gap-4 md:grid-cols-2">
                  <OrderDetailRow label="Customer name" value={selectedOrder.customerName} />
                  <OrderDetailRow label="Email" value={selectedOrder.customerEmail} />
                  <OrderDetailRow
                    label="Account phone"
                    value={selectedOrder.customerPhoneNumber ?? "Not provided"}
                  />
                  <OrderDetailRow label="Delivery phone" value={selectedOrder.addressPhone} />
                </div>
              </DetailSection>

              <DetailSection title="Order state" description="Operational status and lifecycle timestamps.">
                <div className="grid gap-4 md:grid-cols-2">
                  <OrderDetailRow label="Store-facing status" value={selectedOrder.status} />
                  <OrderDetailRow label="Internal status" value={selectedOrder.internalStatus} />
                  <OrderDetailRow label="Vendor status" value={selectedOrder.vendorStatus} />
                  <OrderDetailRow label="Source" value={selectedOrder.source} />
                  <OrderDetailRow label="Created" value={formatDateTime(selectedOrder.createdAt)} />
                  <OrderDetailRow label="Updated" value={formatDateTime(selectedOrder.updatedAt)} />
                  <OrderDetailRow
                    label="Delivered"
                    value={
                      selectedOrder.deliveredAt
                        ? formatDateTime(selectedOrder.deliveredAt)
                        : "Not delivered"
                    }
                  />
                  <OrderDetailRow
                    label="Cancelled"
                    value={
                      selectedOrder.cancelledAt
                        ? formatDateTime(selectedOrder.cancelledAt)
                        : "Not cancelled"
                    }
                  />
                </div>
              </DetailSection>
            </div>

            <DetailSection title="Delivery address" description="The exact address snapshot saved on the order at checkout.">
              <div className="grid gap-4 md:grid-cols-2">
                <OrderDetailRow label="Recipient" value={selectedOrder.addressFullName} />
                <OrderDetailRow label="Phone" value={selectedOrder.addressPhone} />
                <div className="md:col-span-2">
                  <OrderDetailRow
                    label="Address"
                    value={`${selectedOrder.addressStreet}, ${selectedOrder.addressCity}, ${selectedOrder.addressRegion}`}
                  />
                </div>
                <OrderDetailRow
                  label="ETA"
                  value={selectedOrder.trackingEta ?? "No ETA set"}
                />
                <OrderDetailRow
                  label="Progress"
                  value={
                    selectedOrder.progress !== null && selectedOrder.progress !== undefined
                      ? `${Math.round(selectedOrder.progress)}%`
                      : "Not tracked"
                  }
                />
              </div>
            </DetailSection>

            <div className="grid gap-6 xl:grid-cols-2">
              <DetailSection title="Payment" description="The payment method snapshot used for this order.">
                <div className="grid gap-4 md:grid-cols-2">
                  <OrderDetailRow label="Payment status" value={selectedOrder.paymentStatus} />
                  <OrderDetailRow label="Payment type" value={selectedOrder.paymentType} />
                  <OrderDetailRow label="Provider" value={selectedOrder.paymentProvider} />
                  <OrderDetailRow label="Payment label" value={selectedOrder.paymentLabel} />
                  <OrderDetailRow
                    label="Reference"
                    value={selectedOrder.paymentReference ?? "Not provided"}
                  />
                  <OrderDetailRow
                    label="Network / phone"
                    value={
                      [selectedOrder.paymentNetwork, selectedOrder.paymentPhone]
                        .filter(Boolean)
                        .join(" · ") || "Not provided"
                    }
                  />
                  <OrderDetailRow
                    label="Card last 4"
                    value={selectedOrder.paymentLast4 ? `•••• ${selectedOrder.paymentLast4}` : "Not provided"}
                  />
                </div>
              </DetailSection>

              <DetailSection title="Voucher" description="Any applied promotion or discount on this order.">
                <div className="grid gap-4 md:grid-cols-2">
                  <OrderDetailRow label="Voucher code" value={selectedOrder.voucherCode ?? "No voucher"} />
                  <OrderDetailRow
                    label="Voucher title"
                    value={selectedOrder.voucherTitle ?? "No voucher"}
                  />
                  <OrderDetailRow
                    label="Subtotal"
                    value={formatCurrency(selectedOrder.subtotalAmount)}
                  />
                  <OrderDetailRow
                    label="Discount"
                    value={formatCurrency(selectedOrder.discountAmount)}
                  />
                </div>
              </DetailSection>
            </div>

            {selectedOrder.cancellationReason ? (
              <DetailSection title="Cancellation note">
                <OrderDetailRow
                  label="Reason"
                  value={selectedOrder.cancellationReason}
                />
              </DetailSection>
            ) : null}

            {selectedOrder.returnRequests.length > 0 ? (
              <DetailSection
                title="Return requests"
                description="Every return, refund, or exchange case that has been opened against this order."
              >
                <div className="space-y-4">
                  {selectedOrder.returnRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-3xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-textStrong">
                              {request.productTitle}
                            </p>
                            <StatusBadge status={request.status} />
                          </div>
                          <p className="mt-2 text-sm text-textMuted">
                            {request.requestType} · Qty {request.quantity} · {request.reason}
                          </p>
                        </div>
                        <div className="text-sm text-textMuted">
                          {formatDateTime(request.createdAt)}
                        </div>
                      </div>

                      {request.details ? (
                        <p className="mt-3 text-sm leading-6 text-textMuted">{request.details}</p>
                      ) : null}

                      {request.evidenceImageUrls?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {request.evidenceImageUrls.map((imageUrl, index) => (
                            <a
                              key={`${request.id}-${index}`}
                              href={resolveAdminMediaUrl(imageUrl) ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
                            >
                              <img
                                src={resolveAdminMediaUrl(imageUrl) ?? undefined}
                                alt={`Return evidence ${index + 1}`}
                                className="h-36 w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <OrderDetailRow
                          label="Refund amount"
                          value={
                            request.refundAmount !== null && request.refundAmount !== undefined
                              ? formatCurrency(request.refundAmount)
                              : "Not set"
                          }
                        />
                        <OrderDetailRow
                          label="Admin note"
                          value={request.adminNote || "No admin note yet"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            <DetailSection title="Ordered items" description="Every line item captured when the order was placed.">
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-textMuted">
                            <Package2 className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-base font-semibold text-textStrong">{item.title}</p>
                            <p className="mt-1 text-sm text-textMuted">
                              {item.category ?? "Uncategorised"} · Qty {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-textStrong">
                              {formatCurrency(item.lineTotal)}
                            </p>
                            <p className="mt-1 text-xs text-textMuted">
                              {formatCurrency(item.unitPrice)} each
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <OrderDetailRow
                            label="Colour / size"
                            value={
                              [item.selectedColor, item.selectedSize].filter(Boolean).join(" · ") ||
                              "No variant selected"
                            }
                          />
                          <OrderDetailRow label="Product ID" value={item.productId} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editingOrder)}
        onClose={() => {
          if (!actionLoading) {
            setEditingOrder(null);
          }
        }}
        title={editingOrder ? `Update ${editingOrder.orderNumber}` : "Update order"}
        description="Set the current fulfillment stage for this order."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditingOrder(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleStatusUpdate()} isLoading={actionLoading}>
              Save status
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-textStrong">Order status</label>
          <select
            className="app-select"
            value={pendingStatus}
            onChange={(event) => setPendingStatus(event.target.value as OrderStatus)}
          >
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-panel">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
