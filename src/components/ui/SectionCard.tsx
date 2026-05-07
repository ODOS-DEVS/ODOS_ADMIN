import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, description, action, children }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/80 shadow-glow">
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold text-textStrong">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-textMuted">{description}</p> : null}
          </div>
          {action ? <div className="flex items-center gap-3">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
