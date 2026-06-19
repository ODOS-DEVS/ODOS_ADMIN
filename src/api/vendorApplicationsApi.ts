import type { VendorApplication } from "@/types";
import {
  mapVendorApplication,
  type BackendVendorApplication,
} from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

const vendorApplicationsListApi = createPaginatedAdminApi<
  BackendVendorApplication,
  VendorApplication
>({
  path: "/admin/vendor-applications",
  mapItem: mapVendorApplication,
});

export const getVendorApplicationsPage = vendorApplicationsListApi.getPage;
export const getVendorApplications = vendorApplicationsListApi.getAll;

export async function approveVendorApplication(
  token: string,
  applicationId: string,
) {
  const application = await requestJson<BackendVendorApplication>(
    `/admin/vendor-applications/${applicationId}/approve`,
    {
      method: "PATCH",
      token,
    },
  );
  return mapVendorApplication(application);
}

export async function rejectVendorApplication(
  token: string,
  applicationId: string,
  rejectionReason: string,
) {
  const application = await requestJson<BackendVendorApplication>(
    `/admin/vendor-applications/${applicationId}/reject`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    },
  );
  return mapVendorApplication(application);
}
