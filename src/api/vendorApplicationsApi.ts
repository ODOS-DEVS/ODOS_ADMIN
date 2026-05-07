import { mockUsers, mockVendorApplications, mockVendors, mockStores } from "@/data/mockData";
import type { VendorApplication } from "@/types";
import { mapVendorApplication } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export async function getVendorApplications(token: string) {
  return withFallback<VendorApplication[]>(
    async () => {
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
    },
    () => mockVendorApplications,
  );
}

export async function approveVendorApplication(token: string, applicationId: string) {
  return withFallback<VendorApplication>(
    async () => {
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
    },
    () => {
      const application = mockVendorApplications.find((item) => item.id === applicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      application.status = "approved";
      application.updatedAt = new Date().toISOString();
      application.rejectionReason = null;

      const user = mockUsers.find((item) => item.id === application.userId);
      if (user && !user.roles.includes("vendor")) {
        user.roles = [...user.roles, "vendor"];
        user.vendorStatus = "approved";
      }

      const vendorId = `vendor-${application.userId}`;
      if (!mockVendors.find((item) => item.id === vendorId)) {
        mockVendors.unshift({
          id: vendorId,
          userId: application.userId,
          businessName: application.businessName,
          businessCategory: application.businessCategory,
          status: "active",
          email: user?.email ?? "vendor@odos.app",
          phoneNumber: application.phoneNumber,
          totalStores: 1,
          totalProducts: 0,
          totalOrders: 0,
          totalSales: 0,
          joinedAt: new Date().toISOString(),
        });
      }

      if (!mockStores.find((item) => item.vendorId === vendorId)) {
        mockStores.unshift({
          id: `store-${application.userId}`,
          vendorId,
          name: application.storeName,
          slug: application.storeName.toLowerCase().replace(/\s+/g, "-"),
          description: application.storeDescription ?? application.businessDescription,
          category: application.businessCategory,
          marketId: application.marketId ?? "market-1",
          location: application.city,
          region: application.region,
          city: application.city,
          status: "active",
          createdAt: new Date().toISOString(),
        });
      }

      return application;
    },
  );
}

export async function rejectVendorApplication(
  token: string,
  applicationId: string,
  rejectionReason: string,
) {
  return withFallback<VendorApplication>(
    async () => {
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
    },
    () => {
      const application = mockVendorApplications.find((item) => item.id === applicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      application.status = "rejected";
      application.rejectionReason = rejectionReason;
      application.updatedAt = new Date().toISOString();
      const user = mockUsers.find((item) => item.id === application.userId);
      if (user) {
        user.vendorStatus = "rejected";
      }
      return application;
    },
  );
}
