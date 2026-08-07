import type { AdminPermissionLevel, AdminUser } from "@/types";
import { mapAdminUser } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

type BackendAdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url?: string | null;
  roles: string[];
  admin_permission?: string | null;
  vendor_status: AdminUser["vendorStatus"];
  account_status: AdminUser["accountStatus"];
  joined_at: string;
};

const staffListApi = createPaginatedAdminApi<BackendAdminUser, AdminUser>({
  path: "/admin/staff",
  mapItem: mapAdminUser,
});

export const getAdminStaffPage = staffListApi.getPage;

export type CreateAdminStaffPayload = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  adminPermission: AdminPermissionLevel;
};

export async function createAdminStaff(
  token: string,
  payload: CreateAdminStaffPayload,
): Promise<AdminUser> {
  const user = await requestJson<BackendAdminUser>("/admin/staff", {
    method: "POST",
    token,
    body: JSON.stringify({
      full_name: payload.fullName.trim(),
      email: payload.email.trim(),
      password: payload.password,
      phone_number: payload.phoneNumber?.trim() || null,
      admin_permission: payload.adminPermission,
    }),
  });
  return mapAdminUser(user);
}

export async function updateAdminStaffPermission(
  token: string,
  userId: string,
  adminPermission: AdminPermissionLevel,
): Promise<AdminUser> {
  const user = await requestJson<BackendAdminUser>(`/admin/users/${userId}/permission`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ admin_permission: adminPermission }),
  });
  return mapAdminUser(user);
}
