import { Eye } from "lucide-react";
import { useMemo, useState } from "react";

import { getNotificationsPage, markNotificationRead } from "@/api/notificationsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { NotificationItem } from "@/types";
import { formatDateTime } from "@/utils/format";

export function FullNotificationsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const {
    items: notifications,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getNotificationsPage,
    getId: (notification) => notification.id,
  });
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) =>
      typeFilter === "all" ? true : notification.type === typeFilter,
    );
  }, [notifications, typeFilter]);

  async function handleMarkRead(notification: NotificationItem) {
    if (!token || notification.read) return;
    setActionLoadingId(notification.id);
    try {
      await markNotificationRead(token, notification.id);
      replaceItem({ ...notification, read: true });
      showToast({
        title: "Notification marked as read",
        description: notification.title,
        tone: "success",
      });
    } catch (actionError) {
      showToast({
        title: "Unable to update notification",
        description: actionError instanceof Error ? actionError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Notifications"
        title="Complete notification feed"
        description="Every admin signal and notification across the platform."
        backRoute="/notifications"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <SectionCard
        title="Activity feed"
        description="Filter by signal type and keep the operations queue tidy."
        action={
          <FilterSelect
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={[
              { label: "All activity", value: "all" },
              { label: "Orders", value: "order" },
              { label: "Vendors", value: "vendor" },
              { label: "Users", value: "user" },
              { label: "Stores", value: "store" },
              { label: "System", value: "system" },
            ]}
          />
        }
      >
        <AdminInfiniteList
            columns={[
              {
                key: "title",
                header: "Notification",
                render: (notification) => (
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="mt-1 text-xs text-textMuted">{notification.message}</p>
                  </div>
                ),
              },
              {
                key: "type",
                header: "Type",
                render: (notification) => <StatusBadge status={notification.type} />,
              },
              {
                key: "state",
                header: "Read state",
                render: (notification) => (
                  <StatusBadge status={notification.read ? "active" : "unread"} />
                ),
              },
              {
                key: "time",
                header: "Created",
                render: (notification) => formatDateTime(notification.createdAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (notification) => (
                  <Button
                    variant="secondary"
                    leftIcon={<Eye className="size-4" />}
                    onClick={() => void handleMarkRead(notification)}
                    isLoading={actionLoadingId === notification.id}
                    disabled={notification.read}
                  >
                    {notification.read ? "Read" : "Mark as read"}
                  </Button>
                ),
              },
            ]}
            data={filteredNotifications}
            keyExtractor={(notification) => notification.id}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={() => void loadMore()}
            onRetry={() => void refresh()}
            emptyTitle="No notifications found"
            emptyDescription="There are no activity items for the selected type right now."
          />
      </SectionCard>
    </div>
  );
}
