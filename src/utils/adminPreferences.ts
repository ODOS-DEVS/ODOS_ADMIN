export type AdminPreferences = {
  defaultLandingPage: "/dashboard" | "/analytics" | "/orders" | "/vendor-applications";
  vendorAlerts: boolean;
  orderAlerts: boolean;
  securityAlerts: boolean;
  compactTables: boolean;
  confirmDestructiveActions: boolean;
  highlightFreshCatalog: boolean;
  featureFlashSalesFirst: boolean;
};

const ADMIN_PREFERENCES_KEY = "odos_admin_preferences";

export const defaultAdminPreferences: AdminPreferences = {
  defaultLandingPage: "/dashboard",
  vendorAlerts: true,
  orderAlerts: true,
  securityAlerts: true,
  compactTables: false,
  confirmDestructiveActions: true,
  highlightFreshCatalog: true,
  featureFlashSalesFirst: true,
};

export function getStoredAdminPreferences(): AdminPreferences {
  if (typeof window === "undefined") {
    return defaultAdminPreferences;
  }

  const rawValue = window.localStorage.getItem(ADMIN_PREFERENCES_KEY);
  if (!rawValue) {
    return defaultAdminPreferences;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AdminPreferences>;
    return { ...defaultAdminPreferences, ...parsed };
  } catch {
    return defaultAdminPreferences;
  }
}

export function setStoredAdminPreferences(preferences: AdminPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_PREFERENCES_KEY, JSON.stringify(preferences));
}
