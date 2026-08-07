import type { ReactNode } from "react";

type ListToolbarProps = {
  children: ReactNode;
};

export function ListToolbar({ children }: ListToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-stretch">{children}</div>
  );
}

export function ListToolbarField({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-h-10 sm:min-w-[12rem] ${className}`.trim()}>{children}</div>;
}
