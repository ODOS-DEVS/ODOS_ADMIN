import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

export type FlashSaleNomination = {
  id: string;
  eventId?: string | null;
  eventTitle?: string | null;
  productId: string;
  productTitle?: string | null;
  vendorUserId: string;
  vendorName?: string | null;
  proposedPrice?: number | null;
  proposedOldPrice?: number | null;
  stockLimit?: number | null;
  unitsSold?: number | null;
  unitsRemaining?: number | null;
  maxPerUser?: number | null;
  vendorNote?: string | null;
  status: string;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendNomination = {
  id: string;
  event_id?: string | null;
  event_title?: string | null;
  product_id: string;
  product_title?: string | null;
  vendor_user_id: string;
  vendor_name?: string | null;
  proposed_price?: number | null;
  proposed_old_price?: number | null;
  stock_limit?: number | null;
  units_sold?: number | null;
  units_remaining?: number | null;
  max_per_user?: number | null;
  vendor_note?: string | null;
  status: string;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
};

function mapNomination(row: BackendNomination): FlashSaleNomination {
  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    productId: row.product_id,
    productTitle: row.product_title,
    vendorUserId: row.vendor_user_id,
    vendorName: row.vendor_name,
    proposedPrice: row.proposed_price,
    proposedOldPrice: row.proposed_old_price,
    stockLimit: row.stock_limit,
    unitsSold: row.units_sold,
    unitsRemaining: row.units_remaining,
    maxPerUser: row.max_per_user,
    vendorNote: row.vendor_note,
    status: row.status,
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const nominationsListApi = createPaginatedAdminApi<BackendNomination, FlashSaleNomination>({
  path: "/admin/flash-sale-nominations",
  mapItem: mapNomination,
});

export const getFlashSaleNominationsPage = nominationsListApi.getPage;

export async function reviewFlashSaleNomination(
  token: string,
  nominationId: string,
  payload: {
    status: "approved" | "rejected";
    reviewNotes?: string | null;
    eventId?: string | null;
    flashSalePrice?: number | null;
    flashSaleOldPrice?: number | null;
    stockLimit?: number | null;
  },
) {
  const row = await requestJson<BackendNomination>(
    `/admin/flash-sale-nominations/${nominationId}/review`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        status: payload.status,
        review_notes: payload.reviewNotes ?? null,
        event_id: payload.eventId ?? null,
        flash_sale_price: payload.flashSalePrice ?? null,
        flash_sale_old_price: payload.flashSaleOldPrice ?? null,
        stock_limit: payload.stockLimit ?? null,
      }),
    },
  );
  return mapNomination(row);
}
