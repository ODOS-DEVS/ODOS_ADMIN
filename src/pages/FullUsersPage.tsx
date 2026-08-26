import { ArrowRight, Ban, Shield, UserCheck, Users as UsersIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ADMIN_PAGE_SIZE } from "@/api/adminPagination";
import { getUsers, updateUserStatus } from "@/api/usersApi";
import { DirectoryPage } from "@/components/directory/DirectoryPage";
import type { DirectoryColumn } from "@/components/directory/DirectoryTable";
import { SegmentedTabs } from "@/components/directory/SegmentedTabs";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { TABLE_ACTIONS_COLUMN_CLASS_NARROW } from "@/components/ui/IconButton";
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

  const columns = useMemo<Array<DirectoryColumn<AdminUser>>>(
    () => [
      {
        key: "user",
        header: "User",
        sortable: true,
        className: "min-w-[14rem]",
        render: (user) => (
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={user.fullName} imageUrl={user.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium text-textStrong">{user.fullName}</p>
              <p className="truncate text-xs text-textMuted">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "roles",
        header: "Roles",
        className: "min-w-[9rem]",
        render: (user) => (
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <StatePill key={role} label={labelForStatus(role)} tone={toneForStatus(role)} />
            ))}
          </div>
        ),
      },
      {
        key: "vendor",
        header: "Vendor",
        className: "w-[9rem]",
        render: (user) => (
          <StatePill
            label={labelForStatus(user.vendorStatus)}
            tone={toneForStatus(user.vendorStatus)}
          />
        ),
      },
      {
        key: "account",
        header: "Account",
        className: "w-[8rem]",
        render: (user) => (
          <StatePill
            label={labelForStatus(user.accountStatus)}
            tone={toneForStatus(user.accountStatus)}
          />
        ),
      },
      {
        key: "joined",
        header: "Joined",
        sortable: true,
        className: "w-[8rem] whitespace-nowrap text-sm text-textMuted",
        render: (user) => formatDate(user.joinedAt),
      },
      {
        key: "actions",
        header: "Action",
        className: TABLE_ACTIONS_COLUMN_CLASS_NARROW,
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
    ],
    [navigate],
  );

  return (
    <DirectoryPage
      eyebrow="People"
      title="Complete account registry"
      description="Every ODOS account, with roles, vendor standing and access status."
      backRoute="/users"
      onRefresh={() => void loadUsers(true)}
      refreshing={isRefreshing}
      metrics={[
        {
          label: "Total users",
          value: snapshot.totalUsers.toLocaleString(),
          icon: UsersIcon,
          caption: `${snapshot.admins} admin accounts`,
        },
        {
          label: "Active",
          value: snapshot.activeUsers.toLocaleString(),
          icon: UserCheck,
          tone: "success",
          caption: `${snapshot.blockedUsers} blocked`,
        },
        {
          label: "Vendors",
          value: snapshot.vendors.toLocaleString(),
          icon: Shield,
          tone: "info",
          caption: `${snapshot.pendingVendors} pending approval`,
        },
        {
          label: "Customers",
          value: snapshot.customers.toLocaleString(),
          icon: UsersIcon,
          caption: "Shopper accounts",
        },
      ]}
      search={
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, email or phone"
          className="h-10 py-0"
        />
      }
      filters={
        <FilterSelect
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Blocked", value: "blocked" },
            { label: "Inactive", value: "inactive" },
          ]}
          className="h-10"
        />
      }
      tabs={
        <SegmentedTabs
          ariaLabel="Filter accounts by type"
          tabs={DIRECTORY_TABS.map((tab) => ({
            value: tab.id,
            label: tab.label,
            count: filterUsersByTab(users, tab.id).length,
          }))}
          value={activeTab}
          onChange={(value) => setActiveTab(value as UserDirectoryTab)}
        />
      }
      cardTitle={`${DIRECTORY_TABS.find((tab) => tab.id === activeTab)?.label ?? "All"} users`}
      count={filteredUsers.length}
      listSummary={listSummary}
      columns={columns}
      data={pagedUsers}
      keyExtractor={(user) => user.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => void loadUsers()}
      emptyTitle="No users found"
      emptyDescription="Clear the filters or try another search."
      pagination={{
        page,
        pageSize,
        onPageChange: setPage,
        hasMore,
        loadedLabel: `per page · ${filteredUsers.length} matching`,
      }}
    >
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
    </DirectoryPage>
  );
}
