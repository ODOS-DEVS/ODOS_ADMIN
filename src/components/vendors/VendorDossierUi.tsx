import {
  ArrowRight,
  CircleDollarSign,
  Package,
  ShoppingBag,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VendorDetailRow, VendorMark } from "@/components/vendors/VendorsDirectoryUi";
import type { Vendor } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

export function buildVendorRelatedLinks(vendor: Vendor) {
  return [
    {
      id: "user",
      label: "Owner account",
      meta: vendor.email,
      href: `/users/full/${vendor.userId}`,
      icon: UserRound,
    },
    {
      id: "stores",
      label: "Stores",
      meta: `${vendor.totalStores} storefront(s)`,
      href: `/stores/full?q=${encodeURIComponent(vendor.businessName)}`,
      icon: Store,
    },
    {
      id: "products",
      label: "Products",
      meta: `${vendor.totalProducts} listing(s)`,
      href: `/products/full?q=${encodeURIComponent(vendor.businessName)}`,
      icon: Package,
    },
    {
      id: "payouts",
      label: "Payouts",
      meta: "Withdrawals & treasury",
      href: `/payouts/full?status=pending`,
      icon: Wallet,
    },
  ] as const;
}

function QuickLinkTile({
  label,
  meta,
  href,
  icon: Icon,
}: {
  label: string;
  meta: string;
  href: string;
  icon: LucideIcon;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="flex min-h-[6.25rem] flex-col justify-between rounded-xl border border-line bg-surfaceMuted p-4 text-left transition hover:border-accent/30 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accentSoft text-accent">
          <Icon className="size-4" />
        </span>
        <ArrowRight className="size-4 shrink-0 text-textSubtle" />
      </div>
      <div className="mt-3">
        <p className="text-sm font-semibold text-textStrong">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-textMuted">{meta}</p>
      </div>
    </button>
  );
}

function IdentifierRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-textSubtle">{label}</p>
      <p className="mt-1.5 break-all font-mono text-xs leading-relaxed text-textStrong" title={value}>
        {value}
      </p>
    </div>
  );
}

export function VendorDossier360Overview({ vendor }: { vendor: Vendor }) {
  const avgOrderValue =
    vendor.totalOrders > 0 ? vendor.totalSales / vendor.totalOrders : 0;
  const productsPerStore =
    vendor.totalStores > 0 ? vendor.totalProducts / vendor.totalStores : 0;
  const quickLinks = buildVendorRelatedLinks(vendor);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <VendorMark name={vendor.businessName} size="lg" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-textStrong">
                  {vendor.businessName}
                </h2>
                <StatusBadge status={vendor.status} />
              </div>
              <p className="text-sm text-textMuted">{vendor.businessCategory}</p>
              <p className="text-sm text-textMuted">
                {vendor.email}
                {vendor.phoneNumber ? ` · ${vendor.phoneNumber}` : ""}
              </p>
              <p className="text-xs text-textSubtle">
                Seller since {formatDate(vendor.joinedAt)} · Last profile sync from marketplace API
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            variant="compact"
            label="Stores"
            value={String(vendor.totalStores)}
            icon={Store}
            tone="default"
          />
          <StatCard
            variant="compact"
            label="Products"
            value={String(vendor.totalProducts)}
            icon={Package}
            tone="default"
          />
          <StatCard
            variant="compact"
            label="Orders"
            value={String(vendor.totalOrders)}
            icon={ShoppingBag}
            tone="success"
          />
          <StatCard
            variant="compact"
            label="Lifetime sales"
            value={formatCurrency(vendor.totalSales)}
            icon={CircleDollarSign}
            tone="info"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard compact title="Business profile" description="How this seller is classified on ODOS">
          <div className="grid gap-3 sm:grid-cols-2">
            <VendorDetailRow label="Category" value={vendor.businessCategory} />
            <VendorDetailRow label="Account status" value={vendor.status === "active" ? "Active" : "Suspended"} />
            <VendorDetailRow label="Joined" value={formatDateTime(vendor.joinedAt)} />
            <VendorDetailRow
              label="Avg. order value"
              value={vendor.totalOrders > 0 ? formatCurrency(avgOrderValue) : "—"}
            />
          </div>
        </SectionCard>

        <SectionCard compact title="Contact & ownership" description="Primary reach and linked user account">
          <div className="grid gap-3 sm:grid-cols-2">
            <VendorDetailRow label="Email" value={vendor.email} />
            <VendorDetailRow label="Phone" value={vendor.phoneNumber ?? "Not provided"} />
            <VendorDetailRow label="Owner user ID" value={vendor.userId.slice(0, 8) + "…"} />
            <VendorDetailRow
              label="Catalog density"
              value={
                vendor.totalStores > 0
                  ? `${productsPerStore.toFixed(1)} products / store`
                  : "No stores yet"
              }
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        compact
        title="360° navigation"
        description="Jump to related marketplace records without leaving the dossier mental model"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <QuickLinkTile key={link.id} {...link} />
          ))}
        </div>
      </SectionCard>

      <SectionCard compact title="System identifiers" description="For support, audit, and API cross-reference">
        <div className="grid gap-3 md:grid-cols-2">
          <IdentifierRow label="Vendor ID" value={vendor.id} />
          <IdentifierRow label="User ID" value={vendor.userId} />
        </div>
      </SectionCard>
    </div>
  );
}

export function VendorDossierPerformancePanel({ vendor }: { vendor: Vendor }) {
  const avgOrderValue =
    vendor.totalOrders > 0 ? vendor.totalSales / vendor.totalOrders : 0;

  return (
    <SectionCard compact title="Commerce performance" description="Aggregated metrics from ODOS marketplace activity">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <VendorDetailRow label="Stores" value={String(vendor.totalStores)} />
        <VendorDetailRow label="Products" value={String(vendor.totalProducts)} />
        <VendorDetailRow label="Orders fulfilled" value={String(vendor.totalOrders)} />
        <VendorDetailRow label="Lifetime GMV" value={formatCurrency(vendor.totalSales)} />
        <VendorDetailRow
          label="Average order value"
          value={vendor.totalOrders > 0 ? formatCurrency(avgOrderValue) : "—"}
        />
        <VendorDetailRow
          label="Products per store"
          value={
            vendor.totalStores > 0
              ? (vendor.totalProducts / vendor.totalStores).toFixed(1)
              : "—"
          }
        />
      </div>
    </SectionCard>
  );
}
