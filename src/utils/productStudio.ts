import type { CreateProductInput } from "@/api/productsApi";
import type { Category, Product, ProductStatus } from "@/types";

export type ProductFormState = {
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

export type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

export const DEFAULT_PRODUCT_FORM_STATE: ProductFormState = {
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

export const AUDIENCE_OPTIONS = [
  { label: "Use store audience / all shoppers", value: "" },
  { label: "Ladies", value: "ladies" },
  { label: "Gents", value: "gents" },
  { label: "Kids", value: "kids" },
];

export const SECTION_OPTIONS = [
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

export function parseCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeTaxonomyValue(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSubcategoryKey(categorySlug: string, subcategory: string) {
  return `${categorySlug}::${subcategory}`;
}

export function revokePreviewUrls(urls: string[]) {
  for (const url of urls) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}

export function validateProductForm(
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

export function buildFormStateFromProduct(product: Product, categories: Category[]): ProductFormState {
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
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

export function buildCreatePayload(
  form: ProductFormState,
  selectedCategories: Category[],
  availableSubcategories: Array<{ slug: string; label: string }>,
): CreateProductInput {
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

export function getAvailableSubcategories(
  selectedCategories: Category[],
): Array<{ slug: string; categorySlug: string; label: string }> {
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
}
