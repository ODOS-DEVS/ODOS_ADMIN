import { Route } from "react-router-dom";

import { FullAnalyticsPage } from "@/pages/FullAnalyticsPage";
import { CategoryStudioPage } from "@/pages/full/CategoryStudioPage";
import { FullCategoriesPage } from "@/pages/full/FullCategoriesPage";
import { ProductStudioPage } from "@/pages/full/ProductStudioPage";
import { FullFinancePage } from "@/pages/full/FullFinancePage";
import { FullFlashSaleEventsPage } from "@/pages/full/FullFlashSaleEventsPage";
import { FullMerchandisingCampaignsPage } from "@/pages/full/FullMerchandisingCampaignsPage";
import { FullMarketsPage } from "@/pages/full/FullMarketsPage";
import { FullNotificationsPage } from "@/pages/full/FullNotificationsPage";
import { FullOrdersPage } from "@/pages/full/FullOrdersPage";
import { FullPayoutsPage } from "@/pages/full/FullPayoutsPage";
import { FullProductsPage } from "@/pages/full/FullProductsPage";
import { FullPromoBannersPage } from "@/pages/full/FullPromoBannersPage";
import { PromoBannerStudioPage } from "@/pages/full/PromoBannerStudioPage";
import { FullReturnsPage } from "@/pages/full/FullReturnsPage";
import { FullReviewsPage } from "@/pages/full/FullReviewsPage";
import { FullStoresPage } from "@/pages/full/FullStoresPage";
import { FullSupportChatsPage } from "@/pages/full/FullSupportChatsPage";
import { FullUsersPage } from "@/pages/FullUsersPage";
import { FullVendorApplicationsPage } from "@/pages/full/FullVendorApplicationsPage";
import { FullVendorsPage } from "@/pages/full/FullVendorsPage";
import { FullVouchersPage } from "@/pages/full/FullVouchersPage";
import { OrderDetailPage } from "@/pages/full/OrderDetailPage";
import {
  PayoutDetailPage,
  ProductDetailPage,
  ReturnDetailPage,
  ReviewDetailPage,
  StoreDetailPage,
  SupportThreadDetailPage,
  VendorApplicationDetailPage,
  VendorDetailPage,
  VoucherDetailPage,
} from "@/pages/full/entityDetailPages";
import { UserDetailPage } from "@/pages/UserDetailPage";

export function AdminFullRoutes() {
  return (
    <>
      <Route path="/analytics/full" element={<FullAnalyticsPage />} />
      <Route path="/users/full" element={<FullUsersPage />} />
      <Route path="/users/full/:userId" element={<UserDetailPage />} />
      <Route path="/orders/full" element={<FullOrdersPage />} />
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
      <Route path="/support-chats/full" element={<FullSupportChatsPage />} />
      <Route path="/support-chats/full/:threadId" element={<SupportThreadDetailPage />} />
      <Route path="/notifications/full" element={<FullNotificationsPage />} />
    </>
  );
}
