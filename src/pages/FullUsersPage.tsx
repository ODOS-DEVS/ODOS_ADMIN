import { ArrowRight, Ban, Shield, UserCheck, Users as UsersIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ADMIN_PAGE_SIZE } from "@/api/adminPagination";
import { getUsers, updateUserStatus } from "@/api/usersApi";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { UserSectionNav } from "@/components/users/UsersUi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { AccountStatus, AdminUser } from "@/types";
import {
  buildUserDirectorySnapshot,
  filterUsersByTab,
  type UserDirectoryTab,
} from "@/utils/userMetrics";
import { formatDate } from "@/utils/format";
import { formatPaginationRange } from "@/utils/paginationUi";

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

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (background = false) => {
      if (!token) return;
      if (background) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        setUsers(await getUsers(token));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
  } = useQueueSearchParams({
    statusValues: ["active", "blocked", "inactive"],
  });
  const [activeTab, setActiveTab] = useState<UserDirectoryTab>("all");
  const [page, setPage] = useState(1);
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // These run over the FULL account list (fetched once above), not just the
  // rows currently visible on screen — otherwise tab/stat counts silently
  // undercount as soon as there's more than one page of users.
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

  useEffect(() => {
    setPage(1);
  }, [activeTab, query, statusFilter]);

  const pageSize = ADMIN_PAGE_SIZE;
  const pagedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * pageSize, page * pageSize),
    [filteredUsers, page, pageSize],
  );
  const hasMore = page * pageSize < filteredUsers.length;

  async function handleStatusUpdate(nextStatus: AccountStatus) {
    if (!token || !statusTarget) return;
    setActionLoading(true);
    try {
      const updated = await updateUserStatus(token, statusTarget.id, nextStatus);
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
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

  const listSummary = formatPaginationRange({ page, pageSize, itemCount: filteredUsers.length });

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="People"
        title="Complete account registry"
        description={`${snapshot.totalUsers} accounts · open any user for orders, payments, reviews, returns, cart, wishlist, vendor record, wallet, and support threads.`}
        backRoute="/users"
        onRefresh={() => void loadUsers(true)}
        refreshing={isRefreshing}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={String(snapshot.totalUsers)}
          icon={UsersIcon}
          animationDelay={40}
        />
        <StatCard
          label="Active accounts"
          value={String(snapshot.activeUsers)}
          hint={`${snapshot.blockedUsers} blocked`}
          icon={UserCheck}
          tone="success"
          animationDelay={80}
        />
        <StatCard
          label="Vendors"
          value={String(snapshot.vendors)}
          hint={`${snapshot.pendingVendors} pending approval`}
          icon={Shield}
          animationDelay={120}
        />
        <StatCard
          label="Customers"
          value={String(snapshot.customers)}
          hint={`${snapshot.admins} admin accounts`}
          icon={UsersIcon}
          tone="info"
          animationDelay={160}
        />
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
          listSummary={listSummary}
          columns={[
            {
              key: "user",
              header: "User",
              render: (user) => (
                <div className="flex items-center gap-3">
                  <UserAvatar name={user.fullName} imageUrl={user.avatarUrl} />
                  <div className="min-w-0">
                    <p className="font-semibold text-textStrong">{user.fullName}</p>
                    <p className="text-xs text-textMuted">{user.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "roles",
              header: "Roles",
              render: (user) => (
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <StatusBadge key={role} status={role === "admin" ? "admin" : role} />
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
              render: (user) => (
                <span className="text-textMuted">{formatDate(user.joinedAt)}</span>
              ),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (user) => (
                <div className="flex items-center justify-end gap-1">
                  {!user.roles.includes("admin") ? (
                    <Button
                      variant="ghost"
                      className="px-2.5"
                      aria-label={user.accountStatus === "blocked" ? "Unblock user" : "Block user"}
                      onClick={(event) => {
                        event.stopPropagation();
                        setStatusTarget(user);
                      }}
                    >
                      <Ban className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    className="px-2.5"
                    aria-label="Open full profile"
                    onClick={() => navigate(`/users/full/${user.id}`)}
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={pagedUsers}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={false}
          hasMore={hasMore}
          error={error}
          onPageChange={setPage}
          onRetry={() => void loadUsers()}
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
