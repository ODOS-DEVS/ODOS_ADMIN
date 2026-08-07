import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surfaceMuted px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-textStrong">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-textMuted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
