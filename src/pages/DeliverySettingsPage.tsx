import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  buildDeliverySettingsDraft,
  getDeliverySettings,
  updateDeliverySettings,
  type DeliverySettings,
  type DeliverySettingsDraft,
} from "@/api/deliverySettingsApi";
import { AdminPageSkeleton } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDateTime } from "@/utils/format";

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

function MethodFields({
  title,
  titleValue,
  etaValue,
  feeValue,
  feeLabel,
  enabled,
  onTitleChange,
  onEtaChange,
  onFeeChange,
  onEnabledChange,
}: {
  title: string;
  titleValue: string;
  etaValue: string;
  feeValue: number;
  feeLabel: string;
  enabled: boolean;
  onTitleChange: (value: string) => void;
  onEtaChange: (value: string) => void;
  onFeeChange: (value: number) => void;
  onEnabledChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-textStrong">{title}</p>
          <p className="mt-1 text-sm text-textMuted">Shown to shoppers at checkout and on order tracking.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition ${
            enabled
              ? "border-accent/40 bg-accent/20"
              : "border-white/10 bg-white/[0.06]"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full transition ${
              enabled ? "left-6 bg-accent" : "left-1 bg-white/70"
            }`}
          />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-textStrong">Display title</label>
          <input
            className="app-input"
            value={titleValue}
            onChange={(event) => onTitleChange(event.target.value)}
            disabled={!enabled}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-textStrong">ETA label</label>
          <input
            className="app-input"
            value={etaValue}
            onChange={(event) => onEtaChange(event.target.value)}
            disabled={!enabled}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-textStrong">{feeLabel}</label>
          <input
            className="app-input"
            type="number"
            min="0"
            step="0.01"
            value={feeValue}
            onChange={(event) => onFeeChange(Number(event.target.value))}
            disabled={!enabled}
          />
        </div>
      </div>
    </div>
  );
}

export function DeliverySettingsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [draft, setDraft] = useState<DeliverySettingsDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void getDeliverySettings(token)
      .then((loaded) => {
        if (cancelled) {
          return;
        }
        setSettings(loaded);
        setDraft(buildDeliverySettingsDraft(loaded));
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load delivery settings.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const hasChanges = useMemo(() => {
    if (!settings || !draft) {
      return false;
    }
    return JSON.stringify(buildDeliverySettingsDraft(settings)) !== JSON.stringify(draft);
  }, [draft, settings]);

  function updateDraft<K extends keyof DeliverySettingsDraft>(key: K, value: DeliverySettingsDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave() {
    if (!token || !draft) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateDeliverySettings(token, draft);
      setSettings(updated);
      setDraft(buildDeliverySettingsDraft(updated));
      showToast({
        title: "Delivery settings saved",
        description: "Checkout quotes and order validation now use these fees and rules.",
        tone: "success",
      });
    } catch (saveError) {
      showToast({
        title: "Unable to save delivery settings",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <AdminPageSkeleton blocks={2} />;
  }

  if (error || !draft || !settings) {
    return <ErrorState description={error ?? "Delivery settings could not be loaded."} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Delivery settings"
        description="Control shipping fees, free-delivery thresholds, same-day regions, and the labels shoppers see at checkout."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard
            title="Pricing & free shipping"
            description="Standard delivery becomes free when the cart subtotal meets the threshold below."
            action={
              <Button
                onClick={() => void handleSave()}
                isLoading={isSaving}
                disabled={!hasChanges}
                leftIcon={<Save className="size-4" />}
              >
                Save changes
              </Button>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-textStrong">Free shipping threshold</label>
                <input
                  className="app-input"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.freeShippingThreshold}
                  onChange={(event) => updateDraft("freeShippingThreshold", Number(event.target.value))}
                />
                <p className="mt-2 text-sm text-textMuted">
                  Orders at or above {formatCurrency(draft.freeShippingThreshold)} get free standard delivery.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Delivery methods" description="Enable methods and tune how each one appears in the app.">
            <div className="space-y-4">
              <MethodFields
                title="Standard delivery"
                titleValue={draft.economyTitle}
                etaValue={draft.economyEta}
                feeValue={draft.economyFee}
                feeLabel="Standard fee (GH₵)"
                enabled={draft.economyEnabled}
                onTitleChange={(value) => updateDraft("economyTitle", value)}
                onEtaChange={(value) => updateDraft("economyEta", value)}
                onFeeChange={(value) => updateDraft("economyFee", value)}
                onEnabledChange={(value) => updateDraft("economyEnabled", value)}
              />
              <MethodFields
                title="Express delivery"
                titleValue={draft.expressTitle}
                etaValue={draft.expressEta}
                feeValue={draft.expressFee}
                feeLabel="Express fee (GH₵)"
                enabled={draft.expressEnabled}
                onTitleChange={(value) => updateDraft("expressTitle", value)}
                onEtaChange={(value) => updateDraft("expressEta", value)}
                onFeeChange={(value) => updateDraft("expressFee", value)}
                onEnabledChange={(value) => updateDraft("expressEnabled", value)}
              />
              <MethodFields
                title="Same-day delivery"
                titleValue={draft.sameDayTitle}
                etaValue={draft.sameDayEta}
                feeValue={draft.sameDayFee}
                feeLabel="Same-day fee (GH₵)"
                enabled={draft.sameDayEnabled}
                onTitleChange={(value) => updateDraft("sameDayTitle", value)}
                onEtaChange={(value) => updateDraft("sameDayEta", value)}
                onFeeChange={(value) => updateDraft("sameDayFee", value)}
                onEnabledChange={(value) => updateDraft("sameDayEnabled", value)}
              />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Same-day rules" description="Same-day is only offered when the address and order time qualify.">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-textStrong">Order cutoff hour (24h, Accra time)</label>
                <input
                  className="app-input"
                  type="number"
                  min="0"
                  max="23"
                  value={draft.sameDayCutoffHour}
                  onChange={(event) => updateDraft("sameDayCutoffHour", Number(event.target.value))}
                />
                <p className="mt-2 text-sm text-textMuted">
                  Shoppers can order same-day before {draft.sameDayCutoffHour}:00, Monday through Saturday.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-textStrong">Eligible regions</label>
                <textarea
                  className="app-input min-h-[220px] resize-y"
                  value={draft.sameDayRegionsText}
                  onChange={(event) => updateDraft("sameDayRegionsText", event.target.value)}
                  placeholder={"greater accra\naccra\ntema"}
                />
                <p className="mt-2 text-sm text-textMuted">
                  One region per line or comma-separated. Matching is case-insensitive and checks if the shopper&apos;s region contains these values.
                </p>
              </div>
              <ToggleRow
                label="Same-day delivery enabled"
                description="When off, same-day is hidden from checkout entirely."
                checked={draft.sameDayEnabled}
                onChange={(value) => updateDraft("sameDayEnabled", value)}
              />
            </div>
          </SectionCard>

          <SectionCard compact title="Live preview">
            <div className="space-y-3 text-sm">
              <p className="text-textMuted">
                Last updated {formatDateTime(settings.updatedAt)}
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="font-medium text-textStrong">Standard</p>
                <p className="mt-1 text-textMuted">
                  {draft.economyTitle} · {formatCurrency(draft.economyFee)} · free over {formatCurrency(draft.freeShippingThreshold)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="font-medium text-textStrong">Express</p>
                <p className="mt-1 text-textMuted">
                  {draft.expressTitle} · {formatCurrency(draft.expressFee)} · {draft.expressEta}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="font-medium text-textStrong">Same-day</p>
                <p className="mt-1 text-textMuted">
                  {draft.sameDayTitle} · {formatCurrency(draft.sameDayFee)} · before {draft.sameDayCutoffHour}:00 in eligible regions
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
