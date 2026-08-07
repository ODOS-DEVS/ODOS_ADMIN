import {
  ArrowLeft,
  ImagePlus,
  Plus,
  RefreshCw,
  Store,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createMarket, deleteMarket, getMarketsPage, updateMarket } from "@/api/marketsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { AdminFullHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import {
  MarketNameCell,
  MarketsDirectorySkeleton,
  MarketTableActions,
} from "@/components/markets/MarketsDirectoryUi";
import { UserSectionNav } from "@/components/users/UsersUi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { ListToolbar, ListToolbarField } from "@/components/ui/ListToolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { TABLE_ACTIONS_COLUMN_CLASS_NARROW } from "@/components/ui/IconButton";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { Market } from "@/types";
import {
  buildMarketDirectorySnapshot,
  filterMarketsByTab,
  type MarketDirectoryTab,
} from "@/utils/marketMetrics";
import { formatPaginationRange } from "@/utils/paginationUi";

type MarketFormValues = {
  name: string;
  imageFile: File | null;
  status: Market["status"];
};

const initialMarketForm: MarketFormValues = {
  name: "",
  imageFile: null,
  status: "active",
};

const MARKET_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "disabled", label: "Disabled" },
] as const;

const TOOLBAR_CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm shadow-sm";

export function FullMarketsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: markets,
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
    loadPage: getMarketsPage,
    getId: (market) => market.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<MarketDirectoryTab>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [marketForm, setMarketForm] = useState<MarketFormValues>(initialMarketForm);
  const [deleteTarget, setDeleteTarget] = useState<Market | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const snapshot = useMemo(() => buildMarketDirectorySnapshot(markets), [markets]);

  const filteredMarkets = useMemo(() => {
    const tabbed = filterMarketsByTab(markets, activeTab);
    return tabbed.filter((market) => {
      const haystack = market.name.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : market.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [activeTab, markets, query, statusFilter]);

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredMarkets.length })}${
    hasMore ? " · more pages available" : ""
  }`;

  const activeTabLabel = MARKET_TABS.find((tab) => tab.id === activeTab)?.label ?? "All";

  function resetEditorState() {
    setMarketForm(initialMarketForm);
    setEditingMarket(null);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  function openCreateModal() {
    resetEditorState();
    setIsEditorOpen(true);
  }

  function openEditModal(market: Market) {
    setEditingMarket(market);
    setMarketForm({
      name: market.name,
      imageFile: null,
      status: market.status,
    });
    setPreviewUrl(market.imageUrl ?? market.image ?? null);
    setIsEditorOpen(true);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMarketForm((current) => ({ ...current, imageFile: file }));
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : editingMarket?.imageUrl ?? editingMarket?.image ?? null);
    event.target.value = "";
  }

  async function handleSave() {
    if (!token) return;
    setActionLoading(true);
    try {
      if (editingMarket) {
        const updated = await updateMarket(token, editingMarket.id, marketForm);
        replaceItem(updated);
        showToast({
          title: "Market updated",
          description: `${updated.name} has been updated.`,
          tone: "success",
        });
      } else {
        const created = await createMarket(token, marketForm);
        setItems((current) => [created, ...current]);
        showToast({
          title: "Market created",
          description: `${created.name} is now available in ODOS admin.`,
          tone: "success",
        });
      }
      setIsEditorOpen(false);
      resetEditorState();
    } catch (saveError) {
      showToast({
        title: "Unable to save market",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!token || !deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteMarket(token, deleteTarget.id);
      replaceItem({ ...deleteTarget, status: "disabled" });
      showToast({
        title: "Market disabled",
        description: `${deleteTarget.name} has been disabled.`,
        tone: "success",
      });
      setDeleteTarget(null);
    } catch (deleteError) {
      showToast({
        title: "Unable to disable market",
        description: deleteError instanceof Error ? deleteError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading && markets.length === 0) {
    return <MarketsDirectorySkeleton />;
  }

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Markets"
        title="Market directory"
        description={`${snapshot.total} on this page · ${snapshot.active} active · create or edit markets and tie stores to them.`}
        backRoute="/markets"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <HeaderActionButton leftIcon={<Plus className="size-4" />} onClick={openCreateModal}>
            Create market
          </HeaderActionButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Markets"
          value={String(snapshot.total)}
          hint="On this page"
          icon={Store}
          animationDelay={40}
        />
        <StatCard
          label="Active"
          value={String(snapshot.active)}
          hint="Discoverable"
          icon={Store}
          tone="success"
          animationDelay={80}
        />
        <StatCard
          label="Disabled"
          value={String(snapshot.disabled)}
          hint="Hidden from browse"
          icon={Warehouse}
          tone="warning"
          animationDelay={120}
        />
      </div>

      <UserSectionNav
        sections={MARKET_TABS.map((tab) => ({
          id: tab.id,
          label: `${tab.label} (${filterMarketsByTab(markets, tab.id).length})`,
        }))}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as MarketDirectoryTab)}
      />

      <SectionCard
        compact
        title={`${activeTabLabel} markets`}
        description="Search, filter, and manage shopper-facing market artwork."
        action={
          <ListToolbar>
            <ListToolbarField className="sm:min-w-[16rem]">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search markets"
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
                  { label: "Disabled", value: "disabled" },
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
              key: "market",
              header: "Market",
              className: "min-w-[220px]",
              render: (market) => <MarketNameCell market={market} />,
            },
            {
              key: "status",
              header: "Status",
              className: "w-[7.5rem]",
              render: (market) => <StatusBadge status={market.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              className: TABLE_ACTIONS_COLUMN_CLASS_NARROW,
              render: (market) => (
                <MarketTableActions
                  market={market}
                  onEdit={() => openEditModal(market)}
                  onDisable={() => setDeleteTarget(market)}
                />
              ),
            },
          ]}
          data={filteredMarkets}
          keyExtractor={(market) => market.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={isLoadingPage}
          hasMore={hasMore}
          error={error}
          onPageChange={goToPage}
          onRetry={() => void refresh()}
          emptyTitle="No markets found"
          emptyDescription="Try another tab or create a new ODOS market."
        />
      </SectionCard>

      <Modal
        open={isEditorOpen}
        onClose={() => {
          if (!actionLoading) {
            setIsEditorOpen(false);
            resetEditorState();
          }
        }}
        title={editingMarket ? `Edit ${editingMarket.name}` : "Create market"}
        description="Shopper-facing name, status, and optional market artwork."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="min-h-10 w-full sm:min-w-[8.5rem] sm:w-auto"
              onClick={() => {
                setIsEditorOpen(false);
                resetEditorState();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="min-h-10 w-full sm:min-w-[10.5rem] sm:w-auto"
              onClick={() => void handleSave()}
              isLoading={actionLoading}
              disabled={!marketForm.name.trim()}
            >
              {editingMarket ? "Save changes" : "Create market"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Market name</label>
            <input
              className="app-input"
              value={marketForm.name}
              onChange={(event) =>
                setMarketForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Status</label>
            <select
              className="app-select"
              value={marketForm.status}
              onChange={(event) =>
                setMarketForm((current) => ({
                  ...current,
                  status: event.target.value as Market["status"],
                }))
              }
            >
              <option value="active" className="bg-panel">
                Active
              </option>
              <option value="disabled" className="bg-panel">
                Disabled
              </option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Market artwork</label>
            <div className="rounded-2xl border border-dashed border-line bg-surfaceMuted p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex h-32 w-44 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Market preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="px-4 text-center text-xs text-textMuted">Image preview</div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-accentSoft file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/15"
                  />
                  <p className="mt-3 text-xs text-textMuted">
                    Upload the image shoppers see when browsing this market.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surfaceMuted p-5 md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <ImagePlus className="size-4 text-accent" />
              <p className="text-sm font-semibold text-textStrong">Market preview</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="h-28 w-36 overflow-hidden rounded-xl bg-surfaceMuted">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-textMuted">
                    No image yet
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-textStrong">
                  {marketForm.name.trim() || "Market name"}
                </p>
                <p className="mt-2 text-sm text-textMuted">Live artwork on the ODOS browse experience.</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Status: {marketForm.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Disable market"
        description={
          deleteTarget
            ? `Disable ${deleteTarget.name}. Stores linked to it can still be reassigned later.`
            : ""
        }
        confirmLabel="Disable market"
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
