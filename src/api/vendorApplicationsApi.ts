import type { VendorApplication } from "@/types";
import { mapVendorApplication, type BackendVendorApplication } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getVendorApplications(token: string) {
  const applications = await requestJson<BackendVendorApplication[]>(
    "/admin/vendor-applications",
    { token },
  );
  return applications.map(mapVendorApplication);
}

export async function approveVendorApplication(token: string, applicationId: string) {
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
