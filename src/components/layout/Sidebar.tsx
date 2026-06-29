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
import { useAdminAuth } from "@/hooks/useAdminAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/users", label: "Users", icon: Users },
  { to: "/vendors", label: "Vendors", icon: UserCog },
  {
    to: "/vendor-applications",
    label: "Vendor Applications",
    icon: FolderKanban,
  },
  { to: "/stores", label: "Stores", icon: Store },
  { to: "/markets", label: "Markets", icon: Warehouse },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/products", label: "Products", icon: Package },
  { to: "/finance", label: "Finance", icon: Landmark },
  { to: "/payouts", label: "Payouts", icon: Wallet },
  { to: "/returns", label: "Returns", icon: RefreshCcw },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/vouchers", label: "Vouchers", icon: TicketPercent },
  { to: "/promo-banners", label: "Promo Banners", icon: Megaphone },
  { to: "/flash-sale-events", label: "Flash Sale Events", icon: Zap },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/delivery-settings", label: "Delivery", icon: Truck },
  { to: "/support-chats", label: "Support Chats", icon: MessageSquareMore },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Boxes },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { adminUser, logout } = useAdminAuth();
  const initials = adminUser?.fullName
    ?.split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition lg:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-white/10 bg-[#08101d]/95 px-5 py-6 shadow-glow transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="rounded-3xl border border-white/10 bg-panel-gradient px-4 py-5">
          <p className="text-xs font-semibold text-center uppercase tracking-[0.28em] text-accentSoft">
            ODOS Admin
          </p>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border border-accent/20 bg-accent/15 text-textStrong"
                      : "text-textMuted hover:bg-white/5 hover:text-textStrong"
                  }`
                }
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-glow">
          <div className="flex items-center gap-3">
            {adminUser?.avatarUrl ? (
              <img
                src={adminUser.avatarUrl}
                alt={adminUser.fullName}
                className="size-12 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-sm font-semibold text-accentSoft">
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
            className="mt-4 w-full justify-center"
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
