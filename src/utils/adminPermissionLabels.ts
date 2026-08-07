import type { AdminPermissionLevel } from "@/types";

export const ADMIN_PERMISSION_OPTIONS: Array<{
  value: AdminPermissionLevel;
  label: string;
  description: string;
}> = [
  {
    value: "super_admin",
    label: "Super admin",
    description: "Full access to every desk, settings, and staff management.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Broad marketplace operations except super-admin-only controls.",
  },
  {
    value: "moderator",
    label: "Moderator",
    description: "Catalog, vendors, reviews, support, and notifications.",
  },
  {
    value: "support",
    label: "Support",
    description: "Users, orders, returns, notifications, and support chats.",
  },
  {
    value: "finance",
    label: "Finance",
    description: "Treasury, payouts, orders, analytics, and audit log.",
  },
  {
    value: "inventory",
    label: "Inventory",
    description: "Products, stores, markets, categories, and promotions.",
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "Promotions, notifications, products, analytics, and audit.",
  },
  {
    value: "analyst",
    label: "Analyst",
    description: "Dashboard, analytics, and audit log only.",
  },
];

export function labelForAdminPermission(level?: AdminPermissionLevel | null) {
  return (
    ADMIN_PERMISSION_OPTIONS.find((option) => option.value === level)?.label ??
    (level ? level.replace(/_/g, " ") : "Admin")
  );
}
