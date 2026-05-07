import {
  BellRing,
  Camera,
  CreditCard,
  LayoutPanelTop,
  Save,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { updateAdminMe } from "@/api/adminAuthApi";
import { Button } from "@/components/ui/Button";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import {
  defaultAdminPreferences,
  getStoredAdminPreferences,
  setStoredAdminPreferences,
  type AdminPreferences,
} from "@/utils/adminPreferences";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="min-w-0">
        <p className="font-medium text-textStrong">{label}</p>
        <p className="mt-1 text-sm text-textMuted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition ${
          checked
            ? "border-accent/40 bg-accent/20"
            : "border-white/10 bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full transition ${
            checked ? "left-6 bg-accent" : "left-1 bg-white/70"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { adminUser, token, syncAdminUser } = useAdminAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullName, setFullName] = useState(adminUser?.fullName ?? "");
  const [phone, setPhone] = useState(adminUser?.phone ?? "");
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [preferences, setPreferences] = useState<AdminPreferences>(() => getStoredAdminPreferences());

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Admin settings"
        description="Shape your ODOS admin profile, workspace behavior, and daily operating defaults from one polished control room."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard
            title="Admin profile"
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
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col items-center text-center">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt={adminUser?.fullName ?? "Admin avatar"}
                      className="size-28 rounded-[30px] object-cover shadow-glow"
                    />
                  ) : (
                    <div className="flex size-28 items-center justify-center rounded-[30px] bg-accent/15 text-3xl font-semibold text-accentSoft">
                      {adminUser?.fullName
                        ?.split(" ")
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2) ?? "OA"}
                    </div>
                  )}
                  <p className="mt-4 text-lg font-semibold text-textStrong">
                    {adminUser?.fullName ?? "ODOS Admin"}
                  </p>
                  <p className="mt-1 text-sm text-textMuted">{adminUser?.email}</p>
                  <Button
                    className="mt-5 w-full"
                    variant="secondary"
                    leftIcon={<Camera className="size-4" />}
                    onClick={openAvatarPicker}
                  >
                    Upload profile image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarSelection}
                  />
                  <p className="mt-4 text-xs text-textMuted">
                    Square crops work best here. Once saved, the same image becomes the ODOS Official storefront picture in the app.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-textStrong">Full name</label>
                  <input
                    className="app-input"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-textStrong">Email</label>
                  <input className="app-input opacity-70" value={adminUser?.email ?? ""} disabled />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-textStrong">Phone number</label>
                  <input
                    className="app-input"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-textStrong">Access roles</label>
                  <input className="app-input opacity-70" value={joinedRoles} disabled />
                </div>
                <div className="md:col-span-2">
                  <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-4">
                    <p className="text-sm font-medium text-textStrong">Branding sync</p>
                    <p className="mt-1 text-sm text-textMuted">
                      Your ODOS Official store image is now tied to this admin profile, which keeps the app’s platform-managed storefront feeling personal and maintained.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Workspace experience"
            description="Tune how this admin workspace feels day to day without waiting on backend preference endpoints."
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
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <label className="mb-2 block text-sm font-medium text-textStrong">
                    Default landing page
                  </label>
                  <select
                    className="app-input"
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
                  <p className="mt-2 text-sm text-textMuted">
                    Helpful when you already know which desk you want to land on first each day.
                  </p>
                </div>
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
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {[
            {
              title: "Merchandising defaults",
              description:
                "Keep ODOS feeling fresh by deciding whether new arrivals and flash-sale moments should stay front and center for the operations team.",
              icon: Store,
              content: (
                <div className="mt-4 space-y-4">
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
              ),
            },
            {
              title: "Payout and finance notes",
              description:
                "A calm placeholder for commission, settlement timing, and refund policy controls while the payment backend matures.",
              icon: CreditCard,
              content: (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-textMuted">
                  Keep this space ready for payout cadence, service-fee controls, VAT/tax notes, and refund automation once those endpoints are live.
                </div>
              ),
            },
            {
              title: "Access and safety",
              description:
                "Document how this admin space should handle sensitive workflow decisions and team access over time.",
              icon: ShieldCheck,
              content: (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-textMuted">
                  <p>Signed in as: <span className="text-textStrong">{adminUser?.email}</span></p>
                  <p>Role coverage: <span className="text-textStrong">{joinedRoles}</span></p>
                  <p>Suggested next step: add audit visibility and multi-admin permission bands when the operations team grows.</p>
                </div>
              ),
            },
            {
              title: "Notification desk",
              description:
                "Shape how urgent the admin workspace should feel as approvals, store health, and operational alerts increase.",
              icon: BellRing,
              content: (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-textMuted">
                  Alert preferences saved here are currently browser-level workspace choices. They are a good bridge until server-backed admin preference profiles are ready.
                </div>
              ),
            },
            {
              title: "Workspace identity",
              description:
                "Keep the admin experience consistent across the left rail, analytics view, and topbar identity card.",
              icon: LayoutPanelTop,
              content: (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-textMuted">
                  Your profile image, full name, and ODOS Official store image now stay aligned so the platform-managed storefront feels actively maintained.
                </div>
              ),
            },
            {
              title: "Admin presence",
              description:
                "A gentle reminder that the human behind the control room matters as much as the catalog and the charts.",
              icon: UserRound,
              content: (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-textMuted">
                  Choose a warm, recognizable profile image. It helps the ODOS Official presence feel intentional anywhere the store appears in the shopper app.
                </div>
              ),
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <SectionCard key={item.title}>
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-accent/20 bg-accent/10 p-3 text-accentSoft">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-textStrong">{item.title}</h2>
                    <p className="mt-2 text-sm text-textMuted">{item.description}</p>
                    {item.content}
                  </div>
                </div>
              </SectionCard>
            );
          })}
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
