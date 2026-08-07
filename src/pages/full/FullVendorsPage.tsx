import {
  ArrowRight,
  CircleDollarSign,
  Package,
  Store,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getVendorsPage, updateVendorStatus } from "@/api/vendorsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import { UserSectionNav } from "@/components/users/UsersUi";
import {
  VendorDetailRow,
  VendorMark,
  VendorPerformanceGrid,
  VendorTableActions,
} from "@/components/vendors/VendorsDirectoryUi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ListToolbar, ListToolbarField } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TABLE_ACTIONS_COLUMN_CLASS } from "@/components/ui/IconButton";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { Vendor } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { formatPaginationRange } from "@/utils/paginationUi";
import {
  buildVendorDirectorySnapshot,
  filterVendorsByTab,
  type VendorDirectoryTab,
} from "@/utils/vendorMetrics";

const DIRECTORY_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
] as const;

const TOOLBAR_CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm shadow-sm";

export function FullVendorsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: vendors,
    isLoading,
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getVendorsPage,
    getId: (vendor) => vendor.id,
  });
  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
  } = useQueueSearchParams({
    statusValues: ["active", "suspended"],
  });
  const [activeTab, setActiveTab] = useState<VendorDirectoryTab>("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [statusTarget, setStatusTarget] = useState<Vendor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const snapshot = useMemo(() => buildVendorDirectorySnapshot(vendors), [vendors]);

  const filteredVendors = useMemo(() => {
    const tabbed = filterVendorsByTab(vendors, activeTab);
    return tabbed.filter((vendor) => {
      const haystack = [
        vendor.businessName,
        vendor.businessCategory,
        vendor.email,
        vendor.phoneNumber,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : vendor.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [activeTab, query, statusFilter, vendors]);

  async function handleStatusUpdate(nextStatus: Vendor["status"]) {
    if (!token || !statusTarget) return;
    setActionLoading(true);
    try {
      const updated = await updateVendorStatus(token, statusTarget.id, nextStatus);
      replaceItem(updated);
      showToast({
        title: nextStatus === "suspended" ? "Vendor suspended" : "Vendor reactivated",
        description: `${statusTarget.businessName} has been updated successfully.`,
        tone: "success",
      });
      setStatusTarget(null);
    } catch (updateError) {
      showToast({
        title: "Unable to update vendor",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredVendors.length })}${
    hasMore ? " · more pages available" : ""
  }`;

  const activeTabLabel = DIRECTORY_TABS.find((tab) => tab.id === activeTab)?.label ?? "All";

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Vendors"
        title="Complete vendor directory"
        description={`${snapshot.totalVendors} on this page · open any dossier for stores, products, payouts, and moderation history.`}
        backRoute="/vendors"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:items-start">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Vendors"
            value={String(snapshot.totalVendors)}
            hint="On this page"
            icon={Store}
            animationDelay={40}
          />
          <StatCard
            label="Active"
            value={String(snapshot.active)}
            hint={`${snapshot.suspended} suspended`}
            icon={UserCheck}
            tone="success"
            animationDelay={80}
          />
          <StatCard
            label="Products"
            value={String(snapshot.totalProducts)}
            hint={`${snapshot.totalStores} stores`}
            icon={Package}
            animationDelay={120}
          />
          <StatCard
            label="Sales"
            value={formatCurrency(snapshot.totalSales)}
            hint={`${snapshot.totalOrders} orders`}
            icon={CircleDollarSign}
            tone="info"
            animationDelay={160}
          />
        </div>

        {snapshot.totalVendors > 0 ? (
          <SectionCard compact title="Status mix" description="Active vs suspended on this page">
            <div className="space-y-4">
              <MetricBar
                label="Active"
                value={snapshot.active}
                max={snapshot.totalVendors}
                displayValue={String(snapshot.active)}
                tone="emerald"
              />
              <MetricBar
                label="Suspended"
                value={snapshot.suspended}
                max={snapshot.totalVendors}
                displayValue={String(snapshot.suspended)}
                tone="amber"
              />
            </div>
          </SectionCard>
        ) : null}
      </div>

      <UserSectionNav
        sections={DIRECTORY_TABS.map((tab) => ({
          id: tab.id,
          label: `${tab.label} (${filterVendorsByTab(vendors, tab.id).length})`,
        }))}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as VendorDirectoryTab)}
      />

      <SectionCard
        compact
        title={`${activeTabLabel} vendors`}
        description="Search and filter the directory, then open a dossier for full context."
        action={
          <ListToolbar>
            <ListToolbarField className="sm:min-w-[16rem]">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search business, email, phone"
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
              key: "vendor",
              header: "Vendor",
              className: "min-w-[220px]",
              render: (vendor) => (
                <div className="flex items-center gap-3">
                  <VendorMark name={vendor.businessName} />
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate font-semibold text-textStrong">{vendor.businessName}</p>
                    <p className="truncate text-xs text-textMuted">{vendor.businessCategory}</p>
                    <p className="text-[11px] text-textSubtle">Joined {formatDate(vendor.joinedAt)}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "contact",
              header: "Contact",
              className: "min-w-[180px]",
              render: (vendor) => (
                <div className="space-y-0.5">
                  <p className="truncate text-sm text-textStrong">{vendor.email}</p>
                  <p className="truncate text-xs text-textMuted">
                    {vendor.phoneNumber ?? "No phone on file"}
                  </p>
                </div>
              ),
            },
            {
              key: "performance",
              header: "Performance",
              className: "min-w-[260px]",
              render: (vendor) => <VendorPerformanceGrid vendor={vendor} />,
            },
            {
              key: "sales",
              header: "Sales",
              className: "min-w-[7rem] whitespace-nowrap",
              render: (vendor) => (
                <div className="space-y-0.5">
                  <p className="text-sm font-bold tabular-nums text-textStrong">
                    {formatCurrency(vendor.totalSales)}
                  </p>
                  <p className="text-[11px] text-textSubtle">Lifetime GMV</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              className: "w-[7.5rem]",
              render: (vendor) => <StatusBadge status={vendor.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              className: TABLE_ACTIONS_COLUMN_CLASS,
              render: (vendor) => (
                <VendorTableActions
                  vendor={vendor}
                  onPreview={() => setSelectedVendor(vendor)}
                  onToggleStatus={() => setStatusTarget(vendor)}
                  onDossier={() => navigate(`/vendors/full/${vendor.id}`)}
                />
              ),
            },
          ]}
          data={filteredVendors}
          keyExtractor={(vendor) => vendor.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={isLoadingPage}
          hasMore={hasMore}
          error={error}
          onPageChange={goToPage}
          onRetry={() => void refresh()}
          emptyTitle="No vendors found"
          emptyDescription="Try another tab, search term, or status filter."
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedVendor)}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor?.businessName ?? "Vendor preview"}
        description="Snapshot before opening the full dossier."
        footer={
          selectedVendor ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                className="min-h-10 w-full sm:min-w-[8.5rem] sm:w-auto"
                onClick={() => setSelectedVendor(null)}
              >
                Close
              </Button>
              <Button
                className="min-h-10 w-full sm:min-w-[10.5rem] sm:w-auto"
                onClick={() => navigate(`/vendors/full/${selectedVendor.id}`)}
              >
                Open dossier
              </Button>
            </div>
          ) : null
        }
      >
        {selectedVendor ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl border border-line bg-surfaceMuted p-4">
              <VendorMark name={selectedVendor.businessName} />
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-textStrong">{selectedVendor.businessName}</p>
                <p className="text-sm text-textMuted">{selectedVendor.businessCategory}</p>
                <StatusBadge status={selectedVendor.status} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <VendorDetailRow label="Email" value={selectedVendor.email} />
              <VendorDetailRow
                label="Phone"
                value={selectedVendor.phoneNumber ?? "Not provided"}
              />
              <VendorDetailRow label="Stores" value={String(selectedVendor.totalStores)} />
              <VendorDetailRow label="Products" value={String(selectedVendor.totalProducts)} />
              <VendorDetailRow label="Orders" value={String(selectedVendor.totalOrders)} />
              <VendorDetailRow
                label="Total sales"
                value={formatCurrency(selectedVendor.totalSales)}
              />
              <VendorDetailRow label="Joined" value={formatDate(selectedVendor.joinedAt)} />
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          void handleStatusUpdate(statusTarget?.status === "active" ? "suspended" : "active")
        }
        title={statusTarget?.status === "active" ? "Suspend vendor" : "Reactivate vendor"}
        description={
          statusTarget?.status === "active"
            ? `Suspend ${statusTarget.businessName} and stop vendor-side access until the case is resolved.`
            : `Reactivate ${statusTarget?.businessName} and restore vendor access.`
        }
        confirmLabel={statusTarget?.status === "active" ? "Suspend vendor" : "Activate vendor"}
        confirmVariant={statusTarget?.status === "active" ? "danger" : "primary"}
        isLoading={actionLoading}
      />
    </div>
  );
}
