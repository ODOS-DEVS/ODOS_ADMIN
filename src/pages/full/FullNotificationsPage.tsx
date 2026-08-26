import { Bell, BellRing, Eye, Filter } from "lucide-react";
import { useMemo, useState } from "react";

import { getNotificationsPage, markNotificationRead } from "@/api/notificationsApi";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { DirectoryPage } from "@/components/directory/DirectoryPage";
import type { DirectoryColumn } from "@/components/directory/DirectoryTable";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { TABLE_ACTIONS_COLUMN_CLASS } from "@/components/ui/IconButton";
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
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
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

  const columns = useMemo<Array<DirectoryColumn<NotificationItem>>>(
    () => [
      {
        key: "title",
        header: "Notification",
        sortable: true,
        className: "min-w-[18rem] max-w-[30rem]",
        render: (notification) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-textStrong">{notification.title}</p>
            <p className="truncate text-xs text-textMuted">{notification.message}</p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        className: "w-[8rem]",
        render: (notification) => (
          <StatePill
            label={labelForStatus(notification.type)}
            tone={toneForStatus(notification.type)}
          />
        ),
      },
      {
        key: "time",
        header: "Created",
        sortable: true,
        className: "w-[9rem] whitespace-nowrap text-sm text-textMuted",
        render: (notification) => formatDateTime(notification.createdAt),
      },
      {
        key: "state",
        header: "Read state",
        className: "w-[7.5rem]",
        render: (notification) => (
          <StatePill
            label={notification.read ? "Read" : "Unread"}
            tone={notification.read ? "neutral" : "info"}
          />
        ),
      },
      {
        key: "actions",
        header: "Action",
        className: TABLE_ACTIONS_COLUMN_CLASS,
        render: (notification) => (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="h-9 px-3 py-0 text-[13px]"
              leftIcon={<Eye className="size-4" />}
              onClick={() => void handleMarkRead(notification)}
              isLoading={actionLoadingId === notification.id}
              disabled={notification.read}
            >
              {notification.read ? "Read" : "Mark read"}
            </Button>
          </div>
        ),
      },
    ],
    [actionLoadingId],
  );

  return (
    <DirectoryPage
      eyebrow="Notifications"
      title="Complete notification feed"
      description="Every admin signal raised across the platform, newest first."
      backRoute="/notifications"
      onRefresh={() => void refresh()}
      refreshing={isLoading}
      metrics={[
        { label: "On this page", value: notifications.length.toLocaleString(), icon: Bell, caption: "Loaded signals" },
        { label: "Unread", value: notifications.filter((item) => !item.read).length.toLocaleString(), icon: BellRing, tone: "info", caption: "Not yet acknowledged" },
        { label: "Matching filter", value: filteredNotifications.length.toLocaleString(), icon: Filter, caption: "Shown below" },
      ]}
      filters={
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
          className="h-10"
        />
      }
      cardTitle="Activity feed"
      count={filteredNotifications.length}
      columns={columns}
      data={filteredNotifications}
      keyExtractor={(notification) => notification.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refresh()}
      emptyTitle="No notifications found"
      emptyDescription="There are no activity items for the selected type right now."
      pagination={{ page, pageSize, onPageChange: goToPage, hasMore, isLoadingPage, loadedLabel: `per page · ${notifications.length} loaded` }}
    />
  );
}
