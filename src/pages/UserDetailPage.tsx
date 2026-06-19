import { ArrowLeft, Ban, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { loadUserProfile } from "@/api/userProfileApi";
import { updateUserStatus } from "@/api/usersApi";
import { UserDetailView } from "@/components/users/UserDetailView";
import { UserProfileSkeleton } from "@/components/users/UsersUi";
import type { UserProfileReport } from "@/api/userProfileApi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/utils/format";

export function UserDetailPage() {
  const { userId = "" } = useParams();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
            User profile
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">{user.fullName}</h1>
          <p className="mt-1 text-sm text-textMuted">
            Complete account dossier · refreshed {formatDateTime(report.loadedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft className="size-4" />}
            onClick={() => navigate("/users/full")}
          >
            Back to directory
          </Button>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />}
            onClick={() => void loadProfile(true)}
            disabled={isRefreshing}
          >
            Refresh profile
          </Button>
          {!isAdmin ? (
            <Button
              variant={user.accountStatus === "blocked" ? "primary" : "danger"}
              leftIcon={<Ban className="size-4" />}
              onClick={() => setConfirmBlock(true)}
            >
              {user.accountStatus === "blocked" ? "Unblock user" : "Block user"}
            </Button>
          ) : null}
        </div>
      </div>

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
