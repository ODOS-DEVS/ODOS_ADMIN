import type { AccountStatus, AdminUser, AdminUserDetail } from "@/types";
import { mapAdminUser, mapAdminUserDetail } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getUsers(token: string) {
  const users = await requestJson<
    Array<{
      id: string;
      full_name: string;
      email: string;
      phone_number: string | null;
      avatar_url?: string | null;
      roles: string[];
      vendor_status: AdminUser["vendorStatus"];
      account_status: AccountStatus;
      joined_at: string;
    }>
  >("/admin/users", { token });
  return users.map(mapAdminUser);
}

export async function getUser(token: string, userId: string): Promise<AdminUserDetail> {
  const user = await requestJson<
    {
      id: string;
      full_name: string;
      email: string;
      phone_number: string | null;
      avatar_url?: string | null;
      roles: string[];
      vendor_status: AdminUser["vendorStatus"];
      account_status: AccountStatus;
      joined_at: string;
      date_of_birth?: string | null;
      gender?: string | null;
      city?: string | null;
      region?: string | null;
      allow_notifications: boolean;
      discount_notifications: boolean;
      store_notifications: boolean;
      system_notifications: boolean;
      location_notifications: boolean;
      location_updates: boolean;
      vendor_rejection_reason?: string | null;
      is_verified: boolean;
      last_login_at?: string | null;
      updated_at: string;
      auth_providers: string[];
      addresses: Array<{
        id: string;
        label: string | null;
        full_name: string;
        phone: string;
        street: string;
        city: string;
        region: string;
        is_default: boolean;
        created_at: string;
        updated_at: string;
      }>;
      payment_methods: Array<{
        id: string;
        type: string;
        label: string;
        is_default: boolean;
        card_name?: string | null;
        card_last4?: string | null;
        expiry?: string | null;
        network?: string | null;
        phone?: string | null;
        created_at: string;
        updated_at: string;
      }>;
      vendor_application?: {
        id: string;
        status: AdminUser["vendorStatus"];
        business_name: string;
        business_category: string;
        business_description: string;
        phone_number: string;
        whatsapp_number?: string | null;
        region: string;
        city: string;
        market_id?: string | null;
        store_location?: string | null;
        store_name: string;
        store_description?: string | null;
        ghana_card_number?: string | null;
        business_registration_number?: string | null;
        logo_image_url?: string | null;
        banner_image_url?: string | null;
        shop_image_url?: string | null;
        rejection_reason?: string | null;
        reviewed_at?: string | null;
        submitted_at: string;
        created_at: string;
        updated_at: string;
      } | null;
      stores: Array<{
        id: string;
        name: string;
        slug: string;
        status: string;
        logo_image?: string | null;
        banner_image?: string | null;
        market_id?: string | null;
        location?: string | null;
        region: string;
        city: string;
        created_at: string;
        updated_at: string;
      }>;
      stats: {
        total_orders: number;
        total_reviews: number;
        total_saved_addresses: number;
        total_saved_payment_methods: number;
        total_cart_items: number;
        total_wishlist_items: number;
        total_notifications: number;
        total_spent: number;
        last_order_at?: string | null;
        last_review_at?: string | null;
      };
    }
  >(`/admin/users/${userId}`, { token });
  return mapAdminUserDetail(user);
}

export async function updateUserStatus(token: string, userId: string, accountStatus: AccountStatus) {
  const user = await requestJson<{
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    avatar_url?: string | null;
    roles: string[];
    vendor_status: AdminUser["vendorStatus"];
    account_status: AccountStatus;
    joined_at: string;
  }>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ account_status: accountStatus }),
  });
  return mapAdminUser(user);
}
