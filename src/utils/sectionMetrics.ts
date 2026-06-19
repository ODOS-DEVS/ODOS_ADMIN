import type {
  AdminFinanceOverview,
  AdminPaymentTransaction,
  AdminReturnRequest,
  AdminReview,
  AdminVendorWithdrawalRequest,
  Category,
  FlashSaleEvent,
  Market,
  NotificationItem,
  Order,
  Product,
  PromoBanner,
  Store,
  SupportChatThread,
  Vendor,
  VendorApplication,
  VoucherCampaign,
} from "@/types";

function countByStatus<T>(items: T[], selector: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = selector(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function buildOrderSnapshot(orders: Order[]) {
  const paid = orders.filter((o) => o.paymentStatus === "paid");
  return {
    total: orders.length,
    pending: orders.filter((o) => ["pending", "pending_payment", "processing", "confirmed", "ready", "out_for_delivery"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    volume: paid.reduce((sum, o) => sum + o.totalAmount, 0),
  };
}

export function buildVendorSnapshot(vendors: Vendor[]) {
  return {
    total: vendors.length,
    active: vendors.filter((v) => v.status === "active").length,
    suspended: vendors.filter((v) => v.status === "suspended").length,
    sales: vendors.reduce((sum, v) => sum + v.totalSales, 0),
  };
}

export function buildVendorApplicationSnapshot(applications: VendorApplication[]) {
  return {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending" || a.status === "under_review").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };
}

export function buildStoreSnapshot(stores: Store[]) {
  return {
    total: stores.length,
    active: stores.filter((s) => s.status === "active").length,
    suspended: stores.filter((s) => s.status === "suspended").length,
    draft: stores.filter((s) => s.status === "draft").length,
  };
}

export function buildProductSnapshot(products: Product[]) {
  return {
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    pending: products.filter((p) => p.status === "pending").length,
    lowStock: products.filter((p) => p.stock <= 5).length,
  };
}

export function buildFinanceSnapshot(overview: AdminFinanceOverview | null, payments: AdminPaymentTransaction[]) {
  return {
    balance: overview?.currentBalance ?? 0,
    gross: overview?.grossCollectedTotal ?? 0,
    commission: overview?.commissionBalance ?? 0,
    payments: payments.length,
  };
}

export function buildPayoutSnapshot(payouts: AdminVendorWithdrawalRequest[]) {
  return {
    total: payouts.length,
    pending: payouts.filter((p) => p.status === "pending" || p.status === "approved").length,
    paid: payouts.filter((p) => p.status === "approved" || p.status === "processing").length,
    pendingAmount: payouts
      .filter((p) => p.status === "pending" || p.status === "approved")
      .reduce((sum, p) => sum + p.amount, 0),
  };
}

export function buildReturnSnapshot(returns: AdminReturnRequest[]) {
  const open = returns.filter((r) => !["refunded", "exchanged", "rejected"].includes(r.status));
  return {
    total: returns.length,
    open: open.length,
    refunded: returns.filter((r) => r.status === "refunded").length,
    rejected: returns.filter((r) => r.status === "rejected").length,
  };
}

export function buildReviewSnapshot(reviews: AdminReview[]) {
  const visible = reviews.filter((r) => !r.isHidden);
  const avg =
    visible.length > 0 ? visible.reduce((sum, r) => sum + r.rating, 0) / visible.length : 0;
  return {
    total: reviews.length,
    hidden: reviews.filter((r) => r.isHidden).length,
    average: avg,
  };
}

export function buildVoucherSnapshot(vouchers: VoucherCampaign[]) {
  return {
    total: vouchers.length,
    active: vouchers.filter((v) => v.status === "active" || v.isActive).length,
    redemptions: vouchers.reduce((sum, v) => sum + v.redemptionCount, 0),
    discount: vouchers.reduce((sum, v) => sum + v.totalDiscountAmount, 0),
  };
}

export function buildMarketSnapshot(markets: Market[]) {
  return {
    total: markets.length,
    active: markets.filter((m) => m.status === "active").length,
    inactive: markets.filter((m) => m.status !== "active").length,
  };
}

export function buildCategorySnapshot(categories: Category[]) {
  return {
    total: categories.length,
    active: categories.filter((c) => c.status === "active").length,
    inactive: categories.filter((c) => c.status !== "active").length,
  };
}

export function buildPromoBannerSnapshot(banners: PromoBanner[]) {
  return {
    total: banners.length,
    active: banners.filter((b) => b.status === "active").length,
    disabled: banners.filter((b) => b.status === "disabled").length,
  };
}

export function buildFlashEventSnapshot(events: FlashSaleEvent[]) {
  return {
    total: events.length,
    active: events.filter((e) => e.status === "active").length,
    products: events.reduce((sum, e) => sum + e.productIds.length, 0),
  };
}

export function buildSupportSnapshot(threads: SupportChatThread[]) {
  return {
    total: threads.length,
    open: threads.filter((t) => t.supportStatus !== "resolved").length,
    waitingAdmin: threads.filter((t) => t.supportStatus === "waiting_on_admin").length,
    unread: threads.reduce((sum, t) => sum + t.unreadCount, 0),
  };
}

export function buildNotificationSnapshot(notifications: NotificationItem[]) {
  return {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    byType: countByStatus(notifications, (n) => n.type),
  };
}
