import clsx from "clsx";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { InsightPill } from "@/components/analytics/AnalyticsUi";
import { Button } from "@/components/ui/Button";
import { DetailField } from "@/components/ui/DetailList";
import { SectionCard } from "@/components/ui/SectionCard";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";

export const HEADER_ACTION_BUTTON_CLASS =
  "min-h-10 w-full shrink-0 justify-center whitespace-nowrap px-3 text-[13px] font-medium sm:w-[var(--admin-header-action-width)] sm:min-w-[var(--admin-header-action-width)] sm:max-w-[var(--admin-header-action-width)]";

export function AdminHeaderActions({ children }: { children: ReactNode }) {
  return <div className="admin-header-actions">{children}</div>;
}

/** @deprecated Use AdminHeaderActions */
export const DetailHeaderActions = AdminHeaderActions;

export function HeaderActionButton({
  children,
  className,
  ...rest
}: ComponentProps<typeof Button>) {
  return (
    <Button className={clsx(HEADER_ACTION_BUTTON_CLASS, className)} {...rest}>
      {children}
    </Button>
  );
}

/** @deprecated Use HeaderActionButton */
export const DetailHeaderActionButton = HeaderActionButton;

export function AdminBriefHeader({
  eyebrow,
  title,
  description,
  fullRoute,
  fullLabel = "Open full view",
  onRefresh,
  refreshing = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  fullRoute: string;
  fullLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-textMuted">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-textMuted">{description}</p>
      </div>
      <AdminHeaderActions>
        {onRefresh ? (
          <HeaderActionButton
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </HeaderActionButton>
        ) : null}
        <HeaderActionButton leftIcon={<ArrowRight className="size-4" />} onClick={() => navigate(fullRoute)}>
          {fullLabel}
        </HeaderActionButton>
      </AdminHeaderActions>
    </div>
  );
}

export function AdminFullHeader({
  eyebrow,
  title,
  description,
  backRoute,
  backLabel = "Brief overview",
  onRefresh,
  refreshing = false,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  backRoute: string;
  backLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-textMuted">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-textMuted">{description}</p>
      </div>
      <AdminHeaderActions>
        <HeaderActionButton
          variant="secondary"
          leftIcon={<ArrowLeft className="size-4" />}
          onClick={() => navigate(backRoute)}
        >
          {backLabel}
        </HeaderActionButton>
        {onRefresh ? (
          <HeaderActionButton
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </HeaderActionButton>
        ) : null}
        {actions}
      </AdminHeaderActions>
    </div>
  );
}

export function AdminDetailHeader({
  eyebrow,
  title,
  description,
  backRoute,
  backLabel = "Directory",
  onRefresh,
  refreshing = false,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  backRoute: string;
  backLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-textMuted">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">{title}</h1>
        {description ? <div className="mt-2 text-sm text-textMuted">{description}</div> : null}
      </div>
      <AdminHeaderActions>
        <HeaderActionButton
          variant="secondary"
          leftIcon={<ArrowLeft className="size-4" />}
          onClick={() => navigate(backRoute)}
          title="Back to directory"
        >
          {backLabel}
        </HeaderActionButton>
        {onRefresh ? (
          <HeaderActionButton
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </HeaderActionButton>
        ) : null}
        {actions}
      </AdminHeaderActions>
    </div>
  );
}

export function AdminTabNav({
  sections,
  activeId,
  onSelect,
}: {
  sections: Array<{ id: string; label: string }>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1 rounded-xl border border-line bg-surfaceMuted p-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={clsx(
              "rounded-lg px-3 py-2 text-xs font-medium transition",
              activeId === section.id
                ? "bg-accent text-accentForeground shadow-sm"
                : "text-textMuted hover:bg-surface hover:text-textStrong",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminTabPanel({
  activeSection,
  sectionId,
  children,
}: {
  activeSection: string;
  sectionId: string;
  children: ReactNode;
}) {
  if (activeSection !== sectionId) return null;
  return (
    <div key={sectionId} className="animate-fade-up opacity-0" style={{ animationDelay: "0ms" }}>
      {children}
    </div>
  );
}

export function AdminKpiGrid({
  items,
  columns = 4,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
  columns?: 2 | 3 | 4;
}) {
  const columnClass =
    columns === 2 ? "md:grid-cols-2" : columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4";
  return (
    <div className={clsx("grid grid-cols-2 gap-2", columnClass)}>
      {items.map((item) => (
        <div key={item.label} className="border-b border-line/60 pb-3">
          <InsightPill label={item.label} value={item.value} hint={item.hint} />
        </div>
      ))}
    </div>
  );
}

export function AdminCallout({
  title,
  description,
  fullRoute,
  ctaLabel,
  meta,
}: {
  title: string;
  description: string;
  fullRoute: string;
  ctaLabel: string;
  meta?: string;
}) {
  const navigate = useNavigate();
  return (
    <SectionCard compact title={title} description={description}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {meta ? <p className="text-sm text-textMuted">{meta}</p> : <span />}
        <Button leftIcon={<ArrowRight className="size-4" />} onClick={() => navigate(fullRoute)}>
          {ctaLabel}
        </Button>
      </div>
    </SectionCard>
  );
}

export function AdminPageSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-14 rounded-2xl" />
      <SkeletonGrid count={4} className="grid grid-cols-2 gap-3 xl:grid-cols-4" tileClassName="h-24 rounded-2xl" />
      {Array.from({ length: blocks }).map((_, index) => (
        <SkeletonBlock key={`sk-block-${index}`} className="h-40 rounded-2xl" />
      ))}
    </div>
  );
}

export function AdminDetailTile({ label, value }: { label: string; value: ReactNode }) {
  return <DetailField label={label} value={value} />;
}

