import {
  ArrowLeft,
  Mail,
  PauseCircle,
  Phone,
  PlayCircle,
  Plus,
  RefreshCw,
  Store as StoreIcon,
  Warehouse,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { getCategories } from "@/api/categoriesApi";
import { getMarkets } from "@/api/marketsApi";
import {
  createStore,
  getStore,
  getStoresPage,
  updateStoreStatus,
  type CreateStoreInput,
} from "@/api/storesApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { AdminHeaderActions, AdminFullHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import { DetailField, DetailFields, DetailSection, DetailStack } from "@/components/ui/DetailList";
import {
  StoreLocationCell,
  StoreMark,
  StoreMarketBadge,
  StoresDirectorySkeleton,
  StoreTableActions,
} from "@/components/stores/StoresDirectoryUi";
import { TABLE_ACTIONS_COLUMN_CLASS } from "@/components/ui/IconButton";
import { UserSectionNav } from "@/components/users/UsersUi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { ListToolbar, ListToolbarField } from "@/components/ui/ListToolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { AdminStoreDetail, Category, Market, Store, StoreStatus } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";
import { formatPaginationRange } from "@/utils/paginationUi";
import {
  buildStoreDirectorySnapshot,
  filterStoresByTab,
  type StoreDirectoryTab,
} from "@/utils/storeMetrics";

const STORE_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "suspended", label: "Suspended" },
] as const;

const TOOLBAR_CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm shadow-sm";

type StoreFormState = {
  name: string;
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
          : "border-line bg-surfaceMuted text-textMuted hover:border-accent/25 hover:text-textStrong"
      }`}
    >
      {label}
    </button>
  );
}

export function FullStoresPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: stores,
    isLoading,
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
    setItems,
  } = useInfiniteAdminList({
    loadPage: getStoresPage,
    getId: (store) => store.id,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<StoreDirectoryTab>("all");
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

  const loadReferenceData = useCallback(async () => {
    if (!token) return;
    try {
      const [categoryList, marketList] = await Promise.all([
        getCategories(token),
        getMarkets(token),
      ]);
      setCategories(categoryList);
      setMarkets(marketList);
    } catch {
      // reference pickers are optional
    }
  }, [token]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

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

  const snapshot = useMemo(() => buildStoreDirectorySnapshot(stores), [stores]);

  const filteredStores = useMemo(() => {
    const tabbed = filterStoresByTab(stores, activeTab);
    return tabbed.filter((store) => {
      const haystack = [store.name, store.category, store.city, store.region, store.location]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : store.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [activeTab, query, statusFilter, stores]);

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredStores.length })}${
    hasMore ? " · more pages available" : ""
  }`;

  const activeTabLabel = STORE_TABS.find((tab) => tab.id === activeTab)?.label ?? "All";

  const marketLinkedCount = useMemo(
    () => stores.filter((store) => Boolean(store.marketId)).length,
    [stores],
  );

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
      setItems((current) => [created, ...current]);
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
      replaceItem(updated);
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

  if (isLoading && stores.length === 0) {
    return <StoresDirectorySkeleton />;
  }

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Stores"
        title="Store directory"
        description={`${snapshot.total} on this page · ${marketLinkedCount} linked to a market · search, filter, and open a store to edit details or status.`}
        backRoute="/stores"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <HeaderActionButton leftIcon={<Plus className="size-4" />} onClick={() => setIsCreateOpen(true)}>
            Create store
          </HeaderActionButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="On this page"
          value={String(snapshot.total)}
          hint="Loaded storefronts"
          icon={StoreIcon}
          animationDelay={40}
        />
        <StatCard
          label="Live shops"
          value={String(snapshot.active)}
          hint={`${snapshot.draft} in draft`}
          icon={StoreIcon}
          tone="success"
          animationDelay={80}
        />
        <StatCard
          label="Draft"
          value={String(snapshot.draft)}
          hint="Not customer-visible"
          icon={Warehouse}
          animationDelay={120}
        />
        <StatCard
          label="Suspended"
          value={String(snapshot.suspended)}
          hint="Needs review"
          icon={PauseCircle}
          tone="warning"
          animationDelay={160}
        />
      </div>

      <UserSectionNav
        sections={STORE_TABS.map((tab) => ({
          id: tab.id,
          label: `${tab.label} (${filterStoresByTab(stores, tab.id).length})`,
        }))}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as StoreDirectoryTab)}
      />

      <SectionCard
        compact
        title={`${activeTabLabel} stores`}
        description="Search, filter, and open a store dossier for products and vendor context."
        action={
          <ListToolbar>
            <ListToolbarField className="sm:min-w-[16rem]">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search store, city, category"
                className={`${TOOLBAR_CONTROL_CLASS} py-0`}
              />
            </ListToolbarField>
            <ListToolbarField className="sm:min-w-[11rem]">
              <FilterSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[
                  { label: "All statuses", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Draft", value: "draft" },
                  { label: "Suspended", value: "suspended" },
                ]}
                className={`${TOOLBAR_CONTROL_CLASS} outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10`}
              />
            </ListToolbarField>
          </ListToolbar>
        }
        bodyClassName="p-0"
      >
        <AdminInfiniteList
          compact
          listSummary={listSummary}
          columns={[
            {
              key: "store",
              header: "Store",
              className: "min-w-[220px]",
              render: (store) => (
                <div className="flex items-center gap-3">
                  <StoreMark name={store.name} logoUrl={store.logoImage} />
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate font-semibold text-textStrong">{store.name}</p>
                    <p className="truncate text-xs text-textMuted">{store.category}</p>
                    <p className="text-[11px] text-textSubtle">Created {formatDate(store.createdAt)}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "location",
              header: "Location",
              className: "min-w-[140px]",
              render: (store) => <StoreLocationCell store={store} />,
            },
            {
              key: "market",
              header: "Market",
              className: "min-w-[120px]",
              render: (store) => {
                const marketName =
                  markets.find((market) => market.id === store.marketId)?.name ?? "Unassigned";
                return <StoreMarketBadge name={marketName} />;
              },
            },
            {
              key: "status",
              header: "Status",
              className: "w-[7.5rem]",
              render: (store) => <StatusBadge status={store.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              className: TABLE_ACTIONS_COLUMN_CLASS,
              render: (store) => (
                <StoreTableActions
                  store={store}
                  onPreview={() => void handleViewStore(store)}
                  onDossier={() => navigate(`/stores/full/${store.id}`)}
                  onToggleStatus={() => setStatusTarget(store)}
                />
              ),
            },
          ]}
          data={filteredStores}
          keyExtractor={(store) => store.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={isLoadingPage}
          hasMore={hasMore}
          error={error}
          onPageChange={goToPage}
          onRetry={() => void refresh()}
          emptyTitle="No stores found"
          emptyDescription="Try another tab or create a new ODOS storefront."
        />
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
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="min-h-10 w-full sm:min-w-[8.5rem] sm:w-auto"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateState();
              }}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              className="min-h-10 w-full sm:min-w-[10.5rem] sm:w-auto"
              onClick={() => void handleCreateStore()}
              isLoading={createLoading}
            >
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
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="ODOS Fashion Hub"
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
              <StoreIcon className="size-4 text-textMuted" />
              <label className="block text-sm font-medium text-textStrong">Audience focus</label>
            </div>
            <div className="rounded-3xl border border-line bg-surfaceMuted p-4">
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
              className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-surfaceMuted file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-line"
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
              className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-surfaceMuted file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-line"
            />
          </div>

          <div className="md:col-span-2 rounded-panel border border-line bg-surfaceMuted p-5">
            <p className="text-sm font-semibold text-textStrong">Storefront preview</p>
            <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
              <div className="h-40 w-full bg-surfaceMuted">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-textMuted">
                    Banner preview
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="-mt-12 size-20 overflow-hidden rounded-3xl border-4 border-surface bg-surfaceMuted">
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
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-textSubtle">
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
        title={selectedStore?.name ?? selectedStoreSummary?.name ?? "Store preview"}
        description="Snapshot before opening the full dossier."
        size="xl"
        footer={
          selectedStoreSummary ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                className="min-h-10 w-full sm:min-w-[8.5rem] sm:w-auto"
                onClick={() => {
                  setSelectedStoreSummary(null);
                  setSelectedStore(null);
                  setDetailError(null);
                  setIsDetailLoading(false);
                }}
              >
                Close
              </Button>
              <Button
                className="min-h-10 w-full sm:min-w-[10.5rem] sm:w-auto"
                onClick={() => navigate(`/stores/full/${selectedStoreSummary.id}`)}
              >
                Open dossier
              </Button>
            </div>
          ) : null
        }
      >
        {isDetailLoading ? (
          <LoadingState label="Loading store details..." />
        ) : detailError ? (
          <ErrorState
            description={detailError}
            onRetry={() => selectedStoreSummary && void handleViewStore(selectedStoreSummary)}
          />
        ) : selectedStore ? (
          <DetailStack>
            <div className="space-y-5 border-b border-line/90 pb-8">
              <div className="h-36 w-full overflow-hidden rounded-lg bg-surfaceMuted">
                {selectedStore.bannerImage ? (
                  <img
                    src={selectedStore.bannerImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-textMuted">
                    No banner uploaded
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surfaceMuted ring-1 ring-line/80">
                    {selectedStore.logoImage ? (
                      <img
                        src={selectedStore.logoImage}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-textMuted">
                        Logo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-textStrong">{selectedStore.name}</h3>
                      <StatusBadge status={selectedStore.status} />
                    </div>
                    <p className="text-sm text-textMuted">{selectedStore.category}</p>
                    <p className="text-sm text-textMuted">
                      {selectedStore.marketName ?? "No market"}
                      {" · "}
                      {selectedStore.audienceSlugs?.join(", ") ?? "All shoppers"}
                    </p>
                  </div>
                </div>
                <DetailFields columns={3} className="lg:max-w-md">
                  <DetailField emphasize label="Products" value={String(selectedStore.stats.totalProducts)} />
                  <DetailField label="Orders" value={String(selectedStore.stats.totalOrders)} />
                  <DetailField emphasize label="Sales" value={formatCurrency(selectedStore.stats.totalSales)} />
                </DetailFields>
              </div>
            </div>

            <div className="grid gap-10 xl:grid-cols-2">
              <DetailSection title="Store profile">
                <DetailFields columns={2}>
                  <DetailField label="Status" value={selectedStore.status} />
                  <DetailField label="Category" value={selectedStore.category} />
                  <DetailField label="Market" value={selectedStore.marketName ?? "Not assigned"} />
                  <DetailField label="Location" value={selectedStore.location ?? "Not set"} />
                  <DetailField label="City" value={selectedStore.city} />
                  <DetailField label="Region" value={selectedStore.region} />
                  <DetailField
                    label="Audience"
                    value={selectedStore.audienceSlugs?.join(", ") ?? "All shoppers"}
                  />
                  <DetailField label="Created" value={formatDateTime(selectedStore.createdAt)} />
                  <DetailField label="Updated" value={formatDateTime(selectedStore.updatedAt)} />
                  <DetailField
                    label="Description"
                    value={selectedStore.description}
                    className="sm:col-span-2"
                  />
                </DetailFields>
              </DetailSection>

              <DetailSection title="Vendor">
                <DetailFields columns={2}>
                  <DetailField label="Vendor name" value={selectedStore.vendorName ?? "Admin managed"} />
                  <DetailField label="Vendor email" value={selectedStore.vendorEmail ?? "Not linked"} />
                  <DetailField
                    label="Vendor phone"
                    value={selectedStore.vendorPhoneNumber ?? "Not linked"}
                  />
                  <DetailField
                    label="Linked vendor id"
                    value={selectedStore.vendorId ?? "Not linked"}
                  />
                </DetailFields>
              </DetailSection>
            </div>

            <DetailSection title="Product counts">
              <DetailFields columns={2}>
                <DetailField label="Total products" value={String(selectedStore.stats.totalProducts)} />
                <DetailField label="Active products" value={String(selectedStore.stats.activeProducts)} />
                <DetailField label="Pending products" value={String(selectedStore.stats.pendingProducts)} />
                <DetailField label="Hidden products" value={String(selectedStore.stats.hiddenProducts)} />
              </DetailFields>
            </DetailSection>

            <DetailSection title="Products in this store">
              {selectedStore.products.length === 0 ? (
                <EmptyState
                  title="No products yet"
                  description="This store has not received any products yet."
                />
              ) : (
                <ul className="divide-y divide-line/80">
                  {selectedStore.products.map((product) => (
                    <li key={product.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surfaceMuted">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt={product.name} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs text-textMuted">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-textStrong">{product.name}</p>
                            <p className="text-sm text-textMuted">
                              {product.category}
                              {product.subcategory ? ` · ${product.subcategory}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={product.status} />
                            <span className="text-sm font-semibold tabular-nums text-textStrong">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>
                        <DetailFields columns={3} className="mt-2">
                          <DetailField label="Stock" value={String(product.stock)} />
                          <DetailField label="Discount" value={product.discount ?? "—"} />
                          <DetailField label="Updated" value={formatDate(product.updatedAt)} />
                        </DetailFields>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          </DetailStack>
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
