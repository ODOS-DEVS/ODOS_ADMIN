import { Bike, Clock3, CreditCard, MapPin, Package2, ShoppingCart, UserRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getOrder, getOrdersPage, updateOrderStatus } from "@/api/ordersApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { AdminFullHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import {
  OrderAmountCell,
  OrdersDirectorySkeleton,
  OrderSummaryCell,
  OrderTableActions,
} from "@/components/orders/OrdersDirectoryUi";
import { DetailField, DetailFields, DetailHero, DetailSection, DetailStack } from "@/components/ui/DetailList";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { FormField } from "@/components/ui/FormField";
import { TABLE_ACTIONS_COLUMN_CLASS_WIDE } from "@/components/ui/IconButton";
import { ListToolbar, ListToolbarField } from "@/components/ui/ListToolbar";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { AdminOrderDetail, Order, OrderStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { formatPaginationRange } from "@/utils/paginationUi";
import { resolveAdminMediaUrl } from "@/utils/media";

const TOOLBAR_CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm shadow-sm";

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
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getOrdersPage,
    getId: (order) => order.id,
  });
  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
  } = useQueueSearchParams({
    statusValues: [
      "pending",
      "confirmed",
      "processing",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ],
  });
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrderSummary, setSelectedOrderSummary] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>("pending");
  const [overrideNote, setOverrideNote] = useState("");
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

  const snapshot = useMemo(() => {
    const pending = orders.filter((order) => order.status === "pending").length;
    const unpaid = orders.filter((order) => order.paymentStatus === "pending").length;
    return { total: orders.length, pending, unpaid };
  }, [orders]);

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredOrders.length })}${
    hasMore ? " · more pages available" : ""
  }`;

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
      const updated = await updateOrderStatus(
        token,
        editingOrder.id,
        pendingStatus,
        overrideNote.trim() || undefined,
      );
      replaceItem(updated);
      showToast({
        title: "Order updated",
        description: `${editingOrder.orderNumber} is now ${pendingStatus}.`,
        tone: "success",
      });
      setEditingOrder(null);
      setOverrideNote("");
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

  if (isLoading && orders.length === 0) {
    return <OrdersDirectorySkeleton />;
  }

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Orders"
        title="Order list"
        description={`${snapshot.total} loaded · ${snapshot.pending} pending fulfillment · search, filter, and update status.`}
        backRoute="/orders"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <HeaderActionButton
            variant="secondary"
            leftIcon={<Bike className="size-4" />}
            onClick={() => navigate("/orders/delivery-ops")}
          >
            Delivery Ops
          </HeaderActionButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="On this page" value={String(snapshot.total)} icon={ShoppingCart} animationDelay={40} />
        <StatCard
          label="Pending"
          value={String(snapshot.pending)}
          hint="Awaiting fulfillment"
          icon={Clock3}
          tone="warning"
          animationDelay={80}
        />
        <StatCard
          label="Unpaid"
          value={String(snapshot.unpaid)}
          icon={CreditCard}
          animationDelay={120}
        />
      </div>

      <SectionCard
        compact
        title="All orders"
        action={
          <ListToolbar>
            <ListToolbarField className="sm:min-w-[16rem]">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order # or customer"
                className={`${TOOLBAR_CONTROL_CLASS} py-0`}
              />
            </ListToolbarField>
            <ListToolbarField className="sm:min-w-[11rem]">
              <FilterSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[{ label: "All statuses", value: "all" }].concat(
                  orderStatusOptions.map((option) => ({ label: option.label, value: option.value })),
                )}
                className={`${TOOLBAR_CONTROL_CLASS} outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10`}
              />
            </ListToolbarField>
            <ListToolbarField className="sm:min-w-[11rem]">
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
                className={`${TOOLBAR_CONTROL_CLASS} outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10`}
              />
            </ListToolbarField>
          </ListToolbar>
        }
        bodyClassName="p-0"
      >
        <AdminInfiniteList
          compact
          listSummary={listSummary}
          columns={[
            {
              key: "order",
              header: "Order",
              className: "min-w-[140px]",
              render: (order) => <OrderSummaryCell order={order} />,
            },
            {
              key: "store",
              header: "Store",
              className: "min-w-[120px] max-w-[200px]",
              render: (order) => (
                <p className="truncate text-sm text-textStrong">{order.storeName}</p>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              className: "whitespace-nowrap",
              render: (order) => <OrderAmountCell order={order} />,
            },
            {
              key: "status",
              header: "Status",
              className: "w-[8.5rem]",
              render: (order) => (
                <div className="flex flex-wrap gap-1">
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.paymentStatus} />
                </div>
              ),
            },
            {
              key: "created",
              header: "Created",
              className: "min-w-[9rem] whitespace-nowrap text-sm text-textMuted",
              render: (order) => formatDateTime(order.createdAt),
            },
            {
              key: "actions",
              header: "Actions",
              className: TABLE_ACTIONS_COLUMN_CLASS_WIDE,
              render: (order) => (
                <OrderTableActions
                  onQuickView={() => void handleViewOrder(order)}
                  onOpenDetail={() => navigate(`/orders/full/${order.id}`)}
                  onUpdateStatus={() => {
                    setEditingOrder(order);
                    setPendingStatus(order.status);
                  }}
                />
              ),
            },
          ]}
          data={filteredOrders}
          keyExtractor={(order) => order.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={isLoadingPage}
          hasMore={hasMore}
          error={error}
          onPageChange={goToPage}
          onRetry={() => void refresh()}
          emptyTitle="No orders found"
          emptyDescription="Clear filters or try another search."
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
          <LoadingState size="sm" label="Loading order details..." />
        ) : orderDetailError ? (
          <ErrorState
            description={orderDetailError}
            onRetry={() => selectedOrderSummary && void handleViewOrder(selectedOrderSummary)}
          />
        ) : selectedOrder ? (
          <DetailStack>
            <DetailHero
              title={selectedOrder.orderNumber}
              meta={`${selectedOrder.storeName} · ${formatDateTime(selectedOrder.placedAt)}`}
              badges={
                <>
                  <StatusBadge status={selectedOrder.status} />
                  <StatusBadge status={selectedOrder.paymentStatus} />
                </>
              }
            >
              <DetailFields columns={3}>
                <DetailField emphasize label="Total" value={formatCurrency(selectedOrder.totalAmount)} />
                <DetailField label="Shipping" value={formatCurrency(selectedOrder.shippingAmount)} />
                <DetailField label="Discount" value={formatCurrency(selectedOrder.discountAmount)} />
              </DetailFields>
            </DetailHero>

            <div className="grid gap-8 xl:grid-cols-2">
              <DetailSection title="Customer">
                <DetailFields columns={2}>
                  <DetailField label="Customer name" value={selectedOrder.customerName} />
                  <DetailField label="Email" value={selectedOrder.customerEmail} />
                  <DetailField
                    label="Account phone"
                    value={selectedOrder.customerPhoneNumber ?? "Not provided"}
                  />
                  <DetailField label="Delivery phone" value={selectedOrder.addressPhone} />
                </DetailFields>
              </DetailSection>

              <DetailSection title="Order state">
                <DetailFields columns={2}>
                  <DetailField label="Store-facing status" value={selectedOrder.status} />
                  <DetailField label="Internal status" value={selectedOrder.internalStatus} />
                  <DetailField label="Vendor status" value={selectedOrder.vendorStatus} />
                  <DetailField label="Source" value={selectedOrder.source} />
                  <DetailField label="Created" value={formatDateTime(selectedOrder.createdAt)} />
                  <DetailField label="Updated" value={formatDateTime(selectedOrder.updatedAt)} />
                  <DetailField
                    label="Delivered"
                    value={
                      selectedOrder.deliveredAt
                        ? formatDateTime(selectedOrder.deliveredAt)
                        : "Not delivered"
                    }
                  />
                  <DetailField
                    label="Cancelled"
                    value={
                      selectedOrder.cancelledAt
                        ? formatDateTime(selectedOrder.cancelledAt)
                        : "Not cancelled"
                    }
                  />
                </DetailFields>
              </DetailSection>
            </div>

            <DetailSection title="Delivery address">
              <DetailFields columns={2}>
                <DetailField label="Recipient" value={selectedOrder.addressFullName} />
                <DetailField label="Phone" value={selectedOrder.addressPhone} />
                <DetailField
                  label="Address"
                  value={`${selectedOrder.addressStreet}, ${selectedOrder.addressCity}, ${selectedOrder.addressRegion}`}
                  className="sm:col-span-2"
                />
                <DetailField label="ETA" value={selectedOrder.trackingEta ?? "No ETA set"} />
                <DetailField
                  label="Progress"
                  value={
                    selectedOrder.progress !== null && selectedOrder.progress !== undefined
                      ? `${Math.round(selectedOrder.progress)}%`
                      : "Not tracked"
                  }
                />
              </DetailFields>
            </DetailSection>

            <div className="grid gap-8 xl:grid-cols-2">
              <DetailSection title="Payment">
                <DetailFields columns={2}>
                  <DetailField label="Payment status" value={selectedOrder.paymentStatus} />
                  <DetailField label="Payment type" value={selectedOrder.paymentType} />
                  <DetailField label="Provider" value={selectedOrder.paymentProvider} />
                  <DetailField label="Payment label" value={selectedOrder.paymentLabel} />
                  <DetailField
                    label="Reference"
                    value={selectedOrder.paymentReference ?? "Not provided"}
                  />
                  <DetailField
                    label="Network / phone"
                    value={
                      [selectedOrder.paymentNetwork, selectedOrder.paymentPhone]
                        .filter(Boolean)
                        .join(" · ") || "Not provided"
                    }
                  />
                  <DetailField
                    label="Card last 4"
                    value={selectedOrder.paymentLast4 ? `•••• ${selectedOrder.paymentLast4}` : "Not provided"}
                  />
                </DetailFields>
              </DetailSection>

              <DetailSection title="Voucher">
                <DetailFields columns={2}>
                  <DetailField label="Voucher code" value={selectedOrder.voucherCode ?? "No voucher"} />
                  <DetailField
                    label="Voucher title"
                    value={selectedOrder.voucherTitle ?? "No voucher"}
                  />
                  <DetailField label="Subtotal" value={formatCurrency(selectedOrder.subtotalAmount)} />
                  <DetailField label="Discount" value={formatCurrency(selectedOrder.discountAmount)} />
                </DetailFields>
              </DetailSection>
            </div>

            {selectedOrder.cancellationReason ? (
              <DetailSection title="Cancellation note">
                <DetailFields>
                  <DetailField label="Reason" value={selectedOrder.cancellationReason} />
                </DetailFields>
              </DetailSection>
            ) : null}

            {selectedOrder.returnRequests.length > 0 ? (
              <DetailSection title="Return requests">
                <ul className="divide-y divide-line/80">
                  {selectedOrder.returnRequests.map((request) => (
                    <li key={request.id} className="space-y-3 py-5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-textStrong">{request.productTitle}</p>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="text-xs text-textMuted">{formatDateTime(request.createdAt)}</p>
                      </div>
                      <p className="text-sm text-textMuted">
                        {request.requestType} · Qty {request.quantity} · {request.reason}
                      </p>
                      {request.details ? (
                        <p className="text-sm text-textMuted">{request.details}</p>
                      ) : null}
                      {request.evidenceImageUrls?.length ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {request.evidenceImageUrls.map((imageUrl, index) => (
                            <a
                              key={`${request.id}-${index}`}
                              href={resolveAdminMediaUrl(imageUrl) ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={resolveAdminMediaUrl(imageUrl) ?? undefined}
                                alt={`Return evidence ${index + 1}`}
                                className="size-20 rounded-lg object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <DetailFields columns={2}>
                        <DetailField
                          label="Refund amount"
                          value={
                            request.refundAmount !== null && request.refundAmount !== undefined
                              ? formatCurrency(request.refundAmount)
                              : "Not set"
                          }
                        />
                        <DetailField label="Admin note" value={request.adminNote || "No admin note yet"} />
                      </DetailFields>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}

            <DetailSection title="Ordered items">
              <ul className="divide-y divide-line/80">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surfaceMuted">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-textMuted">
                          <Package2 className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-textStrong">{item.title}</p>
                          <p className="text-sm text-textMuted">
                            {item.category ?? "Uncategorised"} · Qty {item.quantity}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold tabular-nums text-textStrong">
                            {formatCurrency(item.lineTotal)}
                          </p>
                          <p className="text-xs text-textMuted">{formatCurrency(item.unitPrice)} each</p>
                        </div>
                      </div>
                      <DetailFields columns={2} className="mt-3">
                        <DetailField
                          label="Variant"
                          value={
                            [item.selectedColor, item.selectedSize].filter(Boolean).join(" · ") ||
                            "—"
                          }
                        />
                        <DetailField label="Product ID" value={item.productId} />
                      </DetailFields>
                    </div>
                  </li>
                ))}
              </ul>
            </DetailSection>
          </DetailStack>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editingOrder)}
        onClose={() => {
          if (!actionLoading) {
            setEditingOrder(null);
            setOverrideNote("");
          }
        }}
        title={editingOrder ? `Update ${editingOrder.orderNumber}` : "Update order"}
        description="Set the current fulfillment stage for this order."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditingOrder(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleStatusUpdate()}
              isLoading={actionLoading}
              disabled={pendingStatus === "delivered" && !overrideNote.trim()}
            >
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
          {pendingStatus === "delivered" ? (
            <FormField
              label="Override reason"
              required
              helper="The customer normally confirms delivery themselves (or it auto-releases after 48h) — explain why you're force-completing it here instead."
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
        </div>
      </Modal>
    </div>
  );
}
