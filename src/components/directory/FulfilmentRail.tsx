import clsx from "clsx";

import type { OrderStatus } from "@/types";

/**
 * Where an order has reached in fulfilment.
 *
 * Order status is a genuine sequence, so it is drawn as one: each segment is a
 * stage an order actually passes through, and the filled run tells you how far
 * it has got without reading the label. Cancelled is not a later stage of the
 * same journey — it leaves the sequence — so it renders as a single struck rail
 * rather than a partly filled one, which would wrongly imply progress.
 */

const STAGES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out_for_delivery",
  "delivered",
];

const STAGE_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function FulfilmentRail({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex min-w-[7.5rem] flex-col gap-1.5">
        <div className="flex items-center gap-0.5" aria-hidden>
          {STAGES.map((stage) => (
            <span key={stage} className="h-1 flex-1 rounded-full bg-danger-soft" />
          ))}
        </div>
        <span className="text-[11px] font-medium text-danger">Cancelled</span>
      </div>
    );
  }

  const reachedIndex = STAGES.indexOf(status);
  const stagesDone = reachedIndex < 0 ? 0 : reachedIndex + 1;
  const isComplete = status === "delivered";

  return (
    <div className="flex min-w-[7.5rem] flex-col gap-1.5">
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Stage ${stagesDone} of ${STAGES.length}: ${STAGE_LABELS[status] ?? status}`}
      >
        {STAGES.map((stage, index) => (
          <span
            key={stage}
            className={clsx(
              "h-1 flex-1 rounded-full transition-colors",
              index < stagesDone
                ? isComplete
                  ? "bg-success"
                  : "bg-accent"
                : "bg-line",
            )}
          />
        ))}
      </div>
      <span
        className={clsx(
          "text-[11px] font-medium",
          isComplete ? "text-success" : "text-textMuted",
        )}
      >
        {STAGE_LABELS[status] ?? status}
      </span>
    </div>
  );
}
