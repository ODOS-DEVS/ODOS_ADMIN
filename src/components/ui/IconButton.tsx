import clsx from "clsx";
import { Children, type ButtonHTMLAttributes, type ReactNode } from "react";

/** Width of one icon slot in a table action bar (height matches). */
export const TABLE_ACTION_SLOT_CLASS = "size-9 min-h-9 min-w-9 max-w-9";

/** Use on actions columns in paginated directory tables (3 icon slots). */
export const TABLE_ACTIONS_COLUMN_CLASS = "w-[7.25rem] text-right";

/** Actions column when up to four icon slots are shown (e.g. application queue). */
export const TABLE_ACTIONS_COLUMN_CLASS_WIDE = "w-[9.25rem] text-right";

/** Actions column for two icon slots (e.g. markets edit/disable). */
export const TABLE_ACTIONS_COLUMN_CLASS_NARROW = "w-[5.25rem] text-right";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "default" | "danger" | "success";
};

const toneClasses = {
  default: "text-textMuted hover:bg-surfaceMuted/90 hover:text-textStrong",
  danger: "text-danger hover:bg-danger-soft/80",
  success: "text-success hover:bg-success-soft/80",
};

export function IconButton({
  label,
  tone = "default",
  className,
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

type TableActionBarProps = {
  children: ReactNode;
  className?: string;
};

/** Segmented icon controls for table rows — always one horizontal row, equal slots. */
export function TableActionBar({ children, className }: TableActionBarProps) {
  const slotCount = Children.toArray(children).filter(Boolean).length;

  return (
    <div
      className={clsx("table-action-bar", className)}
      role="group"
      aria-label="Row actions"
      data-slots={slotCount}
    >
      {children}
    </div>
  );
}

export function TableActionBarItem({
  label,
  tone = "default",
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <IconButton
      label={label}
      tone={tone}
      className={clsx(
        TABLE_ACTION_SLOT_CLASS,
        "table-action-bar__item shrink-0 rounded-none shadow-none",
        className,
      )}
      {...rest}
    >
      {children}
    </IconButton>
  );
}

/** Right-aligns a action bar inside an actions table column. */
export function TableActionsCell({ children }: { children: ReactNode }) {
  return <div className="flex justify-end">{children}</div>;
}
