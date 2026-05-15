import type { AdminOrderDetail, AdminReturnRequest, Order, OrderStatus } from "@/types";
import { mapAdminReturnRequest, mapOrder, mapOrderDetail } from "@/api/mappers";
import { requestJson } from "@/api/client";

export async function getOrders(token: string) {
  const orders = await requestJson<
    Array<{
      id: string;
      order_number: string;
      customer_name: string;
      store_name: string;
      total_amount: number;
      status: OrderStatus;
      payment_status: Order["paymentStatus"];
      created_at: string;
    }>
  >("/admin/orders", { token });
  return orders.map(mapOrder);
}

export async function getOrder(token: string, orderId: string): Promise<AdminOrderDetail> {
  const order = await requestJson<{
    id: string;
    order_number: string;
    customer_name: string;
    store_name: string;
    total_amount: number;
    status: OrderStatus;
    payment_status: Order["paymentStatus"];
    created_at: string;
    customer_id: string;
    customer_email: string;
    customer_phone_number?: string | null;
    customer_avatar_url?: string | null;
    source: string;
    internal_status: OrderStatus;
    vendor_status: OrderStatus | string;
    subtotal_amount: number;
    shipping_amount: number;
    discount_amount: number;
    progress?: number | null;
    tracking_eta?: string | null;
    cancellation_reason?: string | null;
    address_full_name: string;
    address_phone: string;
    address_street: string;
    address_city: string;
    address_region: string;
    payment_type: string;
    payment_label: string;
    payment_network?: string | null;
    payment_phone?: string | null;
    payment_last4?: string | null;
    voucher_id?: string | null;
    voucher_code?: string | null;
    voucher_title?: string | null;
    placed_at: string;
    delivered_at?: string | null;
    cancelled_at?: string | null;
    updated_at: string;
    items: Array<{
      id: string;
      product_id: string;
      title: string;
      category?: string | null;
      image_url?: string | null;
      image_key?: string | null;
      quantity: number;
      unit_price: number;
      line_total: number;
      selected_color?: string | null;
      selected_size?: string | null;
    }>;
    return_requests: Array<{
      id: string;
      order_id: string;
      order_number: string;
      order_item_id: string;
      product_id: string;
      product_title: string;
      product_image_url?: string | null;
      product_image_key?: string | null;
      store_name: string;
      user_id: string;
      customer_name: string;
      customer_email: string;
      request_type: string;
      status: string;
      quantity: number;
      reason: string;
      details?: string | null;
      evidence_image_urls?: string[] | null;
      admin_note?: string | null;
      refund_amount?: number | null;
      reviewed_by_user_id?: string | null;
      reviewed_by_name?: string | null;
      reviewed_at?: string | null;
      resolved_at?: string | null;
      created_at: string;
      updated_at: string;
    }>;
  }>(`/admin/orders/${orderId}`, { token });
  return mapOrderDetail(order);
}

export async function updateOrderStatus(token: string, orderId: string, status: OrderStatus) {
  const order = await requestJson<{
    id: string;
    order_number: string;
    customer_name: string;
    store_name: string;
    total_amount: number;
    status: OrderStatus;
    payment_status: Order["paymentStatus"];
    created_at: string;
  }>(`/admin/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
  return mapOrder(order);
}

export async function getReturnRequests(token: string): Promise<AdminReturnRequest[]> {
  const requests = await requestJson<
    Array<{
      id: string;
      order_id: string;
      order_number: string;
      order_item_id: string;
      product_id: string;
      product_title: string;
      product_image_url?: string | null;
      product_image_key?: string | null;
      store_name: string;
      user_id: string;
      customer_name: string;
      customer_email: string;
      request_type: string;
      status: string;
      quantity: number;
      reason: string;
      details?: string | null;
      evidence_image_urls?: string[] | null;
      admin_note?: string | null;
      refund_amount?: number | null;
      reviewed_by_user_id?: string | null;
      reviewed_by_name?: string | null;
      reviewed_at?: string | null;
      resolved_at?: string | null;
      created_at: string;
      updated_at: string;
    }>
  >("/admin/returns", { token });
  return requests.map(mapAdminReturnRequest);
}

export async function updateReturnRequest(
  token: string,
  requestId: string,
  payload: {
    status: AdminReturnRequest["status"];
    adminNote?: string | null;
    refundAmount?: number | null;
  },
): Promise<AdminReturnRequest> {
  const request = await requestJson<{
    id: string;
    order_id: string;
    order_number: string;
    order_item_id: string;
    product_id: string;
    product_title: string;
    product_image_url?: string | null;
    product_image_key?: string | null;
    store_name: string;
    user_id: string;
    customer_name: string;
    customer_email: string;
    request_type: string;
    status: string;
    quantity: number;
    reason: string;
    details?: string | null;
    evidence_image_urls?: string[] | null;
    admin_note?: string | null;
    refund_amount?: number | null;
    reviewed_by_user_id?: string | null;
    reviewed_by_name?: string | null;
    reviewed_at?: string | null;
    resolved_at?: string | null;
    created_at: string;
    updated_at: string;
  }>(`/admin/returns/${requestId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({
      status: payload.status,
      admin_note: payload.adminNote ?? null,
      refund_amount: payload.refundAmount ?? null,
    }),
  });
  return mapAdminReturnRequest(request);
}
