import type { PromoBanner } from "@/types";
import { mapPromoBanner } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { ApiError, requestJson } from "@/api/client";
import type { PromoBannerLinkType, PromoBannerPlacement } from "@/types";

type BackendPromoBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  cta_label: string;
  cta_link?: string | null;
  image_url?: string | null;
  accent?: string | null;
  sort_order: number;
  status: PromoBanner["status"];
  link_type: string;
  campaign_tag?: string | null;
  placement: string;
  destination_label?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
};

const promoBannersListApi = createPaginatedAdminApi<BackendPromoBanner, PromoBanner>({
  path: "/admin/promo-banners",
  mapItem: mapPromoBanner,
});

export const getPromoBannersPage = promoBannersListApi.getPage;
export const getPromoBanners = promoBannersListApi.getAll;

function shouldFallbackPromoBannerLookup(error: unknown) {
  return error instanceof ApiError && (error.status === 404 || error.status === 405);
}

async function findPromoBannerInPages(token: string, bannerId: string) {
  let offset = 0;
  const limit = 100;

  for (let pageIndex = 0; pageIndex < 20; pageIndex += 1) {
    const page = await getPromoBannersPage(token, { limit, offset });
    const match = page.items.find((entry) => entry.id === bannerId);
    if (match) {
      return match;
    }
    if (!page.has_more || page.items.length === 0) {
      break;
    }
    offset += page.items.length;
  }

  throw new Error("Promo banner not found.");
}

export async function getPromoBanner(token: string, bannerId: string) {
  try {
    const banner = await requestJson<BackendPromoBanner>(`/admin/promo-banners/${bannerId}`, {
      token,
    });
    return mapPromoBanner(banner);
  } catch (error) {
    if (!shouldFallbackPromoBannerLookup(error)) {
      throw error;
    }
    return findPromoBannerInPages(token, bannerId);
  }
}

export type PromoBannerDraft = {
  title: string;
  subtitle?: string | null;
  ctaLabel: string;
  ctaLink?: string | null;
  accent?: PromoBanner["accent"];
  sortOrder: number;
  status: PromoBanner["status"];
  linkType: PromoBannerLinkType;
  campaignTag?: string | null;
  placement: PromoBannerPlacement;
  startsAt?: string | null;
  endsAt?: string | null;
  imageFile?: File | null;
};

function appendPromoBannerForm(formData: FormData, payload: PromoBannerDraft) {
  formData.append("title", payload.title.trim());
  formData.append("cta_label", payload.ctaLabel.trim());
  formData.append("status", payload.status);
  formData.append("sort_order", String(payload.sortOrder));
  formData.append("link_type", payload.linkType);
  formData.append("placement", payload.placement);

  if (payload.subtitle?.trim()) {
    formData.append("subtitle", payload.subtitle.trim());
  }
  if (payload.ctaLink?.trim()) {
    formData.append("cta_link", payload.ctaLink.trim());
  }
  if (payload.campaignTag?.trim()) {
    formData.append("campaign_tag", payload.campaignTag.trim());
  }
  if (payload.accent) {
    formData.append("accent", payload.accent);
  }
  if (payload.startsAt) {
    formData.append("starts_at", payload.startsAt);
  }
  if (payload.endsAt) {
    formData.append("ends_at", payload.endsAt);
  }
  if (payload.imageFile) {
    formData.append("image_file", payload.imageFile);
  }
}

export async function createPromoBanner(token: string, payload: PromoBannerDraft) {
  const formData = new FormData();
  appendPromoBannerForm(formData, payload);

  const banner = await requestJson<BackendPromoBanner>("/admin/promo-banners", {
    method: "POST",
    token,
    body: formData,
  });
  return mapPromoBanner(banner);
}

export async function updatePromoBanner(
  token: string,
  bannerId: string,
  payload: PromoBannerDraft,
) {
  const formData = new FormData();
  appendPromoBannerForm(formData, payload);

  const banner = await requestJson<BackendPromoBanner>(`/admin/promo-banners/${bannerId}`, {
    method: "PATCH",
    token,
    body: formData,
  });
  return mapPromoBanner(banner);
}

export async function deletePromoBanner(token: string, bannerId: string) {
  return requestJson<{ success: true }>(`/admin/promo-banners/${bannerId}`, {
    method: "DELETE",
    token,
  });
}
