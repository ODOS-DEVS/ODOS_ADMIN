import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

export type MerchandisingCampaign = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  bannerImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
  iconKey?: string | null;
  themeColor?: string | null;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  visibility: string;
  startsAt?: string | null;
  endsAt?: string | null;
  displayPriority: number;
  maxProducts?: number | null;
  productSort: string;
  hideOutOfStock: boolean;
  includeEntireMarketplace: boolean;
  allowVendorOptIn: boolean;
  productIds: string[];
  pinnedProductIds: string[];
  categorySlugs: string[];
  storeIds: string[];
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

type BackendCampaign = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  thumbnail_image_url?: string | null;
  icon_key?: string | null;
  theme_color?: string | null;
  status: string;
  is_active: boolean;
  is_featured: boolean;
  visibility: string;
  starts_at?: string | null;
  ends_at?: string | null;
  display_priority: number;
  max_products?: number | null;
  product_sort: string;
  hide_out_of_stock: boolean;
  include_entire_marketplace: boolean;
  allow_vendor_opt_in: boolean;
  product_ids: string[];
  pinned_product_ids: string[];
  category_slugs: string[];
  store_ids: string[];
  product_count: number;
  created_at: string;
  updated_at: string;
};

export type MerchandisingCampaignUpsert = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  bannerImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
  iconKey?: string | null;
  themeColor?: string | null;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  visibility: string;
  startsAt?: string | null;
  endsAt?: string | null;
  displayPriority: number;
  maxProducts?: number | null;
  productSort: string;
  hideOutOfStock: boolean;
  includeEntireMarketplace: boolean;
  allowVendorOptIn: boolean;
  productIds: string[];
  pinnedProductIds: string[];
  categorySlugs: string[];
  storeIds: string[];
};

function mapCampaign(row: BackendCampaign): MerchandisingCampaign {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    bannerImageUrl: row.banner_image_url,
    thumbnailImageUrl: row.thumbnail_image_url,
    iconKey: row.icon_key,
    themeColor: row.theme_color,
    status: row.status,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    visibility: row.visibility,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    displayPriority: row.display_priority,
    maxProducts: row.max_products,
    productSort: row.product_sort,
    hideOutOfStock: row.hide_out_of_stock,
    includeEntireMarketplace: row.include_entire_marketplace,
    allowVendorOptIn: row.allow_vendor_opt_in,
    productIds: row.product_ids ?? [],
    pinnedProductIds: row.pinned_product_ids ?? [],
    categorySlugs: row.category_slugs ?? [],
    storeIds: row.store_ids ?? [],
    productCount: row.product_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildPayload(payload: MerchandisingCampaignUpsert) {
  return {
    slug: payload.slug.trim(),
    title: payload.title.trim(),
    subtitle: payload.subtitle?.trim() || null,
    description: payload.description?.trim() || null,
    banner_image_url: payload.bannerImageUrl?.trim() || null,
    thumbnail_image_url: payload.thumbnailImageUrl?.trim() || null,
    icon_key: payload.iconKey?.trim() || null,
    theme_color: payload.themeColor?.trim() || null,
    status: payload.status,
    is_active: payload.isActive,
    is_featured: payload.isFeatured,
    visibility: payload.visibility,
    starts_at: payload.startsAt || null,
    ends_at: payload.endsAt || null,
    display_priority: payload.displayPriority,
    max_products: payload.maxProducts ?? null,
    product_sort: payload.productSort,
    hide_out_of_stock: payload.hideOutOfStock,
    include_entire_marketplace: payload.includeEntireMarketplace,
    allow_vendor_opt_in: payload.allowVendorOptIn,
    product_ids: payload.productIds,
    pinned_product_ids: payload.pinnedProductIds,
    category_slugs: payload.categorySlugs,
    store_ids: payload.storeIds,
  };
}

const campaignsListApi = createPaginatedAdminApi<BackendCampaign, MerchandisingCampaign>({
  path: "/admin/merchandising-campaigns",
  mapItem: mapCampaign,
});

export const getMerchandisingCampaignsPage = campaignsListApi.getPage;

export async function createMerchandisingCampaign(
  token: string,
  payload: MerchandisingCampaignUpsert,
) {
  const row = await requestJson<BackendCampaign>("/admin/merchandising-campaigns", {
    method: "POST",
    token,
    body: JSON.stringify(buildPayload(payload)),
    headers: { "Content-Type": "application/json" },
  });
  return mapCampaign(row);
}

export async function updateMerchandisingCampaign(
  token: string,
  campaignId: string,
  payload: MerchandisingCampaignUpsert,
) {
  const row = await requestJson<BackendCampaign>(
    `/admin/merchandising-campaigns/${campaignId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(buildPayload(payload)),
      headers: { "Content-Type": "application/json" },
    },
  );
  return mapCampaign(row);
}

export async function duplicateMerchandisingCampaign(token: string, campaignId: string) {
  const row = await requestJson<BackendCampaign>(
    `/admin/merchandising-campaigns/${campaignId}/duplicate`,
    { method: "POST", token },
  );
  return mapCampaign(row);
}

export async function archiveMerchandisingCampaign(token: string, campaignId: string) {
  return requestJson<{ success: true }>(`/admin/merchandising-campaigns/${campaignId}`, {
    method: "DELETE",
    token,
  });
}
