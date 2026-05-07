import { mockMarkets } from "@/data/mockData";
import type { Market } from "@/types";
import { mapMarket } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export async function getMarkets(token: string) {
  return withFallback<Market[]>(
    async () => {
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
    },
    () => mockMarkets,
  );
}

type MarketDraft = Pick<Market, "name" | "slug" | "image" | "status"> & {
  imageFile?: File | null;
};

export async function createMarket(token: string, payload: MarketDraft) {
  return withFallback<Market>(
    async () => {
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
    },
    () => {
      const market: Market = {
        id: `market-${Date.now()}`,
        createdAt: new Date().toISOString(),
        imageUrl: payload.imageFile ? URL.createObjectURL(payload.imageFile) : null,
        ...payload,
      };
      mockMarkets.unshift(market);
      return market;
    },
  );
}

export async function updateMarket(token: string, marketId: string, payload: MarketDraft) {
  return withFallback<Market>(
    async () => {
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
    },
    () => {
      const index = mockMarkets.findIndex((item) => item.id === marketId);
      if (index < 0) {
        throw new Error("Market not found");
      }
      mockMarkets[index] = {
        ...mockMarkets[index],
        ...payload,
        imageUrl: payload.imageFile
          ? URL.createObjectURL(payload.imageFile)
          : mockMarkets[index].imageUrl ?? null,
      };
      return mockMarkets[index];
    },
  );
}

export async function deleteMarket(token: string, marketId: string) {
  return withFallback<{ success: true }>(
    () =>
      requestJson(`/admin/markets/${marketId}`, {
        method: "DELETE",
        token,
      }),
    () => {
      const market = mockMarkets.find((item) => item.id === marketId);
      if (!market) {
        throw new Error("Market not found");
      }
      market.status = "disabled";
      return { success: true as const };
    },
  );
}
