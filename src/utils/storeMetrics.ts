import type { Store, StoreStatus } from "@/types";
import { buildStoreSnapshot } from "@/utils/sectionMetrics";

export type StoreDirectoryTab = "all" | "active" | "draft" | "suspended";

const TAB_STATUS: Record<Exclude<StoreDirectoryTab, "all">, StoreStatus> = {
  active: "active",
  draft: "draft",
  suspended: "suspended",
};

export function filterStoresByTab(stores: Store[], tab: StoreDirectoryTab) {
  if (tab === "all") {
    return stores;
  }
  return stores.filter((store) => store.status === TAB_STATUS[tab]);
}

export function buildStoreDirectorySnapshot(stores: Store[]) {
  return buildStoreSnapshot(stores);
}
