import { mapAdminVendorWithdrawalRequest } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";
import type { AdminVendorWithdrawalRequest } from "@/types";

type BackendAdminVendorWithdrawalRequest = {
  id: string;
  wallet_id: string;
  vendor_user_id: string;
  vendor_name: string;
  vendor_email: string;
  store_name?: string | null;
  currency: string;
  status: AdminVendorWithdrawalRequest["status"];
  amount: number;
  note?: string | null;
  admin_note?: string | null;
  payout_method_type: string;
  payout_account_name: string;
  payout_account_number_masked: string;
  payout_provider?: string | null;
  paystack_transfer_reference?: string | null;
  paystack_transfer_code?: string | null;
  transfer_failure_reason?: string | null;
  transfer_initiated_at?: string | null;
  wallet_available_balance: number;
  wallet_pending_withdrawal_balance: number;
  reviewed_by_user_id?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
};

const vendorWithdrawalsListApi = createPaginatedAdminApi<
  BackendAdminVendorWithdrawalRequest,
  AdminVendorWithdrawalRequest
>({
  path: "/admin/payouts/withdrawals",
  mapItem: mapAdminVendorWithdrawalRequest,
});

export const getVendorWithdrawalRequestsPage = vendorWithdrawalsListApi.getPage;
export const getVendorWithdrawalRequests = vendorWithdrawalsListApi.getAll;

export async function updateVendorWithdrawalRequest(
  token: string,
  requestId: string,
  payload: {
    status: AdminVendorWithdrawalRequest["status"];
    adminNote?: string | null;
  },
) {
  const request = await requestJson<BackendAdminVendorWithdrawalRequest>(
    `/admin/payouts/withdrawals/${requestId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({
        status: payload.status,
        admin_note: payload.adminNote ?? null,
      }),
    },
  );
  return mapAdminVendorWithdrawalRequest(request);
}
