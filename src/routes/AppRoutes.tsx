import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuditLogPage } from "@/pages/AuditLogPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { BootstrapAdminPage } from "@/pages/BootstrapAdminPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DeliverySettingsPage } from "@/pages/DeliverySettingsPage";
import { FinancePage } from "@/pages/FinancePage";
import { FlashSaleEventsPage } from "@/pages/FlashSaleEventsPage";
import { LoginPage } from "@/pages/LoginPage";
import { MarketsPage } from "@/pages/MarketsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { FullPayoutsPage } from "@/pages/full/FullPayoutsPage";
import { PayoutDetailPage } from "@/pages/full/entityDetailPages";
import { ProductsPage } from "@/pages/ProductsPage";
import { PromoBannersPage } from "@/pages/PromoBannersPage";
import { ReturnsPage } from "@/pages/ReturnsPage";
import { ReviewsPage } from "@/pages/ReviewsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StoresPage } from "@/pages/StoresPage";
import { SupportChatsPage } from "@/pages/SupportChatsPage";
import { UsersPage } from "@/pages/UsersPage";
import { VendorApplicationsPage } from "@/pages/VendorApplicationsPage";
import { VendorsPage } from "@/pages/VendorsPage";
import { VouchersPage } from "@/pages/VouchersPage";
import { AdminFullRoutes } from "@/routes/adminFullRoutes";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { getStoredAdminPreferences } from "@/utils/adminPreferences";

export function AppRoutes() {
  const defaultLandingPage = getStoredAdminPreferences().defaultLandingPage;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup-admin" element={<BootstrapAdminPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={defaultLandingPage} replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/vendor-applications" element={<VendorApplicationsPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/payouts" element={<FullPayoutsPage />} />
        <Route path="/payouts/:payoutId" element={<PayoutDetailPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/vouchers" element={<VouchersPage />} />
        <Route path="/promo-banners" element={<PromoBannersPage />} />
        <Route path="/flash-sale-events" element={<FlashSaleEventsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/delivery-settings" element={<DeliverySettingsPage />} />
        <Route path="/support-chats" element={<SupportChatsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {AdminFullRoutes()}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
