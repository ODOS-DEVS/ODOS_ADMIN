import {
  CreditCard,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EntityTimeline } from "@/components/admin/EntityOps";
import {
  PreferenceToggle,
  UserOverviewKpiRow,
  UserProfileHero,
  UserSnapshotGroup,
  UserSnapshotMetric,
} from "@/components/users/UserDossierUi";
import { DetailFields } from "@/components/ui/DetailList";
import {
  DetailTile,
  UserSectionNav,
  UserStatGrid,
} from "@/components/users/UsersUi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { UserProfileReport } from "@/api/userProfileApi";
import type {
  AdminPaymentTransaction,
  AdminReturnRequest,
  AdminReview,
  AdminUserDetail,
  AdminUserNotification,
  Order,
  SupportChatThread,
} from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

const USER_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "commerce", label: "Commerce" },
  { id: "engagement", label: "Engagement" },
  { id: "vendor", label: "Vendor" },
  { id: "settings", label: "Settings" },
  { id: "support", label: "Support" },
  { id: "timeline", label: "Timeline" },
] as const;

type UserSectionId = (typeof USER_SECTIONS)[number]["id"];

type UserDetailViewProps = {
  report: UserProfileReport;
};

export function UserDetailView({ report }: UserDetailViewProps) {
  const navigate = useNavigate();
  const { user, supportThreads } = report;
  const [activeSection, setActiveSection] = useState<UserSectionId>("overview");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  const averageRating = useMemo(() => {
    if (user.reviews.length === 0) return 0;
    return user.reviews.reduce((sum, review) => sum + review.rating, 0) / user.reviews.length;
  }, [user.reviews]);

  const visibleSections = USER_SECTIONS.filter((section) => {
    if (section.id === "vendor") {
      return Boolean(user.vendorApplication || user.stores.length > 0 || user.roles.includes("vendor"));
    }
    if (section.id === "support") {
      return supportThreads.length > 0;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <UserProfileHero user={user} />

      <UserSectionNav
        sections={visibleSections}
        activeId={activeSection}
        onSelect={(id) => setActiveSection(id as UserSectionId)}
      />

      <div key={activeSection} className="animate-fade-up opacity-0" style={{ animationDelay: "0ms" }}>
        {activeSection === "overview" ? (
          <OverviewSection user={user} averageRating={averageRating} supportThreads={supportThreads} />
        ) : null}
        {activeSection === "profile" ? <ProfileSection user={user} /> : null}
        {activeSection === "commerce" ? <CommerceSection user={user} /> : null}
        {activeSection === "engagement" ? <EngagementSection user={user} averageRating={averageRating} /> : null}
        {activeSection === "vendor" ? <VendorSection user={user} /> : null}
        {activeSection === "settings" ? <SettingsSection user={user} /> : null}
        {activeSection === "support" ? (
          <SupportSection threads={supportThreads} onOpenInbox={() => navigate("/support-chats")} />
        ) : null}
        {activeSection === "timeline" ? (
          <EntityTimeline entityType="user" entityId={user.id} actorId={user.id} />
        ) : null}
      </div>
    </div>
  );
}

function OverviewSection({
  user,
  averageRating,
  supportThreads,
}: {
  user: AdminUserDetail;
  averageRating: number;
  supportThreads: SupportChatThread[];
}) {
  return (
    <div className="space-y-5">
      <UserOverviewKpiRow user={user} />

      <SectionCard compact title="Account snapshot">
        <div className="grid gap-4 lg:grid-cols-3">
          <UserSnapshotGroup title="Activity" description="Sessions & account">
            <UserSnapshotMetric label="Joined" value={formatDate(user.joinedAt)} />
            <UserSnapshotMetric
              label="Last login"
              value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
            />
            <UserSnapshotMetric label="Auth" value={user.authProviders.join(", ") || "Password"} />
            <UserSnapshotMetric label="Behavior events" value={String(user.behaviorEventCount)} />
          </UserSnapshotGroup>
          <UserSnapshotGroup title="Commerce" description="Orders & wallet">
            <UserSnapshotMetric label="Payment methods" value={String(user.stats.totalSavedPaymentMethods)} />
            <UserSnapshotMetric label="Return requests" value={String(user.returnRequests.length)} />
            <UserSnapshotMetric
              label="Wallet balance"
              value={
                user.customerWallet ? formatCurrency(user.customerWallet.balance) : "No wallet"
              }
            />
            <UserSnapshotMetric label="Avg rating given" value={averageRating > 0 ? `${averageRating.toFixed(1)}/5` : "—"} />
          </UserSnapshotGroup>
          <UserSnapshotGroup title="Support & alerts" description="Inbox & help">
            <UserSnapshotMetric label="Notifications" value={String(user.stats.totalNotifications)} />
            <UserSnapshotMetric label="Support threads" value={String(supportThreads.length)} />
            <UserSnapshotMetric label="Personalization" value={user.personalizationEnabled ? "On" : "Off"} />
            <UserSnapshotMetric label="Analytics tracking" value={user.analyticsEnabled ? "On" : "Off"} />
          </UserSnapshotGroup>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          compact
          title="Recent orders"
          description={`${user.orders.length} total on marketplace`}
          bodyClassName="p-0"
        >
          <OrderTable orders={user.orders.slice(0, 6)} compact />
        </SectionCard>
        <SectionCard compact title="Recent notifications" description="Latest signals to this account">
          <NotificationList notifications={user.notifications.slice(0, 6)} />
        </SectionCard>
      </div>
    </div>
  );
}

function ProfileSection({ user }: { user: AdminUserDetail }) {
  return (
    <div className="space-y-4">
      <SectionCard compact title="Personal profile" description="Identity, contact, and account metadata">
        <DetailFields columns={2}>
          <DetailTile label="Full name" value={user.fullName} />
          <DetailTile label="Email" value={user.email} />
          <DetailTile label="Phone" value={user.phone ?? "Not provided"} />
          <DetailTile label="Gender" value={user.gender ?? "Not set"} />
          <DetailTile
            label="Date of birth"
            value={user.dateOfBirth ? formatDate(user.dateOfBirth) : "Not set"}
          />
          <DetailTile
            label="Location"
            value={[user.city, user.region].filter(Boolean).join(", ") || "Not set"}
          />
          <DetailTile label="Account status" value={<StatusBadge status={user.accountStatus} />} />
          <DetailTile label="Vendor status" value={<StatusBadge status={user.vendorStatus} />} />
          <DetailTile label="Email verified" value={user.isVerified ? "Yes" : "No"} />
          <DetailTile label="Phone verified" value={user.phoneVerified ? "Yes" : "No"} />
          <DetailTile label="Joined" value={formatDateTime(user.joinedAt)} />
          <DetailTile
            label="Last updated"
            value={formatDateTime(user.updatedAt)}
          />
          <DetailTile
            label="Last login"
            value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "No login recorded"}
          />
          <DetailTile label="Personalization" value={user.personalizationEnabled ? "Enabled" : "Disabled"} />
          <DetailTile label="Analytics tracking" value={user.analyticsEnabled ? "Enabled" : "Disabled"} />
          {user.vendorRejectionReason ? (
            <DetailTile label="Vendor rejection reason" value={user.vendorRejectionReason} />
          ) : null}
        </DetailFields>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard compact title="Saved addresses" description={`${user.addresses.length} on file`}>
          {user.addresses.length === 0 ? (
            <EmptyState title="No addresses" description="This user has not saved any delivery addresses." />
          ) : (
            <ul className="divide-y divide-line">
              {user.addresses.map((address) => (
                <li key={address.id} className="py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{address.label || "Saved address"}</p>
                      <p className="text-xs text-textMuted">
                        {address.fullName} · {address.phone}
                      </p>
                    </div>
                    {address.isDefault ? (
                      <span className="text-[11px] text-accent">Default</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-textMuted">
                    {address.street}, {address.city}, {address.region}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard compact title="Saved payment methods" description={`${user.paymentMethods.length} on file`}>
          {user.paymentMethods.length === 0 ? (
            <EmptyState title="No payment methods" description="No saved payment methods for this user." />
          ) : (
            <div className="space-y-3">
              {user.paymentMethods.map((method) => (
                <div key={method.id} className="rounded-xl border border-line bg-surfaceMuted p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CreditCard className="size-4 text-textMuted" />
                    {method.label}
                    {method.isDefault ? (
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-textMuted">
                    {method.type.toUpperCase()}
                    {method.cardLast4 ? ` · •••• ${method.cardLast4}` : ""}
                    {method.network ? ` · ${method.network}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function CommerceSection({ user }: { user: AdminUserDetail }) {
  return (
    <div className="space-y-4">
      <SectionCard compact title="Commerce summary" description="Orders, payments, returns, and wallet activity">
        <UserStatGrid
          items={[
            { label: "Orders", value: String(user.orders.length) },
            { label: "Total spent", value: formatCurrency(user.stats.totalSpent) },
            { label: "Payments", value: String(user.paymentTransactions.length) },
            { label: "Returns", value: String(user.returnRequests.length) },
            {
              label: "Last order",
              value: user.stats.lastOrderAt ? formatDateTime(user.stats.lastOrderAt) : "None",
            },
            {
              label: "Wallet balance",
              value: user.customerWallet
                ? formatCurrency(user.customerWallet.balance)
                : "No wallet",
            },
          ]}
        />
        {user.customerWallet ? (
          <DetailFields columns={4} className="mt-6 border-t border-line/80 pt-6">
            <DetailTile label="Lifetime top-ups" value={formatCurrency(user.customerWallet.lifetimeTopups)} />
            <DetailTile label="Lifetime spend" value={formatCurrency(user.customerWallet.lifetimeSpend)} />
            <DetailTile label="Lifetime refunds" value={formatCurrency(user.customerWallet.lifetimeRefunds)} />
            <DetailTile
              label="Wallet transactions"
              value={String(user.customerWallet.transactionCount)}
            />
          </DetailFields>
        ) : null}
      </SectionCard>

      <SectionCard compact title="Order history" description="Every order placed by this user">
        {user.orders.length === 0 ? (
          <EmptyState title="No orders" description="This user has not placed any orders yet." />
        ) : (
          <OrderTable orders={user.orders} />
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard compact title="Payment transactions" description="Checkout payment records">
          {user.paymentTransactions.length === 0 ? (
            <EmptyState title="No payments" description="No payment transactions for this user." />
          ) : (
            <DataTable<AdminPaymentTransaction>
              compact
              columns={[
                {
                  key: "order",
                  header: "Order",
                  render: (payment) => (
                    <div>
                      <p className="font-medium">{payment.orderNumber}</p>
                      <p className="text-xs text-textMuted">{payment.provider}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (payment) => <StatusBadge status={payment.status} />,
                },
                {
                  key: "amount",
                  header: "Amount",
                  className: "text-right",
                  render: (payment) => (
                    <span className="font-medium tabular-nums">{formatCurrency(payment.amount)}</span>
                  ),
                },
              ]}
              data={user.paymentTransactions}
              keyExtractor={(payment) => payment.id}
            />
          )}
        </SectionCard>

        <SectionCard compact title="Return requests" description="Refund and exchange activity">
          {user.returnRequests.length === 0 ? (
            <EmptyState title="No returns" description="This user has not submitted return requests." />
          ) : (
            <DataTable<AdminReturnRequest>
              compact
              columns={[
                {
                  key: "order",
                  header: "Return",
                  render: (item) => (
                    <div>
                      <p className="font-medium">{item.orderNumber}</p>
                      <p className="text-xs text-textMuted">{item.productTitle}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => <StatusBadge status={item.status} />,
                },
              ]}
              data={user.returnRequests}
              keyExtractor={(item) => item.id}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function EngagementSection({
  user,
  averageRating,
}: {
  user: AdminUserDetail;
  averageRating: number;
}) {
  return (
    <div className="space-y-4">
      <SectionCard compact title="Engagement summary" description="Reviews, cart, wishlist, and notifications">
        <UserStatGrid
          items={[
            { label: "Reviews written", value: String(user.reviews.length) },
            { label: "Average rating given", value: averageRating > 0 ? `${averageRating.toFixed(1)}/5` : "—" },
            { label: "Cart items", value: String(user.cartItems.length) },
            { label: "Wishlist items", value: String(user.wishlistItems.length) },
            { label: "Notifications", value: String(user.notifications.length) },
            { label: "Behavior events", value: String(user.behaviorEventCount) },
          ]}
        />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard compact title="Reviews" description="Product reviews submitted by this user">
          {user.reviews.length === 0 ? (
            <EmptyState title="No reviews" description="This user has not written any reviews." />
          ) : (
            <DataTable<AdminReview>
              compact
              columns={[
                {
                  key: "product",
                  header: "Product",
                  render: (review) => (
                    <div>
                      <p className="font-medium">{review.productName}</p>
                      <p className="text-xs text-textMuted">{review.storeName ?? "—"}</p>
                    </div>
                  ),
                },
                { key: "rating", header: "Rating", render: (review) => `${review.rating}/5` },
                {
                  key: "hidden",
                  header: "Status",
                  render: (review) => (
                    <StatusBadge status={review.isHidden ? "hidden" : "visible"} />
                  ),
                },
              ]}
              data={user.reviews}
              keyExtractor={(review) => review.id}
            />
          )}
        </SectionCard>

        <SectionCard compact title="In-app notifications" description="Messages delivered to this account">
          <NotificationList notifications={user.notifications} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard compact title="Cart" description="Items currently in cart">
          {user.cartItems.length === 0 ? (
            <EmptyState title="Empty cart" description="No items in this user's cart." />
          ) : (
            <div className="space-y-2">
              {user.cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="size-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-lg bg-surfaceMuted">
                      <ShoppingBag className="size-4 text-textMuted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-textMuted">
                      Qty {item.quantity} · {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard compact title="Wishlist" description="Saved products">
          {user.wishlistItems.length === 0 ? (
            <EmptyState title="Empty wishlist" description="No wishlist items for this user." />
          ) : (
            <div className="space-y-2">
              {user.wishlistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="size-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-lg bg-surfaceMuted">
                      <ShoppingBag className="size-4 text-textMuted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-textMuted">{item.price ?? "Price unavailable"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function VendorSection({ user }: { user: AdminUserDetail }) {
  return (
    <div className="space-y-4">
      {user.vendorApplication ? (
        <SectionCard compact title="Vendor application" description="Full vendor onboarding submission">
          <DetailFields columns={2}>
            <DetailTile label="Business name" value={user.vendorApplication.businessName} />
            <DetailTile label="Category" value={user.vendorApplication.businessCategory} />
            <DetailTile label="Status" value={<StatusBadge status={user.vendorApplication.status} />} />
            <DetailTile label="Store name" value={user.vendorApplication.storeName} />
            <DetailTile label="Phone" value={user.vendorApplication.phoneNumber} />
            <DetailTile
              label="Location"
              value={
                [user.vendorApplication.storeLocation, user.vendorApplication.city, user.vendorApplication.region]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            <DetailTile
              label="Submitted"
              value={formatDateTime(user.vendorApplication.submittedAt)}
            />
            {user.vendorApplication.rejectionReason ? (
              <DetailTile label="Rejection reason" value={user.vendorApplication.rejectionReason} />
            ) : null}
          </DetailFields>
          <p className="mt-6 border-t border-line/80 pt-6 text-sm leading-relaxed text-textMuted">
            {user.vendorApplication.businessDescription}
          </p>
        </SectionCard>
      ) : null}

      {user.stores.length > 0 ? (
        <SectionCard compact title="Linked stores" description="Stores owned by this vendor account">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {user.stores.map((store) => (
              <div key={store.id} className="overflow-hidden rounded-2xl border border-line">
                {store.bannerImage ? (
                  <img src={store.bannerImage} alt={store.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 items-center justify-center bg-surfaceMuted">
                    <Store className="size-5 text-textMuted" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-xs text-textMuted">@{store.slug}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={store.status} />
                  </div>
                  <p className="mt-2 text-xs text-textMuted">
                    {[store.location, store.city, store.region].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        !user.vendorApplication ? (
          <EmptyState title="No vendor data" description="This user is not a vendor and has no application on file." />
        ) : null
      )}
    </div>
  );
}

function SettingsSection({ user }: { user: AdminUserDetail }) {
  const toggles = [
    { label: "General notifications", enabled: user.allowNotifications },
    { label: "Discount alerts", enabled: user.discountNotifications },
    { label: "Store updates", enabled: user.storeNotifications },
    { label: "System updates", enabled: user.systemNotifications },
    { label: "Location notifications", enabled: user.locationNotifications },
    { label: "Location updates", enabled: user.locationUpdates },
    { label: "Personalization", enabled: user.personalizationEnabled },
    { label: "Analytics tracking", enabled: user.analyticsEnabled },
  ];

  return (
    <SectionCard compact title="Preferences & privacy" description="Notification and tracking settings">
      <div className="grid gap-2 md:grid-cols-2">
        {toggles.map(({ label, enabled }) => (
          <PreferenceToggle key={label} label={label} enabled={enabled} />
        ))}
      </div>
    </SectionCard>
  );
}

function SupportSection({
  threads,
  onOpenInbox,
}: {
  threads: SupportChatThread[];
  onOpenInbox: () => void;
}) {
  return (
    <SectionCard
      compact
      title="Support conversations"
      description={`${threads.length} thread${threads.length === 1 ? "" : "s"} involving this user`}
      action={
        <Button variant="ghost" onClick={onOpenInbox}>
          Open inbox
        </Button>
      }
    >
      <div className="space-y-2">
        {threads.map((thread) => (
          <div key={thread.id} className="rounded-xl border border-line bg-surfaceMuted p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{thread.subject ?? "Support request"}</p>
                <p className="mt-1 text-xs text-textMuted">{thread.lastMessageText ?? "No messages yet"}</p>
              </div>
              {thread.supportStatus ? <StatusBadge status={thread.supportStatus} /> : null}
            </div>
            <p className="mt-2 text-[11px] text-textMuted">
              {thread.lastMessageAt ? formatDateTime(thread.lastMessageAt) : formatDateTime(thread.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function OrderTable({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  const navigate = useNavigate();
  return (
    <DataTable<Order>
      compact={compact}
      columns={[
        {
          key: "order",
          header: "Order",
          render: (order) => (
            <button
              type="button"
              className="text-left"
              onClick={() => navigate(`/orders/full/${order.id}`)}
            >
              <p className="font-medium text-accent">{order.orderNumber}</p>
              <p className="text-xs text-textMuted">{order.storeName}</p>
            </button>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (order) => (
            <div className="flex flex-wrap gap-1">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </div>
          ),
        },
        {
          key: "amount",
          header: "Amount",
          className: "text-right",
          render: (order) => (
            <span className="font-medium tabular-nums">{formatCurrency(order.totalAmount)}</span>
          ),
        },
      ]}
      data={orders}
      keyExtractor={(order) => order.id}
    />
  );
}

function NotificationList({ notifications }: { notifications: AdminUserNotification[] }) {
  if (notifications.length === 0) {
    return (
      <EmptyState title="No notifications" description="No in-app notifications recorded for this user." />
    );
  }

  return (
    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
      {notifications.map((notification) => (
        <div key={notification.id} className="rounded-xl border border-line bg-surfaceMuted px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-textMuted">{notification.message}</p>
            </div>
            <StatusBadge status={notification.kind} />
          </div>
          <p className="mt-1.5 text-[11px] text-textMuted">{formatDateTime(notification.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}
