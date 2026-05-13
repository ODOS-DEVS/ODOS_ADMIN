import { Edit3, Info, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  archiveVoucher,
  createVoucher,
  getVouchers,
  type VoucherDraft,
  updateVoucher,
} from "@/api/vouchersApi";
import { getStores } from "@/api/storesApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type {
  Store,
  VoucherAvailability,
  VoucherCampaign,
  VoucherCampaignStatus,
  VoucherDiscountType,
  VoucherScope,
} from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

type VoucherFormValues = {
  code: string;
  title: string;
  description: string;
  issuerName: string;
  scope: VoucherScope;
  availability: VoucherAvailability;
  storeId: string;
  discountType: VoucherDiscountType;
  discountValue: string;
  minSubtotal: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const initialVoucherForm: VoucherFormValues = {
  code: "",
  title: "",
  description: "",
  issuerName: "ODOS",
  scope: "odos",
  availability: "auto",
  storeId: "",
  discountType: "percent",
  discountValue: "10",
  minSubtotal: "0",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "1",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const statusOptions: Array<{ label: string; value: "all" | VoucherCampaignStatus }> = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Expired", value: "expired" },
  { label: "Limit reached", value: "limit_reached" },
  { label: "Disabled", value: "disabled" },
];

const scopeOptions: Array<{ label: string; value: VoucherScope }> = [
  { label: "ODOS-wide", value: "odos" },
  { label: "Store-specific", value: "store" },
];

const availabilityOptions: Array<{ label: string; value: VoucherAvailability }> = [
  { label: "Automatic for shoppers", value: "auto" },
  { label: "Claimable from store page", value: "claim" },
  { label: "Gifted to one shopper", value: "assigned" },
];

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(value: string) {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildRewardPreview(discountType: VoucherDiscountType, discountValue: number) {
  if (discountType === "free_shipping") {
    return "FREE SHIPPING";
  }

  if (discountType === "percent") {
    return `${discountValue}% OFF`;
  }

  return `GHS ${discountValue} OFF`;
}

function describeWindow(voucher: VoucherCampaign) {
  if (voucher.startsAt && voucher.endsAt) {
    return `${formatDateTime(voucher.startsAt)} to ${formatDateTime(voucher.endsAt)}`;
  }
  if (voucher.startsAt) {
    return `Starts ${formatDateTime(voucher.startsAt)}`;
  }
  if (voucher.endsAt) {
    return `Ends ${formatDateTime(voucher.endsAt)}`;
  }
  return "Always available";
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredNumber(value: string, fallback = 0) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

type VoucherEditorFieldProps = {
  label: string;
  helper: string;
  optional?: boolean;
  children: ReactNode;
};

function VoucherEditorField({
  label,
  helper,
  optional = false,
  children,
}: VoucherEditorFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-textStrong">
        {label}
        {optional ? <span className="ml-1 text-xs text-textMuted">Optional</span> : null}
      </span>
      {children}
      <p className="mt-2 text-xs leading-5 text-textMuted">{helper}</p>
    </label>
  );
}

type VoucherEditorSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function VoucherEditorSection({
  title,
  description,
  children,
}: VoucherEditorSectionProps) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-textStrong">{title}</p>
        <p className="mt-1 text-sm leading-6 text-textMuted">{description}</p>
      </div>
      {children}
    </div>
  );
}

type VoucherDateTimeFieldProps = {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
};

function VoucherDateTimeField({
  label,
  helper,
  value,
  onChange,
}: VoucherDateTimeFieldProps) {
  return (
    <VoucherEditorField label={label} helper={helper} optional>
      <div className="space-y-3">
        <input
          className="app-input"
          type="datetime-local"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-textMuted transition hover:text-textStrong"
          >
            Clear date
          </button>
        ) : (
          <p className="text-xs text-textMuted">No schedule selected yet.</p>
        )}
      </div>
    </VoucherEditorField>
  );
}

export function VouchersPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [vouchers, setVouchers] = useState<VoucherCampaign[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VoucherCampaignStatus>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherCampaign | null>(null);
  const [voucherForm, setVoucherForm] = useState<VoucherFormValues>(initialVoucherForm);
  const [archiveTarget, setArchiveTarget] = useState<VoucherCampaign | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadVouchers = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [voucherResult, storeResult] = await Promise.all([
        getVouchers(token),
        getStores(token),
      ]);
      setVouchers(voucherResult);
      setStores(storeResult);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load vouchers.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const haystack = [
        voucher.code,
        voucher.title,
        voucher.description,
        voucher.issuerName,
        voucher.storeName,
        voucher.rewardText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : voucher.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, vouchers]);

  const summary = useMemo(
    () => ({
      activeCount: vouchers.filter((voucher) => voucher.status === "active").length,
      scheduledCount: vouchers.filter((voucher) => voucher.status === "scheduled").length,
      totalRedemptions: vouchers.reduce((sum, voucher) => sum + voucher.redemptionCount, 0),
      totalSavings: vouchers.reduce((sum, voucher) => sum + voucher.totalDiscountAmount, 0),
    }),
    [vouchers],
  );

  const rewardPreview = useMemo(
    () =>
      buildRewardPreview(
        voucherForm.discountType,
        parseRequiredNumber(voucherForm.discountValue, 0),
      ),
    [voucherForm.discountType, voucherForm.discountValue],
  );

  function resetEditorState() {
    setEditingVoucher(null);
    setVoucherForm(initialVoucherForm);
  }

  function openCreateModal() {
    resetEditorState();
    setIsEditorOpen(true);
  }

  function openEditModal(voucher: VoucherCampaign) {
    setEditingVoucher(voucher);
    setVoucherForm({
      code: voucher.code,
      title: voucher.title,
      description: voucher.description ?? "",
      issuerName: voucher.issuerName ?? "ODOS",
      scope: voucher.scope,
      availability: voucher.availability,
      storeId: voucher.storeId ?? "",
      discountType: voucher.discountType,
      discountValue:
        voucher.discountType === "free_shipping" ? "0" : String(voucher.discountValue),
      minSubtotal: String(voucher.minSubtotal),
      maxDiscount: voucher.maxDiscount != null ? String(voucher.maxDiscount) : "",
      usageLimit: voucher.usageLimit != null ? String(voucher.usageLimit) : "",
      perUserLimit: voucher.perUserLimit != null ? String(voucher.perUserLimit) : "",
      startsAt: toDateTimeLocal(voucher.startsAt),
      endsAt: toDateTimeLocal(voucher.endsAt),
      isActive: voucher.isActive,
    });
    setIsEditorOpen(true);
  }

  function updateForm<K extends keyof VoucherFormValues>(key: K, value: VoucherFormValues[K]) {
    setVoucherForm((current) => ({ ...current, [key]: value }));
  }

  function buildVoucherDraft(): VoucherDraft | null {
    const code = voucherForm.code.trim().toUpperCase();
    const title = voucherForm.title.trim();
    if (!code || !title) {
      showToast({
        title: "Missing voucher details",
        description: "Add both a voucher code and campaign title before saving.",
        tone: "error",
      });
      return null;
    }
    if (voucherForm.scope === "store" && !voucherForm.storeId.trim()) {
      showToast({
        title: "Choose a store",
        description: "Store promotions must be attached to a real storefront.",
        tone: "error",
      });
      return null;
    }

    const discountValue =
      voucherForm.discountType === "free_shipping"
        ? 0
        : parseRequiredNumber(voucherForm.discountValue, Number.NaN);
    const minSubtotal = parseRequiredNumber(voucherForm.minSubtotal, Number.NaN);

    if (!Number.isFinite(discountValue) || !Number.isFinite(minSubtotal)) {
      showToast({
        title: "Invalid voucher numbers",
        description: "Check the discount value and minimum subtotal fields.",
        tone: "error",
      });
      return null;
    }

    const startsAt = toIsoString(voucherForm.startsAt);
    const endsAt = toIsoString(voucherForm.endsAt);
    if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      showToast({
        title: "Check the schedule",
        description: "The end date must be later than the start date.",
        tone: "error",
      });
      return null;
    }

    return {
      code,
      title,
      description: voucherForm.description.trim() || null,
      issuerName: voucherForm.issuerName.trim() || null,
      scope: voucherForm.scope,
      availability: voucherForm.availability,
      storeId: voucherForm.scope === "store" ? voucherForm.storeId.trim() || null : null,
      discountType: voucherForm.discountType,
      discountValue,
      minSubtotal,
      maxDiscount: parseOptionalNumber(voucherForm.maxDiscount),
      usageLimit: parseOptionalNumber(voucherForm.usageLimit),
      perUserLimit: parseOptionalNumber(voucherForm.perUserLimit),
      isActive: voucherForm.isActive,
      startsAt,
      endsAt,
    };
  }

  async function handleSave() {
    if (!token) {
      return;
    }

    const payload = buildVoucherDraft();
    if (!payload) {
      return;
    }

    setActionLoading(true);
    try {
      if (editingVoucher) {
        const updated = await updateVoucher(token, editingVoucher.id, payload);
        setVouchers((current) =>
          current.map((voucher) => (voucher.id === updated.id ? updated : voucher)),
        );
        showToast({
          title: "Voucher updated",
          description: `${updated.code} is ready with the latest campaign settings.`,
          tone: "success",
        });
      } else {
        const created = await createVoucher(token, payload);
        setVouchers((current) => [created, ...current]);
        showToast({
          title: "Voucher created",
          description: `${created.code} is now available to shoppers.`,
          tone: "success",
        });
      }

      setIsEditorOpen(false);
      resetEditorState();
    } catch (saveError) {
      showToast({
        title: "Unable to save voucher",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchive() {
    if (!token || !archiveTarget) {
      return;
    }

    setActionLoading(true);
    try {
      await archiveVoucher(token, archiveTarget.id);
      setVouchers((current) =>
        current.map((voucher) =>
          voucher.id === archiveTarget.id
            ? { ...voucher, isActive: false, status: "disabled" }
            : voucher,
        ),
      );
      showToast({
        title: "Voucher archived",
        description: `${archiveTarget.code} is no longer active at checkout.`,
        tone: "success",
      });
      setArchiveTarget(null);
    } catch (archiveError) {
      showToast({
        title: "Unable to archive voucher",
        description: archiveError instanceof Error ? archiveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading vouchers..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadVouchers()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vouchers"
        title="Voucher campaigns"
        description="Create, time, and manage shopper voucher campaigns with real redemption visibility across the marketplace."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreateModal}>
            Create voucher
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">
            Live campaigns
          </p>
          <p className="mt-4 text-3xl font-semibold text-textStrong">{summary.activeCount}</p>
          <p className="mt-2 text-sm text-textMuted">Vouchers that can be redeemed right now.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">
            Scheduled
          </p>
          <p className="mt-4 text-3xl font-semibold text-textStrong">{summary.scheduledCount}</p>
          <p className="mt-2 text-sm text-textMuted">Campaigns queued to start later.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">
            Redemptions
          </p>
          <p className="mt-4 text-3xl font-semibold text-textStrong">{summary.totalRedemptions}</p>
          <p className="mt-2 text-sm text-textMuted">Successful voucher uses across all orders.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">
            Shopper savings
          </p>
          <p className="mt-4 text-3xl font-semibold text-textStrong">
            {formatCurrency(summary.totalSavings)}
          </p>
          <p className="mt-2 text-sm text-textMuted">Value already returned to customers.</p>
        </div>
      </div>

      <SectionCard
        title="Campaign library"
        description="Search codes, monitor status, and keep voucher campaigns tidy as promos start, end, or hit their redemption ceiling."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code, title, or issuer"
              className="sm:w-80"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | VoucherCampaignStatus)
              }
              options={statusOptions}
            />
          </div>
        }
      >
        {filteredVouchers.length === 0 ? (
          <EmptyState
            title="No vouchers found"
            description="Create a new campaign or broaden the current filters."
          />
        ) : (
          <DataTable<VoucherCampaign>
            columns={[
              {
                key: "campaign",
                header: "Campaign",
                render: (voucher) => (
                  <div>
                    <p className="font-medium text-textStrong">{voucher.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-accentSoft">
                      {voucher.code}
                    </p>
                    <p className="mt-2 text-xs text-textMuted">
                      {(voucher.scope === "store"
                        ? voucher.storeName || voucher.issuerName
                        : voucher.issuerName) ?? "ODOS"}
                    </p>
                    <p className="mt-1 text-xs text-textMuted">
                      {voucher.scope === "store" ? "Store promo" : "ODOS promo"} ·{" "}
                      {voucher.availability === "auto"
                        ? "Auto"
                        : voucher.availability === "claim"
                          ? "Claimable"
                          : "Gifted"}
                    </p>
                  </div>
                ),
              },
              {
                key: "reward",
                header: "Reward",
                render: (voucher) => (
                  <div>
                    <p className="font-medium text-textStrong">{voucher.rewardText}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      Min. spend {formatCurrency(voucher.minSubtotal)}
                    </p>
                    <p className="mt-1 text-xs text-textMuted">
                      {voucher.maxDiscount != null
                        ? `Max discount ${formatCurrency(voucher.maxDiscount)}`
                        : "No max discount cap"}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (voucher) => (
                  <div>
                    <StatusBadge status={voucher.status} />
                    <p className="mt-2 text-xs text-textMuted">{describeWindow(voucher)}</p>
                  </div>
                ),
              },
              {
                key: "usage",
                header: "Usage",
                render: (voucher) => (
                  <div>
                    <p className="font-medium text-textStrong">
                      {voucher.redemptionCount}
                      {voucher.usageLimit != null ? ` / ${voucher.usageLimit}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-textMuted">
                      {voucher.uniqueUserCount} unique shopper(s)
                    </p>
                    <p className="mt-1 text-xs text-textMuted">
                      Per-user limit{" "}
                      {voucher.perUserLimit != null ? voucher.perUserLimit : "Unlimited"}
                    </p>
                  </div>
                ),
              },
              {
                key: "impact",
                header: "Impact",
                render: (voucher) => (
                  <div>
                    <p className="font-medium text-textStrong">
                      {formatCurrency(voucher.totalDiscountAmount)}
                    </p>
                    <p className="mt-1 text-xs text-textMuted">
                      Created {formatDate(voucher.createdAt)}
                    </p>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                className: "text-right",
                render: (voucher) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      leftIcon={<Edit3 className="size-4" />}
                      onClick={() => openEditModal(voucher)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => setArchiveTarget(voucher)}
                      disabled={voucher.status === "disabled"}
                    >
                      Archive
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredVouchers}
            keyExtractor={(voucher) => voucher.id}
          />
        )}
      </SectionCard>

      <Modal
        open={isEditorOpen}
        title={editingVoucher ? "Update voucher campaign" : "Create voucher campaign"}
        description="Set the shopper-facing offer, who can use it, and when it should run. Required fields come first, optional controls come later."
        size="xl"
        onClose={() => {
          setIsEditorOpen(false);
          resetEditorState();
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditorOpen(false);
                resetEditorState();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} isLoading={actionLoading}>
              {editingVoucher ? "Save changes" : "Create voucher"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-[28px] border border-accent/15 bg-accent/8 px-4 py-4 text-sm text-textMuted">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accentSoft">
              <Info className="size-4" />
            </div>
            <p className="leading-6">
              Use required fields to get the campaign live quickly. Optional fields help you cap
              discounts, limit usage, or schedule the voucher to start and end automatically.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-5">
              <VoucherEditorSection
                title="Offer basics"
                description="This is the shopper-facing identity of the promotion."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <VoucherEditorField
                    label="Voucher code"
                    helper="Short code shoppers can enter at checkout, like WELCOME10."
                  >
                    <input
                      className="app-input"
                      value={voucherForm.code}
                      onChange={(event) => updateForm("code", event.target.value.toUpperCase())}
                      placeholder="WELCOME10"
                    />
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Campaign title"
                    helper="Name of the offer shown in admin and shopper promotion surfaces."
                  >
                    <input
                      className="app-input"
                      value={voucherForm.title}
                      onChange={(event) => updateForm("title", event.target.value)}
                      placeholder="Welcome savings"
                    />
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Shown as"
                    helper={
                      voucherForm.scope === "store"
                        ? "Name shoppers see as the promotion source. Leave it blank to fall back to the store name."
                        : "Name shoppers see as the promotion source. Leave ODOS unless you want a different brand label."
                    }
                    optional
                  >
                    <input
                      className="app-input"
                      value={voucherForm.issuerName}
                      onChange={(event) => updateForm("issuerName", event.target.value)}
                      placeholder={voucherForm.scope === "store" ? "Use store name" : "ODOS"}
                    />
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Description"
                    helper="Short explanation of what shoppers are getting and when to use it."
                    optional
                  >
                    <textarea
                      className="app-textarea min-h-[120px]"
                      value={voucherForm.description}
                      onChange={(event) => updateForm("description", event.target.value)}
                      placeholder="Great for first-time orders above GHS 100."
                    />
                  </VoucherEditorField>
                </div>
              </VoucherEditorSection>

              <VoucherEditorSection
                title="Who can use it"
                description="Choose whether the promotion belongs to ODOS or one store, and how shoppers receive it."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <VoucherEditorField
                    label="Scope"
                    helper="ODOS promos can work across qualifying checkout items. Store promos only discount items from one store."
                  >
                    <select
                      className="app-select"
                      value={voucherForm.scope}
                      onChange={(event) => {
                        const nextScope = event.target.value as VoucherScope;
                        setVoucherForm((current) => ({
                          ...current,
                          scope: nextScope,
                          storeId: nextScope === "store" ? current.storeId : "",
                          issuerName:
                            nextScope === "store"
                              ? current.issuerName || ""
                              : current.issuerName || "ODOS",
                          discountType:
                            nextScope === "store" && current.discountType === "free_shipping"
                              ? "percent"
                              : current.discountType,
                        }));
                      }}
                    >
                      {scopeOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-panel">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Availability"
                    helper="Auto makes it available immediately. Claimable lets shoppers save it. Gifted only is for private one-to-one offers."
                  >
                    <select
                      className="app-select"
                      value={voucherForm.availability}
                      onChange={(event) =>
                        updateForm("availability", event.target.value as VoucherAvailability)
                      }
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-panel">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </VoucherEditorField>

                  {voucherForm.scope === "store" ? (
                    <VoucherEditorField
                      label="Store"
                      helper="Only products from this store can receive the discount."
                    >
                      <select
                        className="app-select"
                        value={voucherForm.storeId}
                        onChange={(event) => updateForm("storeId", event.target.value)}
                      >
                        <option value="" className="bg-panel">
                          Select a store
                        </option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id} className="bg-panel">
                            {store.name}
                          </option>
                        ))}
                      </select>
                    </VoucherEditorField>
                  ) : (
                    <div className="hidden md:block" />
                  )}
                </div>
              </VoucherEditorSection>
            </div>

            <div className="space-y-5">
              <VoucherEditorSection
                title="Discount rules"
                description="Define what the shopper gets and the spend needed to unlock it."
              >
                <div className="grid gap-5">
                  <VoucherEditorField
                    label="Discount type"
                    helper="Choose a percentage, a flat GHS amount, or free shipping for ODOS-wide promos."
                  >
                    <select
                      className="app-select"
                      value={voucherForm.discountType}
                      onChange={(event) =>
                        updateForm("discountType", event.target.value as VoucherDiscountType)
                      }
                    >
                      <option value="percent" className="bg-panel">
                        Percent off
                      </option>
                      <option value="fixed" className="bg-panel">
                        Fixed amount off
                      </option>
                      {voucherForm.scope === "odos" ? (
                        <option value="free_shipping" className="bg-panel">
                          Free shipping
                        </option>
                      ) : null}
                    </select>
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Discount value"
                    helper={
                      voucherForm.discountType === "percent"
                        ? "Enter the percentage number only. Example: 10 means 10% off."
                        : voucherForm.discountType === "fixed"
                          ? "Enter the GHS amount to take off the order."
                          : "Free shipping uses the current checkout shipping amount automatically."
                    }
                  >
                    <input
                      className="app-input disabled:cursor-not-allowed disabled:opacity-60"
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={voucherForm.discountType === "free_shipping"}
                      value={
                        voucherForm.discountType === "free_shipping"
                          ? "0"
                          : voucherForm.discountValue
                      }
                      onChange={(event) => updateForm("discountValue", event.target.value)}
                      placeholder={voucherForm.discountType === "percent" ? "10" : "25"}
                    />
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Minimum basket amount"
                    helper="The checkout subtotal a shopper must reach before this voucher can be used."
                  >
                    <input
                      className="app-input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={voucherForm.minSubtotal}
                      onChange={(event) => updateForm("minSubtotal", event.target.value)}
                      placeholder="100"
                    />
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Max discount"
                    helper="Useful for percentage promos when you want a discount cap. Leave blank for no cap."
                    optional
                  >
                    <input
                      className="app-input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={voucherForm.maxDiscount}
                      onChange={(event) => updateForm("maxDiscount", event.target.value)}
                      placeholder="For example 50"
                    />
                  </VoucherEditorField>
                </div>
              </VoucherEditorSection>

              <VoucherEditorSection
                title="Timing and limits"
                description="Use these controls only when you want the system to schedule or limit the offer automatically."
              >
                <div className="grid gap-5">
                  <VoucherDateTimeField
                    label="Starts at"
                    helper="Leave blank if the voucher should start working as soon as it is active."
                    value={voucherForm.startsAt}
                    onChange={(nextValue) => updateForm("startsAt", nextValue)}
                  />

                  <VoucherDateTimeField
                    label="Ends at"
                    helper="Leave blank if the voucher should keep working until you disable it or it reaches its limits."
                    value={voucherForm.endsAt}
                    onChange={(nextValue) => updateForm("endsAt", nextValue)}
                  />

                  <VoucherEditorField
                    label="Total uses allowed"
                    helper="How many successful redemptions all shoppers can make before the campaign stops."
                    optional
                  >
                    <input
                      className="app-input"
                      type="number"
                      min={1}
                      step="1"
                      value={voucherForm.usageLimit}
                      onChange={(event) => updateForm("usageLimit", event.target.value)}
                      placeholder="Unlimited if left blank"
                    />
                  </VoucherEditorField>

                  <VoucherEditorField
                    label="Uses per shopper"
                    helper="How many times one shopper can use this voucher. Leave blank for unlimited repeat use."
                    optional
                  >
                    <input
                      className="app-input"
                      type="number"
                      min={1}
                      step="1"
                      value={voucherForm.perUserLimit}
                      onChange={(event) => updateForm("perUserLimit", event.target.value)}
                      placeholder="Usually 1 for one-time offers"
                    />
                  </VoucherEditorField>
                </div>
              </VoucherEditorSection>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">
                      Reward preview
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-textStrong">{rewardPreview}</p>
                    <p className="mt-2 text-sm leading-6 text-textMuted">
                      {voucherForm.scope === "store"
                        ? "This promotion will only work for eligible items from the selected store."
                        : "This promotion can work anywhere in the marketplace when the order qualifies."}{" "}
                      Minimum spend {formatCurrency(parseRequiredNumber(voucherForm.minSubtotal, 0))}.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-textStrong">
                    <input
                      type="checkbox"
                      checked={voucherForm.isActive}
                      onChange={(event) => updateForm("isActive", event.target.checked)}
                    />
                    Campaign active
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title={archiveTarget ? `Archive ${archiveTarget.code}?` : "Archive voucher?"}
        description="The voucher will stop working at checkout immediately, but the campaign history will remain in admin."
        confirmLabel="Archive voucher"
        confirmVariant="danger"
        isLoading={actionLoading}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void handleArchive()}
      />
    </div>
  );
}
