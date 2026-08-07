import type { Market } from "@/types";

export type MarketDirectoryTab = "all" | "active" | "disabled";

export function filterMarketsByTab(markets: Market[], tab: MarketDirectoryTab) {
  if (tab === "all") return markets;
  return markets.filter((market) => market.status === tab);
}

export function buildMarketDirectorySnapshot(markets: Market[]) {
  return {
    total: markets.length,
    active: markets.filter((market) => market.status === "active").length,
    disabled: markets.filter((market) => market.status === "disabled").length,
  };
}
