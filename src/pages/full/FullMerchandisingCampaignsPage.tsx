import { Copy, Edit3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  archiveMerchandisingCampaign,
  createMerchandisingCampaign,
  duplicateMerchandisingCampaign,
  getMerchandisingCampaignsPage,
  updateMerchandisingCampaign,
  type MerchandisingCampaign,
  type MerchandisingCampaignUpsert,
} from "@/api/merchandisingCampaignsApi";
import { getProducts } from "@/api/productsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
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

export function FullMerchandisingCampaignsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const {
    items: campaigns,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
    removeItem,
    setItems,
  } = useInfiniteAdminList({
    loadPage: getMerchandisingCampaignsPage,
    getId: (campaign) => campaign.id,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productQuery, setProductQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MerchandisingCampaign | null>(null);
  const [form, setForm] = useState<CampaignFormValues>(initialForm);
  const [deleteTarget, setDeleteTarget] = useState<MerchandisingCampaign | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
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

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(q) ||
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
      productIds: campaign.productIds,
      pinnedProductIds: campaign.pinnedProductIds,
      categorySlugs: campaign.categorySlugs,
      storeIds: campaign.storeIds,
    });
    setStartsAtLocal(toDateTimeLocal(campaign.startsAt));
    setEndsAtLocal(toDateTimeLocal(campaign.endsAt));
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
        const updated = await updateMerchandisingCampaign(token, editingCampaign.id, payload);
        replaceItem(updated);
        showToast({
          title: "Campaign updated",
          description: `${updated.title} is ready for the shopper app.`,
          tone: "success",
        });
      } else {
        const created = await createMerchandisingCampaign(token, payload);
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
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => void openCreateModal()}>
            Create campaign
          </Button>
        }
      />

      <SectionCard
        title="Campaign library"
        description="Lower display priority appears first. Only active, scheduled, public campaigns surface in the app."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns"
              className="sm:w-80"
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
            />
          </div>
        }
      >
        <AdminInfiniteList
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
              render: (campaign) => <StatusBadge status={campaign.status} />,
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
                  <Button
                    variant="danger"
                    leftIcon={<Trash2 className="size-4" />}
                    onClick={() => setDeleteTarget(campaign)}
                  >
                    Archive
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredCampaigns}
          keyExtractor={(campaign) => campaign.id}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={() => void loadMore()}
          onRetry={() => void refresh()}
          emptyTitle="No campaigns found"
          emptyDescription="Create a campaign or adjust the filters."
        />
      </SectionCard>

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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: slugify(event.target.value) }))
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Subtitle</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={form.subtitle ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, subtitle: event.target.value }))
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Description</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Banner image URL</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={form.bannerImageUrl ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bannerImageUrl: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Thumbnail image URL</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={form.thumbnailImageUrl ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, thumbnailImageUrl: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Status</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={startsAtLocal}
                onChange={(event) => setStartsAtLocal(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Ends at</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
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

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Category slugs (comma-separated)</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={categorySlugsText}
              onChange={(event) => setCategorySlugsText(event.target.value)}
              placeholder="electronics, fashion"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Store IDs (comma-separated)</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
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
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-white/10 p-3">
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
                      <span>{product.title}</span>
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
