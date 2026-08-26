import type { ReactNode } from "react";

/**
 * The filter row above the table: search and narrowing controls on the left,
 * the status switcher on the right. One row on desktop, stacked on mobile.
 */
export function DirectoryToolbar({
  search,
  filters,
  trailing,
}: {
  search: ReactNode;
  filters?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="hidden shrink-0 text-[13px] font-medium text-textMuted xl:inline">
          Filter by
        </span>
        <div className="w-full sm:w-64">{search}</div>
        {filters}
      </div>
      {/* min-w-0 is load-bearing: without it this flex child sizes to the full
          width of the tab strip, which stretches the page past the viewport on
          a phone and takes every other card with it. */}
      {trailing ? (
        <div className="min-w-0 max-w-full overflow-x-auto pb-0.5">{trailing}</div>
      ) : null}
    </div>
  );
}
