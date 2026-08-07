import { CheckCircle2, PauseCircle, Plus, Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteCategory, getCategoriesPage, updateCategory } from "@/api/categoriesApi";
import { AdminFullHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import {
  CategoryNameCell,
  CategoryTableActions,
  CategoriesDirectorySkeleton,
} from "@/components/categories/CategoriesDirectoryUi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { TABLE_ACTIONS_COLUMN_CLASS_WIDE } from "@/components/ui/IconButton";
import { ListToolbar, ListToolbarField } from "@/components/ui/ListToolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { Category } from "@/types";
import { formatDate } from "@/utils/format";
import { formatPaginationRange } from "@/utils/paginationUi";

const TOOLBAR_CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm shadow-sm";

type CategoryDeleteIntent = {
  category: Category;
  mode: "disable" | "permanent";
};

export function FullCategoriesPage() {
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const {
    items: categories,
    isLoading,
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
    removeItem,
  } = useInfiniteAdminList({
    loadPage: getCategoriesPage,
    getId: (category) => category.id,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteIntent, setDeleteIntent] = useState<CategoryDeleteIntent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusTargetId, setStatusTargetId] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const haystack = [category.name, category.slug, category.description, ...(category.subcategories ?? [])]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : category.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [categories, query, statusFilter]);

  const snapshot = useMemo(() => {
    const active = categories.filter((category) => category.status === "active").length;
    const disabled = categories.filter((category) => category.status === "disabled").length;
    return { total: categories.length, active, disabled };
  }, [categories]);

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredCategories.length })}${
    hasMore ? " · more pages available" : ""
  }`;

  async function handleDelete() {
    if (!token || !deleteIntent) return;
    setActionLoading(true);
    try {
      await deleteCategory(token, deleteIntent.category.id, {
        permanent: deleteIntent.mode === "permanent",
      });
      if (deleteIntent.mode === "permanent") {
        removeItem(deleteIntent.category.id);
      } else {
        replaceItem({ ...deleteIntent.category, status: "disabled" });
      }
      showToast({
        title: deleteIntent.mode === "permanent" ? "Category deleted" : "Category disabled",
        description:
          deleteIntent.mode === "permanent"
            ? `${deleteIntent.category.name} has been removed.`
            : `${deleteIntent.category.name} is disabled.`,
        tone: "success",
      });
      setDeleteIntent(null);
    } catch (deleteError) {
      showToast({
        title:
          deleteIntent.mode === "permanent"
            ? "Unable to delete category"
            : "Unable to disable category",
        description: deleteError instanceof Error ? deleteError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRestore(category: Category) {
    if (!token) return;
    setStatusTargetId(category.id);
    try {
      const updated = await updateCategory(token, category.id, {
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageFile: null,
        subcategories: category.subcategories ?? [],
        status: "active",
      });
      replaceItem(updated);
      showToast({
        title: "Category enabled",
        description: `${updated.name} is active again.`,
        tone: "success",
      });
    } catch (restoreError) {
      showToast({
        title: "Unable to enable category",
        description: restoreError instanceof Error ? restoreError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setStatusTargetId(null);
    }
  }

  if (isLoading && categories.length === 0) {
    return <CategoriesDirectorySkeleton />;
  }

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Categories"
        title="Category list"
        description={`${snapshot.total} loaded · ${snapshot.active} active · edit name, image, subcategories, and status.`}
        backRoute="/categories"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <HeaderActionButton
            leftIcon={<Plus className="size-4" />}
            onClick={() => navigate("/categories/full/new")}
          >
            Add category
          </HeaderActionButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="On this page" value={String(snapshot.total)} icon={Tags} animationDelay={40} />
        <StatCard
          label="Active"
          value={String(snapshot.active)}
          hint={`${snapshot.disabled} disabled`}
          icon={CheckCircle2}
          tone="success"
          animationDelay={80}
        />
        <StatCard
          label="Disabled"
          value={String(snapshot.disabled)}
          icon={PauseCircle}
          animationDelay={120}
        />
      </div>

      <SectionCard
        compact
        title="All categories"
        action={
          <ListToolbar>
            <ListToolbarField className="sm:min-w-[16rem]">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, slug, or subcategory"
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
              key: "category",
              header: "Category",
              className: "min-w-[220px]",
              render: (category) => <CategoryNameCell category={category} />,
            },
            {
              key: "subcategories",
              header: "Subcategories",
              className: "min-w-[180px] max-w-[320px]",
              render: (category) => (
                <p className="line-clamp-2 text-sm text-textMuted">
                  {(category.subcategories ?? []).join(", ") || "—"}
                </p>
              ),
            },
            {
              key: "status",
              header: "Status",
              className: "w-[7.5rem]",
              render: (category) => <StatusBadge status={category.status} />,
            },
            {
              key: "created",
              header: "Created",
              className: "w-[7.5rem] whitespace-nowrap text-sm text-textMuted",
              render: (category) => formatDate(category.createdAt),
            },
            {
              key: "actions",
              header: "Actions",
              className: TABLE_ACTIONS_COLUMN_CLASS_WIDE,
              render: (category) => (
                <CategoryTableActions
                  category={category}
                  isBusy={statusTargetId === category.id}
                  onEdit={() => navigate(`/categories/full/${category.id}/studio`)}
                  onDisable={() => setDeleteIntent({ category, mode: "disable" })}
                  onEnable={() => void handleRestore(category)}
                  onDeletePermanently={() => setDeleteIntent({ category, mode: "permanent" })}
                />
              ),
            },
          ]}
          data={filteredCategories}
          keyExtractor={(category) => category.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={isLoadingPage}
          hasMore={hasMore}
          error={error}
          onPageChange={goToPage}
          onRetry={() => void refresh()}
          emptyTitle="No categories found"
          emptyDescription="Clear filters or add a category."
        />
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deleteIntent)}
        onClose={() => setDeleteIntent(null)}
        onConfirm={() => void handleDelete()}
        title={deleteIntent?.mode === "permanent" ? "Delete category permanently?" : "Disable category?"}
        description={
          deleteIntent
            ? deleteIntent.mode === "permanent"
              ? `Remove ${deleteIntent.category.name} from the admin list. Products keep their data; you would need to recreate the category to use it again.`
              : `Disable ${deleteIntent.category.name}. You can turn it back on later.`
            : ""
        }
        confirmLabel={deleteIntent?.mode === "permanent" ? "Delete permanently" : "Disable"}
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
