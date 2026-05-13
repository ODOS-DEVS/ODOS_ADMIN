import type { AccountStatus, AdminUser } from "@/types";
import { mapAdminUser } from "@/api/mappers";
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
