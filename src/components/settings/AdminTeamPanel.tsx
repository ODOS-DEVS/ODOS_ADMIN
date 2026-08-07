import { Shield, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  createAdminStaff,
  getAdminStaffPage,
  updateAdminStaffPermission,
} from "@/api/adminStaffApi";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { AdminPermissionLevel, AdminUser } from "@/types";
import {
  ADMIN_PERMISSION_OPTIONS,
  labelForAdminPermission,
} from "@/utils/adminPermissionLabels";
import { formatDate } from "@/utils/format";

export function AdminTeamPanel() {
  const { token, adminUser } = useAdminAuth();
  const { showToast } = useToast();
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [permissionSavingId, setPermissionSavingId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [adminPermission, setAdminPermission] = useState<AdminPermissionLevel>("support");

  const loadStaff = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const page = await getAdminStaffPage(token, { limit: 50, offset: 0 });
      setStaff(page.items);
    } catch (error) {
      showToast({
        title: "Unable to load admin team",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setIsCreating(true);
    try {
      const created = await createAdminStaff(token, {
        fullName,
        email,
        password,
        phoneNumber,
        adminPermission,
      });
      setStaff((current) => [created, ...current.filter((member) => member.id !== created.id)]);
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setAdminPermission("support");
      showToast({
        title: "Admin account created",
        description: `${created.fullName} can sign in with the permission band you selected.`,
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to create admin",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handlePermissionChange(member: AdminUser, next: AdminPermissionLevel) {
    if (!token || member.adminPermission === next) return;
    setPermissionSavingId(member.id);
    try {
      const updated = await updateAdminStaffPermission(token, member.id, next);
      setStaff((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      showToast({
        title: "Permission updated",
        description: `${updated.fullName} is now ${labelForAdminPermission(next)}.`,
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to update permission",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setPermissionSavingId(null);
    }
  }

  const selectedBand = ADMIN_PERMISSION_OPTIONS.find((option) => option.value === adminPermission);

  return (
    <div className="space-y-5">
      <SectionCard
        title="Create admin account"
        description="Super admins can invite staff with a permission band. Each band limits which sidebar desks and actions appear after sign-in."
        compact
      >
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleCreate}>
          <div>
            <label className="mb-2 block text-sm font-medium text-textStrong">Full name</label>
            <input
              className="app-input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Operations lead"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-textStrong">Email</label>
            <input
              type="email"
              className="app-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="staff@odos.app"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-textStrong">Phone (optional)</label>
            <input
              className="app-input"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+233..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-textStrong">Temporary password</label>
            <input
              type="password"
              className="app-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Permission band</label>
            <FilterSelect
              value={adminPermission}
              onChange={(event) =>
                setAdminPermission(event.target.value as AdminPermissionLevel)
              }
              options={ADMIN_PERMISSION_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              className="w-full"
            />
            {selectedBand ? (
              <p className="mt-2 text-sm text-textMuted">{selectedBand.description}</p>
            ) : null}
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <Button
              type="submit"
              leftIcon={<UserPlus className="size-4" />}
              isLoading={isCreating}
              disabled={!fullName.trim() || !email.trim() || password.length < 8}
            >
              Create admin account
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        compact
        title="Admin team"
        description={`${staff.length} staff account${staff.length === 1 ? "" : "s"} · you are signed in as ${labelForAdminPermission(adminUser?.adminPermission ?? "super_admin")}`}
      >
        {isLoading ? (
          <p className="text-sm text-textMuted">Loading admin team…</p>
        ) : staff.length === 0 ? (
          <p className="text-sm text-textMuted">No admin accounts yet.</p>
        ) : (
          <div className="divide-y divide-line rounded-xl border border-line">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar name={member.fullName} imageUrl={member.avatarUrl} />
                  <div className="min-w-0">
                    <p className="font-semibold text-textStrong">
                      {member.fullName}
                      {member.id === adminUser?.id ? (
                        <span className="ml-2 text-xs font-medium text-accent">(you)</span>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-textMuted">{member.email}</p>
                    <p className="mt-1 text-xs text-textSubtle">Joined {formatDate(member.joinedAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <StatusBadge status={member.adminPermission ?? "admin"} />
                  <FilterSelect
                    value={member.adminPermission ?? "admin"}
                    disabled={permissionSavingId === member.id}
                    onChange={(event) =>
                      void handlePermissionChange(
                        member,
                        event.target.value as AdminPermissionLevel,
                      )
                    }
                    options={ADMIN_PERMISSION_OPTIONS.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                    className="min-w-[11rem]"
                    aria-label={`Permission band for ${member.fullName}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accentSoft px-4 py-3 text-sm text-textMuted">
        <Shield className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Super admin accounts bypass all permission checks. Other bands only see the desks allowed
          in their band after they sign in on the login page.
        </p>
      </div>
    </div>
  );
}
