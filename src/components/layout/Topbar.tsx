import { Bell, Menu } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useOpsQueueBadges } from "@/hooks/useOpsQueueBadges";

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
  const { badges } = useOpsQueueBadges();
  const [query, setQuery] = useState("");

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

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-canvas/80 px-4 py-4 backdrop-blur xl:px-8">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
              Admin Workspace
            </p>
            <h1 className="mt-1 text-lg font-semibold text-textStrong">
              Welcome back{adminUser ? `, ${adminUser.fullName.split(" ")[0]}` : ""}
            </h1>
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
              <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            ) : null}
          </Button>
          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right xl:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
              Live control
            </p>
            <p className="mt-1 text-sm text-textStrong">
              {adminUser ? `${adminUser.fullName.split(" ")[0]}'s workspace` : "ODOS command center"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
