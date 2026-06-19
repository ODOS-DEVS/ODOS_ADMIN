import { Eye, PauseCircle, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getVendorsPage, updateVendorStatus } from "@/api/vendorsApi";
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
import type { Vendor } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

function VendorDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm text-textStrong">{value}</p>
    </div>
  );
}

export function FullVendorsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: vendors,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getVendorsPage,
    getId: (vendor) => vendor.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [statusTarget, setStatusTarget] = useState<Vendor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
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
  }, [query, statusFilter, vendors]);

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

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Vendors"
        title="Complete vendor directory"
        description="Every vendor account with performance metrics and moderation controls."
        backRoute="/vendors"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
      />

      <SectionCard
        title="Approved vendors"
        description="Search by business or contact information, then inspect each vendor’s operating health."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search business, email, phone"
              className="sm:w-80"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
              ]}
            />
          </div>
        }
      >
        <AdminInfiniteList
          columns={[
              {
                key: "vendor",
                header: "Vendor",
                render: (vendor) => (
                  <div>
                    <p className="font-medium">{vendor.businessName}</p>
                    <p className="mt-1 text-xs text-textMuted">{vendor.businessCategory}</p>
                  </div>
                ),
              },
              {
                key: "contact",
                header: "Contact",
                render: (vendor) => (
                  <div>
                    <p>{vendor.email}</p>
                    <p className="mt-1 text-xs text-textMuted">{vendor.phoneNumber}</p>
                  </div>
                ),
              },
              {
                key: "performance",
                header: "Performance",
                render: (vendor) => (
                  <div className="space-y-1 text-xs text-textMuted">
                    <p>{vendor.totalStores} store(s)</p>
                    <p>{vendor.totalProducts} product(s)</p>
                    <p>{vendor.totalOrders} order(s)</p>
                  </div>
                ),
              },
              {
                key: "sales",
                header: "Sales",
                render: (vendor) => formatCurrency(vendor.totalSales),
              },
              {
                key: "status",
                header: "Status",
                render: (vendor) => <StatusBadge status={vendor.status} />,
              },
              {
                key: "actions",
                header: "Actions",
                render: (vendor) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/vendors/full/${vendor.id}`)}
                    >
                      Open dossier
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => setSelectedVendor(vendor)}
                    >
                      View
                    </Button>
                    <Button
                      variant={vendor.status === "active" ? "danger" : "primary"}
                      leftIcon={
                        vendor.status === "active" ? (
                          <PauseCircle className="size-4" />
                        ) : (
                          <PlayCircle className="size-4" />
                        )
                      }
                      onClick={() => setStatusTarget(vendor)}
                    >
                      {vendor.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                ),
              },
            ]}
          data={filteredVendors}
          keyExtractor={(vendor) => vendor.id}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={() => void loadMore()}
          onRetry={() => void refresh()}
          emptyTitle="No vendors found"
          emptyDescription="Adjust the current filters to surface more vendor accounts."
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedVendor)}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor?.businessName ?? "Vendor details"}
        description="Overview of vendor profile, sales summary, and operating state."
      >
        {selectedVendor ? (
          <div className="grid gap-4 md:grid-cols-2">
            <VendorDetailRow label="Business category" value={selectedVendor.businessCategory} />
            <VendorDetailRow label="Status" value={selectedVendor.status} />
            <VendorDetailRow label="Email" value={selectedVendor.email} />
            <VendorDetailRow label="Phone" value={selectedVendor.phoneNumber ?? "Not provided"} />
            <VendorDetailRow label="Stores" value={selectedVendor.totalStores.toString()} />
            <VendorDetailRow label="Products" value={selectedVendor.totalProducts.toString()} />
            <VendorDetailRow label="Orders" value={selectedVendor.totalOrders.toString()} />
            <VendorDetailRow label="Total sales" value={formatCurrency(selectedVendor.totalSales)} />
            <VendorDetailRow label="Joined" value={formatDate(selectedVendor.joinedAt)} />
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
