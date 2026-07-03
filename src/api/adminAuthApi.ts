import type { AdminSession, AdminUser } from "@/types";
import { mapAdminUser } from "@/api/mappers";
import { requestJson } from "@/api/client";

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

type BootstrapStatus = {
  bootstrapEnabled: boolean;
};

type BackendAdminAuthUser = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url?: string | null;
  roles: string[];
  admin_permission?: string | null;
  vendor_status: AdminUser["vendorStatus"];
  account_status?: AdminUser["accountStatus"];
  vendor_id?: string | null;
  vendor_rejection_reason?: string | null;
  is_active?: boolean;
  role?: "customer" | "vendor" | "admin";
  joined_at?: string;
  created_at?: string;
};

function mapAdminMePayload(user: BackendAdminAuthUser): AdminUser {
  const mappedUser = mapAdminUser({
    ...user,
    account_status: user.account_status ?? (user.is_active === false ? "blocked" : "active"),
    joined_at: user.joined_at ?? user.created_at ?? new Date().toISOString(),
  });
  if (!mappedUser.roles.includes("admin")) {
    throw new Error("This account does not have admin access.");
  }
  return mappedUser;
}

export async function loginAdmin(payload: LoginPayload): Promise<AdminSession> {
  const response = await requestJson<{
    access_token: string;
    user: BackendAdminAuthUser;
  }>(
    "/admin/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return {
    token: response.access_token,
    user: mapAdminMePayload(response.user),
  };
}

export async function getAdminBootstrapStatus(): Promise<BootstrapStatus> {
  const response = await requestJson<{ bootstrap_enabled: boolean }>(
    "/admin/auth/bootstrap-status",
  );
  return { bootstrapEnabled: response.bootstrap_enabled };
}

export async function signupFirstAdmin(payload: SignupPayload): Promise<AdminSession> {
  const response = await requestJson<{
    access_token: string;
    user: BackendAdminAuthUser;
  }>("/admin/auth/bootstrap-signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: payload.fullName,
      email: payload.email,
      password: payload.password,
      phone_number: payload.phoneNumber?.trim() || null,
    }),
  });

  return {
    token: response.access_token,
    user: mapAdminMePayload(response.user),
  };
}

export async function getAdminMe(token: string): Promise<AdminUser> {
  const user = await requestJson<BackendAdminAuthUser>("/admin/auth/me", { token });
  return mapAdminMePayload(user);
}

type UpdateAdminMePayload = {
  fullName: string;
  phoneNumber: string;
  avatarFile?: File | null;
};

export async function updateAdminMe(
  token: string,
  payload: UpdateAdminMePayload,
): Promise<AdminUser> {
  const formData = new FormData();
  formData.append("full_name", payload.fullName.trim());
  formData.append("phone_number", payload.phoneNumber.trim());
  if (payload.avatarFile) {
    formData.append("avatar_image", payload.avatarFile);
  }

  const user = await requestJson<BackendAdminAuthUser>("/admin/auth/me", {
    method: "PATCH",
    token,
    body: formData,
  });

  return mapAdminMePayload(user);
}
