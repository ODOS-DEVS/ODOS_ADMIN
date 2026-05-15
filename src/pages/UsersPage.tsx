import {
  BadgeCheck,
  Ban,
  Bell,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getUser, getUsers, updateUserStatus } from "@/api/usersApi";
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
import type { AccountStatus, AdminUser, AdminUserDetail } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

function UserDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-textStrong">{title}</h3>
        {description ? <p className="mt-1 text-xs text-textMuted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-textStrong">{value}</p>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
  const [selectedUserSummary, setSelectedUserSummary] = useState<AdminUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
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

  const handleViewUser = useCallback(
    async (user: AdminUser) => {
      if (!token) return;
      setSelectedUserSummary(user);
      setSelectedUser(null);
      setDetailError(null);
      setIsDetailLoading(true);

      try {
        const detail = await getUser(token, user.id);
        setSelectedUser(detail);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load user details.";
        setDetailError(message);
        showToast({
          title: "Unable to load user details",
          description: message,
          tone: "error",
        });
      } finally {
        setIsDetailLoading(false);
      }
    },
    [showToast, token],
  );

  const closeDetailModal = useCallback(() => {
    setSelectedUserSummary(null);
    setSelectedUser(null);
    setDetailError(null);
    setIsDetailLoading(false);
  }, []);

  async function handleStatusUpdate(nextStatus: AccountStatus) {
    if (!token || !statusTarget) return;
    setActionLoading(true);

    try {
      const updated = await updateUserStatus(token, statusTarget.id, nextStatus);
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setSelectedUserSummary((current) => (current?.id === updated.id ? updated : current));
      setSelectedUser((current) =>
        current?.id === updated.id ? { ...current, accountStatus: updated.accountStatus } : current,
      );
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
                      onClick={() => void handleViewUser(user)}
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
        open={Boolean(selectedUserSummary)}
        onClose={closeDetailModal}
        title={selectedUser?.fullName ?? selectedUserSummary?.fullName ?? "User details"}
        description="Full account profile, saved details, activity, and vendor-related data."
        size="xl"
      >
        {isDetailLoading ? (
          <LoadingState label="Loading user details..." />
        ) : detailError ? (
          <ErrorState description={detailError} onRetry={() => selectedUserSummary && void handleViewUser(selectedUserSummary)} />
        ) : selectedUser ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/30 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.fullName}
                      className="size-24 rounded-[28px] object-cover shadow-glow"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-[28px] bg-white/10 text-2xl font-semibold text-textStrong">
                      {getInitials(selectedUser.fullName) || "U"}
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold text-textStrong">
                        {selectedUser.fullName}
                      </h3>
                      {selectedUser.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                          <BadgeCheck className="size-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                          Pending verification
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedUser.roles.map((role) => (
                        <StatusBadge key={role} status={role === "admin" ? "confirmed" : role} />
                      ))}
                      <StatusBadge status={selectedUser.accountStatus} />
                      <StatusBadge status={selectedUser.vendorStatus} />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 text-sm text-textMuted sm:flex-row sm:flex-wrap">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="size-4" />
                        {selectedUser.email}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Phone className="size-4" />
                        {selectedUser.phone ?? "No phone number"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="size-4" />
                        {[selectedUser.city, selectedUser.region].filter(Boolean).join(", ") || "No location yet"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-full gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                  <StatCard label="Orders" value={String(selectedUser.stats.totalOrders)} />
                  <StatCard
                    label="Total spent"
                    value={formatCurrency(selectedUser.stats.totalSpent)}
                  />
                  <StatCard label="Reviews" value={String(selectedUser.stats.totalReviews)} />
                  <StatCard
                    label="Wishlist items"
                    value={String(selectedUser.stats.totalWishlistItems)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <DetailSection
                title="Profile details"
                description="These are the personal details and account preferences currently saved on the user profile."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <UserDetailRow label="Full name" value={selectedUser.fullName} />
                  <UserDetailRow label="Email" value={selectedUser.email} />
                  <UserDetailRow label="Phone" value={selectedUser.phone ?? "Not provided"} />
                  <UserDetailRow label="Gender" value={selectedUser.gender ?? "Not set"} />
                  <UserDetailRow
                    label="Date of birth"
                    value={selectedUser.dateOfBirth ? formatDate(selectedUser.dateOfBirth) : "Not set"}
                  />
                  <UserDetailRow
                    label="Location"
                    value={[selectedUser.city, selectedUser.region].filter(Boolean).join(", ") || "Not set"}
                  />
                  <UserDetailRow label="Auth providers" value={selectedUser.authProviders.join(", ") || "Password"} />
                  <UserDetailRow label="Joined" value={formatDateTime(selectedUser.joinedAt)} />
                  <UserDetailRow
                    label="Last login"
                    value={selectedUser.lastLoginAt ? formatDateTime(selectedUser.lastLoginAt) : "No login recorded"}
                  />
                  <UserDetailRow label="Last updated" value={formatDateTime(selectedUser.updatedAt)} />
                </div>
              </DetailSection>

              <DetailSection
                title="Account activity"
                description="Quick operational summary for this user account."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <UserDetailRow label="Cart items" value={String(selectedUser.stats.totalCartItems)} />
                  <UserDetailRow
                    label="Saved addresses"
                    value={String(selectedUser.stats.totalSavedAddresses)}
                  />
                  <UserDetailRow
                    label="Saved payment methods"
                    value={String(selectedUser.stats.totalSavedPaymentMethods)}
                  />
                  <UserDetailRow
                    label="Notifications received"
                    value={String(selectedUser.stats.totalNotifications)}
                  />
                  <UserDetailRow
                    label="Last order"
                    value={
                      selectedUser.stats.lastOrderAt
                        ? formatDateTime(selectedUser.stats.lastOrderAt)
                        : "No orders yet"
                    }
                  />
                  <UserDetailRow
                    label="Last review"
                    value={
                      selectedUser.stats.lastReviewAt
                        ? formatDateTime(selectedUser.stats.lastReviewAt)
                        : "No reviews yet"
                    }
                  />
                </div>
              </DetailSection>
            </div>

            <DetailSection
              title="Notification settings"
              description="These toggles help you understand how the user has chosen to hear from ODOS."
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "General notifications", enabled: selectedUser.allowNotifications },
                  { label: "Discount alerts", enabled: selectedUser.discountNotifications },
                  { label: "Store updates", enabled: selectedUser.storeNotifications },
                  { label: "System updates", enabled: selectedUser.systemNotifications },
                  { label: "Location notifications", enabled: selectedUser.locationNotifications },
                  { label: "Location updates", enabled: selectedUser.locationUpdates },
                ].map(({ label, enabled }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <span className="inline-flex items-center gap-2 text-sm text-textStrong">
                      <Bell className="size-4 text-textMuted" />
                      {label}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        enabled
                          ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                          : "border border-white/10 bg-white/5 text-textMuted"
                      }`}
                    >
                      {enabled ? "On" : "Off"}
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>

            <div className="grid gap-6 xl:grid-cols-2">
              <DetailSection
                title="Saved addresses"
                description="Delivery addresses saved by this user."
              >
                {selectedUser.addresses.length === 0 ? (
                  <EmptyState
                    title="No saved addresses"
                    description="The user has not saved any delivery addresses yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {selectedUser.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-textStrong">
                              {address.label || "Saved address"}
                            </p>
                            <p className="mt-1 text-sm text-textMuted">
                              {address.fullName} · {address.phone}
                            </p>
                          </div>
                          {address.isDefault ? (
                            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm text-textStrong">
                          {address.street}, {address.city}, {address.region}
                        </p>
                        <p className="mt-2 text-xs text-textMuted">
                          Added {formatDateTime(address.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </DetailSection>

              <DetailSection
                title="Saved payment methods"
                description="Masked payment methods kept on this user profile."
              >
                {selectedUser.paymentMethods.length === 0 ? (
                  <EmptyState
                    title="No saved payment methods"
                    description="The user has not saved any payment details yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {selectedUser.paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-textStrong">
                            <CreditCard className="size-4 text-textMuted" />
                            {method.label}
                          </div>
                          {method.isDefault ? (
                            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <UserDetailRow label="Type" value={method.type.toUpperCase()} />
                          <UserDetailRow label="Network" value={method.network ?? "Not set"} />
                          <UserDetailRow
                            label="Card"
                            value={method.cardLast4 ? `•••• ${method.cardLast4}` : "Not set"}
                          />
                          <UserDetailRow label="Phone" value={method.phone ?? "Not set"} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DetailSection>
            </div>

            {selectedUser.vendorApplication ? (
              <DetailSection
                title="Vendor application"
                description="If this user applied to become a vendor, admin can review the full submission details and uploaded assets here."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <UserDetailRow
                    label="Business name"
                    value={selectedUser.vendorApplication.businessName}
                  />
                  <UserDetailRow
                    label="Business category"
                    value={selectedUser.vendorApplication.businessCategory}
                  />
                  <UserDetailRow
                    label="Application status"
                    value={selectedUser.vendorApplication.status}
                  />
                  <UserDetailRow
                    label="Contact phone"
                    value={selectedUser.vendorApplication.phoneNumber}
                  />
                  <UserDetailRow
                    label="WhatsApp"
                    value={selectedUser.vendorApplication.whatsappNumber ?? "Not provided"}
                  />
                  <UserDetailRow
                    label="Market / location"
                    value={
                      [
                        selectedUser.vendorApplication.storeLocation,
                        selectedUser.vendorApplication.city,
                        selectedUser.vendorApplication.region,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not set"
                    }
                  />
                  <UserDetailRow
                    label="Store name"
                    value={selectedUser.vendorApplication.storeName}
                  />
                  <UserDetailRow
                    label="Store description"
                    value={selectedUser.vendorApplication.storeDescription ?? "Not provided"}
                  />
                  <UserDetailRow
                    label="Registration number"
                    value={
                      selectedUser.vendorApplication.businessRegistrationNumber ?? "Not provided"
                    }
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-textMuted">
                    Business description
                  </p>
                  <p className="mt-2 text-sm leading-6 text-textStrong">
                    {selectedUser.vendorApplication.businessDescription}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      label: "Logo image",
                      value: selectedUser.vendorApplication.logoImageUrl,
                    },
                    {
                      label: "Banner image",
                      value: selectedUser.vendorApplication.bannerImageUrl,
                    },
                    {
                      label: "Shop image",
                      value: selectedUser.vendorApplication.shopImageUrl,
                    },
                  ].map((asset) => (
                    <div
                      key={asset.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
                    >
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-textMuted">
                        {asset.label}
                      </p>
                      {asset.value ? (
                        <img
                          src={asset.value}
                          alt={asset.label}
                          className="h-40 w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/20 text-sm text-textMuted">
                          No image uploaded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {selectedUser.stores.length > 0 ? (
              <DetailSection
                title="Linked stores"
                description="Stores currently tied to this user account as an approved vendor."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selectedUser.stores.map((store) => (
                    <div
                      key={store.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]"
                    >
                      {store.bannerImage ? (
                        <img
                          src={store.bannerImage}
                          alt={store.name}
                          className="h-28 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-28 items-center justify-center bg-slate-950/30 text-textMuted">
                          <Store className="size-6" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {store.logoImage ? (
                            <img
                              src={store.logoImage}
                              alt={store.name}
                              className="size-12 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-textStrong">
                              {getInitials(store.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-textStrong">
                              {store.name}
                            </p>
                            <p className="mt-1 text-xs text-textMuted">@{store.slug}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <UserDetailRow label="Status" value={store.status} />
                          <UserDetailRow
                            label="Location"
                            value={[store.location, store.city, store.region].filter(Boolean).join(", ")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>
            ) : null}
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
