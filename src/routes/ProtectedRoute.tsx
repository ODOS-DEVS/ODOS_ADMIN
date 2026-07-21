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
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
