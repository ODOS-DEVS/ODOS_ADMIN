import type { Market } from "@/types";
import { mapMarket } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

type BackendMarket = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  image_url?: string | null;
  status: Market["status"];
  created_at: string;
};

const marketsListApi = createPaginatedAdminApi<BackendMarket, Market>({
  path: "/admin/markets",
  mapItem: mapMarket,
});

export const getMarketsPage = marketsListApi.getPage;
export const getMarkets = marketsListApi.getAll;

type MarketDraft = Pick<Market, "name" | "status"> & {
  slug?: string;
  image?: string | null;
  imageFile?: File | null;
};

export async function createMarket(token: string, payload: MarketDraft) {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("status", payload.status);
  if (payload.slug?.trim()) {
    formData.append("slug", payload.slug.trim());
  }
  if (payload.image?.trim()) {
    formData.append("image", payload.image.trim());
  }
  if (payload.imageFile) {
    formData.append("image_file", payload.imageFile);
  }

  const market = await requestJson<{
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    image_url?: string | null;
    status: Market["status"];
    created_at: string;
  }>("/admin/markets", {
    method: "POST",
    token,
    body: formData,
  });
  return mapMarket(market);
}

export async function updateMarket(
  token: string,
  marketId: string,
  payload: MarketDraft,
) {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("status", payload.status);
  if (payload.slug?.trim()) {
    formData.append("slug", payload.slug.trim());
  }
  if (payload.image?.trim()) {
    formData.append("image", payload.image.trim());
  }
  if (payload.imageFile) {
    formData.append("image_file", payload.imageFile);
  }

  const market = await requestJson<{
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    image_url?: string | null;
    status: Market["status"];
    created_at: string;
  }>(`/admin/markets/${marketId}`, {
    method: "PATCH",
    token,
    body: formData,
  });
  return mapMarket(market);
}

export async function deleteMarket(token: string, marketId: string) {
  return requestJson<{ success: true }>(`/admin/markets/${marketId}`, {
    method: "DELETE",
    token,
  });
}
