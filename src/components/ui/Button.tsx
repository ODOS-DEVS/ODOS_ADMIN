import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: ReactNode;
};

/**
 * BRIEF.md section 4: 36px controls, 6px radius, 1px borders, no shadows.
 *
 * `` is dropped here rather than left to the token layer, because it
 * is a Tailwind built-in rather than one of this project's named shadows — the
 * token override that silenced shadow-card does not reach it.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-accent bg-accent text-accentForeground hover:bg-accent/90 focus-visible:ring-accent/30",
  secondary:
    "border border-line bg-surface text-textStrong hover:bg-surfaceMuted focus-visible:ring-accent/20",
  ghost:
    "border border-transparent bg-transparent text-textMuted hover:bg-surfaceMuted hover:text-textStrong focus-visible:ring-accent/15",
  danger:
    "border border-danger/30 bg-danger-soft text-danger hover:bg-danger/10 focus-visible:ring-danger/25",
};

export function Button({
  className,
  children,
  variant = "primary",
  isLoading = false,
  leftIcon,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex h-9 items-center justify-center gap-2 rounded-control px-3.5 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
