import type { Vendor } from "@/types";

export type VendorDirectoryTab = "all" | "active" | "suspended";

export function filterVendorsByTab(vendors: Vendor[], tab: VendorDirectoryTab) {
  if (tab === "all") {
    return vendors;
  }
  return vendors.filter((vendor) => vendor.status === tab);
}

export function buildVendorDirectorySnapshot(vendors: Vendor[]) {
  const active = vendors.filter((vendor) => vendor.status === "active").length;
  const suspended = vendors.filter((vendor) => vendor.status === "suspended").length;
  const totalStores = vendors.reduce((sum, vendor) => sum + vendor.totalStores, 0);
  const totalProducts = vendors.reduce((sum, vendor) => sum + vendor.totalProducts, 0);
  const totalOrders = vendors.reduce((sum, vendor) => sum + vendor.totalOrders, 0);
  const totalSales = vendors.reduce((sum, vendor) => sum + vendor.totalSales, 0);

  return {
    totalVendors: vendors.length,
    active,
    suspended,
    totalStores,
    totalProducts,
    totalOrders,
    totalSales,
  };
}
