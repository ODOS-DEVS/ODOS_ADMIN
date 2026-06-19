import type {
  AdminFinanceOverview,
  AdminPaymentTransaction,
  AdminPlatformLedgerEntry,
  AdminReturnRequest,
  AdminReview,
  AdminUser,
  AdminVendorWithdrawalRequest,
  Category,
  DashboardPayload,
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

import type { AnalyticsSnapshot, DistributionItem } from "@/utils/analyticsMetrics";

export type FullAnalyticsBreakdowns = {
  orderStatus: DistributionItem[];
  paymentStatus: DistributionItem[];
  paymentTransactionStatus: DistributionItem[];
  paymentProviders: DistributionItem[];
  ledgerKinds: DistributionItem[];
  payoutStatus: DistributionItem[];
  returnStatus: DistributionItem[];
  vendorStatus: DistributionItem[];
  vendorApplicationStatus: DistributionItem[];
  storeStatus: DistributionItem[];
  productStatus: DistributionItem[];
  accountStatus: DistributionItem[];
  notificationTypes: DistributionItem[];
  supportStatus: DistributionItem[];
  voucherApproval: DistributionItem[];
};

export type FullAnalyticsReport = {
  loadedAt: string;
  dashboard: DashboardPayload;
  finance: AdminFinanceOverview | null;
  payments: AdminPaymentTransaction[];
  ledger: AdminPlatformLedgerEntry[];
  payouts: AdminVendorWithdrawalRequest[];
  orders: Order[];
  returns: AdminReturnRequest[];
  reviews: AdminReview[];
  users: AdminUser[];
  vendors: Vendor[];
  applications: VendorApplication[];
  stores: Store[];
  products: Product[];
  markets: Market[];
  categories: Category[];
  vouchers: VoucherCampaign[];
  promoBanners: PromoBanner[];
  flashEvents: FlashSaleEvent[];
  supportThreads: SupportChatThread[];
  notifications: NotificationItem[];
  snapshot: AnalyticsSnapshot;
  breakdowns: FullAnalyticsBreakdowns;
  reviewAverageRating: number;
  hiddenReviewCount: number;
  unreadNotifications: number;
  totalOrderVolume: number;
  errors: string[];
};
