import clsx from "clsx";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { InsightPill } from "@/components/analytics/AnalyticsUi";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-textMuted">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh ? (
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        ) : null}
        <Button leftIcon={<ArrowRight className="size-4" />} onClick={() => navigate(fullRoute)}>
          {fullLabel}
        </Button>
      </div>
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-textMuted">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate(backRoute)}>
          {backLabel}
        </Button>
        {onRefresh ? (
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

export function AdminDetailHeader({
  eyebrow,
  title,
  description,
  backRoute,
  backLabel = "Back to directory",
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">{title}</h1>
        {description ? <p className="mt-1 text-sm text-textMuted">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate(backRoute)}>
          {backLabel}
        </Button>
        {onRefresh ? (
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        ) : null}
        {actions}
      </div>
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
      <div className="flex min-w-max gap-1 rounded-xl border border-white/10 bg-surface/95 p-1 backdrop-blur-md">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={clsx(
              "rounded-lg px-3 py-2 text-xs font-medium transition",
              activeId === section.id
                ? "bg-accent/15 text-accentSoft"
                : "text-textMuted hover:bg-white/[0.04] hover:text-textStrong",
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
        <InsightPill key={item.label} label={item.label} value={item.value} hint={item.hint} />
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
      <div className="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`sk-kpi-${index}`} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
      {Array.from({ length: blocks }).map((_, index) => (
        <div key={`sk-block-${index}`} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      ))}
    </div>
  );
}

export function AdminDetailTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-textMuted">{label}</p>
      <div className="mt-1 text-sm text-textStrong">{value}</div>
    </div>
  );
}
