import type { PromoBanner } from "@/types";
import { mapPromoBanner } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getPromoBanners(token: string) {
  const banners = await requestJson<
    Array<{
      id: string;
      title: string;
      subtitle?: string | null;
      cta_label: string;
      cta_link?: string | null;
      image_url?: string | null;
      accent?: string | null;
      sort_order: number;
      status: PromoBanner["status"];
      starts_at?: string | null;
      ends_at?: string | null;
      created_at: string;
      updated_at: string;
    }>
  >("/admin/promo-banners", { token });
  return banners.map(mapPromoBanner);
}

type PromoBannerDraft = Pick<
  PromoBanner,
  "title" | "subtitle" | "ctaLabel" | "ctaLink" | "accent" | "sortOrder" | "status" | "startsAt" | "endsAt"
> & {
  imageFile?: File | null;
};

function appendPromoBannerForm(formData: FormData, payload: PromoBannerDraft) {
  formData.append("title", payload.title.trim());
  formData.append("cta_label", payload.ctaLabel.trim());
  formData.append("status", payload.status);
  formData.append("sort_order", String(payload.sortOrder));

  if (payload.subtitle?.trim()) {
    formData.append("subtitle", payload.subtitle.trim());
  }
  if (payload.ctaLink?.trim()) {
    formData.append("cta_link", payload.ctaLink.trim());
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

  const banner = await requestJson<{
    id: string;
    title: string;
    subtitle?: string | null;
    cta_label: string;
    cta_link?: string | null;
    image_url?: string | null;
    accent?: string | null;
    sort_order: number;
    status: PromoBanner["status"];
    starts_at?: string | null;
    ends_at?: string | null;
    created_at: string;
    updated_at: string;
  }>("/admin/promo-banners", {
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

  const banner = await requestJson<{
    id: string;
    title: string;
    subtitle?: string | null;
    cta_label: string;
    cta_link?: string | null;
    image_url?: string | null;
    accent?: string | null;
    sort_order: number;
    status: PromoBanner["status"];
    starts_at?: string | null;
    ends_at?: string | null;
    created_at: string;
    updated_at: string;
  }>(`/admin/promo-banners/${bannerId}`, {
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
