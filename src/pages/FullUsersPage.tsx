import { ArrowLeft, ArrowRight, Ban, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getUsersPage, updateUserStatus } from "@/api/usersApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { UserSectionNav } from "@/components/users/UsersUi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { AccountStatus, AdminUser } from "@/types";
import {
  buildUserDirectorySnapshot,
  filterUsersByTab,
  type UserDirectoryTab,
} from "@/utils/userMetrics";
import { formatDate } from "@/utils/format";

const DIRECTORY_TABS = [
  { id: "all", label: "All" },
  { id: "customers", label: "Customers" },
  { id: "vendors", label: "Vendors" },
  { id: "admins", label: "Admins" },
  { id: "blocked", label: "Blocked" },
] as const;

export function FullUsersPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const {
    items: users,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getUsersPage,
    getId: (user) => user.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<UserDirectoryTab>("all");
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const snapshot = useMemo(() => buildUserDirectorySnapshot(users), [users]);

  const filteredUsers = useMemo(() => {
    const tabbed = filterUsersByTab(users, activeTab);
    return tabbed.filter((user) => {
      const haystack = [user.fullName, user.email, user.phone].join(" ").toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : user.accountStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [activeTab, query, statusFilter, users]);

  async function handleStatusUpdate(nextStatus: AccountStatus) {
    if (!token || !statusTarget) return;
    setActionLoading(true);
    try {
      const updated = await updateUserStatus(token, statusTarget.id, nextStatus);
      replaceItem(updated);
      showToast({
        title: nextStatus === "blocked" ? "User blocked" : "User reactivated",
        description: `${statusTarget.fullName} has been updated.`,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
            Full user directory
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">
            Complete account registry
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-textMuted">
            {snapshot.totalUsers} accounts · click any user to open their full profile with every order,
            payment, review, return, cart item, wishlist entry, vendor record, wallet balance, and support
            thread.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate("/users")}>
            Brief overview
          </Button>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />}
            onClick={() => void refresh()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <UserSectionNav
        sections={DIRECTORY_TABS.map((tab) => ({
          id: tab.id,
          label: `${tab.label} (${filterUsersByTab(users, tab.id).length})`,
        }))}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as UserDirectoryTab)}
      />

      <SectionCard
        compact
        title={`${DIRECTORY_TABS.find((tab) => tab.id === activeTab)?.label ?? "All"} users`}
        description={`Showing ${filteredUsers.length} account${filteredUsers.length === 1 ? "" : "s"}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone"
              className="sm:w-72"
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
        bodyClassName="p-0"
      >
        <AdminInfiniteList
          compact
          columns={[
            {
              key: "user",
              header: "User",
              render: (user) => (
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-textMuted">{user.email}</p>
                </div>
              ),
            },
            {
              key: "roles",
              header: "Roles",
              render: (user) => (
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <StatusBadge key={role} status={role === "admin" ? "confirmed" : role} />
                  ))}
                </div>
              ),
            },
            {
              key: "vendor",
              header: "Vendor",
              render: (user) => <StatusBadge status={user.vendorStatus} />,
            },
            {
              key: "account",
              header: "Account",
              render: (user) => <StatusBadge status={user.accountStatus} />,
            },
            {
              key: "joined",
              header: "Joined",
              render: (user) => formatDate(user.joinedAt),
            },
            {
              key: "actions",
              header: "",
              render: (user) => (
                <div className="flex flex-wrap justify-end gap-2">
                  {!user.roles.includes("admin") ? (
                    <Button
                      variant="ghost"
                      leftIcon={<Ban className="size-4" />}
                      onClick={(event) => {
                        event.stopPropagation();
                        setStatusTarget(user);
                      }}
                    >
                      {user.accountStatus === "blocked" ? "Unblock" : "Block"}
                    </Button>
                  ) : null}
                  <Button
                    leftIcon={<ArrowRight className="size-4" />}
                    onClick={() => navigate(`/users/full/${user.id}`)}
                  >
                    Full profile
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredUsers}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={() => void loadMore()}
          onRetry={() => void refresh()}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your search or filters."
        />
      </SectionCard>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          void handleStatusUpdate(statusTarget?.accountStatus === "blocked" ? "active" : "blocked")
        }
        title={statusTarget?.accountStatus === "blocked" ? "Restore user access" : "Block this user"}
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
