import { mockDashboard } from "@/data/mockData";
import type { DashboardPayload } from "@/types";
import { mapDashboard } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export async function getDashboardOverview(token: string) {
  return withFallback<DashboardPayload>(
    async () => {
      const payload = await requestJson<{
        stats: {
          total_users: number;
          total_vendors: number;
          pending_vendor_applications: number;
          total_stores: number;
          total_products: number;
          total_orders: number;
          pending_orders: number;
          total_revenue: number;
        };
        recent_orders: Array<{
          id: string;
          order_number: string;
          customer_name: string;
          store_name: string;
          total_amount: number;
          status: DashboardPayload["recentOrders"][number]["status"];
          payment_status: DashboardPayload["recentOrders"][number]["paymentStatus"];
          created_at: string;
        }>;
        recent_vendor_applications: Array<{
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
          status: DashboardPayload["recentVendorApplications"][number]["status"];
          rejection_reason?: string | null;
          submitted_at?: string;
          created_at: string;
          updated_at: string;
        }>;
        recent_notifications: Array<{
          id: string;
          type: DashboardPayload["recentNotifications"][number]["type"];
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        }>;
      }>("/admin/dashboard", { token });
      return mapDashboard(payload);
    },
    () => mockDashboard,
  );
}
