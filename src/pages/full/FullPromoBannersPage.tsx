import { CheckCircle2, Edit3, Images, PauseCircle, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deletePromoBanner, getPromoBannersPage } from "@/api/promoBannersApi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { DirectoryPage } from "@/components/directory/DirectoryPage";
import type { DirectoryColumn } from "@/components/directory/DirectoryTable";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import {
  TABLE_ACTIONS_COLUMN_CLASS,
  TableActionBar,
  TableActionBarItem,
  TableActionsCell,
} from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
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
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
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

  const columns = useMemo<Array<DirectoryColumn<PromoBanner>>>(
    () => [
      {
        key: "banner",
        header: "Banner",
        sortable: true,
        className: "min-w-[16rem]",
        render: (banner) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-line bg-surfaceMuted">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] text-textMuted">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-textStrong">{banner.title}</p>
              {banner.subtitle ? (
                <p className="truncate text-xs text-textMuted">{banner.subtitle}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: "placement",
        header: "Shows on",
        sortable: true,
        className: "min-w-[10rem]",
        render: (banner) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-textStrong">
              {describePromoPlacement(banner.placement)}
            </p>
            <p className="text-xs text-textMuted">Order {banner.sortOrder}</p>
          </div>
        ),
      },
      {
        key: "destination",
        header: "Tap opens",
        className: "min-w-[10rem]",
        render: (banner) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-textStrong">
              {banner.destinationLabel ?? banner.ctaLabel}
            </p>
            <p className="truncate text-xs text-textMuted">Button: {banner.ctaLabel}</p>
          </div>
        ),
      },
      {
        key: "schedule",
        header: "Schedule",
        className: "min-w-[9rem] whitespace-nowrap",
        render: (banner) => (
          <div>
            <p className="text-sm text-textStrong">
              {banner.startsAt ? formatDate(banner.startsAt) : "Live now"}
            </p>
            <p className="text-xs text-textMuted">
              {banner.endsAt ? `Until ${formatDate(banner.endsAt)}` : "No end date"}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[8rem]",
        render: (banner) => (
          <StatePill label={labelForStatus(banner.status)} tone={toneForStatus(banner.status)} />
        ),
      },
      {
        key: "actions",
        header: "Action",
        className: TABLE_ACTIONS_COLUMN_CLASS,
        render: (banner) => (
          <TableActionsCell>
            <TableActionBar>
              <TableActionBarItem
                label="Open studio"
                onClick={() => navigate(`/promo-banners/full/${banner.id}/studio`)}
              >
                <Edit3 className="size-4 shrink-0" strokeWidth={2} />
              </TableActionBarItem>
              <TableActionBarItem label="Archive banner" onClick={() => setDeleteTarget(banner)}>
                <Trash2 className="size-4 shrink-0" strokeWidth={2} />
              </TableActionBarItem>
            </TableActionBar>
          </TableActionsCell>
        ),
      },
    ],
    [navigate],
  );

  return (
    <DirectoryPage
      eyebrow="Promo banners"
      title="Campaign banners"
      description="Home and deals artwork, where each banner sends shoppers, and when it runs."
      backRoute="/promo-banners"
      onRefresh={() => void refresh()}
      refreshing={isLoading}
      headerActions={
        <Button leftIcon={<Plus className="size-4" />} onClick={() => navigate("/promo-banners/full/new")}>
          Create in studio
        </Button>
      }
      metrics={[
        { label: "Banners", value: banners.length.toLocaleString(), icon: Images, caption: "Loaded on this page" },
        { label: "Active", value: banners.filter((banner) => banner.status === "active").length.toLocaleString(), icon: CheckCircle2, tone: "success", caption: "Showing in the app" },
        { label: "Disabled", value: banners.filter((banner) => banner.status !== "active").length.toLocaleString(), icon: PauseCircle, tone: "warning", caption: "Hidden from shoppers" },
      ]}
      search={
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search banners"
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
            { label: "Disabled", value: "disabled" },
          ]}
          className="h-10"
        />
      }
      cardTitle="Banner library"
      count={filteredBanners.length}
      listSummary="Lower carousel order appears first."
      columns={columns}
      data={filteredBanners}
      keyExtractor={(banner) => banner.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refresh()}
      emptyTitle="No promo banners found"
      emptyDescription="Create a banner in the studio or broaden the filters."
      pagination={{ page, pageSize, onPageChange: goToPage, hasMore, isLoadingPage, loadedLabel: `per page · ${banners.length} loaded` }}
    >
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
    </DirectoryPage>
  );
}
