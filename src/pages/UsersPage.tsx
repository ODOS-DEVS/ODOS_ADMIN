import { ArrowRight, RefreshCw, Shield, UserCheck, Users as UsersIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getUsers } from "@/api/usersApi";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { UsersBriefSkeleton } from "@/components/users/UsersUi";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminUser } from "@/types";
import { buildUserDirectorySnapshot } from "@/utils/userMetrics";

export function UsersPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (background = false) => {
      if (!token) return;
      if (background) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        setUsers(await getUsers(token));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const snapshot = useMemo(() => buildUserDirectorySnapshot(users), [users]);
  const roleMax = Math.max(snapshot.customers, snapshot.vendors, snapshot.admins, 1);

  if (isLoading) return <UsersBriefSkeleton />;
  if (error) return <ErrorState description={error} onRetry={() => void loadUsers()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">Users</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">User base overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-textMuted">
            At-a-glance account health across customers, vendors, and admins. Open the full directory to
            inspect any user in complete detail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />}
            onClick={() => void loadUsers(true)}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
          <Button leftIcon={<ArrowRight className="size-4" />} onClick={() => navigate("/users/full")}>
            Open full user directory
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total users" value={String(snapshot.totalUsers)} icon={UsersIcon} animationDelay={60} />
        <StatCard
          label="Active accounts"
          value={String(snapshot.activeUsers)}
          hint={`${snapshot.blockedUsers} blocked`}
          icon={UserCheck}
          tone="success"
          animationDelay={110}
        />
        <StatCard
          label="Vendors"
          value={String(snapshot.vendors)}
          hint={`${snapshot.pendingVendors} pending approval`}
          icon={Shield}
          animationDelay={160}
        />
        <StatCard
          label="Customers"
          value={String(snapshot.customers)}
          hint={`${snapshot.admins} admin accounts`}
          icon={UsersIcon}
          animationDelay={210}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <SectionCard compact className="xl:col-span-7" title="Role composition" description="How the user base splits by role">
          <div className="space-y-3">
            <MetricBar label="Customers" value={snapshot.customers} max={roleMax} displayValue={String(snapshot.customers)} tone="sky" />
            <MetricBar label="Vendors" value={snapshot.vendors} max={roleMax} displayValue={String(snapshot.vendors)} tone="emerald" />
            <MetricBar label="Admins" value={snapshot.admins} max={roleMax} displayValue={String(snapshot.admins)} tone="amber" />
          </div>
        </SectionCard>

        <SectionCard compact className="xl:col-span-5" title="Account health" description="Status mix across the platform">
          <div className="space-y-3">
            <MetricBar label="Active" value={snapshot.activeUsers} max={snapshot.totalUsers || 1} displayValue={String(snapshot.activeUsers)} tone="emerald" />
            <MetricBar label="Blocked" value={snapshot.blockedUsers} max={snapshot.totalUsers || 1} displayValue={String(snapshot.blockedUsers)} tone="amber" />
            <MetricBar label="Inactive" value={snapshot.inactiveUsers} max={snapshot.totalUsers || 1} displayValue={String(snapshot.inactiveUsers)} tone="fuchsia" />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        compact
        title="Need the complete user picture?"
        description="Search, filter, and open any account to see orders, payments, reviews, cart, wishlist, vendor data, wallet, notifications, and support history."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textMuted">
            {snapshot.blockedUsers > 0
              ? `${snapshot.blockedUsers} blocked account${snapshot.blockedUsers === 1 ? "" : "s"} · ${snapshot.pendingVendors} vendor applications pending`
              : `${snapshot.totalUsers} accounts tracked across the platform`}
          </p>
          <Button leftIcon={<ArrowRight className="size-4" />} onClick={() => navigate("/users/full")}>
            Open full user directory
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
