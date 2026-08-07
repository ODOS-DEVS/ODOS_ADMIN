import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-accent bg-accent text-accentForeground hover:bg-accent/90 focus-visible:ring-accent/30 shadow-sm",
  secondary:
    "border border-line bg-surface text-textStrong hover:bg-surfaceMuted focus-visible:ring-accent/20 shadow-sm",
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
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
