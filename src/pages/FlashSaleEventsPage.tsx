import { Edit3, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createFlashSaleEvent,
  deleteFlashSaleEvent,
  getFlashSaleEvents,
  updateFlashSaleEvent,
} from "@/api/flashSaleEventsApi";
import { getProducts } from "@/api/productsApi";
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
  const start = event.startsAt ? formatDate(event.startsAt) : "Now";
  return `${start} → ${formatDate(event.endsAt)}`;
}

export function FlashSaleEventsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState<FlashSaleEvent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productQuery, setProductQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FlashSaleEvent | null>(null);
  const [eventForm, setEventForm] = useState<FlashSaleEventFormValues>(initialForm);
  const [deleteTarget, setDeleteTarget] = useState<FlashSaleEvent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextEvents, nextProducts] = await Promise.all([
        getFlashSaleEvents(token),
        getProducts(token),
      ]);
      setEvents(nextEvents);
      setProducts(nextProducts.filter((item) => item.status === "active"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load flash sale events.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

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

  const openCreateModal = () => {
    setEditingEvent(null);
    setEventForm(initialForm);
    setProductQuery("");
    setIsEditorOpen(true);
  };

  const openEditModal = (event: FlashSaleEvent) => {
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
  };

  const toggleProductSelection = (productId: string) => {
    setEventForm((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    }));
  };

  const handleSave = async () => {
    if (!token) return;
    if (!eventForm.title.trim() || !eventForm.endsAt.trim()) {
      showToast("Title and end time are required.", "error");
      return;
    }

    const slug = slugify(eventForm.slug || eventForm.title);
    if (!slug) {
      showToast("Event slug is required.", "error");
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
        await updateFlashSaleEvent(token, editingEvent.id, payload);
        showToast("Flash sale event updated.", "success");
      } else {
        await createFlashSaleEvent(token, payload);
        showToast("Flash sale event created.", "success");
      }

      setIsEditorOpen(false);
      await loadEvents();
    } catch (saveError) {
      showToast(
        saveError instanceof Error ? saveError.message : "Unable to save flash sale event.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteFlashSaleEvent(token, deleteTarget.id);
      showToast("Flash sale event archived.", "success");
      setDeleteTarget(null);
      await loadEvents();
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : "Unable to archive flash sale event.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading flash sale events..." />;
  }

  if (error) {
    return <ErrorState title="Flash sale events unavailable" message={error} onRetry={() => void loadEvents()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flash Sale Events"
        description="Schedule timed flash sales with real countdowns on the ODOS home feed and product pages."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        }
      />

      <SectionCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput value={query} onChange={setQuery} placeholder="Search events..." />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Disabled", value: "disabled" },
            ]}
          />
        </div>

        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No flash sale events yet"
            description="Create a timed event, attach products, and shoppers will see a live countdown in the app."
            action={
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Create event
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={[
              { key: "title", header: "Event" },
              { key: "window", header: "Window" },
              { key: "products", header: "Products" },
              { key: "status", header: "Status" },
              { key: "actions", header: "Actions", className: "text-right" },
            ]}
            rows={filteredEvents.map((event) => ({
              id: event.id,
              title: (
                <div>
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-500">{event.slug}</p>
                </div>
              ),
              window: eventWindowLabel(event),
              products: `${event.productIds.length} item${event.productIds.length === 1 ? "" : "s"}`,
              status: <StatusBadge status={event.status} />,
              actions: (
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(event)}>
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(event)}>
                    <Trash2 className="h-4 w-4" />
                    Archive
                  </Button>
                </div>
              ),
            }))}
          />
        )}
      </SectionCard>

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingEvent ? "Edit flash sale event" : "Create flash sale event"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={actionLoading}>
              {actionLoading ? "Saving..." : editingEvent ? "Save changes" : "Create event"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
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

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Slug</span>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={eventForm.slug}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, slug: slugify(event.target.value) }))
              }
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Subtitle</span>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={eventForm.subtitle}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, subtitle: event.target.value }))
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Starts at</span>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={eventForm.startsAt}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, startsAt: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Ends at</span>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={eventForm.endsAt}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, endsAt: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Sort order</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={eventForm.sortOrder}
                onChange={(event) =>
                  setEventForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Products</p>
                <p className="text-sm text-slate-500">
                  {eventForm.productIds.length} selected for this event
                </p>
              </div>
              <SearchInput
                value={productQuery}
                onChange={setProductQuery}
                placeholder="Search products..."
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-slate-500">No active products match this search.</p>
              ) : (
                filteredProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={eventForm.productIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                    <span>
                      <span className="block font-medium text-slate-900">{product.name}</span>
                      <span className="block text-sm text-slate-500">
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
        isOpen={Boolean(deleteTarget)}
        title="Archive flash sale event?"
        description="The event will stop appearing in the app. You can recreate it later if needed."
        confirmLabel="Archive event"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
        isLoading={actionLoading}
      />
    </div>
  );
}
