import {
  Bike,
  Clock3,
  CreditCard,
  Download,
  MapPin,
  Package2,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getKpiMetrics, type AdminKpiMetrics } from "@/api/dashboardApi";
import { getOrder, getOrdersPage, updateOrderStatus } from "@/api/ordersApi";
import { DirectoryFooter } from "@/components/directory/DirectoryFooter";
import { DirectoryTable, type DirectoryColumn, type SortState } from "@/components/directory/DirectoryTable";
import { DirectoryToolbar } from "@/components/directory/DirectoryToolbar";
import { FulfilmentRail } from "@/components/directory/FulfilmentRail";
import { MetricStat } from "@/components/directory/MetricStat";
import { SegmentedTabs, type SegmentedTab } from "@/components/directory/SegmentedTabs";
import { SelectionAction, SelectionBar } from "@/components/directory/SelectionBar";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
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
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { AdminOrderDetail, Order, OrderStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { exportCsv } from "@/utils/exportCsv";
import { formatPaginationRange } from "@/utils/paginationUi";
import { resolveAdminMediaUrl } from "@/utils/media";

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

  const [metrics, setMetrics] = useState<AdminKpiMetrics | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ key: "created", direction: "desc" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // Fails soft: the KPI strip drops its deltas rather than blocking the table.
    void getKpiMetrics(token)
      .then((result) => {
        if (!cancelled) setMetrics(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token]);

  const statusTabs = useMemo<Array<SegmentedTab<string>>>(() => {
    const countFor = (status: string) =>
      orders.filter((order) => order.status === status).length;
    return [
      { value: "all", label: "All", count: orders.length },
      { value: "pending", label: "Pending", count: countFor("pending") },
      { value: "confirmed", label: "Confirmed", count: countFor("confirmed") },
      { value: "processing", label: "Processing", count: countFor("processing") },
      { value: "ready", label: "Ready", count: countFor("ready") },
      { value: "out_for_delivery", label: "Delivery", count: countFor("out_for_delivery") },
      { value: "delivered", label: "Delivered", count: countFor("delivered") },
      { value: "cancelled", label: "Cancelled", count: countFor("cancelled") },
    ];
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (!sort) return filteredOrders;
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filteredOrders].sort((left, right) => {
      switch (sort.key) {
        case "order":
          return left.orderNumber.localeCompare(right.orderNumber) * direction;
        case "customer":
          return left.customerName.localeCompare(right.customerName) * direction;
        case "amount":
          return (left.totalAmount - right.totalAmount) * direction;
        case "created":
        default:
          return (
            (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction
          );
      }
    });
  }, [filteredOrders, sort]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((previous) => {
      const allSelected = ids.length > 0 && ids.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...ids]);
    });
  }, []);

  const changeSort = useCallback((key: string) => {
    setSort((previous) => {
      if (previous?.key === key) {
        return { key, direction: previous.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const exportOrders = useCallback((rows: Order[]) => {
    exportCsv(`odos-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
      { header: "Order number", value: (order) => order.orderNumber },
      { header: "Customer", value: (order) => order.customerName },
      { header: "Store", value: (order) => order.storeName },
      { header: "Total", value: (order) => order.totalAmount },
      { header: "Status", value: (order) => order.status },
      { header: "Payment", value: (order) => order.paymentStatus },
      { header: "Placed", value: (order) => order.createdAt },
    ]);
  }, []);


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

  const orderColumns = useMemo<Array<DirectoryColumn<Order>>>(
    () => [
      {
        key: "order",
        header: "Order & date",
        sortable: true,
        className: "min-w-[11rem]",
        render: (order) => (
          <div className="min-w-0">
            <p className="truncate font-mono text-[13px] font-semibold text-textStrong">
              {order.orderNumber}
            </p>
            <p className="mt-0.5 text-xs text-textMuted">{formatDateTime(order.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "customer",
        header: "Customer",
        sortable: true,
        className: "min-w-[11rem] max-w-[15rem]",
        render: (order) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-textStrong">{order.customerName}</p>
            <p className="truncate text-xs text-textMuted">{order.storeName}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        className: "whitespace-nowrap",
        render: (order) => (
          <p className="font-semibold tabular-nums text-textStrong">
            {formatCurrency(order.totalAmount)}
          </p>
        ),
      },
      {
        key: "fulfilment",
        header: "Fulfilment",
        className: "min-w-[9rem]",
        render: (order) => <FulfilmentRail status={order.status} />,
      },
      {
        key: "payment",
        header: "Payment",
        className: "w-[9rem]",
        render: (order) => (
          <StatePill
            label={labelForStatus(order.paymentStatus)}
            tone={toneForStatus(order.paymentStatus)}
          />
        ),
      },
      {
        key: "actions",
        header: "Action",
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
    ],
    [handleViewOrder, navigate],
  );

  if (isLoading && orders.length === 0) {
    return <OrdersDirectorySkeleton />;
  }

  return (
    <div className="space-y-4">
      <AdminFullHeader
        eyebrow="Orders"
        title="Order list"
        description="Track fulfilment, payment and delivery across every store."
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricStat
          label="Orders this month"
          value={metrics ? metrics.monthOrders.toLocaleString() : "—"}
          icon={ShoppingCart}
          delta={
            metrics
              ? { percent: metrics.ordersGrowthPercent, label: "vs last month" }
              : undefined
          }
          caption={metrics ? undefined : "Loading month totals"}
          animationDelay={40}
        />
        <MetricStat
          label="Revenue this month"
          value={metrics ? formatCurrency(metrics.monthRevenue) : "—"}
          icon={CreditCard}
          tone="success"
          delta={
            metrics
              ? { percent: metrics.revenueGrowthPercent, label: "vs last month" }
              : undefined
          }
          caption={metrics ? undefined : "Paid and delivered orders"}
          animationDelay={80}
        />
        <MetricStat
          label="Pending"
          value={snapshot.pending.toLocaleString()}
          icon={Clock3}
          tone="warning"
          caption="Awaiting fulfilment on this page"
          animationDelay={120}
        />
        <MetricStat
          label="Unpaid"
          value={snapshot.unpaid.toLocaleString()}
          icon={Package2}
          tone="danger"
          caption="Payment not settled on this page"
          animationDelay={160}
        />
      </div>

      <DirectoryToolbar
        search={
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Order number, customer or store"
            className="h-10 py-0"
          />
        }
        filters={
          <FilterSelect
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            options={[
              { label: "All payments", value: "all" },
              { label: "Paid", value: "paid" },
              { label: "Pending", value: "pending" },
              { label: "Failed", value: "failed" },
              { label: "Part refunded", value: "partially_refunded" },
              { label: "Refunded", value: "refunded" },
            ]}
            className="h-10"
          />
        }
        trailing={
          <SegmentedTabs
            ariaLabel="Filter orders by status"
            tabs={statusTabs}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        }
      />

      <section className="animate-fade-up rounded-2xl border border-line bg-surface opacity-0 shadow-card">
        <header className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-textStrong">
              All orders{" "}
              <span className="tabular-nums font-normal text-textMuted">
                ({visibleOrders.length})
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-textMuted">{listSummary}</p>
          </div>
          <Button
            variant="secondary"
            leftIcon={<Download className="size-4" />}
            onClick={() => exportOrders(visibleOrders)}
            disabled={visibleOrders.length === 0}
            className="h-10 py-0"
          >
            Export page
          </Button>
        </header>

        {error ? (
          <div className="p-4">
            <ErrorState description={error} onRetry={() => void refresh()} />
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <LoadingState label="Loading orders..." />
          </div>
        ) : (
          <>
            <DirectoryTable
              columns={orderColumns}
              data={visibleOrders}
              keyExtractor={(order) => order.id}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              sort={sort}
              onSortChange={changeSort}
              emptyState={
                <div className="p-4">
                  <EmptyState
                    title="No orders found"
                    description="Clear the filters or try another search."
                  />
                </div>
              }
            />
            <DirectoryFooter
              page={page}
              pageSize={pageSize}
              onPageChange={goToPage}
              hasMore={hasMore}
              isLoading={isLoadingPage}
              loadedLabel={`per page · ${orders.length} loaded`}
            />
          </>
        )}
      </section>

      <SelectionBar count={selectedIds.size} noun="order" onClear={() => setSelectedIds(new Set())}>
        <SelectionAction
          icon={<Download className="size-4" />}
          onClick={() => {
            exportOrders(visibleOrders.filter((order) => selectedIds.has(order.id)));
            setSelectedIds(new Set());
          }}
        >
          Export
        </SelectionAction>
      </SelectionBar>

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
                  <StatePill label={labelForStatus(selectedOrder.status)} tone={toneForStatus(selectedOrder.status)} />
                  <StatePill label={labelForStatus(selectedOrder.paymentStatus)} tone={toneForStatus(selectedOrder.paymentStatus)} />
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
                <DetailFields columns={1}>
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
                <DetailFields columns={1}>
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
                <DetailFields columns={1}>
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
                <DetailFields columns={1}>
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
                          <StatePill label={labelForStatus(request.status)} tone={toneForStatus(request.status)} />
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
