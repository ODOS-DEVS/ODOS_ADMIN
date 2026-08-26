import { lazy } from "react";
import { Route } from "react-router-dom";

import {
  PayoutDetailPage,
  ProductDetailPage,
  ReturnDetailPage,
  ReviewDetailPage,
  StoreDetailPage,
  SupportThreadDetailPage,
  VendorApplicationDetailPage,
  VoucherDetailPage,
} from "@/pages/full/entityDetailPages";


// Every page behind sign-in is code-split. The login screen no longer
// downloads the entire admin console just to render a form; DashboardLayout
// provides the single Suspense boundary these resolve into.
const FullAnalyticsPage = lazy(() =>
  import("@/pages/FullAnalyticsPage").then((module) => ({ default: module.FullAnalyticsPage })),
);
const CategoryStudioPage = lazy(() =>
  import("@/pages/full/CategoryStudioPage").then((module) => ({ default: module.CategoryStudioPage })),
);
const FullCategoriesPage = lazy(() =>
  import("@/pages/full/FullCategoriesPage").then((module) => ({ default: module.FullCategoriesPage })),
);
const ProductStudioPage = lazy(() =>
  import("@/pages/full/ProductStudioPage").then((module) => ({ default: module.ProductStudioPage })),
);
const FullFinancePage = lazy(() =>
  import("@/pages/full/FullFinancePage").then((module) => ({ default: module.FullFinancePage })),
);
const FullFlashSaleEventsPage = lazy(() =>
  import("@/pages/full/FullFlashSaleEventsPage").then((module) => ({ default: module.FullFlashSaleEventsPage })),
);
const FullMerchandisingCampaignsPage = lazy(() =>
  import("@/pages/full/FullMerchandisingCampaignsPage").then((module) => ({ default: module.FullMerchandisingCampaignsPage })),
);
const FullMarketsPage = lazy(() =>
  import("@/pages/full/FullMarketsPage").then((module) => ({ default: module.FullMarketsPage })),
);
const FullDeliveryOpsPage = lazy(() =>
  import("@/pages/full/FullDeliveryOpsPage").then((module) => ({ default: module.FullDeliveryOpsPage })),
);
const FullNotificationsPage = lazy(() =>
  import("@/pages/full/FullNotificationsPage").then((module) => ({ default: module.FullNotificationsPage })),
);
const FullOrdersPage = lazy(() =>
  import("@/pages/full/FullOrdersPage").then((module) => ({ default: module.FullOrdersPage })),
);
const FullPayoutsPage = lazy(() =>
  import("@/pages/full/FullPayoutsPage").then((module) => ({ default: module.FullPayoutsPage })),
);
const FullProductsPage = lazy(() =>
  import("@/pages/full/FullProductsPage").then((module) => ({ default: module.FullProductsPage })),
);
const FullPromoAnalyticsPage = lazy(() =>
  import("@/pages/full/FullPromoAnalyticsPage").then((module) => ({ default: module.FullPromoAnalyticsPage })),
);
const FullPromoBannersPage = lazy(() =>
  import("@/pages/full/FullPromoBannersPage").then((module) => ({ default: module.FullPromoBannersPage })),
);
const PromoBannerStudioPage = lazy(() =>
  import("@/pages/full/PromoBannerStudioPage").then((module) => ({ default: module.PromoBannerStudioPage })),
);
const FullReturnsPage = lazy(() =>
  import("@/pages/full/FullReturnsPage").then((module) => ({ default: module.FullReturnsPage })),
);
const FullReviewsPage = lazy(() =>
  import("@/pages/full/FullReviewsPage").then((module) => ({ default: module.FullReviewsPage })),
);
const FullStoresPage = lazy(() =>
  import("@/pages/full/FullStoresPage").then((module) => ({ default: module.FullStoresPage })),
);
const FullSupportChatsPage = lazy(() =>
  import("@/pages/full/FullSupportChatsPage").then((module) => ({ default: module.FullSupportChatsPage })),
);
const FullUsersPage = lazy(() =>
  import("@/pages/FullUsersPage").then((module) => ({ default: module.FullUsersPage })),
);
const FullVendorApplicationsPage = lazy(() =>
  import("@/pages/full/FullVendorApplicationsPage").then((module) => ({ default: module.FullVendorApplicationsPage })),
);
const FullVendorsPage = lazy(() =>
  import("@/pages/full/FullVendorsPage").then((module) => ({ default: module.FullVendorsPage })),
);
const FullVouchersPage = lazy(() =>
  import("@/pages/full/FullVouchersPage").then((module) => ({ default: module.FullVouchersPage })),
);
const OrderDetailPage = lazy(() =>
  import("@/pages/full/OrderDetailPage").then((module) => ({ default: module.OrderDetailPage })),
);
const VendorDetailPage = lazy(() =>
  import("@/pages/full/VendorDetailPage").then((module) => ({ default: module.VendorDetailPage })),
);
const UserDetailPage = lazy(() =>
  import("@/pages/UserDetailPage").then((module) => ({ default: module.UserDetailPage })),
);

export function AdminFullRoutes() {
  return (
    <>
      <Route path="/analytics/full" element={<FullAnalyticsPage />} />
      <Route path="/users/full" element={<FullUsersPage />} />
      <Route path="/users/full/:userId" element={<UserDetailPage />} />
      <Route path="/orders/full" element={<FullOrdersPage />} />
      <Route path="/orders/delivery-ops" element={<FullDeliveryOpsPage />} />
      <Route path="/orders/full/:orderId" element={<OrderDetailPage />} />
      <Route path="/vendors/full" element={<FullVendorsPage />} />
      <Route path="/vendors/full/:vendorId" element={<VendorDetailPage />} />
      <Route path="/vendor-applications/full" element={<FullVendorApplicationsPage />} />
      <Route path="/vendor-applications/full/:applicationId" element={<VendorApplicationDetailPage />} />
      <Route path="/stores/full" element={<FullStoresPage />} />
      <Route path="/stores/full/:storeId" element={<StoreDetailPage />} />
      <Route path="/products/full" element={<FullProductsPage />} />
      <Route path="/products/full/new" element={<ProductStudioPage />} />
      <Route path="/products/full/:productId/studio" element={<ProductStudioPage />} />
      <Route path="/products/full/:productId" element={<ProductDetailPage />} />
      <Route path="/finance/full" element={<FullFinancePage />} />
      <Route path="/payouts/full" element={<FullPayoutsPage />} />
      <Route path="/payouts/full/:payoutId" element={<PayoutDetailPage />} />
      <Route path="/returns/full" element={<FullReturnsPage />} />
      <Route path="/returns/full/:returnId" element={<ReturnDetailPage />} />
      <Route path="/reviews/full" element={<FullReviewsPage />} />
      <Route path="/reviews/full/:reviewId" element={<ReviewDetailPage />} />
      <Route path="/vouchers/full" element={<FullVouchersPage />} />
      <Route path="/vouchers/full/:voucherId" element={<VoucherDetailPage />} />
      <Route path="/markets/full" element={<FullMarketsPage />} />
      <Route path="/categories/full" element={<FullCategoriesPage />} />
      <Route path="/categories/full/new" element={<CategoryStudioPage />} />
      <Route path="/categories/full/:categoryId/studio" element={<CategoryStudioPage />} />
      <Route path="/promo-banners/full" element={<FullPromoBannersPage />} />
      <Route path="/promo-banners/full/new" element={<PromoBannerStudioPage />} />
      <Route path="/promo-banners/full/:bannerId/studio" element={<PromoBannerStudioPage />} />
      <Route path="/flash-sale-events/full" element={<FullFlashSaleEventsPage />} />
      <Route path="/merchandising-campaigns/full" element={<FullMerchandisingCampaignsPage />} />
      <Route path="/promo-analytics/full" element={<FullPromoAnalyticsPage />} />
      <Route path="/support-chats/full" element={<FullSupportChatsPage />} />
      <Route path="/support-chats/full/:threadId" element={<SupportThreadDetailPage />} />
      <Route path="/notifications/full" element={<FullNotificationsPage />} />
    </>
  );
}
