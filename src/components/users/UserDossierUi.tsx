import clsx from "clsx";
import {
  BadgeCheck,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Star,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import { getUserInitials } from "@/components/users/UsersUi";
import { DetailField } from "@/components/ui/DetailList";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminUserDetail } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

export function UserMark({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "size-20 text-xl" : "size-12 text-sm";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={clsx("shrink-0 rounded-2xl border border-line object-cover shadow-sm ring-2 ring-accent/10", sizeClass)}
      />
    );
  }
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-2xl bg-accentSoft font-bold text-accent ring-2 ring-accent/10",
        sizeClass,
      )}
    >
      {getUserInitials(name) || "U"}
    </span>
  );
}

export function UserProfileHero({ user }: { user: AdminUserDetail }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <UserMark name={user.fullName} avatarUrl={user.avatarUrl} size="lg" />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-textStrong">{user.fullName}</h2>
              {user.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-success">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  Verified
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <StatusBadge key={role} status={role === "admin" ? "confirmed" : role} />
              ))}
              <StatusBadge status={user.accountStatus} />
              {user.vendorStatus !== "none" ? <StatusBadge status={user.vendorStatus} /> : null}
            </div>
            <ul className="space-y-1 text-sm text-textMuted">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-textSubtle" aria-hidden />
                {user.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-textSubtle" aria-hidden />
                {user.phone ?? "No phone"}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-textSubtle" aria-hidden />
                {[user.city, user.region].filter(Boolean).join(", ") || "No location"}
              </li>
            </ul>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4 lg:grid-cols-2 lg:gap-x-8">
          <div>
            <dt className="text-textMuted">Orders</dt>
            <dd className="font-semibold tabular-nums text-textStrong">{user.stats.totalOrders}</dd>
          </div>
          <div>
            <dt className="text-textMuted">Spent</dt>
            <dd className="font-semibold tabular-nums text-textStrong">
              {formatCurrency(user.stats.totalSpent)}
            </dd>
          </div>
          <div>
            <dt className="text-textMuted">Reviews</dt>
            <dd className="font-semibold tabular-nums text-textStrong">{user.stats.totalReviews}</dd>
          </div>
          <div>
            <dt className="text-textMuted">Joined</dt>
            <dd className="font-semibold text-textStrong">{formatDate(user.joinedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function UserOverviewKpiRow({ user }: { user: AdminUserDetail }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label="Cart items"
        value={String(user.stats.totalCartItems)}
        hint="Active basket"
        icon={ShoppingBag}
        animationDelay={40}
      />
      <StatCard
        label="Wishlist"
        value={String(user.stats.totalWishlistItems)}
        icon={Star}
        tone="info"
        animationDelay={80}
      />
      <StatCard
        label="Saved addresses"
        value={String(user.stats.totalSavedAddresses)}
        icon={MapPin}
        animationDelay={120}
      />
      <StatCard
        label="Wallet balance"
        value={
          user.customerWallet ? formatCurrency(user.customerWallet.balance) : "No wallet"
        }
        icon={Wallet}
        tone="success"
        animationDelay={160}
      />
    </div>
  );
}

export function UserDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return <DetailField label={label} value={value} />;
}

export function UserSnapshotGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-line/70 bg-surfaceMuted/25 px-4 py-4">
      <header className="border-b border-line/70 pb-2">
        <p className="text-sm font-semibold text-textStrong">{title}</p>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-textMuted">{description}</p> : null}
      </header>
      <dl className="divide-y divide-line/80 text-sm">{children}</dl>
    </div>
  );
}

export function UserSnapshotMetric({ label, value }: { label: string; value: string }) {
  return <DetailField label={label} value={value} />;
}

export function PreferenceToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
      <span className="text-sm text-textStrong">{label}</span>
      <span
        className={clsx(
          "rounded-full px-3 py-1 text-xs font-semibold",
          enabled
            ? "border border-success/25 bg-success-soft text-success"
            : "border border-line bg-surfaceMuted text-textMuted",
        )}
      >
        {enabled ? "On" : "Off"}
      </span>
    </div>
  );
}
