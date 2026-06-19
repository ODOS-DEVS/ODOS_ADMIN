import type { NotificationItem } from "@/types";
import { mapNotification } from "@/api/mappers";
import {
  ADMIN_PAGE_SIZE,
  buildAdminListQuery,
  fetchAllAdminPages,
  normalizeAdminPageResponse,
} from "@/api/adminPagination";
import { requestJson } from "@/api/client";
import type { AdminListParams, AdminPage } from "@/types/pagination";

type BackendNotification = {
  id: string;
  type: NotificationItem["type"];
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export async function getNotificationsPage(token: string, params: AdminListParams = {}) {
  const raw = await requestJson<AdminPage<BackendNotification> | BackendNotification[]>(
    `/admin/notifications${buildAdminListQuery({ limit: ADMIN_PAGE_SIZE, ...params })}`,
    { token },
  );
  const page = normalizeAdminPageResponse(raw);
  return { ...page, items: page.items.map(mapNotification) };
}

export async function getNotifications(token: string) {
  return fetchAllAdminPages((offset, limit) => getNotificationsPage(token, { offset, limit }));
}

export async function markNotificationRead(token: string, notificationId: string) {
  await requestJson(`/admin/notifications/${notificationId}/read`, {
    method: "PATCH",
    token,
  });
  return { notificationId };
}
