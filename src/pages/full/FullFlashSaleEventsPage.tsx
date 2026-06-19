import { Edit3, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createFlashSaleEvent,
  deleteFlashSaleEvent,
  getFlashSaleEventsPage,
  updateFlashSaleEvent,
} from "@/api/flashSaleEventsApi";
import { getProducts } from "@/api/productsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { FlashSaleEvent, Product } from "@/types";
import { formatDate } from "@/utils/format";

type FlashSaleEventFormValues = {
  slug: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  status: FlashSaleEvent["status"];
  startsAt: string;
  endsAt: string;
  productIds: string[];
};

const initialForm: FlashSaleEventFormValues = {
  slug: "",
  title: "",
  subtitle: "",
  sortOrder: 1,
  status: "active",
  startsAt: "",
  endsAt: "",
  productIds: [],
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

function eventWindowLabel(event: FlashSaleEvent) {
  const start = event.startsAt ? formatDate(event.startsAt) : "Live now";
  return `${start} → ${formatDate(event.endsAt)}`;
}

export function FullFlashSaleEventsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const {
    items: events,
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
    loadPage: getFlashSaleEventsPage,
    getId: (event) => event.id,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productQuery, setProductQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FlashSaleEvent | null>(null);
  const [eventForm, setEventForm] = useState<FlashSaleEventFormValues>(initialForm);
  const [deleteTarget, setDeleteTarget] = useState<FlashSaleEvent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!token) return;
    try {
      const nextProducts = await getProducts(token);
      setProducts(nextProducts.filter((item) => item.status === "active"));
    } catch {
      // picker data is optional; list errors surface via useInfiniteAdminList
    }
  }, [token]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesQuery =
        !query.trim() ||
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.slug.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [events, query, statusFilter]);

  const filteredProducts = useMemo(() => {
    const normalized = productQuery.trim().toLowerCase();
    if (!normalized) return products.slice(0, 40);
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(normalized) ||
          product.id.toLowerCase().includes(normalized) ||
          product.category.toLowerCase().includes(normalized),
      )
      .slice(0, 40);
  }, [productQuery, products]);

  function resetEditorState() {
    setEventForm(initialForm);
    setEditingEvent(null);
    setProductQuery("");
  }

  function openCreateModal() {
    resetEditorState();
    setIsEditorOpen(true);
  }

  function openEditModal(event: FlashSaleEvent) {
    setEditingEvent(event);
    setEventForm({
      slug: event.slug,
      title: event.title,
      subtitle: event.subtitle ?? "",
      sortOrder: event.sortOrder,
      status: event.status,
      startsAt: toDateTimeLocal(event.startsAt),
      endsAt: toDateTimeLocal(event.endsAt),
      productIds: event.productIds,
    });
    setProductQuery("");
    setIsEditorOpen(true);
  }

  function toggleProductSelection(productId: string) {
    setEventForm((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    }));
  }

  async function handleSave() {
    if (!token) return;
    if (!eventForm.title.trim() || !eventForm.endsAt.trim()) {
      showToast({
        title: "Missing details",
        description: "Add a title and end time before saving.",
        tone: "error",
      });
      return;
    }

    const slug = slugify(eventForm.slug || eventForm.title);
    if (!slug) {
      showToast({
        title: "Slug required",
        description: "Add a valid event slug before saving.",
        tone: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        slug,
        title: eventForm.title.trim(),
        subtitle: eventForm.subtitle.trim() || null,
        sortOrder: eventForm.sortOrder,
        status: eventForm.status,
        startsAt: toIsoString(eventForm.startsAt),
        endsAt: toIsoString(eventForm.endsAt) ?? new Date().toISOString(),
        productIds: eventForm.productIds,
      };

      if (editingEvent) {
        const updated = await updateFlashSaleEvent(token, editingEvent.id, payload);
        replaceItem(updated);
        showToast({
          title: "Flash sale event updated",
          description: `${updated.title} is live in the mobile app.`,
          tone: "success",
        });
      } else {
        const created = await createFlashSaleEvent(token, payload);
        setItems((current) => [created, ...current]);
        showToast({
          title: "Flash sale event created",
          description: `${created.title} is ready for the mobile app.`,
          tone: "success",
        });
      }

      setIsEditorOpen(false);
      resetEditorState();
    } catch (saveError) {
      showToast({
        title: "Unable to save event",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
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
      await deleteFlashSaleEvent(token, deleteTarget.id);
      replaceItem({ ...deleteTarget, status: "disabled" });
      showToast({
        title: "Flash sale event archived",
        description: `${deleteTarget.title} has been hidden from the app.`,
        tone: "success",
      });
      setDeleteTarget(null);
    } catch (archiveError) {
      showToast({
        title: "Unable to archive event",
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
        eyebrow="Flash sale events"
        title="Complete flash sale calendar"
        description="Every flash event, product roster, and schedule."
        backRoute="/flash-sale-events"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreateModal}>
            Create event
          </Button>
        }
      />

      <SectionCard
        title="Event library"
        description="Lower sort order values appear first. Products only surface while the event window is live."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events"
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
        <AdminInfiniteList
            columns={[
              {
                key: "event",
                header: "Event",
                render: (event) => (
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="mt-1 text-xs text-textMuted">{event.slug}</p>
                    {event.subtitle ? (
                      <p className="mt-1 text-xs text-textMuted">{event.subtitle}</p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "window",
                header: "Window",
                render: (event) => eventWindowLabel(event),
              },
              {
                key: "products",
                header: "Products",
                render: (event) =>
                  `${event.productIds.length} item${event.productIds.length === 1 ? "" : "s"}`,
              },
              {
                key: "order",
                header: "Order",
                render: (event) => event.sortOrder,
              },
              {
                key: "status",
                header: "Status",
                render: (event) => <StatusBadge status={event.status} />,
              },
              {
                key: "actions",
                header: "Actions",
                render: (event) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Edit3 className="size-4" />}
                      onClick={() => openEditModal(event)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => setDeleteTarget(event)}
                    >
                      Archive
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredEvents}
            keyExtractor={(event) => event.id}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={() => void loadMore()}
            onRetry={() => void refresh()}
            emptyTitle="No flash sale events found"
            emptyDescription="Create an event or adjust the filters."
          />
      </SectionCard>

      <Modal
        open={isEditorOpen}
        title={editingEvent ? "Edit flash sale event" : "Create flash sale event"}
        description="Event timing and products are served to the mobile app through the catalog API."
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
              {editingEvent ? "Save changes" : "Create event"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Title</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={eventForm.title}
              onChange={(event) =>
                setEventForm((current) => ({
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
              value={eventForm.slug}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, slug: slugify(event.target.value) }))
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Subtitle</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={eventForm.subtitle}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, subtitle: event.target.value }))
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Starts at</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={eventForm.startsAt}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, startsAt: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Ends at</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={eventForm.endsAt}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, endsAt: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Sort order</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={eventForm.sortOrder}
                onChange={(event) =>
                  setEventForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Status</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={eventForm.status}
                onChange={(event) =>
                  setEventForm((current) => ({
                    ...current,
                    status: event.target.value as FlashSaleEvent["status"],
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-textMuted">Products</p>
                <p className="text-xs text-textMuted">
                  {eventForm.productIds.length} selected for this event
                </p>
              </div>
              <SearchInput
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Search products"
                className="sm:w-72"
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-white/10 p-3">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-textMuted">No active products match this search.</p>
              ) : (
                filteredProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]"
                  >
                    <input
                      type="checkbox"
                      checked={eventForm.productIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                    <span>
                      <span className="block font-medium text-textStrong">{product.name}</span>
                      <span className="block text-xs text-textMuted">
                        {product.id} · {product.category}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive flash sale event?"
        description="This event will stop appearing in the mobile app."
        confirmLabel="Archive"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={() => void handleArchive()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
