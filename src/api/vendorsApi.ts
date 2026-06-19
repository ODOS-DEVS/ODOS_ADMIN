import type { Vendor } from "@/types";
import { mapVendor } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

type BackendVendor = {
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
};

const vendorsListApi = createPaginatedAdminApi<BackendVendor, Vendor>({
  path: "/admin/vendors",
  mapItem: mapVendor,
});

export const getVendorsPage = vendorsListApi.getPage;
export const getVendors = vendorsListApi.getAll;

export async function updateVendorStatus(
  token: string,
  vendorId: string,
  status: Vendor["status"],
) {
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
}
