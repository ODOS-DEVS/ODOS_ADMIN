import { mapVoucherCampaign } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";
import type {
  PromotionAnalytics,
  PromotionType,
  VoucherAvailability,
  VoucherCampaign,
  VoucherDiscountType,
  VoucherScope,
} from "@/types";

type BackendVoucherCampaign = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  issuer_name?: string | null;
  scope: VoucherScope;
  owner_type?: "platform" | "vendor";
  availability: VoucherAvailability;
  store_id?: string | null;
  store_name?: string | null;
  eligible_store_ids?: string[] | null;
  reward_text: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  min_subtotal: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  is_active: boolean;
  status: VoucherCampaign["status"];
  redemption_count: number;
  unique_user_count: number;
  total_discount_amount: number;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  approval_status?: string;
  campaign_tag?: string | null;
  review_notes?: string | null;
  promotion_type?: PromotionType;
  priority?: number;
  stackable?: boolean;
  exclusive_group?: string | null;
  auto_apply?: boolean;
  bogo_buy_quantity?: number | null;
  bogo_get_quantity?: number | null;
  bogo_get_discount_percent?: number | null;
  first_order_only?: boolean;
  new_user_only?: boolean;
  category_slugs?: string[] | null;
  excluded_category_slugs?: string[] | null;
  product_ids?: string[] | null;
  excluded_product_ids?: string[] | null;
};

export type VoucherDraft = {
  code: string;
  title: string;
  description?: string | null;
  issuerName?: string | null;
  scope: VoucherScope;
  ownerType?: "platform" | "vendor";
  availability: VoucherAvailability;
  storeId?: string | null;
  eligibleStoreIds?: string[] | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  campaignTag?: string | null;
  promotionType?: PromotionType;
  priority?: number;
  stackable?: boolean;
  exclusiveGroup?: string | null;
  autoApply?: boolean;
  bogoBuyQuantity?: number | null;
  bogoGetQuantity?: number | null;
  bogoGetDiscountPercent?: number | null;
  firstOrderOnly?: boolean;
  newUserOnly?: boolean;
  categorySlugs?: string[] | null;
  excludedCategorySlugs?: string[] | null;
  productIds?: string[] | null;
  excludedProductIds?: string[] | null;
};

function toBackendPayload(input: VoucherDraft) {
  return {
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    issuer_name: input.issuerName?.trim() || null,
    scope: input.scope,
    owner_type: input.ownerType ?? "platform",
    availability: input.availability,
    store_id: input.scope === "store" ? input.storeId?.trim() || null : null,
    eligible_store_ids: input.scope === "store" ? null : input.eligibleStoreIds ?? null,
    discount_type: input.discountType,
    discount_value: input.discountType === "free_shipping" ? 0 : input.discountValue,
    min_subtotal: input.minSubtotal,
    max_discount: input.maxDiscount ?? null,
    usage_limit: input.usageLimit ?? null,
    per_user_limit: input.perUserLimit ?? null,
    is_active: input.isActive,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
    campaign_tag: input.campaignTag?.trim() || null,
    promotion_type: input.promotionType ?? "coupon",
    priority: input.priority ?? 0,
    stackable: input.stackable ?? false,
    exclusive_group: input.exclusiveGroup?.trim() || null,
    auto_apply: input.autoApply ?? false,
    bogo_buy_quantity: input.bogoBuyQuantity ?? null,
    bogo_get_quantity: input.bogoGetQuantity ?? null,
    bogo_get_discount_percent: input.bogoGetDiscountPercent ?? null,
    first_order_only: input.firstOrderOnly ?? false,
    new_user_only: input.newUserOnly ?? false,
    category_slugs: input.categorySlugs ?? null,
    excluded_category_slugs: input.excludedCategorySlugs ?? null,
    product_ids: input.productIds ?? null,
    excluded_product_ids: input.excludedProductIds ?? null,
  };
}

const vouchersListApi = createPaginatedAdminApi<BackendVoucherCampaign, VoucherCampaign>({
  path: "/admin/vouchers",
  mapItem: mapVoucherCampaign,
});

export const getVouchersPage = vouchersListApi.getPage;
export const getVouchers = vouchersListApi.getAll;

export async function createVoucher(token: string, payload: VoucherDraft) {
  const voucher = await requestJson<BackendVoucherCampaign>("/admin/vouchers", {
    method: "POST",
    token,
    body: JSON.stringify(toBackendPayload(payload)),
  });
  return mapVoucherCampaign(voucher);
}

export async function updateVoucher(token: string, voucherId: string, payload: VoucherDraft) {
  const voucher = await requestJson<BackendVoucherCampaign>(`/admin/vouchers/${voucherId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(toBackendPayload(payload)),
  });
  return mapVoucherCampaign(voucher);
}

export async function archiveVoucher(token: string, voucherId: string) {
  return requestJson<{ success: true }>(`/admin/vouchers/${voucherId}`, {
    method: "DELETE",
    token,
  });
}

export async function pauseVoucher(token: string, voucherId: string) {
  const voucher = await requestJson<BackendVoucherCampaign>(`/admin/vouchers/${voucherId}/pause`, {
    method: "POST",
    token,
  });
  return mapVoucherCampaign(voucher);
}

export async function resumeVoucher(token: string, voucherId: string) {
  const voucher = await requestJson<BackendVoucherCampaign>(`/admin/vouchers/${voucherId}/resume`, {
    method: "POST",
    token,
  });
  return mapVoucherCampaign(voucher);
}

export async function duplicateVoucher(token: string, voucherId: string) {
  const voucher = await requestJson<BackendVoucherCampaign>(
    `/admin/vouchers/${voucherId}/duplicate`,
    {
      method: "POST",
      token,
    },
  );
  return mapVoucherCampaign(voucher);
}

export async function reviewVoucher(
  token: string,
  voucherId: string,
  payload: { approvalStatus: "approved" | "rejected" | "disabled"; reviewNotes?: string | null; isActive?: boolean },
) {
  const voucher = await requestJson<BackendVoucherCampaign>(`/admin/vouchers/${voucherId}/review`, {
    method: "POST",
    token,
    body: JSON.stringify({
      approval_status: payload.approvalStatus,
      review_notes: payload.reviewNotes ?? null,
      is_active: payload.isActive,
    }),
  });
  return mapVoucherCampaign(voucher);
}

export async function getPromotionAnalytics(token: string): Promise<PromotionAnalytics> {
  const response = await requestJson<{
    total_campaigns: number;
    active_campaigns: number;
    total_redemptions: number;
    total_discount_given: number;
    top_campaigns: BackendVoucherCampaign[];
  }>("/admin/vouchers/analytics", { token });

  return {
    totalCampaigns: response.total_campaigns,
    activeCampaigns: response.active_campaigns,
    totalRedemptions: response.total_redemptions,
    totalDiscountGiven: response.total_discount_given,
    topCampaigns: response.top_campaigns.map(mapVoucherCampaign),
  };
}

export async function bulkGenerateVouchers(
  token: string,
  payload: { prefix: string; count: number; template: VoucherDraft },
) {
  const vouchers = await requestJson<BackendVoucherCampaign[]>("/admin/vouchers/bulk-generate", {
    method: "POST",
    token,
    body: JSON.stringify({
      prefix: payload.prefix.trim().toUpperCase(),
      count: payload.count,
      template: toBackendPayload(payload.template),
    }),
  });
  return vouchers.map(mapVoucherCampaign);
}
