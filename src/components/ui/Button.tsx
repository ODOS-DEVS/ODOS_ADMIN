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
    "border border-accent/60 bg-accent text-slate-950 hover:bg-orange-300 focus-visible:ring-accent/60",
  secondary:
    "border border-white/10 bg-white/5 text-textStrong hover:bg-white/10 focus-visible:ring-white/20",
  ghost:
    "border border-transparent bg-transparent text-textMuted hover:bg-white/5 hover:text-textStrong focus-visible:ring-white/20",
  danger:
    "border border-red-400/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 focus-visible:ring-red-400/40",
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
