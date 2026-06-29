import type { FlashSaleEvent } from "@/types";
import { mapFlashSaleEvent } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

type FlashSaleEventDraft = Pick<
  FlashSaleEvent,
  | "slug"
  | "title"
  | "subtitle"
  | "sortOrder"
  | "status"
  | "startsAt"
  | "endsAt"
  | "productIds"
>;

type BackendFlashSaleEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  starts_at?: string | null;
  ends_at: string;
  sort_order: number;
  status: FlashSaleEvent["status"];
  product_ids: string[];
  created_at: string;
  updated_at: string;
};

const flashSaleEventsListApi = createPaginatedAdminApi<
  BackendFlashSaleEvent,
  FlashSaleEvent
>({
  path: "/admin/flash-sale-events",
  mapItem: mapFlashSaleEvent,
});

export const getFlashSaleEventsPage = flashSaleEventsListApi.getPage;
export const getFlashSaleEvents = flashSaleEventsListApi.getAll;

function buildPayload(payload: FlashSaleEventDraft) {
  return {
    slug: payload.slug.trim(),
    title: payload.title.trim(),
    subtitle: payload.subtitle?.trim() || null,
    sort_order: payload.sortOrder,
    status: payload.status,
    starts_at: payload.startsAt || null,
    ends_at: payload.endsAt,
    product_ids: payload.productIds,
  };
}

export async function createFlashSaleEvent(
  token: string,
  payload: FlashSaleEventDraft,
) {
  const event = await requestJson<{
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    image_url?: string | null;
    starts_at?: string | null;
    ends_at: string;
    sort_order: number;
    status: FlashSaleEvent["status"];
    product_ids: string[];
    created_at: string;
    updated_at: string;
  }>("/admin/flash-sale-events", {
    method: "POST",
    token,
    body: JSON.stringify(buildPayload(payload)),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return mapFlashSaleEvent(event);
}

export async function updateFlashSaleEvent(
  token: string,
  eventId: string,
  payload: FlashSaleEventDraft,
) {
  const event = await requestJson<{
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    image_url?: string | null;
    starts_at?: string | null;
    ends_at: string;
    sort_order: number;
    status: FlashSaleEvent["status"];
    product_ids: string[];
    created_at: string;
    updated_at: string;
  }>(`/admin/flash-sale-events/${eventId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(buildPayload(payload)),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return mapFlashSaleEvent(event);
}

export async function deleteFlashSaleEvent(token: string, eventId: string) {
  return requestJson<{ success: true }>(`/admin/flash-sale-events/${eventId}`, {
    method: "DELETE",
    token,
  });
}
