import { useCallback, useEffect, useState } from "react";

import { getDashboardOverview } from "@/api/dashboardApi";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { DashboardStats } from "@/types";
import { getStoredAdminPreferences } from "@/utils/adminPreferences";

export type OpsQueueBadges = {
  pendingOrders: number;
  pendingVendorApplications: number;
  pendingProducts: number;
  openReturnRequests: number;
  supportWaitingOnAdmin: number;
  pendingWithdrawals: number;
};

const EMPTY: OpsQueueBadges = {
  pendingOrders: 0,
  pendingVendorApplications: 0,
  pendingProducts: 0,
  openReturnRequests: 0,
  supportWaitingOnAdmin: 0,
  pendingWithdrawals: 0,
};

function fromStats(stats: DashboardStats): OpsQueueBadges {
  return {
    pendingOrders: stats.pendingOrders,
    pendingVendorApplications: stats.pendingVendorApplications,
    pendingProducts: stats.pendingProducts,
    openReturnRequests: stats.openReturnRequests,
    supportWaitingOnAdmin: stats.supportWaitingOnAdmin,
    pendingWithdrawals: stats.pendingWithdrawals,
  };
}

/** Lightweight queue counts for sidebar badges / topbar alerts. */
export function useOpsQueueBadges() {
  const { token } = useAdminAuth();
  const [badges, setBadges] = useState<OpsQueueBadges>(EMPTY);

  const refresh = useCallback(async () => {
    if (!token) {
      setBadges(EMPTY);
      return;
    }
    try {
      const payload = await getDashboardOverview(token);
      const prefs = getStoredAdminPreferences();
      const next = fromStats(payload.stats);
      if (!prefs.orderAlerts) {
        next.pendingOrders = 0;
      }
      if (!prefs.vendorAlerts) {
        next.pendingVendorApplications = 0;
        next.pendingWithdrawals = 0;
      }
      setBadges(next);
    } catch {
      // Non-fatal — badges stay at last known / empty.
    }
  }, [token]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { badges, refresh };
}
