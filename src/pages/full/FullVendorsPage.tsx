import {
  ArrowRight,
  CircleDollarSign,
  Package,
  Store,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ADMIN_PAGE_SIZE } from "@/api/adminPagination";
import { getVendors, updateVendorStatus } from "@/api/vendorsApi";
import { DirectoryPage } from "@/components/directory/DirectoryPage";
import type { DirectoryColumn } from "@/components/directory/DirectoryTable";
import { SegmentedTabs } from "@/components/directory/SegmentedTabs";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { MetricBar } from "@/components/analytics/AnalyticsUi";
import {
  VendorDetailRow,
  VendorMark,
  VendorPerformanceGrid,
  VendorTableActions,
} from "@/components/vendors/VendorsDirectoryUi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { TABLE_ACTIONS_COLUMN_CLASS } from "@/components/ui/IconButton";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVendors = useCallback(
    async (background = false) => {
      if (!token) return;
      if (background) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        setVendors(await getVendors(token));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load vendors.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
  } = useQueueSearchParams({
    statusValues: ["active", "suspended"],
  });
  const [activeTab, setActiveTab] = useState<VendorDirectoryTab>("all");
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [statusTarget, setStatusTarget] = useState<Vendor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Computed over the FULL vendor list (fetched once above), not just the
  // rows currently on screen — otherwise counts undercount past one page.
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

  useEffect(() => {
    setPage(1);
  }, [activeTab, query, statusFilter]);

  const pageSize = ADMIN_PAGE_SIZE;
  const pagedVendors = useMemo(
    () => filteredVendors.slice((page - 1) * pageSize, page * pageSize),
    [filteredVendors, page, pageSize],
  );
  const hasMore = page * pageSize < filteredVendors.length;

  async function handleStatusUpdate(nextStatus: Vendor["status"]) {
    if (!token || !statusTarget) return;
    setActionLoading(true);
    try {
      const updated = await updateVendorStatus(token, statusTarget.id, nextStatus);
      setVendors((current) =>
        current.map((vendor) => (vendor.id === updated.id ? updated : vendor)),
      );
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

  const listSummary = formatPaginationRange({ page, pageSize, itemCount: filteredVendors.length });

  const activeTabLabel = DIRECTORY_TABS.find((tab) => tab.id === activeTab)?.label ?? "All";

  const columns = useMemo<Array<DirectoryColumn<Vendor>>>(
    () => [
      {
        key: "vendor",
        header: "Vendor",
        sortable: true,
        className: "min-w-[14rem]",
        render: (vendor) => (
          <div className="flex min-w-0 items-center gap-3">
            <VendorMark name={vendor.businessName} />
            <div className="min-w-0">
              <p className="truncate font-medium text-textStrong">{vendor.businessName}</p>
              <p className="truncate text-xs text-textMuted">{vendor.businessCategory}</p>
            </div>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Contact",
        className: "min-w-[12rem] max-w-[16rem]",
        render: (vendor) => (
          <div className="min-w-0">
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
        className: "min-w-[15rem]",
        render: (vendor) => <VendorPerformanceGrid vendor={vendor} />,
      },
      {
        key: "sales",
        header: "Sales",
        sortable: true,
        className: "min-w-[7rem] whitespace-nowrap",
        render: (vendor) => (
          <div>
            <p className="font-semibold tabular-nums text-textStrong">
              {formatCurrency(vendor.totalSales)}
            </p>
            <p className="mt-0.5 text-[11px] text-textSubtle">Lifetime GMV</p>
          </div>
        ),
      },
      {
        key: "joined",
        header: "Joined",
        sortable: true,
        className: "w-[8rem] whitespace-nowrap text-sm text-textMuted",
        render: (vendor) => formatDate(vendor.joinedAt),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[8rem]",
        render: (vendor) => (
          <StatePill label={labelForStatus(vendor.status)} tone={toneForStatus(vendor.status)} />
        ),
      },
      {
        key: "actions",
        header: "Action",
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
    ],
    [navigate],
  );

  return (
    <DirectoryPage
      eyebrow="Vendors"
      title="Complete vendor directory"
      description="Every vendor on ODOS, with catalogue size, lifetime sales and account standing."
      backRoute="/vendors"
      onRefresh={() => void loadVendors(true)}
      refreshing={isRefreshing}
      metrics={[
        {
          label: "Vendors",
          value: snapshot.totalVendors.toLocaleString(),
          icon: Store,
          caption: `${snapshot.totalStores} stores`,
        },
        {
          label: "Active",
          value: snapshot.active.toLocaleString(),
          icon: UserCheck,
          tone: "success",
          caption: `${snapshot.suspended} suspended`,
        },
        {
          label: "Products",
          value: snapshot.totalProducts.toLocaleString(),
          icon: Package,
          caption: "Listed across all stores",
        },
        {
          label: "Lifetime sales",
          value: formatCurrency(snapshot.totalSales),
          icon: CircleDollarSign,
          tone: "info",
          caption: `${snapshot.totalOrders} orders`,
        },
      ]}
      search={
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Business, email or phone"
          className="h-10 py-0"
        />
      }
      filters={
        <FilterSelect
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
          ]}
          className="h-10"
        />
      }
      tabs={
        <SegmentedTabs
          ariaLabel="Filter vendors"
          tabs={DIRECTORY_TABS.map((tab) => ({
            value: tab.id,
            label: tab.label,
            count: filterVendorsByTab(vendors, tab.id).length,
          }))}
          value={activeTab}
          onChange={(value) => setActiveTab(value as VendorDirectoryTab)}
        />
      }
      cardTitle={`${activeTabLabel} vendors`}
      count={filteredVendors.length}
      listSummary={listSummary}
      columns={columns}
      data={pagedVendors}
      keyExtractor={(vendor) => vendor.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => void loadVendors()}
      emptyTitle="No vendors found"
      emptyDescription="Try another tab, search term, or status filter."
      pagination={{
        page,
        pageSize,
        onPageChange: setPage,
        hasMore,
        loadedLabel: `per page · ${filteredVendors.length} matching`,
      }}
    >
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
                <StatePill label={labelForStatus(selectedVendor.status)} tone={toneForStatus(selectedVendor.status)} />
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
    </DirectoryPage>
  );
}
