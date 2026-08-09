import { requestJson } from "@/api/client";

export type DeliveryOpsOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  storeName: string;
  vendorStatus: string;
  deliveryStatus: string;
  settlementStatus: string;
  deliveryMethod: string;
  addressCity: string;
  addressRegion: string;
  productCount: number;
  totalAmount: number;
  stageStartedAt: string;
  minutesInStage: number;
  isDelayed: boolean;
  isException: boolean;
  placedAt: string;
};

export type DeliveryOpsSnapshot = {
  orders: DeliveryOpsOrder[];
  stageCounts: Record<string, number>;
  delayedCount: number;
  exceptionsCount: number;
  totalActive: number;
};

type BackendDeliveryOpsOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  store_name: string;
  vendor_status: string;
  delivery_status: string;
  settlement_status: string;
  delivery_method: string;
  address_city: string;
  address_region: string;
  product_count: number;
  total_amount: number;
  stage_started_at: string;
  minutes_in_stage: number;
  is_delayed: boolean;
  is_exception: boolean;
  placed_at: string;
};

type BackendDeliveryOpsSnapshot = {
  orders: BackendDeliveryOpsOrder[];
  stage_counts: Record<string, number>;
  delayed_count: number;
  exceptions_count: number;
  total_active: number;
};

export async function getDeliveryOps(token: string): Promise<DeliveryOpsSnapshot> {
  const snapshot = await requestJson<BackendDeliveryOpsSnapshot>("/admin/orders/delivery-ops", {
    token,
  });

  return {
    orders: snapshot.orders.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      storeName: order.store_name,
      vendorStatus: order.vendor_status,
      deliveryStatus: order.delivery_status,
      settlementStatus: order.settlement_status,
      deliveryMethod: order.delivery_method,
      addressCity: order.address_city,
      addressRegion: order.address_region,
      productCount: order.product_count,
      totalAmount: order.total_amount,
      stageStartedAt: order.stage_started_at,
      minutesInStage: order.minutes_in_stage,
      isDelayed: order.is_delayed,
      isException: order.is_exception,
      placedAt: order.placed_at,
    })),
    stageCounts: snapshot.stage_counts,
    delayedCount: snapshot.delayed_count,
    exceptionsCount: snapshot.exceptions_count,
    totalActive: snapshot.total_active,
  };
}
