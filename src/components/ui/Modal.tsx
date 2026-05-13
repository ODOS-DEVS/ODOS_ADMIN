import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
};

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${sizeClasses[size]} rounded-3xl border border-white/10 bg-panel shadow-glow`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-textStrong">{title}</h2>
            {description ? <p className="mt-1 text-sm text-textMuted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-textMuted transition hover:text-textStrong"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-white/10 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
