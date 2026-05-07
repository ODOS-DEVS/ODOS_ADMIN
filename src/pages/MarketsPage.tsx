import { Edit3, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

import { createMarket, deleteMarket, getMarkets, updateMarket } from "@/api/marketsApi";
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
import type { Market } from "@/types";
import { formatDate } from "@/utils/format";

type MarketFormValues = {
  name: string;
  slug: string;
  image: string;
  imageFile: File | null;
  status: Market["status"];
};

const initialMarketForm: MarketFormValues = {
  name: "",
  slug: "",
  image: "",
  imageFile: null,
  status: "active",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MarketsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [marketForm, setMarketForm] = useState<MarketFormValues>(initialMarketForm);
  const [deleteTarget, setDeleteTarget] = useState<Market | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadMarkets = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMarkets(token);
      setMarkets(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load markets.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadMarkets();
  }, [loadMarkets]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const filteredMarkets = useMemo(() => {
    return markets.filter((market) => {
      const haystack = [market.name, market.slug].join(" ").toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : market.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [markets, query, statusFilter]);

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
      slug: market.slug,
      image: market.image ?? "",
      imageFile: null,
      status: market.status,
    });
    setPreviewUrl(market.imageUrl ?? null);
    setIsEditorOpen(true);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMarketForm((current) => ({ ...current, imageFile: file }));
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : editingMarket?.imageUrl ?? null);
    event.target.value = "";
  }

  async function handleSave() {
    if (!token) return;
    setActionLoading(true);
    try {
      const payload = {
        ...marketForm,
        image: marketForm.image || null,
      };

      if (editingMarket) {
        const updated = await updateMarket(token, editingMarket.id, payload);
        setMarkets((current) => current.map((market) => (market.id === updated.id ? updated : market)));
        showToast({
          title: "Market updated",
          description: `${updated.name} has been updated.`,
          tone: "success",
        });
      } else {
        const created = await createMarket(token, payload);
        setMarkets((current) => [created, ...current]);
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
      setMarkets((current) =>
        current.map((market) =>
          market.id === deleteTarget.id ? { ...market, status: "disabled" } : market,
        ),
      );
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

  if (isLoading) {
    return <LoadingState label="Loading markets..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadMarkets()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Markets"
        title="Market management"
        description="Manage marketplace anchors that stores can be attached to across ODOS."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreateModal}>
            Create market
          </Button>
        }
      />

      <SectionCard
        title="Markets"
        description="Search by name or slug and manage active versus disabled markets."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search markets"
              className="sm:w-80"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Disabled", value: "disabled" },
              ]}
            />
          </div>
        }
      >
        {filteredMarkets.length === 0 ? (
          <EmptyState
            title="No markets found"
            description="Create a new market or broaden the current search."
          />
        ) : (
          <DataTable<Market>
            columns={[
              {
                key: "market",
                header: "Market",
                render: (market) => (
                  <div className="flex items-center gap-4">
                    <div className="size-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                      {market.imageUrl ? (
                        <img src={market.imageUrl} alt={market.name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[11px] text-textMuted">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{market.name}</p>
                      <p className="mt-1 text-xs text-textMuted">{market.slug}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "image",
                header: "Image Key",
                render: (market) => market.image ?? "Not set",
              },
              {
                key: "status",
                header: "Status",
                render: (market) => <StatusBadge status={market.status} />,
              },
              {
                key: "created",
                header: "Created",
                render: (market) => formatDate(market.createdAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (market) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Edit3 className="size-4" />}
                      onClick={() => openEditModal(market)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => setDeleteTarget(market)}
                    >
                      Disable
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredMarkets}
            keyExtractor={(market) => market.id}
          />
        )}
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
        description="Create a market with either a fallback image key, uploaded artwork, or both."
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
            <Button
              onClick={() => void handleSave()}
              isLoading={actionLoading}
              disabled={!marketForm.name.trim() || !marketForm.slug.trim()}
            >
              {editingMarket ? "Save changes" : "Create market"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Market name</label>
            <input
              className="app-input"
              value={marketForm.name}
              onChange={(event) =>
                setMarketForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: editingMarket ? current.slug : slugify(event.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Slug</label>
            <input
              className="app-input"
              value={marketForm.slug}
              onChange={(event) =>
                setMarketForm((current) => ({ ...current, slug: slugify(event.target.value) }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Status</label>
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
              <option value="active" className="bg-panel">Active</option>
              <option value="disabled" className="bg-panel">Disabled</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Fallback image key</label>
            <input
              className="app-input"
              value={marketForm.image}
              onChange={(event) =>
                setMarketForm((current) => ({ ...current, image: event.target.value }))
              }
              placeholder="shoe5, handbag, headset"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Market artwork</label>
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex h-32 w-44 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Market preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="px-4 text-center text-xs text-textMuted">
                      Uploaded market image preview
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-white/15"
                  />
                  <p className="mt-3 text-xs text-textMuted">
                    Upload a market image if you want a custom visual. The image key still works as a fallback.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center gap-2">
              <ImagePlus className="size-4 text-accentSoft" />
              <p className="text-sm font-semibold text-textStrong">Market preview</p>
            </div>
            <div className="flex items-center gap-4 rounded-[24px] bg-[#081220] p-4">
              <div className="h-28 w-36 overflow-hidden rounded-[22px] bg-white/[0.06]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-textMuted">
                    No uploaded image yet
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-textStrong">
                  {marketForm.name.trim() || "Market name"}
                </p>
                <p className="mt-2 text-sm text-textMuted">
                  {marketForm.slug.trim() || "market-slug"}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-accentSoft">
                  Fallback key: {marketForm.image.trim() || "not set"}
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
