import { Edit3, Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getOrders, updateOrderStatus } from "@/api/ordersApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

function OrderDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
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

export function OrdersPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>("pending");
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getOrders(token);
      setOrders(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

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

  async function handleStatusUpdate() {
    if (!token || !editingOrder) return;
    setActionLoading(true);
    try {
      const updated = await updateOrderStatus(token, editingOrder.id, pendingStatus);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
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

  if (isLoading) {
    return <LoadingState label="Loading orders..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadOrders()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orders"
        title="Order management"
        description="Track fulfillment progress, payment health, and customer-facing delivery status from a single control surface."
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
                { label: "Paid", value: "paid" },
                { label: "Unpaid", value: "unpaid" },
                { label: "Failed", value: "failed" },
                { label: "Refunded", value: "refunded" },
              ]}
            />
          </div>
        }
      >
        {filteredOrders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="Clear the filters or search for a different order reference."
          />
        ) : (
          <DataTable<Order>
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
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => setSelectedOrder(order)}
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
          />
        )}
      </SectionCard>

      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder?.orderNumber ?? "Order details"}
        description="Customer, store, payment, and fulfillment details for this order."
      >
        {selectedOrder ? (
          <div className="grid gap-4 md:grid-cols-2">
            <OrderDetailRow label="Customer" value={selectedOrder.customerName} />
            <OrderDetailRow label="Store" value={selectedOrder.storeName} />
            <OrderDetailRow label="Amount" value={formatCurrency(selectedOrder.totalAmount)} />
            <OrderDetailRow label="Status" value={selectedOrder.status} />
            <OrderDetailRow label="Payment status" value={selectedOrder.paymentStatus} />
            <OrderDetailRow label="Created" value={formatDateTime(selectedOrder.createdAt)} />
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
