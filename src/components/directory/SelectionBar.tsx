import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Bulk actions for the current selection.
 *
 * Floats over the table rather than sitting in the card header so it stays
 * reachable however far down the list you have scrolled, and it only exists
 * while something is selected — an always-present bar full of disabled buttons
 * teaches operators to ignore that strip of the screen.
 */
export function SelectionBar({
  count,
  noun,
  onClear,
  children,
}: {
  count: number;
  /** Singular noun, e.g. "order". Pluralised here. */
  noun: string;
  onClear: () => void;
  children: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
    >
      <div className="animate-fade-up pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2.5 opacity-0 shadow-[0_8px_28px_rgba(16,24,40,0.16)]">
        <span className="px-1.5 text-sm font-semibold tabular-nums text-textStrong">
          {count} {noun}
          {count === 1 ? "" : "s"} selected
        </span>
        <span className="h-5 w-px bg-line" aria-hidden />
        {children}
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-1 inline-flex size-8 items-center justify-center rounded-lg text-textMuted transition hover:bg-surfaceMuted hover:text-textStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SelectionAction({
  onClick,
  icon,
  children,
  tone = "default",
}: {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        tone === "danger"
          ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-danger transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
          : "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-textStrong transition hover:bg-surfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      }
    >
      {icon}
      {children}
    </button>
  );
}
