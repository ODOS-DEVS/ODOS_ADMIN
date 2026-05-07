import { Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getNotifications, markNotificationRead } from "@/api/notificationsApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { NotificationItem } from "@/types";
import { formatDateTime } from "@/utils/format";

export function NotificationsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getNotifications(token);
      setNotifications(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

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
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
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

  if (isLoading) {
    return <LoadingState label="Loading notifications..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadNotifications()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Platform activity"
        description="Keep an eye on vendor, order, system, and user activity across the marketplace."
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
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="No notifications found"
            description="There are no activity items for the selected type right now."
          />
        ) : (
          <DataTable<NotificationItem>
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
          />
        )}
      </SectionCard>
    </div>
  );
}
