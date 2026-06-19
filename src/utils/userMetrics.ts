import type { AdminUser } from "@/types";

export type UserDirectorySnapshot = {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  inactiveUsers: number;
  customers: number;
  vendors: number;
  admins: number;
  pendingVendors: number;
  verifiedUsers: number;
};

export function buildUserDirectorySnapshot(users: AdminUser[]): UserDirectorySnapshot {
  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.accountStatus === "active").length,
    blockedUsers: users.filter((user) => user.accountStatus === "blocked").length,
    inactiveUsers: users.filter((user) => user.accountStatus === "inactive").length,
    customers: users.filter((user) => user.roles.includes("customer")).length,
    vendors: users.filter((user) => user.roles.includes("vendor")).length,
    admins: users.filter((user) => user.roles.includes("admin")).length,
    pendingVendors: users.filter((user) => user.vendorStatus === "pending").length,
    verifiedUsers: 0,
  };
}

export type UserDirectoryTab = "all" | "customers" | "vendors" | "admins" | "blocked";

export function filterUsersByTab(users: AdminUser[], tab: UserDirectoryTab): AdminUser[] {
  switch (tab) {
    case "customers":
      return users.filter((user) => user.roles.includes("customer"));
    case "vendors":
      return users.filter((user) => user.roles.includes("vendor"));
    case "admins":
      return users.filter((user) => user.roles.includes("admin"));
    case "blocked":
      return users.filter((user) => user.accountStatus === "blocked");
    default:
      return users;
  }
}
