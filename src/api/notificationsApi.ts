import { mockNotifications } from "@/data/mockData";
import type { NotificationItem } from "@/types";
import { mapNotification } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export async function getNotifications(token: string) {
  return withFallback<NotificationItem[]>(
    async () => {
      const notifications = await requestJson<
        Array<{
          id: string;
          type: NotificationItem["type"];
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        }>
      >("/admin/notifications", { token });
      return notifications.map(mapNotification);
    },
    () => mockNotifications,
  );
}

export async function markNotificationRead(token: string, notificationId: string) {
  return withFallback<{ notificationId: string }>(
    async () => {
      await requestJson(`/admin/notifications/${notificationId}/read`, {
        method: "PATCH",
        token,
      });
      return { notificationId };
    },
    () => {
      const notification = mockNotifications.find((item) => item.id === notificationId);
      if (!notification) {
        throw new Error("Notification not found");
      }
      notification.read = true;
      return { notificationId };
    },
  );
}
