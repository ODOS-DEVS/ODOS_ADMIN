import { mockStores } from "@/data/mockData";
import type { Store, StoreStatus } from "@/types";
import { mapStore } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export type CreateStoreInput = {
  name: string;
  slug?: string;
  description: string;
  category: string;
  audienceSlugs?: string[] | null;
  marketId?: string | null;
  location?: string | null;
  region: string;
  city: string;
  status: StoreStatus;
  logoImageFile?: File | null;
  bannerImageFile?: File | null;
};

export async function getStores(token: string) {
  return withFallback<Store[]>(
    async () => {
      const stores = await requestJson<
        Array<{
          id: string;
          vendor_id: string | null;
          name: string;
          slug: string;
          description: string;
          category: string;
          audience_slugs?: string[] | null;
          market_id: string | null;
          location: string | null;
          region: string;
          city: string;
          banner_image?: string | null;
          logo_image?: string | null;
          status: StoreStatus;
          created_at: string;
        }>
      >("/admin/stores", { token });
      return stores.map(mapStore);
    },
    () => mockStores,
  );
}

export async function createStore(token: string, input: CreateStoreInput) {
  return withFallback<Store>(
    async () => {
      const formData = new FormData();
      formData.append("name", input.name.trim());
      formData.append("description", input.description.trim());
      formData.append("category", input.category.trim());
      formData.append("region", input.region.trim());
      formData.append("city", input.city.trim());
      formData.append("status", input.status);
      if (input.slug?.trim()) {
        formData.append("slug", input.slug.trim());
      }
      if (input.marketId?.trim()) {
        formData.append("market_id", input.marketId.trim());
      }
      if (input.location?.trim()) {
        formData.append("location", input.location.trim());
      }
      if (input.audienceSlugs?.length) {
        formData.append("audience_slugs", input.audienceSlugs.join(", "));
      }
      if (input.logoImageFile) {
        formData.append("logo_image", input.logoImageFile);
      }
      if (input.bannerImageFile) {
        formData.append("banner_image", input.bannerImageFile);
      }

      const store = await requestJson<{
        id: string;
        vendor_id: string | null;
        name: string;
        slug: string;
        description: string;
        category: string;
        audience_slugs?: string[] | null;
        market_id: string | null;
        location: string | null;
        region: string;
        city: string;
        banner_image?: string | null;
        logo_image?: string | null;
        status: StoreStatus;
        created_at: string;
      }>("/admin/stores", {
        method: "POST",
        token,
        body: formData,
      });
      return mapStore(store);
    },
    () => {
      const store: Store = {
        id: `store-${Date.now()}`,
        vendorId: null,
        name: input.name,
        slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-"),
        description: input.description,
        category: input.category,
        audienceSlugs: input.audienceSlugs ?? null,
        marketId: input.marketId ?? null,
        location: input.location ?? null,
        region: input.region,
        city: input.city,
        bannerImage: input.bannerImageFile ? URL.createObjectURL(input.bannerImageFile) : null,
        logoImage: input.logoImageFile ? URL.createObjectURL(input.logoImageFile) : null,
        status: input.status,
        createdAt: new Date().toISOString(),
      };
      mockStores.unshift(store);
      return store;
    },
  );
}

export async function updateStoreStatus(token: string, storeId: string, status: StoreStatus) {
  return withFallback<Store>(
    async () => {
      const store = await requestJson<{
        id: string;
        vendor_id: string | null;
        name: string;
        slug: string;
        description: string;
        category: string;
        market_id: string | null;
        location: string | null;
        region: string;
        city: string;
        banner_image?: string | null;
        logo_image?: string | null;
        status: StoreStatus;
        created_at: string;
      }>(`/admin/stores/${storeId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      return mapStore(store);
    },
    () => {
      const store = mockStores.find((item) => item.id === storeId);
      if (!store) {
        throw new Error("Store not found");
      }
      store.status = status;
      return store;
    },
  );
}
