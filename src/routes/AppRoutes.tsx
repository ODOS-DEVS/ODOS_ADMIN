import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { BootstrapAdminPage } from "@/pages/BootstrapAdminPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { MarketsPage } from "@/pages/MarketsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ReturnsPage } from "@/pages/ReturnsPage";
import { ReviewsPage } from "@/pages/ReviewsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StoresPage } from "@/pages/StoresPage";
import { SupportChatsPage } from "@/pages/SupportChatsPage";
import { UsersPage } from "@/pages/UsersPage";
import { VendorApplicationsPage } from "@/pages/VendorApplicationsPage";
import { VendorsPage } from "@/pages/VendorsPage";
import { VouchersPage } from "@/pages/VouchersPage";
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
        <Route path="/users" element={<UsersPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/vendor-applications" element={<VendorApplicationsPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/vouchers" element={<VouchersPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/support-chats" element={<SupportChatsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
