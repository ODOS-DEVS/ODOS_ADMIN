import { Ban, Eye, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getUsers, updateUserStatus } from "@/api/usersApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { AccountStatus, AdminUser } from "@/types";
import { formatDate } from "@/utils/format";

function UserDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

export function UsersPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUsers(token);
      setUsers(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const haystack = [user.fullName, user.email, user.phone].join(" ").toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesRole = roleFilter === "all" ? true : user.roles.includes(roleFilter as never);
      const matchesStatus = statusFilter === "all" ? true : user.accountStatus === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  async function handleStatusUpdate(nextStatus: AccountStatus) {
    if (!token || !statusTarget) return;
    setActionLoading(true);

    try {
      const updated = await updateUserStatus(token, statusTarget.id, nextStatus);
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      showToast({
        title: nextStatus === "blocked" ? "User blocked" : "User reactivated",
        description: `${statusTarget.fullName} has been updated successfully.`,
        tone: "success",
      });
      setStatusTarget(null);
    } catch (updateError) {
      showToast({
        title: "Unable to update user",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading users..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadUsers()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Users"
        title="User management"
        description="Search the ODOS user base, understand account roles, and intervene when account access needs moderation."
      />

      <SectionCard
        title="All users"
        description="Filter by role, account status, or vendor state."
        action={
          <div className="flex flex-col gap-3 xl:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone"
              className="xl:w-80"
            />
            <FilterSelect
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              options={[
                { label: "All roles", value: "all" },
                { label: "Customer", value: "customer" },
                { label: "Vendor", value: "vendor" },
                { label: "Admin", value: "admin" },
              ]}
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Blocked", value: "blocked" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>
        }
      >
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Adjust your filters or search terms to surface more accounts."
          />
        ) : (
          <DataTable<AdminUser>
            columns={[
              {
                key: "user",
                header: "User",
                render: (user) => (
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="mt-1 text-xs text-textMuted">{user.email}</p>
                  </div>
                ),
              },
              {
                key: "phone",
                header: "Phone",
                render: (user) => user.phone,
              },
              {
                key: "roles",
                header: "Roles",
                render: (user) => (
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <StatusBadge key={role} status={role === "admin" ? "confirmed" : role} />
                    ))}
                  </div>
                ),
              },
              {
                key: "vendor",
                header: "Vendor status",
                render: (user) => <StatusBadge status={user.vendorStatus} />,
              },
              {
                key: "account",
                header: "Account status",
                render: (user) => <StatusBadge status={user.accountStatus} />,
              },
              {
                key: "joined",
                header: "Joined",
                render: (user) => formatDate(user.joinedAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (user) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => setSelectedUser(user)}
                    >
                      View
                    </Button>
                    {user.roles.includes("admin") ? (
                      <Button
                        variant="ghost"
                        leftIcon={<ShieldCheck className="size-4" />}
                        disabled
                      >
                        Protected
                      </Button>
                    ) : (
                      <Button
                        variant={user.accountStatus === "blocked" ? "primary" : "danger"}
                        leftIcon={<Ban className="size-4" />}
                        onClick={() => setStatusTarget(user)}
                      >
                        {user.accountStatus === "blocked" ? "Unblock" : "Block"}
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredUsers}
            keyExtractor={(user) => user.id}
          />
        )}
      </SectionCard>

      <Modal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.fullName ?? "User details"}
        description="Profile, role, and vendor access details for this account."
      >
        {selectedUser ? (
          <div className="grid gap-4 md:grid-cols-2">
            <UserDetailRow label="Email" value={selectedUser.email} />
            <UserDetailRow label="Phone" value={selectedUser.phone ?? "Not provided"} />
            <UserDetailRow label="Roles" value={selectedUser.roles.join(", ")} />
            <UserDetailRow label="Vendor status" value={selectedUser.vendorStatus} />
            <UserDetailRow label="Account status" value={selectedUser.accountStatus} />
            <UserDetailRow label="Joined date" value={formatDate(selectedUser.joinedAt)} />
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          void handleStatusUpdate(statusTarget?.accountStatus === "blocked" ? "active" : "blocked")
        }
        title={
          statusTarget?.accountStatus === "blocked" ? "Restore user access" : "Block this user"
        }
        description={
          statusTarget?.accountStatus === "blocked"
            ? `Restore ${statusTarget.fullName}'s access to the ODOS platform.`
            : `Block ${statusTarget?.fullName} from using the ODOS platform until manually restored.`
        }
        confirmLabel={statusTarget?.accountStatus === "blocked" ? "Restore access" : "Block user"}
        confirmVariant={statusTarget?.accountStatus === "blocked" ? "primary" : "danger"}
        isLoading={actionLoading}
      />
    </div>
  );
}
