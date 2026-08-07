import {
  CheckCircle2,
  Circle,
  ImagePlus,
  Layers3,
  Package,
  Save,
  Sparkles,
  Store as StoreIcon,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCategories } from "@/api/categoriesApi";
import { createProduct, getProduct, updateProduct } from "@/api/productsApi";
import { getStores } from "@/api/storesApi";
import { AdminPageSkeleton } from "@/components/admin/AdminShell";
import { ProductShopperPreview } from "@/components/products";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField } from "@/components/ui/FormField";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useTabSection } from "@/hooks/useTabSection";
import { useToast } from "@/hooks/useToast";
import type { Category, ProductStatus, Store } from "@/types";
import {
  AUDIENCE_OPTIONS,
  DEFAULT_PRODUCT_FORM_STATE,
  SECTION_OPTIONS,
  buildCreatePayload,
  buildFormStateFromProduct,
  getAvailableSubcategories,
  revokePreviewUrls,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormState,
} from "@/utils/productStudio";

type StudioSection = "identity" | "gallery" | "taxonomy" | "merchandising" | "pricing" | "publish";

const SECTIONS: Array<{ id: StudioSection; label: string; hint: string }> = [
  { id: "identity", label: "Identity", hint: "Name, store, story" },
  { id: "gallery", label: "Gallery", hint: "Hero images & crops" },
  { id: "taxonomy", label: "Taxonomy", hint: "Categories & filters" },
  { id: "merchandising", label: "Merchandising", hint: "Placement & audience" },
  { id: "pricing", label: "Pricing", hint: "Price, stock, variants" },
  { id: "publish", label: "Publish", hint: "Status & checklist" },
];

function TaxonomyChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-accent/40 bg-accent/15 text-textStrong"
          : "border-line bg-surfaceMuted text-textMuted hover:border-accent/30 hover:text-textStrong"
      }`}
    >
      {label}
    </button>
  );
}

export function ProductStudioPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isCreate = !productId;
  const { token } = useAdminAuth();
  const { showToast } = useToast();

  const { record, isLoading, error, reload } = useRecordDetail({
    id: productId ?? "",
    loadDetail: getProduct,
    enabled: !isCreate,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [form, setForm] = useState<ProductFormState>(DEFAULT_PRODUCT_FORM_STATE);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [queuedImagePreviewUrls, setQueuedImagePreviewUrls] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [activeCropFile, setActiveCropFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(isCreate);

  const { activeSection, setActiveSection } = useTabSection<StudioSection>("identity");

  useEffect(() => {
    if (!token) return;
    setCatalogLoading(true);
    void Promise.all([getCategories(token), getStores(token)])
      .then(([categoryList, storeList]) => {
        setCategories(categoryList);
        setStores(storeList);
      })
      .catch(() => {
        showToast({
          title: "Unable to load catalog data",
          description: "Categories and stores could not be loaded.",
          tone: "error",
        });
      })
      .finally(() => setCatalogLoading(false));
  }, [showToast, token]);

  useEffect(() => {
    if (isCreate || !record || categories.length === 0) return;
    setForm(buildFormStateFromProduct(record, categories));
    setHydrated(true);
  }, [categories, isCreate, record]);

  useEffect(() => {
    const nextUrls = form.imageFiles.map((file) => URL.createObjectURL(file));
    setQueuedImagePreviewUrls(nextUrls);
    return () => revokePreviewUrls(nextUrls);
  }, [form.imageFiles]);

  const categoriesBySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories],
  );

  const selectedCategories = useMemo(
    () =>
      form.selectedCategorySlugs
        .map((slug) => categoriesBySlug.get(slug))
        .filter((value): value is Category => Boolean(value)),
    [categoriesBySlug, form.selectedCategorySlugs],
  );

  const availableSubcategories = useMemo(
    () => getAvailableSubcategories(selectedCategories),
    [selectedCategories],
  );

  const existingProductImages = record?.images ?? [];
  const heroPreviewUrl = queuedImagePreviewUrls[0] ?? existingProductImages[0] ?? null;
  const selectedStore = stores.find((store) => store.id === form.storeId);

  const readiness = useMemo(() => {
    const checks = [
      { id: "name", label: "Product name set", done: Boolean(form.name.trim()) },
      { id: "description", label: "Description written", done: form.description.trim().length >= 12 },
      {
        id: "images",
        label: "At least one product image",
        done: form.imageFiles.length > 0 || existingProductImages.length > 0,
      },
      { id: "taxonomy", label: "Category selected", done: form.selectedCategorySlugs.length > 0 },
      { id: "price", label: "Valid selling price", done: Number.isFinite(Number(form.price)) && Number(form.price) >= 0 },
      { id: "stock", label: "Stock configured", done: Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0 },
    ];
    const score = checks.filter((check) => check.done).length;
    return { checks, score, total: checks.length };
  }, [existingProductImages.length, form]);

  function updateForm<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  }

  function toggleCategory(slug: string) {
    setForm((current) => {
      const active = current.selectedCategorySlugs.includes(slug);
      const nextCategorySlugs = active
        ? current.selectedCategorySlugs.filter((item) => item !== slug)
        : [...current.selectedCategorySlugs, slug];

      const allowedSubcategories = new Set(
        nextCategorySlugs.flatMap((categorySlug) =>
          (categoriesBySlug.get(categorySlug)?.subcategories ?? []).map(
            (subcategory) => `${categorySlug}::${subcategory}`,
          ),
        ),
      );

      return {
        ...current,
        selectedCategorySlugs: nextCategorySlugs,
        selectedSubcategorySlugs: current.selectedSubcategorySlugs.filter((item) =>
          allowedSubcategories.has(item),
        ),
      };
    });
    setFormErrors((current) => ({ ...current, selectedCategorySlugs: undefined }));
  }

  function toggleSubcategory(slug: string) {
    setForm((current) => ({
      ...current,
      selectedSubcategorySlugs: current.selectedSubcategorySlugs.includes(slug)
        ? current.selectedSubcategorySlugs.filter((item) => item !== slug)
        : [...current.selectedSubcategorySlugs, slug],
    }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = Math.max(6 - form.imageFiles.length, 0);
    if (remainingSlots === 0) {
      showToast({
        title: "Image limit reached",
        description: "You can attach up to 6 images per product.",
        tone: "error",
      });
      event.target.value = "";
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    setCropQueue(acceptedFiles.slice(1));
    setActiveCropFile(acceptedFiles[0]);
    event.target.value = "";
  }

  function handleCropConfirm(file: File) {
    setForm((current) => ({
      ...current,
      imageFiles: [...current.imageFiles, file].slice(0, 6),
    }));
    setFormErrors((current) => ({ ...current, imageFiles: undefined }));

    if (cropQueue.length > 0) {
      const [nextFile, ...rest] = cropQueue;
      setCropQueue(rest);
      setActiveCropFile(nextFile);
      return;
    }
    setActiveCropFile(null);
  }

  function removeQueuedImage(index: number) {
    setForm((current) => ({
      ...current,
      imageFiles: current.imageFiles.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  const handleSave = useCallback(async () => {
    if (!token) return;

    const nextErrors = validateProductForm(form, {
      requireImage: isCreate || (!existingProductImages.length && form.imageFiles.length === 0),
    });
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast({
        title: "Check product details",
        description: "Complete the required fields before publishing.",
        tone: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildCreatePayload(form, selectedCategories, availableSubcategories);
      if (isCreate) {
        const created = await createProduct(token, payload);
        showToast({
          title: "Product published",
          description: `${created.name} is now in the ODOS catalog.`,
          tone: "success",
        });
      } else if (productId) {
        const updated = await updateProduct(token, productId, payload);
        showToast({
          title: "Product updated",
          description: `${updated.name} has been saved.`,
          tone: "success",
        });
      }
      navigate("/products/full", { replace: true });
    } catch (saveError) {
      showToast({
        title: "Unable to save product",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    availableSubcategories,
    existingProductImages.length,
    form,
    isCreate,
    navigate,
    productId,
    selectedCategories,
    showToast,
    token,
  ]);

  if (catalogLoading || (!isCreate && (isLoading || !hydrated))) {
    return <AdminPageSkeleton blocks={3} />;
  }

  if (!isCreate && (error || !record)) {
    return (
      <ErrorState description={error ?? "Product not found."} onRetry={() => void reload()} />
    );
  }

  const categoryLabel =
    selectedCategories[0]?.name ?? (form.selectedCategorySlugs[0] || "Category");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium text-textMuted">Products</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">
            {isCreate ? "New product" : form.name || "Edit product"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-textMuted">
            Photos, price, categories, variants, and status for this listing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => navigate("/products/full")}>
            Back to list
          </Button>
          <Button
            leftIcon={<Save className="size-4" />}
            onClick={() => void handleSave()}
            isLoading={isSaving}
          >
            {isCreate ? "Create product" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <ProductShopperPreview
            name={form.name}
            description={form.description}
            imageUrl={heroPreviewUrl}
            price={form.price}
            oldPrice={form.oldPrice}
            rating={form.rating}
            reviews={form.reviews}
            colorOptions={form.colorOptions}
            sizeOptions={form.sizeOptions}
            storeName={selectedStore?.name ?? "ODOS Official"}
            categoryLabel={categoryLabel}
            status={form.status}
          />

          <div className="rounded-3xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-textStrong">Launch readiness</p>
                <p className="mt-1 text-xs text-textMuted">
                  {readiness.score} of {readiness.total} checks complete
                </p>
              </div>
              <div className="text-2xl font-semibold text-accent">
                {Math.round((readiness.score / readiness.total) * 100)}%
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surfaceMuted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(readiness.score / readiness.total) * 100}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {readiness.checks.map((check) => (
                <div key={check.id} className="flex items-center gap-2 text-xs text-textMuted">
                  {check.done ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <Circle className="size-4 text-textSubtle" />
                  )}
                  <span className={check.done ? "text-textStrong" : undefined}>{check.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`rounded-card border px-4 py-3 text-left transition ${
                    active
                      ? "border-accent/40 bg-accent/10 shadow-card"
                      : "border-line bg-surfaceMuted hover:border-accent/30"
                  }`}
                >
                  <p className="text-sm font-semibold text-textStrong">{section.label}</p>
                  <p className="mt-1 text-xs text-textMuted">{section.hint}</p>
                </button>
              );
            })}
          </div>

          {activeSection === "identity" ? (
            <section className="rounded-panel border border-line bg-surface p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-accent/10 p-2.5 text-accent">
                  <Package className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">Product identity</h2>
                  <p className="text-sm text-textMuted">What shoppers see first on browse and search.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Product name" error={formErrors.name} className="md:col-span-2">
                  <input
                    className="app-input"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Women's Ribbed Lounge Set"
                  />
                </FormField>
                <FormField label="Store">
                  <select
                    className="app-select"
                    value={form.storeId}
                    onChange={(event) => updateForm("storeId", event.target.value)}
                  >
                    <option value="" className="bg-panel">
                      ODOS Official store
                    </option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id} className="bg-panel">
                        {store.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select
                    className="app-select"
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value as ProductStatus)}
                  >
                    <option value="pending" className="bg-panel">Pending approval</option>
                    <option value="active" className="bg-panel">Active</option>
                    <option value="hidden" className="bg-panel">Hidden</option>
                    <option value="suspended" className="bg-panel">Suspended</option>
                  </select>
                </FormField>
                <FormField label="Description" error={formErrors.description} className="md:col-span-2">
                  <textarea
                    className="app-textarea min-h-32"
                    value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                    placeholder="Soft two-piece outfit designed for everyday comfort..."
                  />
                </FormField>
              </div>
            </section>
          ) : null}

          {activeSection === "gallery" ? (
            <section className="rounded-panel border border-line bg-surface p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-accent/10 p-2.5 text-accent">
                  <ImagePlus className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">Product gallery</h2>
                  <p className="text-sm text-textMuted">Upload up to 6 cropped images. First image is the hero.</p>
                </div>
              </div>
              <div className="rounded-panel border border-dashed border-line bg-surfaceMuted p-6">
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="size-44 overflow-hidden rounded-panel border border-line bg-surface">
                    {heroPreviewUrl ? (
                      <img src={heroPreviewUrl} alt="Hero" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-textMuted">
                        <Upload className="size-6 text-textSubtle" />
                        Add product photos
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={handleImageChange}
                      className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-surfaceMuted file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-line"
                    />
                    {formErrors.imageFiles ? (
                      <p className="text-xs text-danger">{formErrors.imageFiles}</p>
                    ) : null}
                    {queuedImagePreviewUrls.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {queuedImagePreviewUrls.map((url, index) => (
                          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-line">
                            <img src={url} alt="" className="size-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeQueuedImage(index)}
                              className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-1 text-white"
                              aria-label="Remove image"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {!isCreate && existingProductImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {existingProductImages.map((url, index) => (
                          <div key={url} className="aspect-square overflow-hidden rounded-xl border border-line">
                            <img src={url} alt="" className="size-full object-cover" />
                            {index === 0 && !queuedImagePreviewUrls.length ? (
                              <p className="mt-1 text-center text-[10px] text-textMuted">Current hero</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "taxonomy" ? (
            <section className="rounded-panel border border-line bg-surface p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-accent/10 p-2.5 text-accent">
                  <Layers3 className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">Catalog taxonomy</h2>
                  <p className="text-sm text-textMuted">Map the product to categories and subcategory filters.</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-sm font-medium text-textStrong">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <TaxonomyChip
                        key={category.id}
                        label={category.name}
                        active={form.selectedCategorySlugs.includes(category.slug)}
                        onClick={() => toggleCategory(category.slug)}
                      />
                    ))}
                  </div>
                  {formErrors.selectedCategorySlugs ? (
                    <p className="mt-2 text-xs text-danger">{formErrors.selectedCategorySlugs}</p>
                  ) : null}
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-textStrong">Subcategories</p>
                  {availableSubcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableSubcategories.map((subcategory) => (
                        <TaxonomyChip
                          key={subcategory.slug}
                          label={subcategory.label}
                          active={form.selectedSubcategorySlugs.includes(subcategory.slug)}
                          onClick={() => toggleSubcategory(subcategory.slug)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textMuted">Select a category to unlock subcategories.</p>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "merchandising" ? (
            <section className="rounded-panel border border-line bg-surface p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-accent/10 p-2.5 text-accent">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">Merchandising</h2>
                  <p className="text-sm text-textMuted">Control where this product surfaces across ODOS.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Audience">
                  <select
                    className="app-select"
                    value={form.audienceSlug}
                    onChange={(event) => updateForm("audienceSlug", event.target.value)}
                  >
                    {AUDIENCE_OPTIONS.map((option) => (
                      <option key={option.value || "blank"} value={option.value} className="bg-panel">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Home section">
                  <select
                    className="app-select"
                    value={form.section}
                    onChange={(event) => updateForm("section", event.target.value)}
                  >
                    {SECTION_OPTIONS.map((option) => (
                      <option key={option.value || "blank"} value={option.value} className="bg-panel">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Placement tags" className="md:col-span-2">
                  <input
                    className="app-input"
                    value={form.placementTags}
                    onChange={(event) => updateForm("placementTags", event.target.value)}
                    placeholder="flash-sale, popular, featured"
                  />
                </FormField>
              </div>
            </section>
          ) : null}

          {activeSection === "pricing" ? (
            <section className="rounded-panel border border-line bg-surface p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-accent/10 p-2.5 text-accent">
                  <Tag className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">Pricing & variants</h2>
                  <p className="text-sm text-textMuted">Set commercial terms and shopper-facing options.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Selling price (GHS)" error={formErrors.price}>
                  <input className="app-input" type="number" min="0" value={form.price} onChange={(e) => updateForm("price", e.target.value)} />
                </FormField>
                <FormField label="Compare-at price" error={formErrors.oldPrice}>
                  <input className="app-input" type="number" min="0" value={form.oldPrice} onChange={(e) => updateForm("oldPrice", e.target.value)} />
                </FormField>
                <FormField label="Stock" error={formErrors.stock}>
                  <input className="app-input" type="number" min="0" value={form.stock} onChange={(e) => updateForm("stock", e.target.value)} />
                </FormField>
                <FormField label="Rating">
                  <input className="app-input" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateForm("rating", e.target.value)} />
                </FormField>
                <FormField label="Reviews label">
                  <input className="app-input" value={form.reviews} onChange={(e) => updateForm("reviews", e.target.value)} />
                </FormField>
                <FormField label="Colors">
                  <input className="app-input" value={form.colorOptions} onChange={(e) => updateForm("colorOptions", e.target.value)} placeholder="Black, Sand, Sage" />
                </FormField>
                <FormField label="Sizes">
                  <input className="app-input" value={form.sizeOptions} onChange={(e) => updateForm("sizeOptions", e.target.value)} placeholder="S, M, L, XL" />
                </FormField>
                <FormField label="Specifications" className="md:col-span-2">
                  <textarea className="app-textarea min-h-28" value={form.specifications} onChange={(e) => updateForm("specifications", e.target.value)} placeholder={"Material: Cotton blend\nCare: Machine wash cold"} />
                </FormField>
              </div>
            </section>
          ) : null}

          {activeSection === "publish" ? (
            <section className="rounded-panel border border-line bg-surface p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-success/10 p-2.5 text-success">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textStrong">Review & publish</h2>
                  <p className="text-sm text-textMuted">Confirm the listing is ready for the shopper app.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-line bg-surfaceMuted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-textSubtle">Summary</p>
                  <p className="mt-2 text-lg font-semibold text-textStrong">{form.name.trim() || "Untitled product"}</p>
                  <p className="mt-2 text-sm text-textMuted">{form.description || "No description yet."}</p>
                  <p className="mt-3 text-xs text-textMuted">
                    {form.selectedCategorySlugs.length} categories · {form.imageFiles.length + existingProductImages.length} images · {form.status}
                  </p>
                </div>
                <div className="rounded-card border border-line bg-surfaceMuted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-textSubtle">Storefront</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-textStrong">
                    <StoreIcon className="size-4 text-textMuted" />
                    {selectedStore?.name ?? "ODOS Official"}
                  </div>
                  <p className="mt-3 text-xs text-textMuted">
                    Active products appear in browse, search, and configured home sections.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button leftIcon={<Save className="size-4" />} onClick={() => void handleSave()} isLoading={isSaving}>
                  {isCreate ? "Publish product" : "Save changes"}
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <ImageCropModal
        open={Boolean(activeCropFile)}
        file={activeCropFile}
        onClose={() => {
          setActiveCropFile(null);
          setCropQueue([]);
        }}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
