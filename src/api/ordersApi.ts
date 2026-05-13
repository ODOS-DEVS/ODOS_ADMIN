import type { Order, OrderStatus } from "@/types";
import { mapOrder } from "@/api/mappers";
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
