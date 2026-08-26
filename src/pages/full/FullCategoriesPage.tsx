import { CheckCircle2, PauseCircle, Plus, Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteCategory, getCategoriesPage, updateCategory } from "@/api/categoriesApi";
import { HeaderActionButton } from "@/components/admin/AdminShell";
import { DirectoryPage } from "@/components/directory/DirectoryPage";
import type { DirectoryColumn } from "@/components/directory/DirectoryTable";
import { StatePill } from "@/components/directory/StatePill";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import {
  CategoryNameCell,
  CategoryTableActions,
  CategoriesDirectorySkeleton,
} from "@/components/categories/CategoriesDirectoryUi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { TABLE_ACTIONS_COLUMN_CLASS_WIDE } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
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

  const columns = useMemo<Array<DirectoryColumn<Category>>>(
    () => [
      {
        key: "category",
        header: "Category",
        sortable: true,
        className: "min-w-[14rem]",
        render: (category) => <CategoryNameCell category={category} />,
      },
      {
        key: "subcategories",
        header: "Subcategories",
        className: "min-w-[14rem] max-w-[22rem]",
        render: (category) => (
          <p className="line-clamp-2 text-sm text-textMuted">
            {(category.subcategories ?? []).join(", ") || "—"}
          </p>
        ),
      },
      {
        key: "created",
        header: "Created",
        sortable: true,
        className: "w-[8rem] whitespace-nowrap text-sm text-textMuted",
        render: (category) => formatDate(category.createdAt),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[8rem]",
        render: (category) => (
          <StatePill
            label={labelForStatus(category.status)}
            tone={toneForStatus(category.status)}
          />
        ),
      },
      {
        key: "actions",
        header: "Action",
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
    ],
    [navigate, statusTargetId],
  );

  if (isLoading && categories.length === 0) {
    return <CategoriesDirectorySkeleton />;
  }

  return (
    <DirectoryPage
      eyebrow="Categories"
      title="Category list"
      description="The taxonomy shoppers browse by — names, artwork, subcategories and visibility."
      backRoute="/categories"
      onRefresh={() => void refresh()}
      refreshing={isLoading}
      headerActions={
        <HeaderActionButton
          leftIcon={<Plus className="size-4" />}
          onClick={() => navigate("/categories/full/new")}
        >
          Add category
        </HeaderActionButton>
      }
      metrics={[
        { label: "Categories", value: snapshot.total.toLocaleString(), icon: Tags, caption: "Loaded on this page" },
        { label: "Active", value: snapshot.active.toLocaleString(), icon: CheckCircle2, tone: "success", caption: "Browsable by shoppers" },
        { label: "Disabled", value: snapshot.disabled.toLocaleString(), icon: PauseCircle, tone: "warning", caption: "Hidden from the app" },
      ]}
      search={
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, slug or subcategory"
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
      cardTitle="All categories"
      count={filteredCategories.length}
      listSummary={listSummary}
      columns={columns}
      data={filteredCategories}
      keyExtractor={(category) => category.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refresh()}
      emptyTitle="No categories found"
      emptyDescription="Clear the filters or add a category."
      pagination={{ page, pageSize, onPageChange: goToPage, hasMore, isLoadingPage, loadedLabel: `per page · ${categories.length} loaded` }}
    >
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
    </DirectoryPage>
  );
}
