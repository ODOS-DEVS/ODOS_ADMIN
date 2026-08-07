import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { LoadingState } from "@/components/ui/LoadingState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { adminUser, token, isHydrating } = useAdminAuth();
  const { canAccessRoute } = useAdminPermissions();
  const location = useLocation();

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-canvas p-6">
        <LoadingState label="Restoring your admin workspace..." />
      </div>
    );
  }

  if (!token || !adminUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!canAccessRoute(location.pathname)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-textSubtle">
          Access restricted
        </p>
        <h1 className="text-2xl font-semibold text-textStrong">
          You don’t have permission for this area
        </h1>
        <p className="max-w-md text-sm text-textMuted">
          Your admin band can’t open {location.pathname}. Ask a super admin to update your
          permission, or return to the dashboard.
        </p>
        <a
          href="/dashboard"
          className="mt-2 rounded-xl border border-accent/25 bg-accentSoft px-4 py-2 text-sm font-semibold text-accent"
        >
          Back to dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
