import { getCategories } from "@/api/categoriesApi";
import { getSupportChatThreads } from "@/api/chatApi";
import { getDashboardOverview } from "@/api/dashboardApi";
import {
  getFinanceOverview,
  getPaymentTransactions,
  getPlatformLedgerEntries,
} from "@/api/financeApi";
import { getFlashSaleEvents } from "@/api/flashSaleEventsApi";
import { getMarkets } from "@/api/marketsApi";
import { getNotifications } from "@/api/notificationsApi";
import { getOrders, getReturnRequests } from "@/api/ordersApi";
import { getVendorWithdrawalRequests } from "@/api/payoutsApi";
import { getProducts } from "@/api/productsApi";
import { getPromoBanners } from "@/api/promoBannersApi";
import { getReviews } from "@/api/reviewsApi";
import { getStores } from "@/api/storesApi";
import { getUsers } from "@/api/usersApi";
import { getVendorApplications } from "@/api/vendorApplicationsApi";
import { getVendors } from "@/api/vendorsApi";
import { getVouchers } from "@/api/vouchersApi";
import type { FullAnalyticsReport } from "@/types/fullAnalytics";
import {
  buildAnalyticsSnapshot,
  buildDistribution,
  buildNotificationMix,
  buildOrderStatusMix,
  buildPaymentProviderMix,
  buildPaymentStatusMix,
} from "@/utils/analyticsMetrics";

async function settle<T>(promise: Promise<T>, fallback: T, errors: string[], label: string) {
  try {
    return await promise;
  } catch (error) {
    errors.push(
      `${label}: ${error instanceof Error ? error.message : "Unable to load."}`,
    );
    return fallback;
  }
}

export async function loadFullAnalyticsReport(token: string): Promise<FullAnalyticsReport> {
  const errors: string[] = [];

  const dashboard = await settle(
    getDashboardOverview(token),
    {
      stats: {
        totalUsers: 0,
        totalVendors: 0,
        pendingVendorApplications: 0,
        totalStores: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
      },
      recentOrders: [],
      recentVendorApplications: [],
      recentNotifications: [],
    },
    errors,
    "Dashboard overview",
  );

  const [
    finance,
    payments,
    ledger,
    payouts,
    orders,
    returns,
    reviews,
    users,
    vendors,
    applications,
    stores,
    products,
    markets,
    categories,
    vouchers,
    promoBanners,
    flashEvents,
    supportThreads,
    notifications,
  ] = await Promise.all([
    settle(getFinanceOverview(token), null, errors, "Finance overview"),
    settle(getPaymentTransactions(token), [], errors, "Payment transactions"),
    settle(getPlatformLedgerEntries(token), [], errors, "Platform ledger"),
    settle(getVendorWithdrawalRequests(token), [], errors, "Vendor payouts"),
    settle(getOrders(token), [], errors, "Orders"),
    settle(getReturnRequests(token), [], errors, "Returns"),
    settle(getReviews(token), [], errors, "Reviews"),
    settle(getUsers(token), [], errors, "Users"),
    settle(getVendors(token), [], errors, "Vendors"),
    settle(getVendorApplications(token), [], errors, "Vendor applications"),
    settle(getStores(token), [], errors, "Stores"),
    settle(getProducts(token), [], errors, "Products"),
    settle(getMarkets(token), [], errors, "Markets"),
    settle(getCategories(token), [], errors, "Categories"),
    settle(getVouchers(token), [], errors, "Vouchers"),
    settle(getPromoBanners(token), [], errors, "Promo banners"),
    settle(getFlashSaleEvents(token), [], errors, "Flash sale events"),
    settle(getSupportChatThreads(token), [], errors, "Support chats"),
    settle(getNotifications(token), [], errors, "Notifications"),
  ]);

  const snapshot = buildAnalyticsSnapshot(dashboard, finance);
  const reviewAverageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return {
    loadedAt: new Date().toISOString(),
    dashboard,
    finance,
    payments,
    ledger,
    payouts,
    orders,
    returns,
    reviews,
    users,
    vendors,
    applications,
    stores,
    products,
    markets,
    categories,
    vouchers,
    promoBanners,
    flashEvents,
    supportThreads,
    notifications,
    snapshot,
    reviewAverageRating,
    hiddenReviewCount: reviews.filter((review) => review.isHidden).length,
    unreadNotifications: notifications.filter((item) => !item.read).length,
    totalOrderVolume: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    breakdowns: {
      orderStatus: buildOrderStatusMix(orders),
      paymentStatus: buildPaymentStatusMix(orders),
      paymentTransactionStatus: buildDistribution(payments, (item) => item.status),
      paymentProviders: buildPaymentProviderMix(payments),
      ledgerKinds: buildDistribution(ledger, (item) => item.kind),
      payoutStatus: buildDistribution(payouts, (item) => item.status),
      returnStatus: buildDistribution(returns, (item) => item.status),
      vendorStatus: buildDistribution(vendors, (item) => item.status),
      vendorApplicationStatus: buildDistribution(applications, (item) => item.status),
      storeStatus: buildDistribution(stores, (item) => item.status),
      productStatus: buildDistribution(products, (item) => item.status),
      accountStatus: buildDistribution(users, (item) => item.accountStatus),
      notificationTypes: buildNotificationMix(notifications),
      supportStatus: buildDistribution(
        supportThreads,
        (item) => item.supportStatus ?? "unknown",
      ),
      voucherApproval: buildDistribution(
        vouchers,
        (item) => item.approvalStatus ?? "unknown",
      ),
    },
    errors,
  };
}
