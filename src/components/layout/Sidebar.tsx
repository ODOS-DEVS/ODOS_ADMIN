import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Boxes,
  Landmark,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareMore,
  Package,
  RefreshCcw,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Truck,
  Wallet,
  TicketPercent,
  Tags,
  UserCog,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useOpsQueueBadges } from "@/hooks/useOpsQueueBadges";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: keyof ReturnType<typeof useOpsQueueBadges>["badges"];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Command",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/audit", label: "Audit log", icon: Shield },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/users/full", label: "Users", icon: Users },
      { to: "/vendors/full", label: "Vendors", icon: UserCog },
      {
        to: "/vendor-applications/full",
        label: "Vendor applications",
        icon: FolderKanban,
        badgeKey: "pendingVendorApplications",
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/stores/full", label: "Stores", icon: Store },
      { to: "/markets/full", label: "Markets", icon: Warehouse },
      { to: "/categories/full", label: "Categories", icon: Tags },
      {
        to: "/products/full",
        label: "Products",
        icon: Package,
        badgeKey: "pendingProducts",
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        to: "/orders/full",
        label: "Orders",
        icon: ShoppingBag,
        badgeKey: "pendingOrders",
      },
      {
        to: "/returns/full",
        label: "Returns",
        icon: RefreshCcw,
        badgeKey: "openReturnRequests",
      },
      { to: "/delivery-settings", label: "Delivery", icon: Truck },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/vouchers/full", label: "Vouchers", icon: TicketPercent },
      { to: "/promo-banners/full", label: "Promo banners", icon: Megaphone },
      { to: "/merchandising-campaigns/full", label: "Campaigns", icon: Tags },
      { to: "/flash-sale-events/full", label: "Flash sale events", icon: Zap },
      { to: "/promo-analytics/full", label: "Promo performance", icon: BarChart3 },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/finance/full", label: "Finance", icon: Landmark },
      {
        to: "/payouts",
        label: "Payouts",
        icon: Wallet,
        badgeKey: "pendingWithdrawals",
      },
    ],
  },
  {
    label: "Community",
    items: [
      { to: "/reviews/full", label: "Reviews", icon: Star },
      {
        to: "/support-chats/full",
        label: "Support chats",
        icon: MessageSquareMore,
        badgeKey: "supportWaitingOnAdmin",
      },
      { to: "/notifications/full", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings", icon: Boxes }],
  },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { adminUser, logout } = useAdminAuth();
  const { canAccessRoute } = useAdminPermissions();
  const { badges } = useOpsQueueBadges();
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(item.to)),
    }))
    .filter((group) => group.items.length > 0);
  const initials = adminUser?.fullName
    ?.split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition lg:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-line bg-surface px-4 py-5 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accentForeground shadow-sm">
            O
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-textStrong">ODOS Admin</p>
            <p className="truncate text-xs text-textMuted">Business operations</p>
          </div>
        </div>

        <div className="mt-5 px-1">
          <SearchInput placeholder="Search navigation…" aria-label="Filter navigation" />
        </div>

        <nav className="mt-5 flex-1 space-y-5 overflow-y-auto px-1 pr-0.5">
          {visibleNavGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-textSubtle">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "border border-line bg-surface text-textStrong shadow-nav-active"
                            : "text-textMuted hover:bg-surfaceMuted hover:text-textStrong"
                        }`
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {badge > 0 ? (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold tabular-nums text-warning">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t border-line px-1 pt-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            {adminUser?.avatarUrl ? (
              <img
                src={adminUser.avatarUrl}
                alt={adminUser.fullName}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-accentSoft text-sm font-semibold text-accent">
                {initials ?? "OA"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-textStrong">
                {adminUser?.fullName ?? "ODOS Admin"}
              </p>
              <p className="truncate text-xs text-textMuted">
                {adminUser?.email ?? "admin@odos.app"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="mt-2 w-full justify-start px-2"
            leftIcon={<LogOut className="size-4" />}
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
