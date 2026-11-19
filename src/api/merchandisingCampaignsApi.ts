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
  /** Last moment vendors may nominate. Null runs the window to the campaign end. */
  submissionDeadline?: string | null;
  requiresProposedPrice: boolean;
  minDiscountPercent?: number | null;
  vendorsNotifiedAt?: string | null;
  vendorsNotifiedCount: number;
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
  submission_deadline?: string | null;
  requires_proposed_price?: boolean;
  min_discount_percent?: number | null;
  vendors_notified_at?: string | null;
  vendors_notified_count?: number;
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
  submissionDeadline?: string | null;
  requiresProposedPrice: boolean;
  minDiscountPercent?: number | null;
  /** Invite every approved vendor when this save publishes the campaign. */
  notifyVendors?: boolean;
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
    submissionDeadline: row.submission_deadline ?? null,
    requiresProposedPrice: Boolean(row.requires_proposed_price),
    minDiscountPercent: row.min_discount_percent ?? null,
    vendorsNotifiedAt: row.vendors_notified_at ?? null,
    vendorsNotifiedCount: row.vendors_notified_count ?? 0,
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
    submission_deadline: payload.submissionDeadline || null,
    requires_proposed_price: payload.requiresProposedPrice,
    min_discount_percent: payload.minDiscountPercent ?? null,
    notify_vendors: Boolean(payload.notifyVendors),
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

/**
 * Upload campaign artwork.
 *
 * Separate from the JSON upsert because FastAPI cannot mix a JSON body with file parts — which
 * is why the dashboard previously offered only URL text fields for images an admin had sitting
 * on their disk. Only the files actually passed are written, so replacing a banner leaves an
 * existing thumbnail alone.
 */
export async function uploadCampaignArtwork(
  token: string,
  campaignId: string,
  files: { banner?: File | null; thumbnail?: File | null },
) {
  const formData = new FormData();
  if (files.banner) formData.append("banner_image", files.banner);
  if (files.thumbnail) formData.append("thumbnail_image", files.thumbnail);

  const row = await requestJson<BackendCampaign>(
    `/admin/merchandising-campaigns/${campaignId}/artwork`,
    { method: "POST", token, body: formData },
  );
  return mapCampaign(row);
}


/* ---------- Vendor participation ---------- */

export type CampaignParticipation = {
  campaignId: string;
  campaignSlug: string;
  vendorsNotified: number;
  vendorsNotifiedAt: string | null;
  vendorsSubmitted: number;
  eligibleVendors: number;
  productsNominated: number;
  productsApproved: number;
  productsRejected: number;
  productsPending: number;
};

type BackendParticipation = {
  campaign_id: string;
  campaign_slug: string;
  vendors_notified: number;
  vendors_notified_at: string | null;
  vendors_submitted: number;
  eligible_vendors: number;
  products_nominated: number;
  products_approved: number;
  products_rejected: number;
  products_pending: number;
};

const mapParticipation = (row: BackendParticipation): CampaignParticipation => ({
  campaignId: row.campaign_id,
  campaignSlug: row.campaign_slug,
  vendorsNotified: row.vendors_notified ?? 0,
  vendorsNotifiedAt: row.vendors_notified_at ?? null,
  vendorsSubmitted: row.vendors_submitted ?? 0,
  eligibleVendors: row.eligible_vendors ?? 0,
  productsNominated: row.products_nominated ?? 0,
  productsApproved: row.products_approved ?? 0,
  productsRejected: row.products_rejected ?? 0,
  productsPending: row.products_pending ?? 0,
});

export async function getCampaignParticipation(token: string, campaignId: string) {
  const row = await requestJson<BackendParticipation>(
    `/admin/merchandising-campaigns/${campaignId}/participation`,
    { token },
  );
  return mapParticipation(row);
}

/**
 * Invite every approved vendor to submit products.
 *
 * Refused with 409 if the campaign has already been notified, so a double-click cannot send a
 * second round. `force` is the deliberate re-send — after extending a deadline, say.
 */
export async function notifyCampaignVendors(token: string, campaignId: string, force = false) {
  const row = await requestJson<BackendParticipation>(
    `/admin/merchandising-campaigns/${campaignId}/notify-vendors${force ? "?force=true" : ""}`,
    { method: "POST", token },
  );
  return mapParticipation(row);
}
