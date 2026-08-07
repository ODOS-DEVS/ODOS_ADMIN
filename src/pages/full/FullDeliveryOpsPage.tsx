import { AlertTriangle, Bike, PackageCheck, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getDeliveryOps, type DeliveryOpsOrder, type DeliveryOpsSnapshot } from "@/api/deliveryOpsApi";
import { AdminFullHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatCurrency } from "@/utils/format";

const POLL_INTERVAL_MS = 20_000;

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function DeliveryOpsRow({
  order,
  onOpen,
}: {
  order: DeliveryOpsOrder;
  onOpen: () => void;
}) {
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-line/70 last:border-b-0 hover:bg-surfaceMuted/60"
    >
      <td className="min-w-[140px] px-4 py-3">
        <p className="font-medium text-textStrong">{order.orderNumber}</p>
        <p className="truncate text-xs text-textMuted">{order.customerName}</p>
      </td>
      <td className="min-w-[120px] max-w-[180px] px-4 py-3">
        <p className="truncate text-sm text-textStrong">{order.storeName}</p>
      </td>
      <td className="w-[8.5rem] px-4 py-3">
        <StatusBadge status={order.vendorStatus} />
      </td>
      <td className="min-w-[7rem] px-4 py-3">
        <span
          className={
            order.isDelayed
              ? "inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger"
              : "text-sm text-textMuted"
          }
        >
          {order.isDelayed ? <AlertTriangle className="size-3.5" /> : null}
          {formatMinutes(order.minutesInStage)}
        </span>
      </td>
      <td className="min-w-[10rem] px-4 py-3 text-sm text-textMuted">
        {order.deliveryMethod.replace(/_/g, " ")} · {order.addressCity || order.addressRegion}
      </td>
      <td className="min-w-[6rem] px-4 py-3 font-mono text-sm text-textStrong">
        {order.deliveryCode ?? "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-textStrong">
        {formatCurrency(order.totalAmount)}
      </td>
    </tr>
  );
}

export function FullDeliveryOpsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<DeliveryOpsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (!token) return;
      if (showSpinner) {
        setIsLoading(true);
      }
      try {
        const next = await getDeliveryOps(token);
        setSnapshot(next);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load delivery ops.");
      } finally {
        if (showSpinner) {
          setIsLoading(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => void load(false), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  if (isLoading && !snapshot) {
    return <LoadingState label="Loading delivery ops..." />;
  }

  if (error && !snapshot) {
    return <ErrorState description={error} onRetry={() => void load(true)} />;
  }

  const stageCounts = snapshot?.stageCounts ?? {};

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Delivery"
        title="Delivery Ops"
        description="Every order still moving through fulfillment, live — sorted by how long it's been sitting in its current stage. Refreshes automatically every 20 seconds."
        backRoute="/orders/full"
        backLabel="Orders list"
        onRefresh={() => void load(true)}
        refreshing={isLoading}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Active orders"
          value={String(snapshot?.totalActive ?? 0)}
          icon={PackageCheck}
          animationDelay={40}
        />
        <StatCard
          label="Delayed"
          value={String(snapshot?.delayedCount ?? 0)}
          hint="Past this stage's SLA"
          icon={AlertTriangle}
          tone={snapshot?.delayedCount ? "warning" : "default"}
          animationDelay={80}
        />
        <StatCard
          label="Preparing"
          value={String(stageCounts.processing ?? 0)}
          icon={Timer}
          animationDelay={120}
        />
        <StatCard
          label="Out for delivery"
          value={String(stageCounts.out_for_delivery ?? 0)}
          icon={Bike}
          tone="info"
          animationDelay={160}
        />
      </div>

      <SectionCard compact title="Active pipeline" bodyClassName="overflow-x-auto p-0">
        {snapshot && snapshot.orders.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-textMuted">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Time in stage</th>
                <th className="px-4 py-3 font-medium">Delivery</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.orders.map((order) => (
                <DeliveryOpsRow
                  key={order.id}
                  order={order}
                  onOpen={() => navigate(`/orders/full/${order.id}`)}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-textMuted">
            Nothing in the delivery pipeline right now.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
