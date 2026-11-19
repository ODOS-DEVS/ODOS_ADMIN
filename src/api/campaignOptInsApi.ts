import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

export type CampaignOptIn = {
  id: string;
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  productId: string;
  productTitle: string;
  vendorUserId: string;
  vendorName?: string | null;
  /** What the vendor asked the product to cost during the campaign, and the shelf price at
   *  the moment they asked. Never written back onto the product itself. */
  proposedPrice?: number | null;
  proposedOldPrice?: number | null;
  currentPrice?: number | null;
  discountPercent?: number | null;
  vendorNote?: string | null;
  status: string;
  reviewNotes?: string | null;
  unitsSoldSinceApproval?: number | null;
  createdAt: string;
  updatedAt: string;
};

type BackendOptIn = {
  id: string;
  campaign_id: string;
  campaign_slug: string;
  campaign_title: string;
  product_id: string;
  product_title: string;
  vendor_user_id: string;
  vendor_name?: string | null;
  proposed_price?: number | null;
  proposed_old_price?: number | null;
  current_price?: number | null;
  discount_percent?: number | null;
  vendor_note?: string | null;
  status: string;
  review_notes?: string | null;
  units_sold_since_approval?: number | null;
  created_at: string;
  updated_at: string;
};

function mapOptIn(row: BackendOptIn): CampaignOptIn {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignSlug: row.campaign_slug,
    campaignTitle: row.campaign_title,
    productId: row.product_id,
    productTitle: row.product_title,
    vendorUserId: row.vendor_user_id,
    vendorName: row.vendor_name,
    proposedPrice: row.proposed_price ?? null,
    proposedOldPrice: row.proposed_old_price ?? null,
    currentPrice: row.current_price ?? null,
    discountPercent: row.discount_percent ?? null,
    vendorNote: row.vendor_note ?? null,
    status: row.status,
    reviewNotes: row.review_notes,
    unitsSoldSinceApproval: row.units_sold_since_approval,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const optInsListApi = createPaginatedAdminApi<BackendOptIn, CampaignOptIn>({
  path: "/admin/merchandising-campaign-opt-ins",
  mapItem: mapOptIn,
});

export const getCampaignOptInsPage = optInsListApi.getPage;

export async function reviewCampaignOptIn(
  token: string,
  optInId: string,
  payload: {
    status: "approved" | "rejected";
    reviewNotes?: string | null;
    /** Settle on a different campaign price than the vendor proposed. Never the shelf price. */
    campaignPrice?: number | null;
  },
) {
  const params = new URLSearchParams({ status: payload.status });
  if (payload.reviewNotes) {
    params.set("review_notes", payload.reviewNotes);
  }
  if (payload.campaignPrice != null) {
    params.set("campaign_price", String(payload.campaignPrice));
  }
  const row = await requestJson<BackendOptIn>(
    `/admin/merchandising-campaign-opt-ins/${optInId}/review?${params.toString()}`,
    { method: "POST", token },
  );
  return mapOptIn(row);
}
