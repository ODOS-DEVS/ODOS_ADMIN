import clsx from "clsx";

export type SegmentedTab<T extends string> = {
  value: T;
  label: string;
  /** Optional running count. Omit rather than passing 0 when the count is unknown. */
  count?: number;
};

type SegmentedTabsProps<T extends string> = {
  tabs: Array<SegmentedTab<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
};

/**
 * The status switcher that sits opposite the search field.
 *
 * These are the states an operator triages by, so they get one tap rather than
 * hiding inside the filter dropdowns next to them — the dropdowns are for
 * narrowing, this is for switching what you are looking at.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-xl border border-line bg-surfaceMuted/70 p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={clsx(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              isActive
                ? "bg-surface text-textStrong shadow-sm"
                : "text-textMuted hover:text-textStrong",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={clsx(
                  "rounded px-1.5 py-px text-[11px] font-semibold tabular-nums",
                  isActive ? "bg-accentSoft text-accent" : "bg-line/70 text-textMuted",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
