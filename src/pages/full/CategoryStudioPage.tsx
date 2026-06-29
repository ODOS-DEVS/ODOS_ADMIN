import {
  CheckCircle2,
  Circle,
  ImagePlus,
  Layers3,
  Plus,
  Save,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createCategory,
  getCategories,
  updateCategory,
} from "@/api/categoriesApi";
import { AdminPageSkeleton } from "@/components/admin/AdminShell";
import { CategoryShopperPreview } from "@/components/categories";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useTabSection } from "@/hooks/useTabSection";
import { useToast } from "@/hooks/useToast";
import type { Category } from "@/types";

type StudioSection = "identity" | "visual" | "taxonomy" | "publish";

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  status: Category["status"];
  imageFile: File | null;
  subcategories: string[];
};

const SECTIONS: Array<{ id: StudioSection; label: string; hint: string }> = [
  { id: "identity", label: "Identity", hint: "Name, slug, and story" },
  { id: "visual", label: "Visual", hint: "Shopper-facing artwork" },
  { id: "taxonomy", label: "Taxonomy", hint: "Subcategory chips" },
  { id: "publish", label: "Publish", hint: "Status and checklist" },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildInitialForm(category?: Category | null): CategoryFormState {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    status: category?.status ?? "active",
    imageFile: null,
    subcategories: category?.subcategories ?? [],
  };
}

export function CategoryStudioPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const isCreate = !categoryId;
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { record, isLoading, error, reload } = useRecordDetail({
    id: categoryId ?? "",
    loadList: getCategories,
    enabled: !isCreate,
  });

  const [form, setForm] = useState<CategoryFormState>(buildInitialForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [subcategoryDraft, setSubcategoryDraft] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(isCreate);

  const { activeSection, setActiveSection } =
    useTabSection<StudioSection>("identity");

  useEffect(() => {
    if (isCreate || !record) return;
    setForm(buildInitialForm(record));
    setPreviewUrl(record.imageUrl ?? null);
    setHydrated(true);
  }, [isCreate, record]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const readiness = useMemo(() => {
    const checks = [
      {
        id: "name",
        label: "Category name set",
        done: Boolean(form.name.trim()),
      },
      {
        id: "description",
        label: "Shopper description written",
        done: form.description.trim().length >= 12,
      },
      {
        id: "image",
        label: "Category artwork uploaded",
        done: Boolean(previewUrl),
      },
      {
        id: "taxonomy",
        label: "At least 2 subcategories",
        done: form.subcategories.length >= 2,
      },
      {
        id: "slug",
        label: "URL slug configured",
        done: Boolean(form.slug.trim()),
      },
    ];
    const score = checks.filter((check) => check.done).length;
    return { checks, score, total: checks.length };
  }, [form, previewUrl]);

  const canSave = form.name.trim().length > 0 && !isSaving;

  function updatePreviewFromFile(
    file: File | null,
    fallbackUrl?: string | null,
  ) {
    setForm((current) => ({ ...current, imageFile: file }));
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : (fallbackUrl ?? null));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    updatePreviewFromFile(file, record?.imageUrl ?? null);
    event.target.value = "";
  }

  function addSubcategory(value = subcategoryDraft) {
    const next = value.trim();
    if (!next) return;
    setForm((current) => {
      if (
        current.subcategories.some(
          (item) => item.toLowerCase() === next.toLowerCase(),
        )
      ) {
        return current;
      }
      return { ...current, subcategories: [...current.subcategories, next] };
    });
    setSubcategoryDraft("");
  }

  function removeSubcategory(index: number) {
    setForm((current) => ({
      ...current,
      subcategories: current.subcategories.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  function handleSubcategoryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addSubcategory();
    }
  }

  const handleSave = useCallback(async () => {
    if (!token || !canSave) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug.trim() || slugify(form.name),
        description: form.description,
        status: form.status,
        imageFile: form.imageFile,
        subcategories: form.subcategories,
      };

      if (isCreate) {
        const created = await createCategory(token, payload);
        showToast({
          title: "Category published",
          description: `${created.name} is now part of the ODOS catalog.`,
          tone: "success",
        });
        navigate("/categories/full", { replace: true });
      } else if (categoryId) {
        const updated = await updateCategory(token, categoryId, payload);
        showToast({
          title: "Category updated",
          description: `${updated.name} has been saved.`,
          tone: "success",
        });
        navigate("/categories/full", { replace: true });
      }
    } catch (saveError) {
      showToast({
        title: "Unable to save category",
        description:
          saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [canSave, categoryId, form, isCreate, navigate, showToast, token]);

  if (!isCreate && (isLoading || !hydrated)) {
    return <AdminPageSkeleton blocks={3} />;
  }

  if (!isCreate && (error || !record)) {
    return (
      <ErrorState
        description={error ?? "Category not found."}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
            Category studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">
            {isCreate
              ? "Design a new category"
              : `Edit ${form.name || "category"}`}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-textMuted">
            Shape how shoppers discover this aisle — with live mobile previews,
            structured subcategories, and a publish checklist.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate("/categories/full")}
          >
            Cancel
          </Button>
          <Button
            leftIcon={<Save className="size-4" />}
            onClick={() => void handleSave()}
            isLoading={isSaving}
            disabled={!canSave}
          >
            {isCreate ? "Publish category" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <CategoryShopperPreview
            name={form.name}
            description={form.description}
            imageUrl={previewUrl}
            subcategories={form.subcategories}
            status={form.status}
            slug={form.slug || slugify(form.name)}
          />

          <div className="rounded-[24px] border border-white/10 bg-panel/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-textStrong">
                  Launch readiness
                </p>
                <p className="mt-1 text-xs text-textMuted">
                  {readiness.score} of {readiness.total} checks complete
                </p>
              </div>
              <div className="text-2xl font-semibold text-accentSoft">
                {Math.round((readiness.score / readiness.total) * 100)}%
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-sky-400 transition-all"
                style={{
                  width: `${(readiness.score / readiness.total) * 100}%`,
                }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {readiness.checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-2 text-xs text-textMuted"
                >
                  {check.done ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <Circle className="size-4 text-white/20" />
                  )}
                  <span className={check.done ? "text-textStrong" : undefined}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`rounded-[22px] border px-4 py-3 text-left transition ${
                    active
                      ? "border-accent/40 bg-accent/10 shadow-glow"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <p className="text-sm font-semibold text-textStrong">
                    {section.label}
                  </p>
                  <p className="mt-1 text-xs text-textMuted">{section.hint}</p>
                </button>
              );
            })}
          </div>

          {activeSection === "identity" ? (
            <section className="rounded-[28px] border border-white/10 bg-panel/80 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-accent/15 p-2.5 text-accentSoft">
                  <Tag className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">
                    Category identity
                  </h2>
                  <p className="text-sm text-textMuted">
                    The name and story shoppers see when they browse ODOS.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-textStrong">
                    Category name
                  </label>
                  <input
                    className="app-input"
                    value={form.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="e.g. Fashion & Apparel"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-textStrong">
                    URL slug
                  </label>
                  <input
                    className="app-input font-mono text-sm"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((current) => ({
                        ...current,
                        slug: slugify(event.target.value),
                      }));
                    }}
                    placeholder="fashion-apparel"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-textStrong">
                    Status
                  </label>
                  <select
                    className="app-select"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as Category["status"],
                      }))
                    }
                  >
                    <option value="active" className="bg-panel">
                      Active — visible to shoppers
                    </option>
                    <option value="disabled" className="bg-panel">
                      Disabled — hidden from browse
                    </option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-textStrong">
                    Shopper description
                  </label>
                  <textarea
                    className="app-textarea min-h-32"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Tell shoppers what they'll find in this category..."
                  />
                  <p className="text-xs text-textMuted">
                    Aim for at least 12 characters. This copy appears on
                    category cards and detail screens.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "visual" ? (
            <section className="rounded-[28px] border border-white/10 bg-panel/80 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-sky-500/15 p-2.5 text-sky-200">
                  <ImagePlus className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">
                    Visual artwork
                  </h2>
                  <p className="text-sm text-textMuted">
                    Upload the hero image used on category cards across the
                    mobile app.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />

              <div
                className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] p-6"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0] ?? null;
                  if (file)
                    updatePreviewFromFile(file, record?.imageUrl ?? null);
                }}
              >
                <div className="flex flex-col items-center gap-5 lg:flex-row">
                  <div className="size-44 overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f]">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Category artwork"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-textMuted">
                        <Upload className="size-6 text-accentSoft" />
                        Drop an image or choose a file
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3 text-center lg:text-left">
                    <p className="text-sm text-textMuted">
                      Use a bold, high-contrast visual. Square or portrait crops
                      work best for the shopper browse card.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                      <Button
                        variant="secondary"
                        leftIcon={<Upload className="size-4" />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload artwork
                      </Button>
                      {previewUrl ? (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            updatePreviewFromFile(
                              null,
                              record?.imageUrl ?? null,
                            )
                          }
                        >
                          Remove image
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "taxonomy" ? (
            <section className="rounded-[28px] border border-white/10 bg-panel/80 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-violet-500/15 p-2.5 text-violet-200">
                  <Layers3 className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">
                    Subcategory taxonomy
                  </h2>
                  <p className="text-sm text-textMuted">
                    Build filter chips shoppers tap inside this category.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="app-input flex-1"
                  value={subcategoryDraft}
                  onChange={(event) => setSubcategoryDraft(event.target.value)}
                  onKeyDown={handleSubcategoryKeyDown}
                  placeholder="Add a subcategory and press Enter"
                />
                <Button
                  leftIcon={<Plus className="size-4" />}
                  onClick={() => addSubcategory()}
                  disabled={!subcategoryDraft.trim()}
                >
                  Add
                </Button>
              </div>

              {form.subcategories.length === 0 ? (
                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-textMuted">
                  No subcategories yet. Add at least two to help shoppers filter
                  products quickly.
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2">
                  {form.subcategories.map((subcategory, index) => (
                    <span
                      key={`${subcategory}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-textStrong"
                    >
                      {subcategory}
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-textMuted hover:bg-white/10 hover:text-textStrong"
                        onClick={() => removeSubcategory(index)}
                        aria-label={`Remove ${subcategory}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {["Ladies Wear", "Men's Wear", "Kids Wear"].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addSubcategory(suggestion)}
                      className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-textMuted transition hover:border-accent/30 hover:text-textStrong"
                    >
                      + {suggestion}
                    </button>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {activeSection === "publish" ? (
            <section className="rounded-[28px] border border-white/10 bg-panel/80 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/15 p-2.5 text-emerald-200">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">
                    Review & publish
                  </h2>
                  <p className="text-sm text-textMuted">
                    Confirm the category is ready before it goes live on ODOS.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-accentSoft">
                    Summary
                  </p>
                  <p className="mt-2 text-lg font-semibold text-textStrong">
                    {form.name.trim() || "Untitled category"}
                  </p>
                  <p className="mt-2 text-sm text-textMuted">
                    {form.description || "No description yet."}
                  </p>
                  <p className="mt-3 text-xs text-textMuted">
                    {form.subcategories.length} subcategories ·{" "}
                    {form.status === "active"
                      ? "Will be live"
                      : "Will stay hidden"}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-accentSoft">
                    Before you publish
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-textMuted">
                    <li>
                      • Artwork should feel premium on a dark and light phone
                      theme.
                    </li>
                    <li>
                      • Subcategories become product filters in the shopper app.
                    </li>
                    <li>
                      • Disabling keeps existing products but hides browse entry
                      points.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  leftIcon={<Save className="size-4" />}
                  onClick={() => void handleSave()}
                  isLoading={isSaving}
                  disabled={!canSave}
                >
                  {isCreate ? "Publish category" : "Save changes"}
                </Button>
                {!isCreate ? (
                  <Button
                    variant="danger"
                    leftIcon={<Trash2 className="size-4" />}
                    onClick={() => navigate("/categories/full")}
                  >
                    Back to directory
                  </Button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
