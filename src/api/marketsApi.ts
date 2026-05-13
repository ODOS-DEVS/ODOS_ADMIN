import type { Market } from "@/types";
import { mapMarket } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getMarkets(token: string) {
  const markets = await requestJson<
    Array<{
      id: string;
      name: string;
      slug: string;
      image?: string | null;
      image_url?: string | null;
      status: Market["status"];
      created_at: string;
    }>
  >("/admin/markets", { token });
  return markets.map(mapMarket);
}

type MarketDraft = Pick<Market, "name" | "slug" | "image" | "status"> & {
  imageFile?: File | null;
};

export async function createMarket(token: string, payload: MarketDraft) {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("slug", payload.slug.trim());
  formData.append("status", payload.status);
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

export async function updateMarket(token: string, marketId: string, payload: MarketDraft) {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("slug", payload.slug.trim());
  formData.append("status", payload.status);
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
