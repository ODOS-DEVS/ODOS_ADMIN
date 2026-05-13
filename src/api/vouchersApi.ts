import { mapVoucherCampaign } from "@/api/mappers";
import { requestJson } from "@/api/client";
import type {
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
  availability: VoucherAvailability;
  store_id?: string | null;
  store_name?: string | null;
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
};

export type VoucherDraft = {
  code: string;
  title: string;
  description?: string | null;
  issuerName?: string | null;
  scope: VoucherScope;
  availability: VoucherAvailability;
  storeId?: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

function toBackendPayload(input: VoucherDraft) {
  return {
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    issuer_name: input.issuerName?.trim() || null,
    scope: input.scope,
    availability: input.availability,
    store_id: input.scope === "store" ? input.storeId?.trim() || null : null,
    discount_type: input.discountType,
    discount_value: input.discountType === "free_shipping" ? 0 : input.discountValue,
    min_subtotal: input.minSubtotal,
    max_discount: input.maxDiscount ?? null,
    usage_limit: input.usageLimit ?? null,
    per_user_limit: input.perUserLimit ?? null,
    is_active: input.isActive,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
  };
}

export async function getVouchers(token: string) {
  const vouchers = await requestJson<BackendVoucherCampaign[]>("/admin/vouchers", { token });
  return vouchers.map(mapVoucherCampaign);
}

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
