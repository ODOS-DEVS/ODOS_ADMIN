import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Edit3,
  ImagePlus,
  Inbox,
  Megaphone,
  Plus,
  Radio,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  archiveMerchandisingCampaign,
  createMerchandisingCampaign,
  duplicateMerchandisingCampaign,
  getCampaignParticipation,
  getMerchandisingCampaignsPage,
  notifyCampaignVendors,
  updateMerchandisingCampaign,
  uploadCampaignArtwork,
  type CampaignParticipation,
  type MerchandisingCampaign,
  type MerchandisingCampaignUpsert,
} from "@/api/merchandisingCampaignsApi";
import { getCampaignOptInsPage, reviewCampaignOptIn } from "@/api/campaignOptInsApi";
import { getProducts } from "@/api/productsApi";
import { DirectorySection } from "@/components/directory/DirectorySection";
import { MetricStat } from "@/components/directory/MetricStat";
import { SegmentedTabs } from "@/components/directory/SegmentedTabs";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { Product } from "@/types";
import { formatDate } from "@/utils/format";

type CampaignFormValues = MerchandisingCampaignUpsert;

const initialForm: CampaignFormValues = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  bannerImageUrl: "",
  thumbnailImageUrl: "",
  iconKey: "",
  themeColor: "",
  status: "draft",
  isActive: false,
  isFeatured: false,
  visibility: "public",
  startsAt: null,
  endsAt: null,
  displayPriority: 100,
  maxProducts: null,
  productSort: "manual",
  hideOutOfStock: true,
  includeEntireMarketplace: false,
  allowVendorOptIn: false,
  submissionDeadline: null,
  requiresProposedPrice: false,
  minDiscountPercent: null,
  notifyVendors: false,
  productIds: [],
  pinnedProductIds: [],
  categorySlugs: [],
  storeIds: [],
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type PageView = "campaigns" | "opt-ins";


/**
 * One piece of campaign artwork: upload a file, or paste a URL if the image already lives
 * somewhere. Upload wins when both are present, because a file the admin just chose is a
 * clearer intent than a URL left over in the form.
 */
function ArtworkField({
  label,
  hint,
  currentUrl,
  file,
  onUrlChange,
  onFileChange,
}: {
  label: string;
  hint: string;
  currentUrl: string;
  file: File | null;
  onUrlChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
}) {
  const preview = file ? URL.createObjectURL(file) : currentUrl || null;

  return (
    <div className="space-y-2">
      <span className="text-sm text-textMuted">{label}</span>

      <div className="flex items-start gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surfaceMuted">
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-textSubtle" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[13px] font-medium hover:border-accent/40">
            <Upload className="size-4" aria-hidden />
            {file ? "Choose another" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
          </label>

          {file && (
            <p className="flex items-center gap-2 text-[12px] text-textMuted">
              <span className="truncate">{file.name}</span>
              <button type="button" onClick={() => onFileChange(null)} className="text-danger-text">
                Remove
              </button>
            </p>
          )}

          <input
            className="w-full rounded-xl border border-line bg-surfaceMuted px-3 py-2 text-[13px] text-textStrong outline-none"
            placeholder="…or paste an image URL"
            value={currentUrl}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </div>
      </div>

      <p className="text-[12px] text-textSubtle">{hint}</p>
    </div>
  );
}

export function FullMerchandisingCampaignsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<PageView>("campaigns");
  const {
    items: campaigns,
    isLoading,
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
    removeItem,
    setItems,
  } = useInfiniteAdminList({
    loadPage: getMerchandisingCampaignsPage,
    getId: (campaign) => campaign.id,
    enabled: view === "campaigns",
  });
  const {
    items: optIns,
    isLoading: isLoadingOptIns,
    page: optInsPage,
    pageSize: optInsPageSize,
    isLoadingPage: isLoadingOptInsPage,
    hasMore: optInsHasMore,
    error: optInsError,
    goToPage: goToOptInsPage,
    refresh: refreshOptIns,
    replaceItem: replaceOptIn,
  } = useInfiniteAdminList({
    loadPage: getCampaignOptInsPage,
    getId: (optIn) => optIn.id,
    enabled: view === "opt-ins",
  });
  const [optInStatusFilter, setOptInStatusFilter] = useState("pending");
  const [optInActionLoading, setOptInActionLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productQuery, setProductQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MerchandisingCampaign | null>(null);
  const [form, setForm] = useState<CampaignFormValues>(initialForm);
  // Artwork is uploaded after the campaign exists, because the upsert takes JSON and the upload
  // takes multipart — they cannot be one request.
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MerchandisingCampaign | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [categorySlugsText, setCategorySlugsText] = useState("");
  const [storeIdsText, setStoreIdsText] = useState("");

  const filteredCampaigns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
      if (!q) return true;
      return (
        campaign.title.toLowerCase().includes(q) ||
        campaign.slug.toLowerCase().includes(q) ||
        (campaign.subtitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [campaigns, query, statusFilter]);

  const filteredOptIns = useMemo(() => {
    if (optInStatusFilter === "all") return optIns;
    return optIns.filter((optIn) => optIn.status === optInStatusFilter);
  }, [optInStatusFilter, optIns]);

  const pendingOptInCount = useMemo(
    () => optIns.filter((optIn) => optIn.status === "pending").length,
    [optIns],
  );

  async function handleReviewOptIn(
    optIn: (typeof optIns)[number],
    status: "approved" | "rejected",
  ) {
    if (!token) return;

    let reviewNotes: string | null = null;
    let campaignPrice: number | null = null;

    if (status === "rejected") {
      const entered = window.prompt(
        `Optional rejection note for ${optIn.productTitle}`,
        optIn.reviewNotes ?? "",
      );
      if (entered === null) return;
      reviewNotes = entered.trim() || null;
    } else if (optIn.proposedPrice != null) {
      // Approving a priced nomination is the moment to settle on the number, so the admin is
      // shown what was proposed and can change it. The shelf price is never touched either way.
      const entered = window.prompt(
        `Campaign price for ${optIn.productTitle} (currently ${optIn.currentPrice ?? "?"}). ` +
          `The vendor proposed ${optIn.proposedPrice}.`,
        String(optIn.proposedPrice),
      );
      if (entered === null) return;
      const parsed = Number(entered.trim());
      if (!Number.isFinite(parsed) || parsed <= 0) {
        showToast({
          title: "Invalid campaign price",
          description: "Enter a whole number of cedis above zero.",
          tone: "error",
        });
        return;
      }
      campaignPrice = parsed;
    }

    setOptInActionLoading(true);
    try {
      const updated = await reviewCampaignOptIn(token, optIn.id, {
        status,
        reviewNotes,
        campaignPrice,
      });
      replaceOptIn(updated);
      showToast({
        title: status === "approved" ? "Opt-in approved" : "Opt-in rejected",
        description:
          status === "approved"
            ? `${optIn.productTitle} is now featured in ${optIn.campaignTitle}.`
            : `${optIn.productTitle} was not selected for ${optIn.campaignTitle}.`,
        tone: "success",
      });
    } catch (reviewError) {
      showToast({
        title: "Unable to review opt-in",
        description: reviewError instanceof Error ? reviewError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setOptInActionLoading(false);
    }
  }

  const [participation, setParticipation] = useState<CampaignParticipation | null>(null);
  const [participationCampaign, setParticipationCampaign] = useState<MerchandisingCampaign | null>(null);
  const [participationLoading, setParticipationLoading] = useState(false);

  async function openParticipation(campaign: MerchandisingCampaign) {
    if (!token) return;
    setParticipationCampaign(campaign);
    setParticipation(null);
    setParticipationLoading(true);
    try {
      setParticipation(await getCampaignParticipation(token, campaign.id));
    } catch (participationError) {
      showToast({
        title: "Unable to load participation",
        description:
          participationError instanceof Error ? participationError.message : "Please try again.",
        tone: "error",
      });
      setParticipationCampaign(null);
    } finally {
      setParticipationLoading(false);
    }
  }

  async function handleNotifyVendors(campaign: MerchandisingCampaign, force: boolean) {
    if (!token) return;
    setParticipationLoading(true);
    try {
      const next = await notifyCampaignVendors(token, campaign.id, force);
      setParticipation(next);
      showToast({
        title: "Vendors invited",
        description: `${next.vendorsNotified} vendors were invited to ${campaign.title}.`,
        tone: "success",
      });
      refresh();
    } catch (notifyError) {
      showToast({
        title: "Unable to invite vendors",
        description: notifyError instanceof Error ? notifyError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setParticipationLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.id.toLowerCase().includes(q) ||
          (product.category ?? "").toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [productQuery, products]);

  async function ensureProductsLoaded() {
    if (!token || products.length > 0) return;
    try {
      const items = await getProducts(token);
      setProducts(items.slice(0, 120));
    } catch {
      // Product picker stays empty; admins can still save without it.
    }
  }

  function resetEditorState() {
    setEditingCampaign(null);
    setForm(initialForm);
    setStartsAtLocal("");
    setEndsAtLocal("");
    setDeadlineLocal("");
    setCategorySlugsText("");
    setStoreIdsText("");
    setProductQuery("");
  }

  async function openCreateModal() {
    resetEditorState();
    await ensureProductsLoaded();
    setIsEditorOpen(true);
  }

  async function openEditModal(campaign: MerchandisingCampaign) {
    await ensureProductsLoaded();
    setEditingCampaign(campaign);
    setForm({
      slug: campaign.slug,
      title: campaign.title,
      subtitle: campaign.subtitle ?? "",
      description: campaign.description ?? "",
      bannerImageUrl: campaign.bannerImageUrl ?? "",
      thumbnailImageUrl: campaign.thumbnailImageUrl ?? "",
      iconKey: campaign.iconKey ?? "",
      themeColor: campaign.themeColor ?? "",
      status: campaign.status === "ended" ? "active" : campaign.status,
      isActive: campaign.isActive,
      isFeatured: campaign.isFeatured,
      visibility: campaign.visibility,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      displayPriority: campaign.displayPriority,
      maxProducts: campaign.maxProducts,
      productSort: campaign.productSort,
      hideOutOfStock: campaign.hideOutOfStock,
      includeEntireMarketplace: campaign.includeEntireMarketplace,
      allowVendorOptIn: campaign.allowVendorOptIn,
      submissionDeadline: campaign.submissionDeadline ?? null,
      requiresProposedPrice: campaign.requiresProposedPrice,
      minDiscountPercent: campaign.minDiscountPercent ?? null,
      // Never pre-checked on edit: a vendor invite is an action an admin takes on purpose,
      // not something that rides along with an unrelated save.
      notifyVendors: false,
      productIds: campaign.productIds,
      pinnedProductIds: campaign.pinnedProductIds,
      categorySlugs: campaign.categorySlugs,
      storeIds: campaign.storeIds,
    });
    setStartsAtLocal(toDateTimeLocal(campaign.startsAt));
    setEndsAtLocal(toDateTimeLocal(campaign.endsAt));
    setDeadlineLocal(toDateTimeLocal(campaign.submissionDeadline));
    setCategorySlugsText(campaign.categorySlugs.join(", "));
    setStoreIdsText(campaign.storeIds.join(", "));
    setIsEditorOpen(true);
  }

  async function handleSave() {
    if (!token) return;
    if (!form.title.trim() || !form.slug.trim()) {
      showToast({
        title: "Missing details",
        description: "Title and slug are required.",
        tone: "error",
      });
      return;
    }

    const payload: MerchandisingCampaignUpsert = {
      ...form,
      slug: slugify(form.slug),
      startsAt: toIsoString(startsAtLocal),
      endsAt: toIsoString(endsAtLocal),
      submissionDeadline: toIsoString(deadlineLocal),
      categorySlugs: categorySlugsText
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
      storeIds: storeIdsText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    setActionLoading(true);
    try {
      if (editingCampaign) {
        let updated = await updateMerchandisingCampaign(token, editingCampaign.id, payload);
        if (bannerFile || thumbnailFile) {
          updated = await uploadCampaignArtwork(token, updated.id, {
            banner: bannerFile,
            thumbnail: thumbnailFile,
          });
        }
        replaceItem(updated);
        showToast({
          title: "Campaign updated",
          description: `${updated.title} is ready for the shopper app.`,
          tone: "success",
        });
      } else {
        let created = await createMerchandisingCampaign(token, payload);
        if (bannerFile || thumbnailFile) {
          created = await uploadCampaignArtwork(token, created.id, {
            banner: bannerFile,
            thumbnail: thumbnailFile,
          });
        }
        setItems((current) => [created, ...current]);
        showToast({
          title: "Campaign created",
          description: `${created.title} was added to the campaign library.`,
          tone: "success",
        });
      }
      setIsEditorOpen(false);
      resetEditorState();
    } catch (saveError) {
      showToast({
        title: "Unable to save campaign",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDuplicate(campaign: MerchandisingCampaign) {
    if (!token) return;
    setActionLoading(true);
    try {
      const clone = await duplicateMerchandisingCampaign(token, campaign.id);
      setItems((current) => [clone, ...current]);
      showToast({
        title: "Campaign duplicated",
        description: `${clone.title} was created as a draft.`,
        tone: "success",
      });
    } catch (dupError) {
      showToast({
        title: "Unable to duplicate",
        description: dupError instanceof Error ? dupError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchive() {
    if (!token || !deleteTarget) return;
    setActionLoading(true);
    try {
      await archiveMerchandisingCampaign(token, deleteTarget.id);
      removeItem(deleteTarget.id);
      showToast({
        title: "Campaign archived",
        description: `${deleteTarget.title} is hidden from the shopper app.`,
        tone: "success",
      });
      setDeleteTarget(null);
    } catch (archiveError) {
      showToast({
        title: "Unable to archive campaign",
        description: archiveError instanceof Error ? archiveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Merchandising campaigns"
        title="Marketplace campaign studio"
        description="Create seasonal and featured campaigns with product, category, and store targeting."
        backRoute="/merchandising-campaigns"
        onRefresh={() => void (view === "campaigns" ? refresh() : refreshOptIns())}
        refreshing={view === "campaigns" ? isLoading : isLoadingOptIns}
        actions={
          view === "campaigns" ? (
            <Button leftIcon={<Plus className="size-4" />} onClick={() => void openCreateModal()}>
              Create campaign
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricStat label="Campaigns" value={campaigns.length.toLocaleString()} icon={Megaphone} caption="Loaded on this page" animationDelay={40} />
        <MetricStat label="Live" value={campaigns.filter((campaign) => campaign.status === "active").length.toLocaleString()} icon={Radio} tone="success" caption="Surfacing in the app" animationDelay={80} />
        <MetricStat label="Scheduled" value={campaigns.filter((campaign) => campaign.status === "scheduled").length.toLocaleString()} icon={CalendarClock} tone="info" caption="Queued to start" animationDelay={120} />
        <MetricStat label="Opt-ins pending" value={pendingOptInCount.toLocaleString()} icon={Inbox} tone="warning" caption="Vendor requests to review" animationDelay={160} />
      </div>

      <div className="flex">
        <SegmentedTabs
          ariaLabel="Switch between campaigns and vendor opt-in requests"
          tabs={[
            { value: "campaigns", label: "Campaigns", count: campaigns.length },
            { value: "opt-ins", label: "Vendor opt-ins", count: pendingOptInCount },
          ]}
          value={view}
          onChange={(value) => setView(value as PageView)}
        />
      </div>

      {view === "opt-ins" ? (
        <DirectorySection
          cardTitle="Vendor campaign opt-in requests"
          count={filteredOptIns.length}
          listSummary="Approve to add the vendor's product to the campaign, or reject with a note."
          cardAction={
            <FilterSelect
              value={optInStatusFilter}
              onChange={(event) => setOptInStatusFilter(event.target.value)}
              options={[
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "All", value: "all" },
              ]}
              className="h-10"
            />
          }
          columns={[
              {
                key: "product",
                header: "Product",
                render: (optIn) => (
                  <div>
                    <p className="font-medium">{optIn.productTitle}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {optIn.vendorName ?? optIn.vendorUserId}
                    </p>
                  </div>
                ),
              },
              {
                key: "campaign",
                header: "Campaign",
                render: (optIn) => optIn.campaignTitle,
              },
              {
                key: "pricing",
                header: "Campaign price",
                render: (optIn) =>
                  optIn.proposedPrice != null ? (
                    <div>
                      <p className="font-medium">
                        GHS {optIn.proposedPrice}
                        {optIn.proposedOldPrice != null && (
                          <span className="ml-2 text-xs text-textMuted line-through">
                            GHS {optIn.proposedOldPrice}
                          </span>
                        )}
                      </p>
                      {optIn.discountPercent != null && (
                        <p className="mt-1 text-xs text-textMuted">{optIn.discountPercent}% off</p>
                      )}
                      {optIn.vendorNote && (
                        <p className="mt-1 text-xs text-textMuted">“{optIn.vendorNote}”</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-textMuted">Shelf price</span>
                  ),
              },
              {
                key: "performance",
                header: "Units sold since approval",
                render: (optIn) =>
                  optIn.unitsSoldSinceApproval != null ? (
                    optIn.unitsSoldSinceApproval
                  ) : (
                    <span className="text-textMuted">—</span>
                  ),
              },
              {
                key: "status",
                header: "Status",
                render: (optIn) => <StatePill label={labelForStatus(optIn.status)} tone={toneForStatus(optIn.status)} />,
              },
              {
                key: "actions",
                header: "Actions",
                render: (optIn) =>
                  optIn.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        leftIcon={<CheckCircle2 className="size-4" />}
                        isLoading={optInActionLoading}
                        onClick={() => void handleReviewOptIn(optIn, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        leftIcon={<XCircle className="size-4" />}
                        isLoading={optInActionLoading}
                        onClick={() => void handleReviewOptIn(optIn, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-textMuted">{optIn.reviewNotes || "Reviewed"}</span>
                  ),
              },]}
          data={filteredOptIns}
          keyExtractor={(optIn) => optIn.id}
          isLoading={isLoadingOptIns}
          error={optInsError}
          onRetry={() => void refreshOptIns()}
          emptyTitle="No opt-in requests"
          emptyDescription="Vendor requests to join a campaign appear here."
          pagination={{
            page: optInsPage,
            pageSize: optInsPageSize,
            onPageChange: goToOptInsPage,
            hasMore: optInsHasMore,
            isLoadingPage: isLoadingOptInsPage,
            loadedLabel: `per page · ${optIns.length} loaded`,
          }}
        />
      ) : null}

      {view === "campaigns" ? (
      <DirectorySection
        cardTitle="Campaign library"
        count={filteredCampaigns.length}
        listSummary="Lower display priority appears first. Only active, scheduled, public campaigns surface in the app."
        cardAction={
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns"
              className="h-10 py-0 sm:w-64"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Draft", value: "draft" },
                { label: "Scheduled", value: "scheduled" },
                { label: "Active", value: "active" },
                { label: "Ended", value: "ended" },
                { label: "Archived", value: "archived" },
              ]}
              className="h-10"
            />
          </div>
        }
        columns={[
            {
              key: "campaign",
              header: "Campaign",
              render: (campaign) => (
                <div>
                  <p className="font-medium">{campaign.title}</p>
                  <p className="mt-1 text-xs text-textMuted">{campaign.slug}</p>
                  {campaign.subtitle ? (
                    <p className="mt-1 text-xs text-textMuted">{campaign.subtitle}</p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "window",
              header: "Schedule",
              render: (campaign) =>
                `${campaign.startsAt ? formatDate(campaign.startsAt) : "Anytime"} → ${
                  campaign.endsAt ? formatDate(campaign.endsAt) : "Open"
                }`,
            },
            {
              key: "targets",
              header: "Targets",
              render: (campaign) =>
                `${campaign.productCount} products · ${campaign.categorySlugs.length} cats · ${campaign.storeIds.length} stores`,
            },
            {
              key: "priority",
              header: "Priority",
              render: (campaign) => campaign.displayPriority,
            },
            {
              key: "status",
              header: "Status",
              render: (campaign) => <StatePill label={labelForStatus(campaign.status)} tone={toneForStatus(campaign.status)} />,
            },
            {
              key: "actions",
              header: "Actions",
              render: (campaign) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    leftIcon={<Edit3 className="size-4" />}
                    onClick={() => void openEditModal(campaign)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<Copy className="size-4" />}
                    onClick={() => void handleDuplicate(campaign)}
                  >
                    Duplicate
                  </Button>
                  {campaign.allowVendorOptIn && (
                    <Button
                      variant="secondary"
                      leftIcon={<Users className="size-4" />}
                      onClick={() => void openParticipation(campaign)}
                    >
                      Participation
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    leftIcon={<Trash2 className="size-4" />}
                    onClick={() => setDeleteTarget(campaign)}
                  >
                    Archive
                  </Button>
                </div>
              ),
            },]}
        data={filteredCampaigns}
        keyExtractor={(campaign) => campaign.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refresh()}
        emptyTitle="No campaigns found"
        emptyDescription="Create a campaign or adjust the filters."
        pagination={{
          page,
          pageSize,
          onPageChange: goToPage,
          hasMore,
          isLoadingPage,
          loadedLabel: `per page · ${campaigns.length} loaded`,
        }}
      />
      ) : null}

      <Modal
        open={isEditorOpen}
        title={editingCampaign ? "Edit campaign" : "Create campaign"}
        description="Products are resolved live from assignments, categories, stores, and vendor opt-ins."
        onClose={() => {
          setIsEditorOpen(false);
          resetEditorState();
        }}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditorOpen(false);
                resetEditorState();
              }}
            >
              Cancel
            </Button>
            <Button isLoading={actionLoading} onClick={() => void handleSave()}>
              {editingCampaign ? "Save changes" : "Create campaign"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Title</span>
            <input
              className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                  slug: current.slug || slugify(event.target.value),
                }))
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Slug</span>
            <input
              className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: slugify(event.target.value) }))
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Subtitle</span>
            <input
              className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
              value={form.subtitle ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, subtitle: event.target.value }))
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Description</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <ArtworkField
              label="Banner"
              hint="Wide artwork, shown on the campaign card and its landing page."
              currentUrl={form.bannerImageUrl ?? ""}
              file={bannerFile}
              onUrlChange={(value) => setForm((current) => ({ ...current, bannerImageUrl: value }))}
              onFileChange={setBannerFile}
            />
            <ArtworkField
              label="Thumbnail"
              hint="Square fallback, used where the banner would be cropped badly."
              currentUrl={form.thumbnailImageUrl ?? ""}
              file={thumbnailFile}
              onUrlChange={(value) => setForm((current) => ({ ...current, thumbnailImageUrl: value }))}
              onFileChange={setThumbnailFile}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Status</span>
              <select
                className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Priority</span>
              <input
                type="number"
                className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
                value={form.displayPriority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    displayPriority: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Product sort</span>
              <select
                className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
                value={form.productSort}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productSort: event.target.value }))
                }
              >
                <option value="manual">Manual / pinned</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="rating">Top rated</option>
                <option value="popular">Popular</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Starts at</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
                value={startsAtLocal}
                onChange={(event) => setStartsAtLocal(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Ends at</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
                value={endsAtLocal}
                onChange={(event) => setEndsAtLocal(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["isActive", "Active"],
                ["isFeatured", "Featured on home"],
                ["hideOutOfStock", "Hide out of stock"],
                ["allowVendorOptIn", "Allow vendor opt-in"],
                ["includeEntireMarketplace", "Include entire marketplace"],
                ["requiresProposedPrice", "Require a campaign price"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm text-textMuted">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
          </div>

          {/* Vendor participation. Only meaningful once opt-in is on, so the whole block is
              hidden otherwise rather than offering settings that would do nothing. */}
          {form.allowVendorOptIn && (
            <div className="space-y-3 rounded-2xl border border-line bg-surfaceMuted/50 p-4">
              <p className="text-sm font-semibold text-textStrong">Vendor participation</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">
                    Submission deadline
                    <span className="ml-1 text-xs">(blank = until the campaign ends)</span>
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
                    value={deadlineLocal}
                    onChange={(event) => setDeadlineLocal(event.target.value)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Minimum discount %</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
                    value={form.minDiscountPercent ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minDiscountPercent: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                  />
                </label>
              </div>

              {editingCampaign?.vendorsNotifiedAt ? (
                <p className="text-xs text-textMuted">
                  {editingCampaign.vendorsNotifiedCount} vendors invited on{" "}
                  {formatDate(editingCampaign.vendorsNotifiedAt)}. Use the campaign row menu to
                  re-send.
                </p>
              ) : (
                <label className="flex items-center gap-3 text-sm text-textMuted">
                  <input
                    type="checkbox"
                    checked={Boolean(form.notifyVendors)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, notifyVendors: event.target.checked }))
                    }
                  />
                  Invite every approved vendor when this campaign is published
                </label>
              )}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Category slugs (comma-separated)</span>
            <input
              className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
              value={categorySlugsText}
              onChange={(event) => setCategorySlugsText(event.target.value)}
              placeholder="electronics, fashion"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Store IDs (comma-separated)</span>
            <input
              className="w-full rounded-2xl border border-line bg-surfaceMuted px-4 py-3 text-textStrong outline-none"
              value={storeIdsText}
              onChange={(event) => setStoreIdsText(event.target.value)}
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-textMuted">Manual products</span>
              <SearchInput
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Filter products"
                className="w-56"
              />
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-line p-3">
              {filteredProducts.map((product) => {
                const checked = form.productIds.includes(product.id);
                const pinned = form.pinnedProductIds.includes(product.id);
                return (
                  <label key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setForm((current) => {
                            const productIds = event.target.checked
                              ? [...current.productIds, product.id]
                              : current.productIds.filter((id) => id !== product.id);
                            const pinnedProductIds = event.target.checked
                              ? current.pinnedProductIds
                              : current.pinnedProductIds.filter((id) => id !== product.id);
                            return { ...current, productIds, pinnedProductIds };
                          });
                        }}
                      />
                      <span>{product.name}</span>
                    </span>
                    {checked ? (
                      <button
                        type="button"
                        className="text-xs text-textMuted underline"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            pinnedProductIds: pinned
                              ? current.pinnedProductIds.filter((id) => id !== product.id)
                              : [...current.pinnedProductIds, product.id],
                          }))
                        }
                      >
                        {pinned ? "Unpin" : "Pin"}
                      </button>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(participationCampaign)}
        onClose={() => setParticipationCampaign(null)}
        title={`Participation — ${participationCampaign?.title ?? ""}`}
      >
        {participationLoading && !participation ? (
          <p className="text-sm text-textMuted">Loading…</p>
        ) : participation ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(
                [
                  ["Vendors invited", participation.vendorsNotified],
                  ["Of eligible", participation.eligibleVendors],
                  ["Vendors submitted", participation.vendorsSubmitted],
                  ["Products nominated", participation.productsNominated],
                  ["Approved", participation.productsApproved],
                  ["Rejected", participation.productsRejected],
                  ["Awaiting review", participation.productsPending],
                  [
                    "Yet to respond",
                    // Invited but silent: the number an admin actually chases.
                    Math.max(0, participation.vendorsNotified - participation.vendorsSubmitted),
                  ],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-line bg-surfaceMuted/50 p-3">
                  <p className="text-xs text-textMuted">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-textStrong">{value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-textMuted">
              {participation.vendorsNotifiedAt
                ? `Invitations sent ${formatDate(participation.vendorsNotifiedAt)}.`
                : "No invitations have been sent for this campaign yet."}
            </p>

            {participationCampaign && (
              <Button
                variant="secondary"
                leftIcon={<Users className="size-4" />}
                isLoading={participationLoading}
                onClick={() =>
                  void handleNotifyVendors(
                    participationCampaign,
                    Boolean(participation.vendorsNotifiedAt),
                  )
                }
              >
                {participation.vendorsNotifiedAt ? "Re-send invitations" : "Invite all vendors"}
              </Button>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive campaign?"
        description={
          deleteTarget
            ? `${deleteTarget.title} will stop appearing in the shopper app.`
            : "This campaign will stop appearing in the shopper app."
        }
        confirmLabel="Archive"
        confirmVariant="danger"
        isLoading={actionLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleArchive()}
      />
    </div>
  );
}
