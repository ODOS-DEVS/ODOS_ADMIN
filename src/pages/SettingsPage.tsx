import {
  BellRing,
  Camera,
  LayoutPanelTop,
  Save,
  ShieldCheck,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import type { ChangeEvent, ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { updateAdminMe } from "@/api/adminAuthApi";
import { AdminTeamPanel } from "@/components/settings/AdminTeamPanel";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { SectionCard } from "@/components/ui/SectionCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useTabSection } from "@/hooks/useTabSection";
import { useToast } from "@/hooks/useToast";
import {
  defaultAdminPreferences,
  getStoredAdminPreferences,
  setStoredAdminPreferences,
  type AdminPreferences,
} from "@/utils/adminPreferences";
import { labelForAdminPermission } from "@/utils/adminPermissionLabels";

type SettingsSection = "profile" | "workspace" | "merchandising" | "notifications" | "security" | "team";

const BASE_SECTIONS: Array<{ id: SettingsSection; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "workspace", label: "Workspace", icon: LayoutPanelTop },
  { id: "merchandising", label: "Merchandising", icon: Store },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export function SettingsPage() {
  const { adminUser, token, syncAdminUser } = useAdminAuth();
  const { isSuperAdmin } = useAdminPermissions();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullName, setFullName] = useState(adminUser?.fullName ?? "");
  const [phone, setPhone] = useState(adminUser?.phone ?? "");
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [preferences, setPreferences] = useState<AdminPreferences>(() => getStoredAdminPreferences());
  const { activeSection, setActiveSection } = useTabSection<SettingsSection>("profile");

  const sections = useMemo(
    () => (isSuperAdmin ? [...BASE_SECTIONS, { id: "team" as const, label: "Team", icon: Users }] : BASE_SECTIONS),
    [isSuperAdmin],
  );

  useEffect(() => {
    setFullName(adminUser?.fullName ?? "");
    setPhone(adminUser?.phone ?? "");
  }, [adminUser?.fullName, adminUser?.phone]);

  const avatarPreviewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return adminUser?.avatarUrl ?? null;
  }, [adminUser?.avatarUrl, avatarFile]);

  useEffect(() => {
    if (!avatarPreviewUrl?.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const joinedRoles = adminUser?.roles.join(", ") ?? "admin";
  const hasProfileChanges =
    fullName.trim() !== (adminUser?.fullName ?? "") ||
    phone.trim() !== (adminUser?.phone ?? "") ||
    Boolean(avatarFile);

  function updatePreference<K extends keyof AdminPreferences>(key: K, value: AdminPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function openAvatarPicker() {
    fileInputRef.current?.click();
  }

  function handleAvatarSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) {
      return;
    }
    setAvatarCropFile(selectedFile);
  }

  async function handleProfileSave() {
    if (!token || !adminUser) {
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedAdmin = await updateAdminMe(token, {
        fullName,
        phoneNumber: phone,
        avatarFile,
      });
      syncAdminUser(updatedAdmin);
      setAvatarFile(null);
      showToast({
        title: "Profile updated",
        description:
          "Your admin profile is saved, and the ODOS Official storefront now uses this image too.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save profile",
        description:
          error instanceof Error ? error.message : "Please try saving your admin profile again.",
        tone: "error",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handlePreferenceSave() {
    setStoredAdminPreferences(preferences);
    showToast({
      title: "Workspace preferences saved",
      description: "This admin browser will now remember the experience choices you made here.",
      tone: "success",
    });
  }

  function resetPreferences() {
    setPreferences(defaultAdminPreferences);
    setStoredAdminPreferences(defaultAdminPreferences);
    showToast({
      title: "Preferences reset",
      description: "ODOS Admin is back to the default workspace setup.",
      tone: "info",
    });
  }

  const initials =
    adminUser?.fullName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2) ?? "OA";
  const shortId = adminUser?.id ? adminUser.id.slice(0, 8).toUpperCase() : "PENDING";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-textMuted">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-textStrong">Your desk</h1>
        <p className="mt-1 max-w-xl text-sm text-textMuted">
          Your ODOS admin identity, workspace behavior, and daily operating defaults.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px,minmax(0,1fr)] lg:items-start">
        {/* Identity badge + section nav */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
            <div className="h-1.5 bg-accent" />
            <div className="flex flex-col items-center px-6 py-6 text-center">
              {avatarPreviewUrl ? (
                <img
                  src={avatarPreviewUrl}
                  alt={adminUser?.fullName ?? "Admin avatar"}
                  className="size-20 rounded-full object-cover shadow-card"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
                  {initials}
                </div>
              )}
              <p className="mt-3 font-display text-base font-semibold text-textStrong">
                {adminUser?.fullName ?? "ODOS Admin"}
              </p>
              <p className="mt-1 truncate text-xs text-textMuted">{adminUser?.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-surfaceMuted px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-textMuted">
                <ShieldCheck className="size-3" />
                {labelForAdminPermission(adminUser?.adminPermission)}
              </div>
              <p className="mt-3 font-mono text-[10px] tracking-[0.08em] text-textSubtle">ADMIN · {shortId}</p>
            </div>
          </div>

          <nav className="space-y-0.5 rounded-panel border border-line bg-surface p-2 shadow-card">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-textMuted hover:bg-surfaceMuted hover:text-textStrong"
                  }`}
                >
                  <Icon className="size-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active section content */}
        <div className="space-y-5">
          {activeSection === "profile" ? (
            <SectionCard
              title="Profile"
              description="Update the identity that appears across ODOS Admin and the platform-managed ODOS Official store."
              action={
                <Button
                  onClick={() => void handleProfileSave()}
                  isLoading={isSavingProfile}
                  disabled={!hasProfileChanges}
                  leftIcon={<Save className="size-4" />}
                >
                  Save profile
                </Button>
              }
            >
              <div className="grid gap-6 lg:grid-cols-[220px,minmax(0,1fr)]">
                <div className="flex flex-col items-center gap-3 rounded-panel border border-line bg-surfaceMuted p-5 text-center">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt={adminUser?.fullName ?? "Admin avatar"}
                      className="size-24 rounded-[26px] object-cover shadow-card"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-[26px] bg-accent/15 text-2xl font-semibold text-accent">
                      {initials}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    variant="secondary"
                    leftIcon={<Camera className="size-4" />}
                    onClick={openAvatarPicker}
                  >
                    Upload image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarSelection}
                  />
                  <p className="text-xs text-textMuted">
                    Square crops work best. This image also becomes the ODOS Official storefront picture
                    across the sidebar, analytics, and topbar.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Full name">
                    <input
                      className="app-input"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Enter your full name"
                    />
                  </FormField>
                  <FormField label="Email">
                    <input className="app-input opacity-70" value={adminUser?.email ?? ""} disabled />
                  </FormField>
                  <FormField label="Phone number">
                    <input
                      className="app-input"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="0XX XXX XXXX"
                    />
                  </FormField>
                  <FormField label="Permission band">
                    <input
                      className="app-input opacity-70"
                      value={labelForAdminPermission(adminUser?.adminPermission)}
                      disabled
                    />
                  </FormField>
                  <FormField label="Access roles" className="sm:col-span-2">
                    <input className="app-input opacity-70" value={joinedRoles} disabled />
                  </FormField>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "workspace" ? (
            <SectionCard
              title="Workspace experience"
              description="Tune how this admin workspace feels day to day. These are saved to this browser."
              action={
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={resetPreferences}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={handlePreferenceSave}>
                    Save preferences
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <FormField
                  label="Default landing page"
                  helper="Helpful when you already know which desk you want to land on first each day."
                >
                  <select
                    className="app-select"
                    value={preferences.defaultLandingPage}
                    onChange={(event) =>
                      updatePreference(
                        "defaultLandingPage",
                        event.target.value as AdminPreferences["defaultLandingPage"],
                      )
                    }
                  >
                    <option value="/dashboard">Dashboard overview</option>
                    <option value="/analytics">Analytics</option>
                    <option value="/orders">Orders queue</option>
                    <option value="/vendor-applications">Vendor applications</option>
                  </select>
                </FormField>
                <ToggleRow
                  label="Compact tables"
                  description="Use denser spacing in listings when you want to review more rows at once."
                  checked={preferences.compactTables}
                  onChange={(value) => updatePreference("compactTables", value)}
                />
                <ToggleRow
                  label="Confirm sensitive actions"
                  description="Keep an extra confirmation step before suspend, reject, hide, or block actions."
                  checked={preferences.confirmDestructiveActions}
                  onChange={(value) => updatePreference("confirmDestructiveActions", value)}
                />
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "merchandising" ? (
            <SectionCard
              title="Merchandising defaults"
              description="Keep ODOS feeling fresh by deciding whether new arrivals and flash-sale moments should stay front and center."
              action={
                <Button variant="secondary" onClick={handlePreferenceSave}>
                  Save preferences
                </Button>
              }
            >
              <div className="space-y-4">
                <ToggleRow
                  label="Highlight fresh catalog first"
                  description="Favor newer products and recent updates during merchandising reviews."
                  checked={preferences.highlightFreshCatalog}
                  onChange={(value) => updatePreference("highlightFreshCatalog", value)}
                />
                <ToggleRow
                  label="Feature flash sales first"
                  description="Keep time-sensitive promotions more visible when curating the storefront."
                  checked={preferences.featureFlashSalesFirst}
                  onChange={(value) => updatePreference("featureFlashSalesFirst", value)}
                />
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "notifications" ? (
            <SectionCard
              title="Notification desk"
              description="Shape how urgent the admin workspace should feel as approvals, store health, and operational alerts increase."
              action={
                <Button variant="secondary" onClick={handlePreferenceSave}>
                  Save preferences
                </Button>
              }
            >
              <div className="space-y-4">
                <ToggleRow
                  label="Vendor review alerts"
                  description="Keep nudges visible when fresh vendor applications or review updates come in."
                  checked={preferences.vendorAlerts}
                  onChange={(value) => updatePreference("vendorAlerts", value)}
                />
                <ToggleRow
                  label="Order exception alerts"
                  description="Stay aware when pending or problem orders need quick follow-up."
                  checked={preferences.orderAlerts}
                  onChange={(value) => updatePreference("orderAlerts", value)}
                />
                <ToggleRow
                  label="Security alerts"
                  description="Reserve stronger alerting for access changes, blocked users, and account risk events."
                  checked={preferences.securityAlerts}
                  onChange={(value) => updatePreference("securityAlerts", value)}
                />
                <p className="text-xs text-textMuted">
                  These preferences are currently browser-level workspace choices — a good bridge until
                  server-backed admin preference profiles are ready.
                </p>
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "security" ? (
            <SectionCard
              title="Access and safety"
              description="How this admin space handles sensitive workflow decisions and team access over time."
            >
              <div className="space-y-4 text-sm">
                <div className="rounded-2xl border border-line bg-surfaceMuted p-4">
                  <p className="text-textMuted">
                    Signed in as <span className="font-medium text-textStrong">{adminUser?.email}</span>
                  </p>
                  <p className="mt-1 text-textMuted">
                    Role coverage: <span className="font-medium text-textStrong">{joinedRoles}</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-surfaceMuted p-4">
                  <p className="font-medium text-textStrong">On the roadmap</p>
                  <ul className="mt-2 space-y-1.5 text-textMuted">
                    <li>· Audit visibility and multi-admin permission bands as the operations team grows.</li>
                    <li>· Payout cadence, service-fee controls, VAT/tax notes, and refund automation.</li>
                    <li>· Server-backed notification preference profiles.</li>
                  </ul>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "team" && isSuperAdmin ? <AdminTeamPanel /> : null}
        </div>
      </div>

      <ImageCropModal
        file={avatarCropFile}
        open={Boolean(avatarCropFile)}
        aspect={1}
        eyebrow="Profile Image"
        title="Frame the admin identity clearly"
        description="Choose a clean square crop that feels warm, recognizable, and strong across the admin desk and the ODOS Official store."
        outputLabel="1:1 square crop"
        outputDescription="Best for profile images, store identity, and consistent branding in the ODOS app."
        onClose={() => setAvatarCropFile(null)}
        onConfirm={(file) => {
          setAvatarFile(file);
          setAvatarCropFile(null);
        }}
      />
    </div>
  );
}
