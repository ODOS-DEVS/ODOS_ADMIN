import {
  Eye,
  MapPin,
  Mail,
  PauseCircle,
  Phone,
  PlayCircle,
  Plus,
  Store as StoreIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCategories } from "@/api/categoriesApi";
import { getMarkets } from "@/api/marketsApi";
import {
  createStore,
  getStore,
  getStores,
  updateStoreStatus,
  type CreateStoreInput,
} from "@/api/storesApi";
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
import type { AdminStoreDetail, Category, Market, Store, StoreStatus } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

type StoreFormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  marketId: string;
  location: string;
  region: string;
  city: string;
  audienceSlugs: string[];
  status: StoreStatus;
  logoImageFile: File | null;
  bannerImageFile: File | null;
};

const AUDIENCES = ["ladies", "gents", "kids"];

const DEFAULT_FORM_STATE: StoreFormState = {
  name: "",
  slug: "",
  description: "",
  category: "",
  marketId: "",
  location: "",
  region: "",
  city: "",
  audienceSlugs: [],
  status: "active",
  logoImageFile: null,
  bannerImageFile: null,
};

function StoreDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-textStrong">{title}</h3>
        {description ? <p className="mt-1 text-xs text-textMuted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AudienceChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-accent/40 bg-accent/15 text-textStrong"
          : "border-white/10 bg-white/[0.03] text-textMuted hover:border-white/20 hover:text-textStrong"
      }`}
    >
      {label}
    </button>
  );
}

export function StoresPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStoreSummary, setSelectedStoreSummary] = useState<Store | null>(null);
  const [selectedStore, setSelectedStore] = useState<AdminStoreDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Store | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState<StoreFormState>(DEFAULT_FORM_STATE);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [storeList, categoryList, marketList] = await Promise.all([
        getStores(token),
        getCategories(token),
        getMarkets(token),
      ]);
      setStores(storeList);
      setCategories(categoryList);
      setMarkets(marketList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load stores.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview, logoPreview]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const haystack = [store.name, store.category, store.city, store.region, store.location]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : store.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, stores]);

  const handleViewStore = useCallback(
    async (store: Store) => {
      if (!token) return;
      setSelectedStoreSummary(store);
      setSelectedStore(null);
      setDetailError(null);
      setIsDetailLoading(true);
      try {
        const detail = await getStore(token, store.id);
        setSelectedStore(detail);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load store details.";
        setDetailError(message);
        showToast({
          title: "Unable to load store",
          description: message,
          tone: "error",
        });
      } finally {
        setIsDetailLoading(false);
      }
    },
    [showToast, token],
  );

  function resetCreateState() {
    setForm(DEFAULT_FORM_STATE);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
    }
    setLogoPreview(null);
    setBannerPreview(null);
  }

  function updateForm<K extends keyof StoreFormState>(key: K, value: StoreFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAudience(slug: string) {
    setForm((current) => ({
      ...current,
      audienceSlugs: current.audienceSlugs.includes(slug)
        ? current.audienceSlugs.filter((item) => item !== slug)
        : [...current.audienceSlugs, slug],
    }));
  }

  async function handleCreateStore() {
    if (!token) return;
    if (!form.name.trim() || !form.category.trim() || !form.region.trim() || !form.city.trim()) {
      showToast({
        title: "Missing store details",
        description: "Name, category, region, and city are required.",
        tone: "error",
      });
      return;
    }

    setCreateLoading(true);
    try {
      const payload: CreateStoreInput = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        category: form.category,
        marketId: form.marketId || null,
        location: form.location.trim() || null,
        region: form.region.trim(),
        city: form.city.trim(),
        audienceSlugs: form.audienceSlugs.length ? form.audienceSlugs : null,
        status: form.status,
        logoImageFile: form.logoImageFile,
        bannerImageFile: form.bannerImageFile,
      };
      const created = await createStore(token, payload);
      setStores((current) => [created, ...current]);
      showToast({
        title: "Store created",
        description: `${created.name} is ready for product population on ODOS.`,
        tone: "success",
      });
      setIsCreateOpen(false);
      resetCreateState();
    } catch (createError) {
      showToast({
        title: "Unable to create store",
        description: createError instanceof Error ? createError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleStatusUpdate(nextStatus: StoreStatus) {
    if (!token || !statusTarget) return;
    setActionLoading(true);
    try {
      const updated = await updateStoreStatus(token, statusTarget.id, nextStatus);
      setStores((current) => current.map((store) => (store.id === updated.id ? updated : store)));
      showToast({
        title: nextStatus === "suspended" ? "Store suspended" : "Store updated",
        description: `${statusTarget.name} is now ${nextStatus}.`,
        tone: "success",
      });
      setStatusTarget(null);
    } catch (updateError) {
      showToast({
        title: "Unable to update store",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading stores..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadStores()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stores"
        title="Store management"
        description="Create admin-managed storefronts, assign them to categories and markets, and prepare them to receive products immediately."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => setIsCreateOpen(true)}>
            Create store
          </Button>
        }
      />

      <SectionCard
        title="All stores"
        description="Use filters to focus on active, suspended, or draft storefronts."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search store, city, category"
              className="sm:w-80"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Draft", value: "draft" },
                { label: "Suspended", value: "suspended" },
              ]}
            />
          </div>
        }
      >
        {filteredStores.length === 0 ? (
          <EmptyState
            title="No stores found"
            description="Try broadening the search or create the first ODOS-managed store."
          />
        ) : (
          <DataTable<Store>
            columns={[
              {
                key: "store",
                header: "Store",
                render: (store) => (
                  <div className="flex items-center gap-4">
                    <div className="size-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                      {store.logoImage ? (
                        <img src={store.logoImage} alt={store.name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[11px] text-textMuted">
                          No logo
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="mt-1 text-xs text-textMuted">{store.category}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "location",
                header: "Location",
                render: (store) => (
                  <div>
                    <p>{store.location ?? "Not set"}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {store.city}, {store.region}
                    </p>
                  </div>
                ),
              },
              {
                key: "market",
                header: "Market",
                render: (store) => markets.find((market) => market.id === store.marketId)?.name ?? "Not assigned",
              },
              {
                key: "status",
                header: "Status",
                render: (store) => <StatusBadge status={store.status} />,
              },
              {
                key: "created",
                header: "Created",
                render: (store) => formatDate(store.createdAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (store) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => void handleViewStore(store)}
                    >
                      View
                    </Button>
                    <Button
                      variant={store.status === "suspended" ? "primary" : "danger"}
                      leftIcon={
                        store.status === "suspended" ? (
                          <PlayCircle className="size-4" />
                        ) : (
                          <PauseCircle className="size-4" />
                        )
                      }
                      onClick={() => setStatusTarget(store)}
                    >
                      {store.status === "suspended" ? "Activate" : "Suspend"}
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredStores}
            keyExtractor={(store) => store.id}
          />
        )}
      </SectionCard>

      <Modal
        open={isCreateOpen}
        onClose={() => {
          if (!createLoading) {
            setIsCreateOpen(false);
            resetCreateState();
          }
        }}
        title="Create store"
        description="Set up an ODOS storefront, choose its category, attach a market if needed, and prepare it for product assignment."
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateState();
              }}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleCreateStore()} isLoading={createLoading}>
              Create store
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Store name</label>
            <input
              className="app-input"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: current.slug || slugify(event.target.value),
                }))
              }
              placeholder="ODOS Fashion Hub"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Slug</label>
            <input
              className="app-input"
              value={form.slug}
              onChange={(event) => updateForm("slug", slugify(event.target.value))}
              placeholder="odos-fashion-hub"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Category</label>
            <select
              className="app-select"
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
            >
              <option value="" className="bg-panel">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name} className="bg-panel">
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Market</label>
            <select
              className="app-select"
              value={form.marketId}
              onChange={(event) => updateForm("marketId", event.target.value)}
            >
              <option value="" className="bg-panel">Not assigned</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id} className="bg-panel">
                  {market.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Region</label>
            <input
              className="app-input"
              value={form.region}
              onChange={(event) => updateForm("region", event.target.value)}
              placeholder="Greater Accra"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">City</label>
            <input
              className="app-input"
              value={form.city}
              onChange={(event) => updateForm("city", event.target.value)}
              placeholder="Accra"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Location</label>
            <input
              className="app-input"
              value={form.location}
              onChange={(event) => updateForm("location", event.target.value)}
              placeholder="Makola Market, Block C, Shop 18"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Description</label>
            <textarea
              className="app-textarea min-h-28"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Describe the store vibe, specialty, and what customers should expect."
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <StoreIcon className="size-4 text-accentSoft" />
              <label className="block text-sm font-medium text-textStrong">Audience focus</label>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap gap-3">
                {AUDIENCES.map((audience) => (
                  <AudienceChip
                    key={audience}
                    label={audience}
                    active={form.audienceSlugs.includes(audience)}
                    onClick={() => toggleAudience(audience)}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-textMuted">
                Leave unselected if the store should serve all shoppers.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Status</label>
            <select
              className="app-select"
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value as StoreStatus)}
            >
              <option value="active" className="bg-panel">Active</option>
              <option value="draft" className="bg-panel">Draft</option>
              <option value="suspended" className="bg-panel">Suspended</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Store logo</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                updateForm("logoImageFile", file);
                if (logoPreview) {
                  URL.revokeObjectURL(logoPreview);
                }
                setLogoPreview(file ? URL.createObjectURL(file) : null);
                event.target.value = "";
              }}
              className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-white/15"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Banner image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                updateForm("bannerImageFile", file);
                if (bannerPreview) {
                  URL.revokeObjectURL(bannerPreview);
                }
                setBannerPreview(file ? URL.createObjectURL(file) : null);
                event.target.value = "";
              }}
              className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-white/15"
            />
          </div>

          <div className="md:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-textStrong">Storefront preview</p>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#081220]">
              <div className="h-40 w-full bg-white/[0.05]">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-textMuted">
                    Banner preview
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="-mt-12 size-20 overflow-hidden rounded-[24px] border-4 border-[#081220] bg-white/[0.08]">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[11px] text-textMuted">
                      Logo
                    </div>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-lg font-semibold text-textStrong">
                    {form.name.trim() || "Store name"}
                  </p>
                  <p className="mt-1 text-sm text-textMuted">
                    {form.category || "Category"} {form.city.trim() ? `· ${form.city.trim()}` : ""}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-accentSoft">
                    {(form.audienceSlugs.length ? form.audienceSlugs.join(", ") : "all shoppers").toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedStoreSummary)}
        onClose={() => {
          setSelectedStoreSummary(null);
          setSelectedStore(null);
          setDetailError(null);
          setIsDetailLoading(false);
        }}
        title={selectedStore?.name ?? selectedStoreSummary?.name ?? "Store details"}
        description="Store profile, vendor context, merchandising assets, and linked products."
        size="xl"
      >
        {isDetailLoading ? (
          <LoadingState label="Loading store details..." />
        ) : detailError ? (
          <ErrorState
            description={detailError}
            onRetry={() => selectedStoreSummary && void handleViewStore(selectedStoreSummary)}
          />
        ) : selectedStore ? (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/30">
              <div className="h-64 w-full bg-white/[0.03]">
                {selectedStore.bannerImage ? (
                  <img src={selectedStore.bannerImage} alt={selectedStore.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-textMuted">
                    No banner uploaded
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="-mt-16 size-24 overflow-hidden rounded-[28px] border-4 border-slate-950 bg-white/[0.08] shadow-glow">
                    {selectedStore.logoImage ? (
                      <img src={selectedStore.logoImage} alt={selectedStore.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-textMuted">
                        Logo
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold text-textStrong">{selectedStore.name}</h3>
                      <StatusBadge status={selectedStore.status} />
                    </div>
                    <p className="mt-2 text-sm text-textMuted">
                      {selectedStore.category} · @{selectedStore.slug}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-textMuted">
                        {selectedStore.marketName ?? "No market"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-textMuted">
                        {selectedStore.audienceSlugs?.join(", ") ?? "All shoppers"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StoreDetailRow label="Products" value={String(selectedStore.stats.totalProducts)} />
                  <StoreDetailRow label="Orders" value={String(selectedStore.stats.totalOrders)} />
                  <StoreDetailRow label="Sales" value={formatCurrency(selectedStore.stats.totalSales)} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <DetailSection title="Store profile" description="Core storefront information visible to admin.">
                <div className="grid gap-4 md:grid-cols-2">
                  <StoreDetailRow label="Status" value={selectedStore.status} />
                  <StoreDetailRow label="Category" value={selectedStore.category} />
                  <StoreDetailRow label="Market" value={selectedStore.marketName ?? "Not assigned"} />
                  <StoreDetailRow label="Slug" value={selectedStore.slug} />
                  <StoreDetailRow label="Location" value={selectedStore.location ?? "Not set"} />
                  <StoreDetailRow label="City" value={selectedStore.city} />
                  <StoreDetailRow label="Region" value={selectedStore.region} />
                  <StoreDetailRow
                    label="Audience"
                    value={selectedStore.audienceSlugs?.join(", ") ?? "All shoppers"}
                  />
                  <StoreDetailRow label="Created" value={formatDateTime(selectedStore.createdAt)} />
                  <StoreDetailRow label="Updated" value={formatDateTime(selectedStore.updatedAt)} />
                  <div className="md:col-span-2">
                    <StoreDetailRow label="Description" value={selectedStore.description} />
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Vendor context" description="Who owns or operates this store on ODOS.">
                <div className="grid gap-4 md:grid-cols-2">
                  <StoreDetailRow label="Vendor name" value={selectedStore.vendorName ?? "Admin managed"} />
                  <StoreDetailRow label="Vendor email" value={selectedStore.vendorEmail ?? "Not linked"} />
                  <StoreDetailRow
                    label="Vendor phone"
                    value={selectedStore.vendorPhoneNumber ?? "Not linked"}
                  />
                  <StoreDetailRow
                    label="Linked vendor id"
                    value={selectedStore.vendorId ?? "Not linked"}
                  />
                </div>
              </DetailSection>
            </div>

            <DetailSection title="Merchandising stats" description="A quick look at how stocked and active the store currently is.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StoreDetailRow label="Total products" value={String(selectedStore.stats.totalProducts)} />
                <StoreDetailRow label="Active products" value={String(selectedStore.stats.activeProducts)} />
                <StoreDetailRow label="Pending products" value={String(selectedStore.stats.pendingProducts)} />
                <StoreDetailRow label="Hidden products" value={String(selectedStore.stats.hiddenProducts)} />
              </div>
            </DetailSection>

            <DetailSection title="Products in this store" description="Every product currently linked to this store.">
              {selectedStore.products.length === 0 ? (
                <EmptyState
                  title="No products yet"
                  description="This store has not received any products yet."
                />
              ) : (
                <div className="space-y-4">
                  {selectedStore.products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-3xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-textMuted">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-base font-semibold text-textStrong">{product.name}</p>
                              <p className="mt-1 text-sm text-textMuted">
                                {product.category}
                                {product.subcategory ? ` · ${product.subcategory}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={product.status} />
                              <span className="text-sm font-semibold text-textStrong">
                                {formatCurrency(product.price)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <StoreDetailRow label="Stock" value={String(product.stock)} />
                            <StoreDetailRow
                              label="Discount"
                              value={product.discount ?? "No discount"}
                            />
                            <StoreDetailRow
                              label="Updated"
                              value={formatDate(product.updatedAt)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          void handleStatusUpdate(statusTarget?.status === "suspended" ? "active" : "suspended")
        }
        title={statusTarget?.status === "suspended" ? "Activate store" : "Suspend store"}
        description={
          statusTarget?.status === "suspended"
            ? `Reactivate ${statusTarget.name} and allow it to appear normally in the marketplace.`
            : `Suspend ${statusTarget?.name} while the store is being reviewed or corrected.`
        }
        confirmLabel={statusTarget?.status === "suspended" ? "Activate store" : "Suspend store"}
        confirmVariant={statusTarget?.status === "suspended" ? "primary" : "danger"}
        isLoading={actionLoading}
      />
    </div>
  );
}
