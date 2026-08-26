import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BootstrapAdminPage } from "@/pages/BootstrapAdminPage";
import { LoginPage } from "@/pages/LoginPage";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { AdminFullRoutes } from "@/routes/adminFullRoutes";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { getStoredAdminPreferences } from "@/utils/adminPreferences";

// recharts (and, on the advanced page, MUI) are heavy and used by these two
// screens alone. Loading them lazily keeps them out of the initial bundle, so
// the login form is not waiting on chart libraries it will never render.
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center p-8">
      <span
        className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent"
        role="status"
        aria-label="Loading page"
      />
    </div>
  );
}

const AuditLogPage = lazy(() =>
  import("@/pages/AuditLogPage").then((module) => ({ default: module.AuditLogPage })),
);
const AnalyticsPage = lazy(() =>
  import("@/pages/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })),
);
const CategoriesPage = lazy(() =>
  import("@/pages/CategoriesPage").then((module) => ({ default: module.CategoriesPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const DeliverySettingsPage = lazy(() =>
  import("@/pages/DeliverySettingsPage").then((module) => ({ default: module.DeliverySettingsPage })),
);
const FinancePage = lazy(() =>
  import("@/pages/FinancePage").then((module) => ({ default: module.FinancePage })),
);
const FlashSaleEventsPage = lazy(() =>
  import("@/pages/FlashSaleEventsPage").then((module) => ({ default: module.FlashSaleEventsPage })),
);
const MarketsPage = lazy(() =>
  import("@/pages/MarketsPage").then((module) => ({ default: module.MarketsPage })),
);
const MerchandisingCampaignsPage = lazy(() =>
  import("@/pages/MerchandisingCampaignsPage").then((module) => ({ default: module.MerchandisingCampaignsPage })),
);
const NotificationsPage = lazy(() =>
  import("@/pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage })),
);
const OrdersPage = lazy(() =>
  import("@/pages/OrdersPage").then((module) => ({ default: module.OrdersPage })),
);
const FullPayoutsPage = lazy(() =>
  import("@/pages/full/FullPayoutsPage").then((module) => ({ default: module.FullPayoutsPage })),
);
const PayoutDetailPage = lazy(() =>
  import("@/pages/full/entityDetailPages").then((module) => ({ default: module.PayoutDetailPage })),
);
const ProductsPage = lazy(() =>
  import("@/pages/ProductsPage").then((module) => ({ default: module.ProductsPage })),
);
const PromoBannersPage = lazy(() =>
  import("@/pages/PromoBannersPage").then((module) => ({ default: module.PromoBannersPage })),
);
const ReturnsPage = lazy(() =>
  import("@/pages/ReturnsPage").then((module) => ({ default: module.ReturnsPage })),
);
const ReviewsPage = lazy(() =>
  import("@/pages/ReviewsPage").then((module) => ({ default: module.ReviewsPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);
const StoresPage = lazy(() =>
  import("@/pages/StoresPage").then((module) => ({ default: module.StoresPage })),
);
const SupportChatsPage = lazy(() =>
  import("@/pages/SupportChatsPage").then((module) => ({ default: module.SupportChatsPage })),
);
const UsersPage = lazy(() =>
  import("@/pages/UsersPage").then((module) => ({ default: module.UsersPage })),
);
const VendorApplicationsPage = lazy(() =>
  import("@/pages/VendorApplicationsPage").then((module) => ({ default: module.VendorApplicationsPage })),
);
const VendorsPage = lazy(() =>
  import("@/pages/VendorsPage").then((module) => ({ default: module.VendorsPage })),
);
const VouchersPage = lazy(() =>
  import("@/pages/VouchersPage").then((module) => ({ default: module.VouchersPage })),
);

function LandingRedirect() {
  const { canAccessRoute } = useAdminPermissions();
  const preferred = getStoredAdminPreferences().defaultLandingPage;
  const target = canAccessRoute(preferred) ? preferred : "/dashboard";
  return <Navigate to={target} replace />;
}

export function AppRoutes() {
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
        <Route index element={<LandingRedirect />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/analytics-dashboard"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AdminDashboardPage />
            </Suspense>
          }
        />
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
        <Route path="/merchandising-campaigns" element={<MerchandisingCampaignsPage />} />
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
