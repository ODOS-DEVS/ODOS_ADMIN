import { Bell, Menu } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useOpsQueueBadges } from "@/hooks/useOpsQueueBadges";
import { resolvePageTitle } from "@/utils/pageTitles";

type TopbarProps = {
  onMenu: () => void;
};

function resolveSearchTarget(raw: string) {
  const query = raw.trim();
  if (!query) return null;

  const lower = query.toLowerCase();
  if (lower.startsWith("ord") || /^#?\d{4,}/.test(query) || lower.includes("order")) {
    return `/orders/full?q=${encodeURIComponent(query.replace(/^order:?\s*/i, ""))}`;
  }
  if (lower.startsWith("vendor") || lower.startsWith("store")) {
    return `/vendors/full?q=${encodeURIComponent(query.replace(/^(vendor|store):?\s*/i, ""))}`;
  }
  return `/users/full?q=${encodeURIComponent(query)}`;
}

export function Topbar({ onMenu }: TopbarProps) {
  const { adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { badges } = useOpsQueueBadges();
  const [query, setQuery] = useState("");

  const pageTitle = resolvePageTitle(pathname);
  const alertCount = useMemo(
    () =>
      badges.pendingOrders +
      badges.pendingVendorApplications +
      badges.pendingProducts +
      badges.openReturnRequests +
      badges.supportWaitingOnAdmin +
      badges.pendingWithdrawals,
    [badges],
  );

  const initials = adminUser?.fullName
    ?.split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 px-4 py-4 backdrop-blur xl:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onMenu}
            className="p-2 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-textStrong">{pageTitle}</h1>
            <p className="mt-0.5 text-sm text-textMuted">ODOS marketplace operations</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            className="w-full sm:w-80"
            onSubmit={(event) => {
              event.preventDefault();
              const target = resolveSearchTarget(query);
              if (target) {
                navigate(target);
                setQuery("");
              }
            }}
          >
            <SearchInput
              placeholder="Search users, orders, vendors..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search marketplace"
            />
          </form>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/dashboard")}
              className="relative p-3"
              aria-label={
                alertCount > 0
                  ? `Open attention queues, ${alertCount} alerts`
                  : "Open attention queues"
              }
            >
              <Bell className="size-4" />
              {alertCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              ) : null}
            </Button>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 shadow-sm">
              {adminUser?.avatarUrl ? (
                <img
                  src={adminUser.avatarUrl}
                  alt={adminUser.fullName}
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-accentSoft text-xs font-semibold text-accent">
                  {initials ?? "OA"}
                </div>
              )}
              <div className="hidden min-w-0 pr-1 sm:block">
                <p className="truncate text-sm font-medium text-textStrong">
                  {adminUser?.fullName ?? "Admin"}
                </p>
                <p className="truncate text-xs text-textMuted">{adminUser?.email ?? ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
