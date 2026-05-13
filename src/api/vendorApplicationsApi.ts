import type { VendorApplication } from "@/types";
import { mapVendorApplication } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getVendorApplications(token: string) {
  const applications = await requestJson<
    Array<{
      id: string;
      user_id: string;
      business_name: string;
      business_category: string;
      business_description: string;
      phone_number: string;
      whatsapp_number?: string | null;
      region: string;
      city: string;
      market_id?: string | null;
      store_name: string;
      store_description?: string | null;
      status: VendorApplication["status"];
      rejection_reason?: string | null;
      submitted_at?: string;
      created_at: string;
      updated_at: string;
    }>
  >("/admin/vendor-applications", { token });
  return applications.map(mapVendorApplication);
}

export async function approveVendorApplication(token: string, applicationId: string) {
  const application = await requestJson<{
    id: string;
    user_id: string;
    business_name: string;
    business_category: string;
    business_description: string;
    phone_number: string;
    whatsapp_number?: string | null;
    region: string;
    city: string;
    market_id?: string | null;
    store_name: string;
    store_description?: string | null;
    status: VendorApplication["status"];
    rejection_reason?: string | null;
    submitted_at?: string;
    created_at: string;
    updated_at: string;
  }>(`/admin/vendor-applications/${applicationId}/approve`, {
    method: "PATCH",
    token,
  });
  return mapVendorApplication(application);
}

export async function rejectVendorApplication(
  token: string,
  applicationId: string,
  rejectionReason: string,
) {
  const application = await requestJson<{
    id: string;
    user_id: string;
    business_name: string;
    business_category: string;
    business_description: string;
    phone_number: string;
    whatsapp_number?: string | null;
    region: string;
    city: string;
    market_id?: string | null;
    store_name: string;
    store_description?: string | null;
    status: VendorApplication["status"];
    rejection_reason?: string | null;
    submitted_at?: string;
    created_at: string;
    updated_at: string;
  }>(`/admin/vendor-applications/${applicationId}/reject`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  return mapVendorApplication(application);
}
