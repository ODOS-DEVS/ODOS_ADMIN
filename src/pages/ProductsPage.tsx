import {
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  ImagePlus,
  Mail,
  MapPin,
  PackagePlus,
  Star,
  Store as StoreIcon,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { getCategories } from "@/api/categoriesApi";
import {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  updateProductStatus,
  type CreateProductInput,
} from "@/api/productsApi";
import { getStores } from "@/api/storesApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { Category, Product, ProductStatus, Store } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

type ProductFormState = {
  name: string;
  description: string;
  storeId: string;
  selectedCategorySlugs: string[];
  selectedSubcategorySlugs: string[];
  audienceSlug: string;
  section: string;
  placementTags: string;
  price: string;
  oldPrice: string;
  stock: string;
  rating: string;
  reviews: string;
  colorOptions: string;
  sizeOptions: string;
  specifications: string;
  status: ProductStatus;
  imageFiles: File[];
};

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

const DEFAULT_FORM_STATE: ProductFormState = {
  name: "",
  description: "",
  storeId: "",
  selectedCategorySlugs: [],
  selectedSubcategorySlugs: [],
  audienceSlug: "",
  section: "",
  placementTags: "",
  price: "",
  oldPrice: "",
  stock: "",
  rating: "4.5",
  reviews: "12 reviews",
  colorOptions: "",
  sizeOptions: "",
  specifications: "",
  status: "active",
  imageFiles: [],
};

const AUDIENCE_OPTIONS = [
  { label: "Use store audience / all shoppers", value: "" },
  { label: "Ladies", value: "ladies" },
  { label: "Gents", value: "gents" },
  { label: "Kids", value: "kids" },
];

const SECTION_OPTIONS = [
  { label: "Default placement", value: "" },
  { label: "Flash Sale", value: "flash-sale" },
  { label: "Popular Products", value: "popular" },
  { label: "Featured", value: "featured" },
  { label: "Popular New", value: "popular-new" },
  { label: "Market Spotlight", value: "market-feature" },
  { label: "Category Highlight", value: "category-highlight" },
  { label: "Trending", value: "trending" },
  { label: "Essentials", value: "essentials" },
];

function ProductDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <div className="mt-2 text-sm text-textStrong">{value}</div>
    </div>
  );
}

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
          : "border-white/10 bg-white/[0.03] text-textMuted hover:border-white/20 hover:text-textStrong"
      }`}
    >
      {label}
    </button>
  );
}

function validateProductForm(
  form: ProductFormState,
  { requireImage = true }: { requireImage?: boolean } = {},
): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Enter a product name.";
  }
  if (form.description.trim().length < 12) {
    errors.description = "Write a short but useful description.";
  }
  if (form.selectedCategorySlugs.length === 0) {
    errors.selectedCategorySlugs = "Select at least one category.";
  }
  if (requireImage && form.imageFiles.length === 0) {
    errors.imageFiles = "Upload at least one product image.";
  }

  const price = Number(form.price);
  const oldPrice = form.oldPrice.trim() ? Number(form.oldPrice) : null;
  const stock = Number(form.stock);
  const rating = form.rating.trim() ? Number(form.rating) : null;

  if (!Number.isFinite(price) || price < 0) {
    errors.price = "Enter a valid price in Ghana cedis.";
  }
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < price)) {
    errors.oldPrice = "Compare-at price should be higher than the selling price.";
  }
  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = "Enter a valid stock count.";
  }
  if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
    errors.rating = "Rating should be between 0 and 5.";
  }

  return errors;
}

function parseCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTaxonomyValue(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSubcategoryKey(categorySlug: string, subcategory: string) {
  return `${categorySlug}::${subcategory}`;
}

function revokePreviewUrls(urls: string[]) {
  for (const url of urls) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}

export function ProductsPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [statusProduct, setStatusProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ProductStatus>("active");
  const [actionLoading, setActionLoading] = useState(false);
  const [productDetailLoading, setProductDetailLoading] = useState(false);
  const [productDetailError, setProductDetailError] = useState<string | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState<ProductFormState>(DEFAULT_FORM_STATE);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [activeCropFile, setActiveCropFile] = useState<File | null>(null);
  const [queuedImagePreviewUrls, setQueuedImagePreviewUrls] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const [productList, categoryList, storeList] = await Promise.all([
        getProducts(token),
        getCategories(token),
        getStores(token),
      ]);
      setProducts(productList);
      setCategories(categoryList);
      setStores(storeList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const nextUrls = form.imageFiles.map((file) => URL.createObjectURL(file));
    setQueuedImagePreviewUrls(nextUrls);

    return () => {
      revokePreviewUrls(nextUrls);
    };
  }, [form.imageFiles]);

  const categoriesBySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories],
  );
  const subcategoryLabelBySlug = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const category of categories) {
      for (const subcategory of category.subcategories ?? []) {
        lookup.set(normalizeTaxonomyValue(subcategory), subcategory);
      }
    }
    return lookup;
  }, [categories]);

  const selectedCategories = useMemo(
    () =>
      form.selectedCategorySlugs
        .map((slug) => categoriesBySlug.get(slug))
        .filter((value): value is Category => Boolean(value)),
    [categoriesBySlug, form.selectedCategorySlugs],
  );

  const existingProductImages = editingProduct?.images ?? [];
  const heroPreviewUrl = queuedImagePreviewUrls[0] ?? existingProductImages[0] ?? null;

  const availableSubcategories = useMemo(() => {
    const entries = selectedCategories.flatMap((category) =>
      (category.subcategories ?? []).map((subcategory) => ({
        slug: buildSubcategoryKey(category.slug, subcategory),
        categorySlug: category.slug,
        label: subcategory,
      })),
    );

    const seen = new Set<string>();
    return entries.filter((entry) => {
      if (seen.has(entry.slug)) {
        return false;
      }
      seen.add(entry.slug);
      return true;
    });
  }, [selectedCategories]);

  const categoryOptions = useMemo(
    () => [{ label: "All categories", value: "all" }].concat(
      categories.map((category) => ({ label: category.name, value: category.slug })),
    ),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.description,
        product.storeName,
        product.audienceSlug,
        product.subcategory,
        ...(product.categorySlugs ?? []),
        ...(product.subcategorySlugs ?? []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : product.status === statusFilter;
      const matchesCategory = categoryFilter === "all"
        ? true
        : product.categorySlugs?.includes(categoryFilter) || product.category === categoriesBySlug.get(categoryFilter)?.name;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoriesBySlug, categoryFilter, products, query, statusFilter]);

  function resetCreateState() {
    setForm(DEFAULT_FORM_STATE);
    setFormErrors({});
    setCropQueue([]);
    setActiveCropFile(null);
  }

  function closeProductModal() {
    if (createLoading) return;
    setIsProductModalOpen(false);
    setEditingProduct(null);
    resetCreateState();
  }

  function closeProductDetail() {
    setSelectedProduct(null);
    setProductDetailError(null);
    setProductDetailLoading(false);
    setDetailImageIndex(0);
  }

  function openCreateModal() {
    setEditingProduct(null);
    resetCreateState();
    setIsProductModalOpen(true);
  }

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

  function buildFormStateFromProduct(product: Product): ProductFormState {
    const normalizedCategorySlugs = (
      product.categorySlugs?.filter((slug) => categoriesBySlug.has(slug)) ?? []
    );

    if (normalizedCategorySlugs.length === 0) {
      const fallbackCategory = categories.find((category) => {
        const normalizedName = normalizeTaxonomyValue(category.name);
        return (
          normalizedName === normalizeTaxonomyValue(product.category) ||
          category.slug === normalizeTaxonomyValue(product.category)
        );
      });
      if (fallbackCategory) {
        normalizedCategorySlugs.push(fallbackCategory.slug);
      }
    }

    const matchingSubcategories = normalizedCategorySlugs.flatMap((categorySlug) =>
      (categoriesBySlug.get(categorySlug)?.subcategories ?? []).map((subcategory) => ({
        key: buildSubcategoryKey(categorySlug, subcategory),
        label: subcategory,
      })),
    );

    const selectedSubcategoryKeys = new Set<string>();
    const requestedSubcategories = [
      ...(product.subcategorySlugs ?? []),
      ...(product.subcategory ? [product.subcategory] : []),
    ].map((value) => normalizeTaxonomyValue(value));

    for (const value of requestedSubcategories) {
      const match = matchingSubcategories.find(
        (entry) => normalizeTaxonomyValue(entry.label) === value,
      );
      if (match) {
        selectedSubcategoryKeys.add(match.key);
      }
    }

    return {
      name: product.name,
      description: product.description,
      storeId: product.storeId ?? "",
      selectedCategorySlugs: normalizedCategorySlugs,
      selectedSubcategorySlugs: Array.from(selectedSubcategoryKeys),
      audienceSlug: product.audienceSlug ?? "",
      section: product.section ?? "",
      placementTags: product.placementTags?.join(", ") ?? "",
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      stock: String(product.stock),
      rating: typeof product.rating === "number" ? String(product.rating) : "",
      reviews: product.reviews ?? "",
      colorOptions: product.colorOptions?.join(", ") ?? "",
      sizeOptions: product.sizeOptions?.join(", ") ?? "",
      specifications: product.specifications?.join("\n") ?? "",
      status: product.status,
      imageFiles: [],
    };
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm(buildFormStateFromProduct(product));
    setFormErrors({});
    setCropQueue([]);
    setActiveCropFile(null);
    setIsProductModalOpen(true);
  }

  async function openProductDetail(product: Product) {
    setSelectedProduct(product);
    setProductDetailError(null);
    setProductDetailLoading(true);
    setDetailImageIndex(0);

    if (!token) {
      setProductDetailLoading(false);
      return;
    }

    try {
      const nextProduct = await getProduct(token, product.id);
      setSelectedProduct(nextProduct);
    } catch (detailError) {
      setProductDetailError(
        detailError instanceof Error ? detailError.message : "Unable to load product details.",
      );
    } finally {
      setProductDetailLoading(false);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

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
    if (acceptedFiles.length < files.length) {
      showToast({
        title: "Some images were skipped",
        description: `Only ${remainingSlots} more image(s) can be added to this product.`,
        tone: "error",
      });
    }

    setCropQueue(acceptedFiles.slice(1));
    setActiveCropFile(acceptedFiles[0]);
    event.target.value = "";
  }

  function handleCropClose() {
    setActiveCropFile(null);
    setCropQueue([]);
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

  function normalizeCreatePayload(): CreateProductInput {
    const primaryCategory = selectedCategories[0];
    const primarySubcategory = availableSubcategories.find((item) =>
      form.selectedSubcategorySlugs.includes(item.slug),
    );

    return {
      name: form.name.trim(),
      description: form.description.trim(),
      category: primaryCategory?.name ?? "",
      subcategory: primarySubcategory?.label,
      categorySlugs: form.selectedCategorySlugs,
      subcategorySlugs: form.selectedSubcategorySlugs.map((item) => item.split("::")[1] ?? item),
      storeId: form.storeId.trim() || null,
      audienceSlug: form.audienceSlug.trim() || undefined,
      section: form.section.trim() || undefined,
      placementTags: form.placementTags.trim() ? parseCommaSeparated(form.placementTags) : null,
      price: Number(form.price),
      oldPrice: form.oldPrice.trim() ? Number(form.oldPrice) : null,
      stock: Number(form.stock),
      rating: form.rating.trim() ? Number(form.rating) : null,
      reviews: form.reviews.trim() || null,
      colorOptions: form.colorOptions.trim() ? parseCommaSeparated(form.colorOptions) : null,
      sizeOptions: form.sizeOptions.trim() ? parseCommaSeparated(form.sizeOptions) : null,
      specifications: form.specifications.trim()
        ? form.specifications
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        : null,
      status: form.status,
      imageFiles: form.imageFiles,
    };
  }

  async function handleSubmitProduct() {
    if (!token) return;

    const nextErrors = validateProductForm(form, {
      requireImage: !editingProduct || (!editingProduct.images.length && form.imageFiles.length === 0),
    });
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast({
        title: "Check product details",
        description: "Complete the required fields before saving this product.",
        tone: "error",
      });
      return;
    }

    setCreateLoading(true);
    try {
      const payload = normalizeCreatePayload();
      const savedProduct = editingProduct
        ? await updateProduct(token, editingProduct.id, payload)
        : await createProduct(token, payload);
      setProducts((current) =>
        editingProduct
          ? current.map((product) => (product.id === savedProduct.id ? savedProduct : product))
          : [savedProduct, ...current],
      );
      setSelectedProduct((current) => (current?.id === savedProduct.id ? savedProduct : current));
      setStatusProduct((current) => (current?.id === savedProduct.id ? savedProduct : current));
      showToast({
        title: editingProduct ? "Product updated" : "Product created",
        description: editingProduct
          ? `${savedProduct.name} now uses the latest category and subcategory mapping.`
          : `${savedProduct.name} is now available in the ODOS catalog.`,
        tone: "success",
      });
      closeProductModal();
    } catch (createError) {
      showToast({
        title: editingProduct ? "Unable to update product" : "Unable to create product",
        description: createError instanceof Error ? createError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!token || !statusProduct) return;
    setActionLoading(true);
    try {
      const updated = await updateProductStatus(token, statusProduct.id, pendingStatus);
      setProducts((current) =>
        current.map((product) => (product.id === updated.id ? updated : product)),
      );
      setSelectedProduct((current) => (current?.id === updated.id ? updated : current));
      setEditingProduct((current) => (current?.id === updated.id ? updated : current));
      showToast({
        title: "Product updated",
        description: `${statusProduct.name} is now ${pendingStatus}.`,
        tone: "success",
      });
      setStatusProduct(null);
    } catch (updateError) {
      showToast({
        title: "Unable to update product",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleQuickStatusUpdate(product: Product, nextStatus: ProductStatus) {
    if (!token) return;
    setActionLoading(true);
    try {
      const updated = await updateProductStatus(token, product.id, nextStatus);
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedProduct(updated);
      setStatusProduct((current) => (current?.id === updated.id ? updated : current));
      setEditingProduct((current) => (current?.id === updated.id ? updated : current));
      showToast({
        title: nextStatus === "active" && product.status === "pending" ? "Product approved" : "Product updated",
        description:
          nextStatus === "active" && product.status === "pending"
            ? `${updated.name} is now approved and can appear across ODOS.`
            : `${updated.name} is now ${nextStatus}.`,
        tone: "success",
      });
    } catch (updateError) {
      showToast({
        title: "Unable to update product",
        description: updateError instanceof Error ? updateError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading products..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadData()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Products"
        title="Product management"
        description="Review vendor submissions, approve what should go live on ODOS, and inspect the full product payload before publishing."
        actions={
          <Button leftIcon={<PackagePlus className="size-4" />} onClick={openCreateModal}>
            Create product
          </Button>
        }
      />

      <SectionCard
        title="Catalog inventory"
        description="Search products, review merchandising quality, and create real products that populate the ODOS customer experience."
        action={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products or descriptions"
              className="xl:w-80"
            />
            <FilterSelect
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              options={categoryOptions}
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Pending approval", value: "pending" },
                { label: "Active", value: "active" },
                { label: "Hidden", value: "hidden" },
                { label: "Suspended", value: "suspended" },
              ]}
            />
          </div>
        }
      >
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Create your first product or clear the filters to reveal more inventory."
          />
        ) : (
          <DataTable<Product>
            columns={[
              {
                key: "product",
                header: "Product",
                render: (product) => (
                  <div className="flex items-center gap-3">
                    <div className="size-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-textMuted">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="mt-1 text-xs text-textMuted">
                        {(product.categorySlugs?.length ?? 0) > 1
                          ? `${product.category} + ${(product.categorySlugs?.length ?? 1) - 1} more`
                          : product.category}
                      </p>
                      <p className="mt-1 text-xs text-textMuted">
                        {product.subcategory ?? "No subcategory selected"}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "store",
                header: "Store",
                render: (product) => (
                  <div>
                    <p>{product.storeName ?? "ODOS Official"}</p>
                    <p className="mt-1 text-xs text-textMuted">{product.storeId ?? "Platform store"}</p>
                  </div>
                ),
              },
              {
                key: "price",
                header: "Price",
                render: (product) => (
                  <div>
                    <p>{formatCurrency(product.price)}</p>
                    {product.oldPrice ? (
                      <p className="mt-1 text-xs text-textMuted line-through">
                        {formatCurrency(product.oldPrice)}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "rating",
                header: "Rating",
                render: (product) => (
                  <div className="flex items-center gap-2">
                    <Star className="size-4 fill-amber-300 text-amber-300" />
                    <div>
                      <p>{typeof product.rating === "number" ? product.rating.toFixed(1) : "Not set"}</p>
                      {product.reviews ? (
                        <p className="mt-1 text-xs text-textMuted">{product.reviews}</p>
                      ) : null}
                    </div>
                  </div>
                ),
              },
              {
                key: "stock",
                header: "Stock",
                render: (product) => `${product.stock} units`,
              },
              {
                key: "status",
                header: "Status",
                render: (product) => <StatusBadge status={product.status} />,
              },
              {
                key: "actions",
                header: "Actions",
                render: (product) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Eye className="size-4" />}
                      onClick={() => void openProductDetail(product)}
                    >
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon={<Edit3 className="size-4" />}
                      onClick={() => openEditModal(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      leftIcon={<Tag className="size-4" />}
                      onClick={() => {
                        setStatusProduct(product);
                        setPendingStatus(product.status);
                      }}
                    >
                      {product.status === "pending" ? "Review" : "Update status"}
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredProducts}
            keyExtractor={(product) => product.id}
          />
        )}
      </SectionCard>

      <Modal
        open={isProductModalOpen}
        onClose={closeProductModal}
        title={editingProduct ? `Edit ${editingProduct.name}` : "Create product"}
        description={
          editingProduct
            ? "Correct taxonomy, store mapping, pricing, and merchandising details without recreating the product."
            : "Build a polished ODOS product and map it to one or more categories, one or more subcategories, and the exact store it belongs to."
        }
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeProductModal} disabled={createLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmitProduct()} isLoading={createLoading}>
              {editingProduct ? "Save product" : "Create product"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Product images</label>
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-4">
              <div className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)]">
                <div className="flex h-44 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-panel">
                  {heroPreviewUrl ? (
                    <img src={heroPreviewUrl} alt="Preview" className="size-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-6 text-center text-textMuted">
                      <ImagePlus className="size-6 text-accentSoft" />
                      <span className="text-xs">Upload clean ecommerce product photos</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-sm text-textMuted file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-textStrong hover:file:bg-white/15"
                  />
                  <p className="mt-3 text-xs text-textMuted">
                    {editingProduct
                      ? "Add up to 6 total images. New uploads are cropped one by one and then added to the current product gallery."
                      : "Add up to 6 images. Each image opens a crop step before it is queued into the product gallery."}
                  </p>
                  {formErrors.imageFiles ? <p className="mt-2 text-xs text-red-300">{formErrors.imageFiles}</p> : null}
                  <div className="flex flex-wrap gap-2 text-xs text-textMuted">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                      {queuedImagePreviewUrls.length} new image(s) ready
                    </span>
                    {editingProduct ? (
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                        {existingProductImages.length} existing image(s)
                      </span>
                    ) : null}
                  </div>

                  {queuedImagePreviewUrls.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-textMuted">
                        New uploads
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {queuedImagePreviewUrls.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-panel"
                          >
                            <div className="relative aspect-square">
                              <img
                                src={url}
                                alt={`Queued upload ${index + 1}`}
                                className="size-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeQueuedImage(index)}
                                className="absolute right-2 top-2 rounded-full border border-red-400/30 bg-slate-950/80 p-1.5 text-red-100 transition hover:bg-red-500/20"
                                aria-label={`Remove queued image ${index + 1}`}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {editingProduct && existingProductImages.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-textMuted">
                        Current gallery
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {existingProductImages.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-panel"
                          >
                            <div className="aspect-square">
                              <img
                                src={url}
                                alt={`Current product image ${index + 1}`}
                                className="size-full object-cover"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Product name</label>
            <input
              className="app-input"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Women’s Ribbed Lounge Set"
            />
            {formErrors.name ? <p className="text-xs text-red-300">{formErrors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium text-textStrong">Store</label>
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
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Description</label>
            <textarea
              className="app-input min-h-28 resize-none"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Soft two-piece outfit designed for everyday comfort, easy styling, and repeat wear."
            />
            {formErrors.description ? <p className="text-xs text-red-300">{formErrors.description}</p> : null}
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-accentSoft" />
              <label className="block text-sm font-medium text-textStrong">Categories</label>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <TaxonomyChip
                    key={category.id}
                    label={category.name}
                    active={form.selectedCategorySlugs.includes(category.slug)}
                    onClick={() => toggleCategory(category.slug)}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-textMuted">
                A product can belong to one or more categories. The first selected category becomes the primary label customers see.
              </p>
              {formErrors.selectedCategorySlugs ? (
                <p className="mt-2 text-xs text-red-300">{formErrors.selectedCategorySlugs}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <StoreIcon className="size-4 text-accentSoft" />
              <label className="block text-sm font-medium text-textStrong">Subcategories</label>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              {availableSubcategories.length > 0 ? (
                <div className="flex flex-wrap gap-3">
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
                <p className="text-sm text-textMuted">
                  Select one or more categories first to unlock their subcategories.
                </p>
              )}
              <p className="mt-3 text-xs text-textMuted">
                You can attach one or more subcategories to the same product for richer discovery and filtering in the app.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Audience</label>
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
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Section</label>
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
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Placement tags</label>
            <input
              className="app-input"
              value={form.placementTags}
              onChange={(event) => updateForm("placementTags", event.target.value)}
              placeholder="flash-sale, popular, popular-new"
            />
            <p className="text-xs text-textMuted">
              Use commas for placements like `flash-sale`, `popular`, `popular-new`, `featured`.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Selling price (GHS)</label>
            <input
              className="app-input"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => updateForm("price", event.target.value)}
              placeholder="189"
            />
            {formErrors.price ? <p className="text-xs text-red-300">{formErrors.price}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Compare-at price (optional)</label>
            <input
              className="app-input"
              type="number"
              min="0"
              value={form.oldPrice}
              onChange={(event) => updateForm("oldPrice", event.target.value)}
              placeholder="240"
            />
            {formErrors.oldPrice ? <p className="text-xs text-red-300">{formErrors.oldPrice}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Stock</label>
            <input
              className="app-input"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => updateForm("stock", event.target.value)}
              placeholder="20"
            />
            {formErrors.stock ? <p className="text-xs text-red-300">{formErrors.stock}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Status</label>
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
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Rating</label>
            <input
              className="app-input"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(event) => updateForm("rating", event.target.value)}
              placeholder="4.7"
            />
            {formErrors.rating ? <p className="text-xs text-red-300">{formErrors.rating}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Reviews label</label>
            <input
              className="app-input"
              value={form.reviews}
              onChange={(event) => updateForm("reviews", event.target.value)}
              placeholder="128 reviews"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Colors</label>
            <input
              className="app-input"
              value={form.colorOptions}
              onChange={(event) => updateForm("colorOptions", event.target.value)}
              placeholder="Black, Sand, Sage"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-textStrong">Sizes</label>
            <input
              className="app-input"
              value={form.sizeOptions}
              onChange={(event) => updateForm("sizeOptions", event.target.value)}
              placeholder="S, M, L, XL"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-textStrong">Specifications</label>
            <textarea
              className="app-input min-h-28 resize-none"
              value={form.specifications}
              onChange={(event) => updateForm("specifications", event.target.value)}
              placeholder={"Processor: Intel Core i7\nRAM: 16GB\nStorage: 512GB SSD"}
            />
            <p className="text-xs text-textMuted">
              Add one specification per line for products like laptops, appliances, gadgets, or detailed apparel sizing.
            </p>
          </div>
        </div>
      </Modal>

      <ImageCropModal
        open={Boolean(activeCropFile)}
        file={activeCropFile}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
      />

      <Modal
        open={Boolean(selectedProduct)}
        onClose={closeProductDetail}
        title={selectedProduct?.name ?? "Product details"}
        description={
          selectedProduct?.status === "pending"
            ? "Review the full vendor submission before approving it for ODOS."
            : "Full product submission, merchandising setup, and current catalog state."
        }
        size="xl"
        footer={
          selectedProduct ? (
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={closeProductDetail} disabled={actionLoading}>
                Close
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Tag className="size-4" />}
                onClick={() => {
                  setStatusProduct(selectedProduct);
                  setPendingStatus(selectedProduct.status);
                }}
                disabled={actionLoading}
              >
                Change status
              </Button>
              {selectedProduct.status === "pending" ? (
                <Button
                  leftIcon={<CheckCircle2 className="size-4" />}
                  onClick={() => void handleQuickStatusUpdate(selectedProduct, "active")}
                  isLoading={actionLoading}
                >
                  Approve and publish
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {selectedProduct ? (
          <div className="space-y-5">
            {productDetailError ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {productDetailError}
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                {selectedProduct.images[detailImageIndex] ? (
                  <img
                    src={selectedProduct.images[detailImageIndex]}
                    alt={selectedProduct.name}
                    className="h-80 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-80 items-center justify-center text-sm text-textMuted">
                    No product image uploaded
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={selectedProduct.status} />
                    {selectedProduct.status === "pending" ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
                        <Clock3 className="size-3.5" />
                        Awaiting admin approval
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-textMuted">
                    {selectedProduct.status === "pending"
                      ? "This product was submitted by a vendor and is currently blocked from the ODOS shopper experience until an admin approves it."
                      : "This product is already part of the managed ODOS catalog. Review the submission details and merchandising choices below."}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-textMuted">
                    Submission gallery
                  </p>
                  {selectedProduct.images.length > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {selectedProduct.images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setDetailImageIndex(index)}
                          className={`overflow-hidden rounded-2xl border transition ${
                            detailImageIndex === index
                              ? "border-accent/40 shadow-glow"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-textMuted">No gallery images were uploaded for this product.</p>
                  )}
                </div>
              </div>
            </div>

            {productDetailLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-textMuted">
                Refreshing full product details...
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ProductDetailRow
                label="Vendor"
                value={
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserRound className="size-4 text-accentSoft" />
                      <span>{selectedProduct.vendorName ?? "ODOS Admin"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-textMuted">
                      <Mail className="size-4" />
                      <span>{selectedProduct.vendorEmail ?? "No vendor email"}</span>
                    </div>
                  </div>
                }
              />
              <ProductDetailRow
                label="Store"
                value={
                  <div className="space-y-2">
                    <p>{selectedProduct.storeName ?? "ODOS Official"}</p>
                    <p className="text-textMuted">{selectedProduct.storeSlug ?? selectedProduct.storeId ?? "Platform store"}</p>
                    <p className="text-textMuted">{selectedProduct.storeCategory ?? "No store category"}</p>
                  </div>
                }
              />
              <ProductDetailRow
                label="Location"
                value={
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-accentSoft" />
                      <span>{selectedProduct.storeLocation ?? "No store location"}</span>
                    </div>
                    <p className="text-textMuted">
                      {[selectedProduct.storeCity, selectedProduct.storeRegion].filter(Boolean).join(", ") || "Region not set"}
                    </p>
                  </div>
                }
              />
              <ProductDetailRow
                label="Categories"
                value={
                  selectedProduct.categorySlugs?.length
                    ? selectedProduct.categorySlugs
                        .map((slug) => categoriesBySlug.get(slug)?.name ?? slug)
                        .join(", ")
                    : selectedProduct.category
                }
              />
              <ProductDetailRow
                label="Subcategories"
                value={
                  selectedProduct.subcategorySlugs?.length
                    ? selectedProduct.subcategorySlugs
                        .map((slug) => subcategoryLabelBySlug.get(normalizeTaxonomyValue(slug)) ?? slug)
                        .join(", ")
                    : selectedProduct.subcategory ?? "Not set"
                }
              />
              <ProductDetailRow label="Audience" value={selectedProduct.audienceSlug ?? "All shoppers"} />
              <ProductDetailRow label="Section" value={selectedProduct.section ?? "Default placement"} />
              <ProductDetailRow
                label="Placements"
                value={selectedProduct.placementTags?.join(", ") ?? "Not set"}
              />
              <ProductDetailRow label="Price" value={formatCurrency(selectedProduct.price)} />
              <ProductDetailRow
                label="Compare-at price"
                value={selectedProduct.oldPrice ? formatCurrency(selectedProduct.oldPrice) : "Not set"}
              />
              <ProductDetailRow
                label="Discount"
                value={selectedProduct.discount ?? "No discount generated"}
              />
              <ProductDetailRow label="Stock" value={`${selectedProduct.stock} units`} />
              <ProductDetailRow
                label="Rating"
                value={
                  typeof selectedProduct.rating === "number"
                    ? `${selectedProduct.rating.toFixed(1)}${selectedProduct.reviews ? ` · ${selectedProduct.reviews}` : ""}`
                    : "Not set"
                }
              />
              <ProductDetailRow
                label="Colors"
                value={selectedProduct.colorOptions?.join(", ") ?? "Not defined"}
              />
              <ProductDetailRow
                label="Sizes"
                value={selectedProduct.sizeOptions?.join(", ") ?? "Not defined"}
              />
              <ProductDetailRow
                label="Specifications"
                value={
                  selectedProduct.specifications?.length ? (
                    <ul className="space-y-2">
                      {selectedProduct.specifications.map((item) => (
                        <li key={item} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "Not defined"
                  )
                }
              />
              <ProductDetailRow label="Image key" value={selectedProduct.imageKey} />
              <ProductDetailRow label="Product ID" value={selectedProduct.id} />
              <ProductDetailRow label="Created" value={formatDate(selectedProduct.createdAt)} />
              <ProductDetailRow label="Last updated" value={formatDate(selectedProduct.updatedAt)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProductDetailRow label="Description" value={selectedProduct.description} />
              <ProductDetailRow
                label="Approval notes"
                value={
                  selectedProduct.status === "pending"
                    ? "Review pricing, images, taxonomy, and brand/store correctness before publishing to the shopper app."
                    : "This listing has already passed review or was created directly from the admin side."
                }
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(statusProduct)}
        onClose={() => {
          if (!actionLoading) {
            setStatusProduct(null);
          }
        }}
        title={statusProduct ? `Update ${statusProduct.name}` : "Update product"}
        description="Choose whether this product should stay pending, go live, remain hidden, or be suspended."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setStatusProduct(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleStatusUpdate()} isLoading={actionLoading}>
              Save status
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-textStrong">Product status</label>
          <select
            className="app-select"
            value={pendingStatus}
            onChange={(event) => setPendingStatus(event.target.value as ProductStatus)}
          >
            <option value="pending" className="bg-panel">Pending approval</option>
            <option value="active" className="bg-panel">Active</option>
            <option value="hidden" className="bg-panel">Hidden</option>
            <option value="suspended" className="bg-panel">Suspended</option>
          </select>
          {statusProduct?.status === "pending" ? (
            <p className="text-xs text-textMuted">
              `Active` approves the product and makes it available to ODOS shoppers. `Hidden` keeps the listing out of the app without removing the submission.
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
