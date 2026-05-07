import { mockVendors } from "@/data/mockData";
import type { Vendor } from "@/types";
import { mapVendor } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export async function getVendors(token: string) {
  return withFallback<Vendor[]>(
    async () => {
      const vendors = await requestJson<
        Array<{
          id: string;
          user_id: string;
          business_name: string;
          business_category: string;
          status: Vendor["status"];
          email: string;
          phone_number: string | null;
          total_stores: number;
          total_products: number;
          total_orders: number;
          total_sales: number;
          joined_at: string;
        }>
      >("/admin/vendors", { token });
      return vendors.map(mapVendor);
    },
    () => mockVendors,
  );
}

export async function updateVendorStatus(token: string, vendorId: string, status: Vendor["status"]) {
  return withFallback<Vendor>(
    async () => {
      const vendor = await requestJson<{
        id: string;
        user_id: string;
        business_name: string;
        business_category: string;
        status: Vendor["status"];
        email: string;
        phone_number: string | null;
        total_stores: number;
        total_products: number;
        total_orders: number;
        total_sales: number;
        joined_at: string;
      }>(`/admin/vendors/${vendorId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      return mapVendor(vendor);
    },
    () => {
      const vendor = mockVendors.find((item) => item.id === vendorId);
      if (!vendor) {
        throw new Error("Vendor not found");
      }
      vendor.status = status;
      return vendor;
    },
  );
}
