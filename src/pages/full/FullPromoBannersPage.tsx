import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deletePromoBanner, getPromoBannersPage } from "@/api/promoBannersApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { PromoBanner } from "@/types";
import { describePromoPlacement } from "@/utils/promoBannerStudio";
import { formatDate } from "@/utils/format";

export function FullPromoBannersPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const {
    items: banners,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getPromoBannersPage,
    getId: (banner) => banner.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<PromoBanner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const haystack = [
        banner.title,
        banner.subtitle,
        banner.ctaLabel,
        banner.destinationLabel,
        banner.placement,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : banner.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [banners, query, statusFilter]);

  async function handleArchive() {
    if (!token || !deleteTarget) return;
    setActionLoading(true);
    try {
      await deletePromoBanner(token, deleteTarget.id);
      replaceItem({ ...deleteTarget, status: "disabled" });
      showToast({
        title: "Promo banner archived",
        description: `${deleteTarget.title} has been hidden from the app.`,
        tone: "success",
      });
      setDeleteTarget(null);
    } catch (archiveError) {
      showToast({
        title: "Unable to archive banner",
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
        eyebrow="Promo banners"
        title="Campaign banners"
        description="Home and deals banners with shopper-friendly destinations — no technical links needed."
        backRoute="/promo-banners"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={() => navigate("/promo-banners/full/new")}
          >
            Create in studio
          </Button>
        }
      />

      <SectionCard
        title="Banner library"
        description="Lower carousel order appears first. Each banner can send shoppers to a different screen when tapped."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search banners"
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
              key: "banner",
              header: "Banner",
              render: (banner) => (
                <div className="flex items-center gap-4">
                  <div className="size-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[11px] text-textMuted">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{banner.title}</p>
                    {banner.subtitle ? (
                      <p className="mt-1 text-xs text-textMuted">{banner.subtitle}</p>
                    ) : null}
                  </div>
                </div>
              ),
            },
            {
              key: "placement",
              header: "Shows on",
              render: (banner) => (
                <div className="text-sm">
                  <p>{describePromoPlacement(banner.placement)}</p>
                  <p className="mt-1 text-xs text-textMuted">Order {banner.sortOrder}</p>
                </div>
              ),
            },
            {
              key: "destination",
              header: "Tap opens",
              render: (banner) => (
                <div className="text-sm">
                  <p>{banner.destinationLabel ?? banner.ctaLabel}</p>
                  <p className="mt-1 text-xs text-textMuted">Button: {banner.ctaLabel}</p>
                </div>
              ),
            },
            {
              key: "schedule",
              header: "Schedule",
              render: (banner) => (
                <div className="text-sm">
                  <p>{banner.startsAt ? formatDate(banner.startsAt) : "Live now"}</p>
                  <p className="mt-1 text-xs text-textMuted">
                    {banner.endsAt ? `Until ${formatDate(banner.endsAt)}` : "No end date"}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (banner) => <StatusBadge status={banner.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              render: (banner) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    leftIcon={<Edit3 className="size-4" />}
                    onClick={() => navigate(`/promo-banners/full/${banner.id}/studio`)}
                  >
                    Open studio
                  </Button>
                  <Button
                    variant="danger"
                    leftIcon={<Trash2 className="size-4" />}
                    onClick={() => setDeleteTarget(banner)}
                  >
                    Archive
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredBanners}
          keyExtractor={(banner) => banner.id}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={() => void loadMore()}
          onRetry={() => void refresh()}
          emptyTitle="No promo banners found"
          emptyDescription="Create a banner in the studio or broaden the current filters."
        />
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive promo banner?"
        description="This banner will be hidden from the mobile app."
        confirmLabel="Archive"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={() => void handleArchive()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
