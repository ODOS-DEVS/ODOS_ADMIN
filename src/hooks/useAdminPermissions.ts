import { useMemo } from "react";

import { useAdminAuth } from "@/hooks/useAdminAuth";

export type AdminPermissionLevel =
  | "super_admin"
  | "admin"
  | "support"
  | "finance"
  | "inventory"
  | "analyst";

const PERMISSION_FEATURES: Record<AdminPermissionLevel, Set<string> | "*"> = {
  super_admin: "*",
  admin: new Set([
    "dashboard",
    "analytics",
    "audit_log",
    "users",
    "vendors",
    "orders",
    "returns",
    "products",
    "stores",
    "markets",
    "categories",
    "promotions",
    "reviews",
    "notifications",
    "support",
    "delivery",
    "finance",
    "payouts",
  ]),
  support: new Set([
    "dashboard",
    "audit_log",
    "users",
    "orders",
    "returns",
    "notifications",
    "support",
  ]),
  finance: new Set([
    "dashboard",
    "analytics",
    "audit_log",
    "finance",
    "payouts",
    "orders",
  ]),
  inventory: new Set([
    "dashboard",
    "audit_log",
    "products",
    "stores",
    "markets",
    "categories",
    "promotions",
  ]),
  analyst: new Set(["dashboard", "analytics", "audit_log"]),
};

export const ROUTE_FEATURES: Record<string, string> = {
  "/dashboard": "dashboard",
  "/analytics": "analytics",
  "/audit": "audit_log",
  "/users": "users",
  "/vendors": "vendors",
  "/vendor-applications": "vendors",
  "/stores": "stores",
  "/markets": "markets",
  "/categories": "categories",
  "/products": "products",
  "/finance": "finance",
  "/payouts": "payouts",
  "/returns": "returns",
  "/reviews": "reviews",
  "/vouchers": "promotions",
  "/vouchers/full": "promotions",
  "/promo-banners": "promotions",
  "/merchandising-campaigns": "promotions",
  "/flash-sale-events": "promotions",
  "/orders": "orders",
  "/delivery-settings": "delivery",
  "/support-chats": "support",
  "/notifications": "notifications",
  "/settings": "dashboard",
};

function normalizePermission(value: string | null | undefined): AdminPermissionLevel {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw && raw in PERMISSION_FEATURES) {
    return raw as AdminPermissionLevel;
  }
  // Fail closed for unknown bands; treat missing as full admin for legacy accounts.
  if (!raw) {
    return "admin";
  }
  return "analyst";
}

export function useAdminPermissions() {
  const { adminUser } = useAdminAuth();

  return useMemo(() => {
    const level = normalizePermission(adminUser?.adminPermission);
    const allowed = PERMISSION_FEATURES[level];

    const canAccess = (feature: string) => {
      if (allowed === "*") return true;
      return allowed.has(feature);
    };

    const canAccessRoute = (route: string) => {
      const normalized = route.split("?")[0] || route;
      const exact = ROUTE_FEATURES[normalized];
      if (exact) {
        return canAccess(exact);
      }
      // Match nested full-studio routes (e.g. /vouchers/full/:id).
      const prefixMatch = Object.keys(ROUTE_FEATURES)
        .filter((key) => normalized === key || normalized.startsWith(`${key}/`))
        .sort((a, b) => b.length - a.length)[0];
      if (!prefixMatch) {
        return false;
      }
      return canAccess(ROUTE_FEATURES[prefixMatch]);
    };

    return {
      level,
      isSuperAdmin: level === "super_admin",
      canAccess,
      canAccessRoute,
    };
  }, [adminUser?.adminPermission]);
}
