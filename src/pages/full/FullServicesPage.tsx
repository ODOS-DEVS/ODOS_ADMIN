import { BadgeCheck, CheckCircle2, Clock, Inbox, Layers, Plus, ShieldAlert, Trash2, Wrench, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PROVIDER_VERIFICATIONS,
  SERVICE_LISTING_STATUSES,
  createServiceCategory,
  deactivateServiceCategory,
  getServiceBookingsPage,
  getServiceCategories,
  getServiceListingsPage,
  getServicesOverview,
  setProviderVerification,
  setServiceListingStatus,
  updateServiceCategory,
  type ProviderVerification,
  type ServiceBooking,
  type ServiceCategory,
  type ServiceListing,
  type ServiceListingStatus,
  type ServicesOverview,
} from "@/api/adminServicesApi";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { DirectorySection } from "@/components/directory/DirectorySection";
import { MetricStat } from "@/components/directory/MetricStat";
import { SegmentedTabs } from "@/components/directory/SegmentedTabs";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { StatePill } from "@/components/directory/StatePill";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { usePaginatedAdminList } from "@/hooks/usePaginatedAdminList";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate } from "@/utils/format";

type PageView = "listings" | "categories" | "bookings";

const EMPTY_CATEGORY = {
  slug: "",
  title: "",
  subtitle: "",
  icon: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
};

/** Only `rejected` demands a reason — the API refuses it without one. */
const NEEDS_REASON: ServiceListingStatus = "rejected";

export function FullServicesPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();

  const [view, setView] = useState<PageView>("listings");
  const [overview, setOverview] = useState<ServicesOverview | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({ ...EMPTY_CATEGORY });
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deactivating, setDeactivating] = useState<ServiceCategory | null>(null);

  const [moderating, setModerating] = useState<ServiceListing | null>(null);
  const [moderationStatus, setModerationStatus] = useState<ServiceListingStatus>("active");
  const [moderationReason, setModerationReason] = useState("");
  const [savingModeration, setSavingModeration] = useState(false);

  const listings = usePaginatedAdminList<ServiceListing>({
    loadPage: getServiceListingsPage,
    getId: (row) => row.id,
    enabled: view === "listings",
    // Refetches from the server when the status filter changes, rather than filtering a page
    // the operator may only have part of.
    resetKey: statusFilter,
  });

  const bookings = usePaginatedAdminList<ServiceBooking>({
    loadPage: getServiceBookingsPage,
    getId: (row) => row.id,
    enabled: view === "bookings",
  });

  const loadOverview = useCallback(async () => {
    if (!token) return;
    try {
      setOverview(await getServicesOverview(token));
    } catch {
      // The KPI strip is context, not the point of the page — a failure here hides it rather
      // than blocking moderation.
      setOverview(null);
    }
  }, [token]);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      setCategories(await getServiceCategories(token));
    } catch (error) {
      setCategoriesError(error instanceof Error ? error.message : "We couldn't load service categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOverview();
    void loadCategories();
  }, [loadOverview, loadCategories]);

  const parents = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const categoryTitle = useCallback(
    (id?: string | null) => (id ? (categories.find((c) => c.id === id)?.title ?? id) : "—"),
    [categories],
  );

  const visibleListings = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return listings.items.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!needle) return true;
      return row.title.toLowerCase().includes(needle) || row.slug.toLowerCase().includes(needle);
    });
  }, [listings.items, statusFilter, search]);

  async function handleModerate() {
    if (!token || !moderating) return;
    if (moderationStatus === NEEDS_REASON && !moderationReason.trim()) {
      showToast({
        title: "Reason required",
        description: "Give a reason so the provider knows what to fix.",
        tone: "error",
      });
      return;
    }

    setSavingModeration(true);
    try {
      const updated = await setServiceListingStatus(token, moderating.id, moderationStatus, moderationReason);
      listings.replaceItem(updated);
      showToast({ title: `Listing ${labelForStatus(updated.status).toLowerCase()}`, tone: "success" });
      setModerating(null);
      setModerationReason("");
      void loadOverview();
    } catch (error) {
      showToast({
        title: "Couldn't update the listing",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    } finally {
      setSavingModeration(false);
    }
  }

  async function handleVerify(listing: ServiceListing, verification: ProviderVerification) {
    if (!token) return;
    try {
      await setProviderVerification(token, listing.storeId, verification);
      showToast({ title: `Provider marked ${verification}`, tone: "success" });
      void loadOverview();
    } catch (error) {
      showToast({
        title: "Couldn't change verification",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    }
  }

  async function handleSaveCategory() {
    if (!token) return;
    if (!categoryForm.title.trim() || !categoryForm.slug.trim()) {
      showToast({ title: "Slug and title are required", tone: "error" });
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        slug: categoryForm.slug.trim(),
        title: categoryForm.title.trim(),
        subtitle: categoryForm.subtitle.trim() || null,
        icon: categoryForm.icon.trim() || null,
        parentId: categoryForm.parentId || null,
        sortOrder: Number(categoryForm.sortOrder) || 0,
        isActive: categoryForm.isActive,
      };
      if (editingCategory) await updateServiceCategory(token, editingCategory.id, payload);
      else await createServiceCategory(token, payload);

      showToast({ title: editingCategory ? "Category updated" : "Category created", tone: "success" });
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ ...EMPTY_CATEGORY });
      void loadCategories();
    } catch (error) {
      showToast({
        title: "Couldn't save the category",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeactivate() {
    if (!token || !deactivating) return;
    try {
      await deactivateServiceCategory(token, deactivating.id);
      showToast({
        title: "Category deactivated",
        description: "Existing listings keep their category; it just stops being offered.",
        tone: "success",
      });
      void loadCategories();
    } catch (error) {
      showToast({
        title: "Couldn't deactivate",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    } finally {
      setDeactivating(null);
    }
  }

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Marketplace"
        title="Services"
        description="Moderate service listings, manage the taxonomy, verify providers and watch bookings."
        backRoute="/dashboard"
        onRefresh={() => {
          void loadOverview();
          void loadCategories();
          listings.refresh();
          bookings.refresh();
        }}
      />

      {overview && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricStat
            label="Pending review"
            value={String(overview.listingsPendingReview)}
            icon={Clock}
            tone={overview.listingsPendingReview > 0 ? "warning" : "default"}
            caption={`${overview.listingsLive} live`}
          />
          <MetricStat
            label="Providers"
            value={String(overview.providers)}
            icon={BadgeCheck}
            caption={`${overview.providersAwaitingVerification} awaiting verification`}
          />
          <MetricStat
            label="Open disputes"
            value={String(overview.openDisputes)}
            icon={ShieldAlert}
            tone={overview.openDisputes > 0 ? "danger" : "default"}
            caption={`${overview.bookingsAwaitingRelease} awaiting release`}
          />
          <MetricStat
            label="Held in escrow"
            value={formatCurrency(overview.amountHeldInEscrow)}
            icon={Layers}
            caption={`${formatCurrency(overview.commissionInWindow)} commission / ${overview.windowDays}d`}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedTabs
          ariaLabel="Services view"
          value={view}
          onChange={setView}
          tabs={[
            { value: "listings", label: "Listings" },
            { value: "categories", label: "Categories" },
            { value: "bookings", label: "Bookings" },
          ]}
        />

        {view === "listings" && (
          <>
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search listings"
              aria-label="Search service listings"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter listings by status"
              options={[
                { value: "all", label: "All statuses" },
                ...SERVICE_LISTING_STATUSES.map((s) => ({ value: s, label: labelForStatus(s) })),
              ]}
            />
          </>
        )}

        {view === "categories" && (
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ ...EMPTY_CATEGORY });
              setCategoryModalOpen(true);
            }}
          >
            New category
          </Button>
        )}
      </div>

      {view === "listings" && (
        <DirectorySection<ServiceListing>
          cardTitle="Service listings"
          count={visibleListings.length}
          listSummary={`${visibleListings.length} of ${listings.items.length} loaded`}
          isLoading={listings.isLoading}
          error={listings.error}
          onRetry={listings.refresh}
          emptyTitle="No service listings"
          emptyDescription="Listings appear here once providers publish them."
          keyExtractor={(row) => row.id}
          data={visibleListings}
          columns={[
            {
              key: "title",
              header: "Service",
              render: (row) => (
                <div className="min-w-0">
                  <p className="truncate font-medium text-textStrong">{row.title}</p>
                  <p className="truncate text-[12.5px] text-textMuted">
                    {categoryTitle(row.categoryId)} · {row.slug}
                  </p>
                </div>
              ),
            },
            {
              key: "price",
              header: "Price",
              render: (row) =>
                row.pricingModel === "quote"
                  ? "On request"
                  : `${formatCurrency(row.basePrice)}${row.pricingModel === "hourly" ? "/hr" : ""}`,
            },
            {
              key: "bookings",
              header: "Bookings",
              render: (row) => (
                <span className="tabular-nums">
                  {row.bookingCount}
                  {row.reviewCount > 0 && row.rating ? ` · ${row.rating.toFixed(1)}★` : ""}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatePill tone={toneForStatus(row.status)} label={labelForStatus(row.status)} />,
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (row) => (
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setModerating(row);
                      // Default to the useful action: approve what is waiting, otherwise leave as-is.
                      setModerationStatus(row.status === "pending_review" ? "active" : (row.status as ServiceListingStatus));
                      setModerationReason("");
                    }}
                  >
                    Moderate
                  </Button>
                  <Button variant="ghost" onClick={() => void handleVerify(row, "verified")}>
                    <BadgeCheck className="size-4" />
                    <span className="sr-only">Verify provider for {row.title}</span>
                  </Button>
                </div>
              ),
            },
          ]}
          pagination={{
            page: listings.page,
            pageSize: listings.pageSize,
            onPageChange: listings.goToPage,
            hasMore: listings.hasMore,
            isLoadingPage: listings.isLoadingPage,
            loadedLabel: `${listings.items.length} listings loaded`,
          }}
        />
      )}

      {view === "categories" && (
        <DirectorySection<ServiceCategory>
          cardTitle="Service categories"
          count={categories.length}
          listSummary={`${parents.length} top-level, ${categories.length - parents.length} sub`}
          isLoading={categoriesLoading}
          error={categoriesError}
          onRetry={() => void loadCategories()}
          emptyTitle="No service categories"
          emptyDescription="Providers cannot categorise a listing until at least one exists."
          keyExtractor={(row) => row.id}
          data={categories}
          columns={[
            {
              key: "title",
              header: "Category",
              render: (row) => (
                <div className="min-w-0">
                  <p className="truncate font-medium text-textStrong">
                    {row.parentId ? `↳ ${row.title}` : row.title}
                  </p>
                  <p className="truncate text-[12.5px] text-textMuted">{row.subtitle || row.slug}</p>
                </div>
              ),
            },
            { key: "parent", header: "Parent", render: (row) => categoryTitle(row.parentId) },
            { key: "order", header: "Order", render: (row) => <span className="tabular-nums">{row.sortOrder}</span> },
            {
              key: "active",
              header: "State",
              render: (row) => (
                <StatePill tone={row.isActive ? "success" : "neutral"} label={row.isActive ? "Active" : "Hidden"} />
              ),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (row) => (
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingCategory(row);
                      setCategoryForm({
                        slug: row.slug,
                        title: row.title,
                        subtitle: row.subtitle ?? "",
                        icon: row.icon ?? "",
                        parentId: row.parentId ?? "",
                        sortOrder: row.sortOrder,
                        isActive: row.isActive,
                      });
                      setCategoryModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  {row.isActive && (
                    <Button variant="ghost" onClick={() => setDeactivating(row)}>
                      <Trash2 className="size-4" />
                      <span className="sr-only">Deactivate {row.title}</span>
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {view === "bookings" && (
        <DirectorySection<ServiceBooking>
          cardTitle="Service bookings"
          count={bookings.items.length}
          isLoading={bookings.isLoading}
          error={bookings.error}
          onRetry={bookings.refresh}
          emptyTitle="No bookings yet"
          emptyDescription="Service bookings appear here as customers make them."
          keyExtractor={(row) => row.id}
          data={bookings.items}
          columns={[
            {
              key: "number",
              header: "Booking",
              render: (row) => <span className="font-medium text-textStrong">{row.bookingNumber}</span>,
            },
            {
              key: "when",
              header: "Scheduled",
              render: (row) => (row.scheduledStartAt ? formatDate(row.scheduledStartAt) : "Not scheduled"),
            },
            {
              key: "amount",
              header: "Total",
              render: (row) => (
                <span className="tabular-nums">
                  {formatCurrency(row.totalAmount)}
                  {row.amountPaid > 0 && row.amountPaid < row.totalAmount
                    ? ` (${formatCurrency(row.amountPaid)} paid)`
                    : ""}
                </span>
              ),
            },
            { key: "payment", header: "Payment", render: (row) => labelForStatus(row.paymentStatus) },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatePill tone={toneForStatus(row.status)} label={labelForStatus(row.status)} />,
            },
          ]}
          pagination={{
            page: bookings.page,
            pageSize: bookings.pageSize,
            onPageChange: bookings.goToPage,
            hasMore: bookings.hasMore,
            isLoadingPage: bookings.isLoadingPage,
            loadedLabel: `${bookings.items.length} bookings loaded`,
          }}
        />
      )}

      <Modal
        open={moderating !== null}
        onClose={() => setModerating(null)}
        title={moderating ? `Moderate "${moderating.title}"` : "Moderate listing"}
        description="Approving puts the listing in the public catalogue. Rejecting sends the reason back to the provider."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModerating(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleModerate()} disabled={savingModeration}>
              {savingModeration ? "Saving…" : "Apply"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-textStrong">New status</span>
            <FilterSelect
              value={moderationStatus}
              onChange={(event) => setModerationStatus(event.target.value as ServiceListingStatus)}
              className="w-full"
              options={SERVICE_LISTING_STATUSES.map((s) => ({ value: s, label: labelForStatus(s) }))}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-textStrong">
              Reason {moderationStatus === NEEDS_REASON ? "(required)" : "(optional)"}
            </span>
            <textarea
              value={moderationReason}
              onChange={(event) => setModerationReason(event.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13.5px] focus:border-accent focus:outline-none"
              placeholder="What the provider needs to change."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {PROVIDER_VERIFICATIONS.map((verification) => (
              <Button
                key={verification}
                variant="secondary"
                onClick={() => moderating && void handleVerify(moderating, verification)}
              >
                Mark provider {verification}
              </Button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? `Edit ${editingCategory.title}` : "New service category"}
        description="Categories are what providers pick from and shoppers browse by."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveCategory()} disabled={savingCategory}>
              {savingCategory ? "Saving…" : editingCategory ? "Save changes" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-textStrong">Title</span>
            <input
              value={categoryForm.title}
              onChange={(event) => setCategoryForm((f) => ({ ...f, title: event.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13.5px] focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-textStrong">Slug</span>
            <input
              value={categoryForm.slug}
              onChange={(event) => setCategoryForm((f) => ({ ...f, slug: event.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13.5px] focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium text-textStrong">Subtitle</span>
            <input
              value={categoryForm.subtitle}
              onChange={(event) => setCategoryForm((f) => ({ ...f, subtitle: event.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13.5px] focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-textStrong">Parent</span>
            <FilterSelect
              value={categoryForm.parentId}
              onChange={(event) => setCategoryForm((f) => ({ ...f, parentId: event.target.value }))}
              className="w-full"
              options={[
                { value: "", label: "Top level" },
                ...parents
                  .filter((p) => p.id !== editingCategory?.id)
                  .map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-textStrong">Sort order</span>
            <input
              value={String(categoryForm.sortOrder)}
              onChange={(event) =>
                setCategoryForm((f) => ({ ...f, sortOrder: Number(event.target.value.replace(/[^0-9]/g, "")) || 0 }))
              }
              inputMode="numeric"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13.5px] focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={deactivating !== null}
        title={`Deactivate "${deactivating?.title}"?`}
        description="It stops being offered to providers and shoppers. Existing listings keep their category, so nothing is orphaned."
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={() => void handleDeactivate()}
        onClose={() => setDeactivating(null)}
      />
    </div>
  );
}
