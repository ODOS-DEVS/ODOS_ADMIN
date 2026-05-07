import { Bell, Menu } from "lucide-react";

import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type TopbarProps = {
  onMenu: () => void;
};

export function Topbar({ onMenu }: TopbarProps) {
  const { adminUser } = useAdminAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-canvas/80 px-4 py-4 backdrop-blur xl:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-textMuted transition hover:text-textStrong lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accentSoft">
              Admin Workspace
            </p>
            <h1 className="mt-1 text-lg font-semibold text-textStrong">
              Welcome back{adminUser ? `, ${adminUser.fullName.split(" ")[0]}` : ""}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput placeholder="Search users, orders, vendors..." className="w-full sm:w-80" />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-textMuted transition hover:text-textStrong"
          >
            <Bell className="size-4" />
          </button>
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
