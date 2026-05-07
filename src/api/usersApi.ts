import { mockUsers } from "@/data/mockData";
import type { AccountStatus, AdminUser } from "@/types";
import { mapAdminUser } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export async function getUsers(token: string) {
  return withFallback<AdminUser[]>(
    async () => {
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
    },
    () => mockUsers,
  );
}

export async function updateUserStatus(token: string, userId: string, accountStatus: AccountStatus) {
  return withFallback<AdminUser>(
    async () => {
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
    },
    () => {
      const user = mockUsers.find((item) => item.id === userId);
      if (!user) {
        throw new Error("User not found");
      }
      user.accountStatus = accountStatus;
      return user;
    },
  );
}
