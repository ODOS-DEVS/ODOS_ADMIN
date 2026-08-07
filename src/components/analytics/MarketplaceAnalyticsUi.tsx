import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import type { AdminFinanceOverview, DashboardPayload, Order } from "@/types";
import type { AnalyticsSnapshot } from "@/utils/analyticsMetrics";
import { formatCurrency } from "@/utils/format";

/** Categorical chart-segment palette — routed through the app's semantic tokens, no raw Tailwind colors. */
const SEGMENT_COLORS = [
  "stroke-accent",
  "stroke-success",
  "stroke-warning",
  "stroke-info",
  "stroke-danger",
] as const;

export function MiniBarTrend({
  title,
  subtitle,
  bars,
  tone = "accent",
}: {
  title: string;
  subtitle?: string;
  bars: Array<{ label: string; value: number }>;
  tone?: "accent" | "emerald" | "sky";
}) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const barClass =
    tone === "emerald"
      ? "bg-success"
      : tone === "sky"
        ? "bg-info"
        : "bg-accent";

  return (
    <div className="rounded-2xl border border-line bg-surfaceMuted/50 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-textStrong">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-textMuted">{subtitle}</p> : null}
      </div>
      <div className="flex h-36 items-end justify-between gap-2">
        {bars.map((bar) => {
          const height = Math.max((bar.value / max) * 100, bar.value > 0 ? 8 : 4);
          return (
            <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={clsx("w-full max-w-[2.25rem] rounded-t-lg transition-[height] duration-700", barClass)}
                  style={{ height: `${height}%` }}
                  title={`${bar.label}: ${bar.value}`}
                />
              </div>
              <span className="truncate text-[10px] font-medium text-textSubtle">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DonutMixChart({
  title,
  centerValue,
  centerLabel,
  segments,
}: {
  title: string;
  centerValue: string;
  centerLabel: string;
  segments: Array<{ label: string; value: number; colorIndex?: number }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total <= 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surfaceMuted/40 p-6 text-center">
        <p className="text-sm font-medium text-textStrong">{title}</p>
        <p className="mt-1 text-xs text-textMuted">No distribution data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surfaceMuted/50 p-4">
      <p className="mb-4 text-sm font-semibold text-textStrong">{title}</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative size-32 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" className="stroke-line/80" strokeWidth="10" />
            {total > 0
              ? segments.map((segment, index) => {
                  const fraction = segment.value / total;
                  const dash = fraction * circumference;
                  const circle = (
                    <circle
                      key={segment.label}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className={SEGMENT_COLORS[segment.colorIndex ?? index % SEGMENT_COLORS.length]}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += dash;
                  return circle;
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-bold tabular-nums text-textStrong">{centerValue}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-textSubtle">{centerLabel}</p>
          </div>
        </div>
        <ul className="w-full min-w-0 space-y-2 sm:max-w-[11rem]">
          {segments.map((segment, index) => (
            <li key={segment.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-textMuted">
                <span
                  className={clsx(
                    "size-2 shrink-0 rounded-full bg-current",
                    SEGMENT_COLORS[segment.colorIndex ?? index % SEGMENT_COLORS.length].replace("stroke-", "text-"),
                  )}
                />
                <span className="truncate capitalize">{segment.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-textStrong">{segment.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MarketplaceHealthGrid({
  snapshot,
  stats,
}: {
  snapshot: AnalyticsSnapshot;
  stats: DashboardPayload["stats"];
}) {
  const items = [
    {
      label: "Fulfillment",
      value: `${Math.round(snapshot.completionRate)}%`,
      hint: `${snapshot.completedOrders} completed`,
      tone: "success" as const,
    },
    {
      label: "Pending orders",
      value: String(stats.pendingOrders),
      hint: `${snapshot.pendingOrderRate.toFixed(0)}% of volume`,
      tone: "warning" as const,
    },
    {
      label: "Catalog depth",
      value: snapshot.productsPerStore.toFixed(1),
      hint: "Products per store",
      tone: "default" as const,
    },
    {
      label: "Vendor queue",
      value: String(stats.pendingVendorApplications),
      hint: "Applications pending",
      tone: "info" as const,
    },
  ];

  const toneBg = {
    default: "border-line bg-surface",
    success: "border-success/20 bg-success-soft/60",
    warning: "border-warning/25 bg-warning-soft/70",
    info: "border-info/25 bg-info-soft/70",
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className={clsx("rounded-xl border px-3 py-3", toneBg[item.tone])}>
          <p className="text-xs font-medium text-textMuted">{item.label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-textStrong">{item.value}</p>
          <p className="mt-1 text-[11px] text-textMuted">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function FootprintTiles({
  stats,
}: {
  stats: DashboardPayload["stats"];
}) {
  const tiles = [
    { label: "Users", value: stats.totalUsers, icon: Users, tone: "text-info bg-info-soft" },
    { label: "Vendors", value: stats.totalVendors, icon: TrendingUp, tone: "text-success bg-success-soft" },
    { label: "Stores", value: stats.totalStores, icon: Store, tone: "text-warning bg-warning-soft" },
    { label: "Products", value: stats.totalProducts, icon: Package, tone: "text-danger bg-danger-soft" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-sm"
        >
          <span className={clsx("rounded-xl p-2.5", tile.tone)}>
            <tile.icon className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium text-textMuted">{tile.label}</p>
            <p className="text-xl font-bold tabular-nums text-textStrong">
              {new Intl.NumberFormat("en-GH").format(tile.value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TreasuryHighlightPanel({
  finance,
  onOpenFinance,
}: {
  finance: AdminFinanceOverview | null;
  onOpenFinance?: () => void;
}) {
  if (!finance) {
    return (
      <div className="flex h-full min-h-[280px] flex-col justify-center rounded-3xl border border-dashed border-line bg-surfaceMuted/50 px-6 py-8 text-center">
        <CircleDollarSign className="mx-auto size-10 text-textSubtle" aria-hidden />
        <p className="mt-3 text-sm font-medium text-textStrong">No finance data yet</p>
        <p className="mt-1 text-xs text-textMuted">Shows up after payments are recorded.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-textMuted">Treasury</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-textStrong">
            {formatCurrency(finance.currentBalance)}
          </p>
          <p className="mt-1 text-xs text-textMuted">Platform cash after fees, refunds & payouts</p>
        </div>
        {onOpenFinance ? (
          <button
            type="button"
            onClick={onOpenFinance}
            className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accentSoft"
          >
            Open
          </button>
        ) : null}
      </div>
      <div className="mt-5 space-y-2.5 border-t border-line/80 pt-4">
        {[
          { label: "Vendor liability", value: formatCurrency(finance.vendorLiabilityBalance) },
          { label: "Commission", value: formatCurrency(finance.commissionBalance) },
          { label: "Pending withdrawals", value: formatCurrency(finance.pendingWithdrawalTotal), warn: true },
        ].map((row) => (
          <div
            key={row.label}
            className={clsx(
              "flex items-center justify-between rounded-xl px-3 py-2 text-xs",
              row.warn ? "bg-warning-soft/80" : "bg-surfaceMuted/80",
            )}
          >
            <span className="text-textMuted">{row.label}</span>
            <span className="font-semibold tabular-nums text-textStrong">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildRecentOrderVolumeBars(orders: Order[], bucketCount = 7) {
  return [...orders]
    .slice(0, bucketCount)
    .reverse()
    .map((order, index) => ({
      label: order.orderNumber
        ? order.orderNumber.replace(/^ORD-?/i, "").slice(-4)
        : `${index + 1}`,
      value: Math.round(order.totalAmount),
    }));
}

export function KpiStripItem({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-lg bg-accentSoft p-2 text-accent">
          <Icon className="size-4" aria-hidden />
        </span>
        {delta ? (
          <span className="rounded-md bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
            {delta}
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-xs font-medium text-textMuted">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-textStrong">{value}</p>
      </div>
    </div>
  );
}
