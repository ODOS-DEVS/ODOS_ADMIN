import type { StateTone } from "@/components/directory/StatePill";

/**
 * Maps a backend status string to a pill tone.
 *
 * Kept alongside StatePill rather than inside it so the component stays a dumb
 * presenter — the meaning of "suspended" belongs to the domain, not to a pill.
 */
const TONES: Record<string, StateTone> = {
  // order lifecycle
  pending_payment: "warning",
  pending: "warning",
  confirmed: "info",
  processing: "info",
  ready: "info",
  out_for_delivery: "accent",
  delivered: "success",
  cancelled: "danger",
  // payment
  paid: "success",
  failed: "danger",
  refunded: "danger",
  partially_refunded: "warning",
  // product
  active: "success",
  hidden: "neutral",
  suspended: "danger",
  draft: "neutral",
};

const LABELS: Record<string, string> = {
  out_for_delivery: "Out for delivery",
  pending_payment: "Awaiting payment",
  partially_refunded: "Part refunded",
};

export function toneForStatus(status: string): StateTone {
  return TONES[status] ?? "neutral";
}

export function labelForStatus(status: string): string {
  if (LABELS[status]) return LABELS[status];
  return status.replace(/_/g, " ").replace(/^\w/, (character) => character.toUpperCase());
}
