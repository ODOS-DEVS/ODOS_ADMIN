import { Edit3, ImagePlus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/api/categoriesApi";
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
import type { Category } from "@/types";
import { formatDate } from "@/utils/format";

type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  image: string;
  imageFile: File | null;
  subcategories: string;
  status: Category["status"];
};

type CategoryDeleteIntent = {
  category: Category;
  mode: "disable" | "permanent";
};

const initialCategoryForm: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  image: "",
  imageFile: null,
  subcategories: "",
  status: "active",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseSubcategories(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CategoriesPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormValues>(initialCategoryForm);
  const [deleteIntent, setDeleteIntent] = useState<CategoryDeleteIntent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusTargetId, setStatusTargetId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCategories(token);
      setCategories(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const haystack = [
        category.name,
        category.slug,
        category.description,
        ...(category.subcategories ?? []),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : category.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [categories, query, statusFilter]);

  function resetEditorState() {
    setCategoryForm(initialCategoryForm);
    setEditingCategory(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  function openCreateModal() {
    resetEditorState();
    setIsEditorOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image ?? "",
      imageFile: null,
      subcategories: (category.subcategories ?? []).join("\n"),
      status: category.status,
    });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(category.imageUrl ?? null);
    setIsEditorOpen(true);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setCategoryForm((current) => ({ ...current, imageFile: file }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : editingCategory?.imageUrl ?? null);
    event.target.value = "";
  }

  async function handleSave() {
    if (!token) return;
    setActionLoading(true);
    try {
      const payload = {
        ...categoryForm,
        image: categoryForm.image || null,
        subcategories: parseSubcategories(categoryForm.subcategories),
      };

      if (editingCategory) {
        const updated = await updateCategory(token, editingCategory.id, payload);
        setCategories((current) =>
          current.map((category) => (category.id === updated.id ? updated : category)),
        );
        showToast({
          title: "Category updated",
          description: `${updated.name} has been updated.`,
          tone: "success",
        });
      } else {
        const created = await createCategory(token, payload);
        setCategories((current) => [created, ...current]);
        showToast({
          title: "Category created",
          description: `${created.name} is now part of the ODOS catalog.`,
          tone: "success",
        });
      }

      setIsEditorOpen(false);
      resetEditorState();
    } catch (saveError) {
      showToast({
        title: "Unable to save category",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!token || !deleteIntent) return;
    setActionLoading(true);
    try {
      await deleteCategory(token, deleteIntent.category.id, {
        permanent: deleteIntent.mode === "permanent",
      });
      if (deleteIntent.mode === "permanent") {
        setCategories((current) =>
          current.filter((category) => category.id !== deleteIntent.category.id),
        );
      } else {
        setCategories((current) =>
          current.map((category) =>
            category.id === deleteIntent.category.id
              ? { ...category, status: "disabled" }
              : category,
          ),
        );
      }
      showToast({
        title:
          deleteIntent.mode === "permanent" ? "Category deleted" : "Category disabled",
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
        image: category.image ?? null,
        imageFile: null,
        subcategories: category.subcategories ?? [],
        status: "active",
      });
      setCategories((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
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

  if (isLoading) {
    return <LoadingState label="Loading categories..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadCategories()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categories"
        title="Category management"
        description="Shape the catalog taxonomy with visual category cards, uploadable artwork, and grouped subcategories customers can browse cleanly."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreateModal}>
            Create category
          </Button>
        }
      />

      <SectionCard
        title="Categories"
        description="Search existing categories, manage the shopper taxonomy, disable categories that should disappear from shoppers, or permanently remove archived ones."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search category, slug, or subcategory"
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
        {filteredCategories.length === 0 ? (
          <EmptyState
            title="No categories found"
            description="Create a category or broaden the current search."
          />
        ) : (
          <DataTable<Category>
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
                key: "slug",
                header: "Slug",
                render: (category) => category.slug,
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
                        variant="secondary"
                        leftIcon={<Edit3 className="size-4" />}
                        onClick={() => openEditModal(category)}
                        disabled={isStatusUpdating}
                      >
                        Edit
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
                            onClick={() =>
                              setDeleteIntent({ category, mode: "permanent" })
                            }
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
          />
        )}
      </SectionCard>

      <Modal
        open={isEditorOpen}
        onClose={() => {
          if (!actionLoading) {
            setIsEditorOpen(false);
          }
        }}
        title={editingCategory ? `Edit ${editingCategory.name}` : "Create category"}
        description="Define how products should be grouped across ODOS, including the image that appears on the shopper app."
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditorOpen(false);
                resetEditorState();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              isLoading={actionLoading}
              disabled={!categoryForm.name.trim() || !categoryForm.slug.trim()}
            >
              {editingCategory ? "Save changes" : "Create category"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Category name</label>
            <input
              className="app-input"
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: editingCategory ? current.slug : slugify(event.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Slug</label>
            <input
              className="app-input"
              value={categoryForm.slug}
              onChange={(event) =>
                setCategoryForm((current) => ({ ...current, slug: slugify(event.target.value) }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Status</label>
            <select
              className="app-select"
              value={categoryForm.status}
              onChange={(event) =>
                setCategoryForm((current) => ({
                  ...current,
                  status: event.target.value as Category["status"],
                }))
              }
            >
              <option value="active" className="bg-panel">Active</option>
              <option value="disabled" className="bg-panel">Disabled</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Fallback image key</label>
            <input
              className="app-input"
              value={categoryForm.image}
              onChange={(event) =>
                setCategoryForm((current) => ({ ...current, image: event.target.value }))
              }
              placeholder="dress, shoe5, headset"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Category artwork</label>
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex h-36 w-44 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Category preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="px-4 text-center text-xs text-textMuted">
                      Shopper app category image preview
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-white/15"
                  />
                  <p className="mt-3 text-xs text-textMuted">
                    Upload a strong visual for the category card. This image is rendered in the shopper app’s category screen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Description</label>
            <textarea
              className="app-textarea min-h-28"
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Subcategories</label>
            <textarea
              className="app-textarea min-h-40"
              value={categoryForm.subcategories}
              onChange={(event) =>
                setCategoryForm((current) => ({ ...current, subcategories: event.target.value }))
              }
              placeholder={"Ladies Wear\nMen’s Wear\nKids Wear"}
            />
            <p className="text-xs text-textMuted">
              Add one subcategory per line. These will be selectable on products and filterable in the shopper app.
            </p>
          </div>

          <div className="md:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center gap-2">
              <ImagePlus className="size-4 text-accentSoft" />
              <p className="text-sm font-semibold text-textStrong">Category card preview</p>
            </div>
            <div className="flex items-center gap-4 rounded-[24px] bg-[#081220] p-4">
              <div className="h-28 w-32 overflow-hidden rounded-[22px] bg-white/[0.06]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-textMuted">
                    No image yet
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-textStrong">
                  {categoryForm.name.trim() || "Category title"}
                </p>
                <p className="mt-2 text-sm text-textMuted">
                  {categoryForm.description.trim() || "Category description will appear here."}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-accentSoft">
                  {parseSubcategories(categoryForm.subcategories).length} subcategories ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteIntent)}
        onClose={() => setDeleteIntent(null)}
        onConfirm={() => void handleDelete()}
        title={
          deleteIntent?.mode === "permanent"
            ? "Delete category permanently?"
            : "Disable category"
        }
        description={
          deleteIntent
            ? deleteIntent.mode === "permanent"
              ? `Delete ${deleteIntent.category.name} from admin categories entirely. Existing products stay untouched, but you would need to recreate this category later if you want it back.`
              : `Disable ${deleteIntent.category.name}. Existing products can be reassigned later if needed.`
            : ""
        }
        confirmLabel={
          deleteIntent?.mode === "permanent"
            ? "Delete permanently"
            : "Disable category"
        }
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
