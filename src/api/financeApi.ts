import { requestJson } from "@/api/client";
import type {
  AdminFinanceOverview,
  AdminPaymentTransaction,
  AdminPlatformLedgerEntry,
} from "@/types";

export async function getFinanceOverview(token: string): Promise<AdminFinanceOverview> {
  const overview = await requestJson<{
    currency: string;
    current_balance: number;
    vendor_liability_balance: number;
    commission_balance: number;
    gross_collected_total: number;
    processor_fee_total: number;
    refunded_total: number;
    total_payouts_sent: number;
    pending_withdrawal_total: number;
    approved_withdrawal_total: number;
    paid_order_count: number;
    paid_order_volume: number;
  }>("/admin/finance/overview", { token });

  return {
    currency: overview.currency,
    currentBalance: overview.current_balance,
    vendorLiabilityBalance: overview.vendor_liability_balance,
    commissionBalance: overview.commission_balance,
    grossCollectedTotal: overview.gross_collected_total,
    processorFeeTotal: overview.processor_fee_total,
    refundedTotal: overview.refunded_total,
    totalPayoutsSent: overview.total_payouts_sent,
    pendingWithdrawalTotal: overview.pending_withdrawal_total,
    approvedWithdrawalTotal: overview.approved_withdrawal_total,
    paidOrderCount: overview.paid_order_count,
    paidOrderVolume: overview.paid_order_volume,
  };
}

export async function getPaymentTransactions(
  token: string,
): Promise<AdminPaymentTransaction[]> {
  const transactions = await requestJson<
    Array<{
      id: string;
      order_id: string;
      order_number: string;
      user_id: string;
      customer_email: string;
      provider: string;
      reference: string;
      amount: number;
      currency: string;
      status: string;
      preferred_channel?: string | null;
      processor_fee_amount: number;
      gateway_response?: string | null;
      provider_transaction_id?: string | null;
      paid_at?: string | null;
      verified_at?: string | null;
      created_at: string;
      updated_at: string;
    }>
  >("/admin/finance/payments", { token });

  return transactions.map((transaction) => ({
    id: transaction.id,
    orderId: transaction.order_id,
    orderNumber: transaction.order_number,
    userId: transaction.user_id,
    customerEmail: transaction.customer_email,
    provider: transaction.provider,
    reference: transaction.reference,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    preferredChannel: transaction.preferred_channel ?? null,
    processorFeeAmount: transaction.processor_fee_amount,
    gatewayResponse: transaction.gateway_response ?? null,
    providerTransactionId: transaction.provider_transaction_id ?? null,
    paidAt: transaction.paid_at ?? null,
    verifiedAt: transaction.verified_at ?? null,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  }));
}

export async function getPlatformLedgerEntries(
  token: string,
): Promise<AdminPlatformLedgerEntry[]> {
  const entries = await requestJson<
    Array<{
      id: string;
      kind: string;
      direction: string;
      title: string;
      description?: string | null;
      amount: number;
      current_balance_after: number;
      vendor_liability_balance_after: number;
      commission_balance_after: number;
      order_id?: string | null;
      order_number?: string | null;
      payment_transaction_id?: string | null;
      payment_reference?: string | null;
      return_request_id?: string | null;
      vendor_withdrawal_request_id?: string | null;
      created_at: string;
    }>
  >("/admin/finance/ledger", { token });

  return entries.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    direction: entry.direction,
    title: entry.title,
    description: entry.description ?? null,
    amount: entry.amount,
    currentBalanceAfter: entry.current_balance_after,
    vendorLiabilityBalanceAfter: entry.vendor_liability_balance_after,
    commissionBalanceAfter: entry.commission_balance_after,
    orderId: entry.order_id ?? null,
    orderNumber: entry.order_number ?? null,
    paymentTransactionId: entry.payment_transaction_id ?? null,
    paymentReference: entry.payment_reference ?? null,
    returnRequestId: entry.return_request_id ?? null,
    vendorWithdrawalRequestId: entry.vendor_withdrawal_request_id ?? null,
    createdAt: entry.created_at,
  }));
}
