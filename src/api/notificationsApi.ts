import type { NotificationItem } from "@/types";
import { mapNotification } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getNotifications(token: string) {
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
}

export async function markNotificationRead(token: string, notificationId: string) {
  await requestJson(`/admin/notifications/${notificationId}/read`, {
    method: "PATCH",
    token,
  });
  return { notificationId };
}
