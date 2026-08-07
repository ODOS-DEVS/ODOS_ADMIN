import { Ban } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { loadUserProfile } from "@/api/userProfileApi";
import { updateUserStatus } from "@/api/usersApi";
import { AdminDetailHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import { UserDetailView } from "@/components/users/UserDetailView";
import { UserProfileSkeleton } from "@/components/users/UsersUi";
import type { UserProfileReport } from "@/api/userProfileApi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/utils/format";

export function UserDetailPage() {
  const { userId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [report, setReport] = useState<UserProfileReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProfile = useCallback(
    async (background = false) => {
      if (!token || !userId) return;
      if (background) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        setReport(await loadUserProfile(token, userId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load user profile.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, userId],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleStatusToggle() {
    if (!token || !report) return;
    const nextStatus = report.user.accountStatus === "blocked" ? "active" : "blocked";
    setActionLoading(true);
    try {
      await updateUserStatus(token, report.user.id, nextStatus);
      showToast({
        title: nextStatus === "blocked" ? "User blocked" : "User reactivated",
        description: `${report.user.fullName} has been updated.`,
        tone: "success",
      });
      setConfirmBlock(false);
      await loadProfile(true);
    } catch (updateError) {
      showToast({
        title: "Unable to update user",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) return <UserProfileSkeleton />;
  if (error || !report) {
    return (
      <ErrorState
        description={error ?? "User profile unavailable."}
        onRetry={() => void loadProfile()}
      />
    );
  }

  const { user } = report;
  const isAdmin = user.roles.includes("admin");

  return (
    <div className="space-y-6">
      <AdminDetailHeader
        eyebrow="Users"
        title={user.fullName}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{user.email}</span>
            <StatusBadge status={user.accountStatus} />
            {user.roles.includes("vendor") ? <StatusBadge status="vendor" /> : null}
            <span className="text-textSubtle">·</span>
            <span>Refreshed {formatDateTime(report.loadedAt)}</span>
          </span>
        }
        backRoute="/users/full"
        onRefresh={() => void loadProfile(true)}
        refreshing={isRefreshing}
        actions={
          !isAdmin ? (
            <HeaderActionButton
              variant={user.accountStatus === "blocked" ? "primary" : "danger"}
              leftIcon={<Ban className="size-4" />}
              onClick={() => setConfirmBlock(true)}
            >
              {user.accountStatus === "blocked" ? "Unblock" : "Block"}
            </HeaderActionButton>
          ) : null
        }
      />

      <UserDetailView report={report} />

      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={() => void handleStatusToggle()}
        title={user.accountStatus === "blocked" ? "Restore user access" : "Block this user"}
        description={
          user.accountStatus === "blocked"
            ? `Restore ${user.fullName}'s access to the ODOS platform.`
            : `Block ${user.fullName} from using the ODOS platform until manually restored.`
        }
        confirmLabel={user.accountStatus === "blocked" ? "Restore access" : "Block user"}
        confirmVariant={user.accountStatus === "blocked" ? "primary" : "danger"}
        isLoading={actionLoading}
      />
    </div>
  );
}
