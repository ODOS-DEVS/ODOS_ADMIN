import { Edit3, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteCategory, getCategoriesPage, updateCategory } from "@/api/categoriesApi";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { Category } from "@/types";
import { formatDate } from "@/utils/format";

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
    isLoadingMore,
    hasMore,
    error,
    loadMore,
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
      const haystack = [category.name, category.description, ...(category.subcategories ?? [])]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : category.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [categories, query, statusFilter]);

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
            ? `${deleteIntent.category.name} has been removed from admin categories.`
            : `${deleteIntent.category.name} has been disabled.`,
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
        description: `${updated.name} is live again.`,
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

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Categories"
        title="Complete category taxonomy"
        description="Manage catalog categories and jump into a full studio screen to craft each category."
        backRoute="/categories"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <Button
            leftIcon={<Sparkles className="size-4" />}
            onClick={() => navigate("/categories/full/new")}
          >
            Create in studio
          </Button>
        }
      />

      <SectionCard
        title="Categories"
        description="Search existing categories, tune status, and open the full studio experience for richer edits."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search category or subcategory"
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
                key: "category",
                header: "Category",
                render: (category) => (
                  <div className="flex items-center gap-4">
                    <div className="size-16 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[11px] text-textMuted">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="mt-1 text-xs text-textMuted">{category.description}</p>
                      <p className="mt-2 text-xs text-textMuted">
                        {(category.subcategories ?? []).length} subcategories
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "subcategories",
                header: "Subcategories",
                render: (category) => (
                  <div className="max-w-[320px] text-sm text-textMuted">
                    {(category.subcategories ?? []).slice(0, 4).join(", ") || "Not set"}
                    {(category.subcategories?.length ?? 0) > 4 ? " ..." : ""}
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (category) => <StatusBadge status={category.status} />,
              },
              {
                key: "created",
                header: "Created",
                render: (category) => formatDate(category.createdAt),
              },
              {
                key: "actions",
                header: "Actions",
                render: (category) => {
                  const isStatusUpdating = statusTargetId === category.id;
                  return (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        leftIcon={<Edit3 className="size-4" />}
                        onClick={() => navigate(`/categories/full/${category.id}/studio`)}
                        disabled={isStatusUpdating}
                      >
                        Open studio
                      </Button>
                      {category.status === "disabled" ? (
                        <>
                          <Button
                            variant="secondary"
                            leftIcon={<RotateCcw className="size-4" />}
                            onClick={() => void handleRestore(category)}
                            isLoading={isStatusUpdating}
                          >
                            Enable
                          </Button>
                          <Button
                            variant="danger"
                            leftIcon={<Trash2 className="size-4" />}
                            onClick={() => setDeleteIntent({ category, mode: "permanent" })}
                            disabled={isStatusUpdating}
                          >
                            Delete permanently
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="danger"
                          leftIcon={<Trash2 className="size-4" />}
                          onClick={() => setDeleteIntent({ category, mode: "disable" })}
                          disabled={isStatusUpdating}
                        >
                          Disable
                        </Button>
                      )}
                    </div>
                  );
                },
              },
            ]}
            data={filteredCategories}
            keyExtractor={(category) => category.id}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={() => void loadMore()}
            onRetry={() => void refresh()}
            emptyTitle="No categories found"
            emptyDescription="Try a broader search or create a new category in studio."
          />
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deleteIntent)}
        onClose={() => setDeleteIntent(null)}
        onConfirm={() => void handleDelete()}
        title={deleteIntent?.mode === "permanent" ? "Delete category permanently?" : "Disable category"}
        description={
          deleteIntent
            ? deleteIntent.mode === "permanent"
              ? `Delete ${deleteIntent.category.name} from admin categories entirely. Existing products stay untouched, but you would need to recreate this category later if you want it back.`
              : `Disable ${deleteIntent.category.name}. Existing products can be reassigned later if needed.`
            : ""
        }
        confirmLabel={deleteIntent?.mode === "permanent" ? "Delete permanently" : "Disable category"}
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
