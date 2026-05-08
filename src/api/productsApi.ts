import { mockProducts } from "@/data/mockData";
import type { Product, ProductStatus } from "@/types";
import { mapProduct } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

type BackendProduct = {
  id: string;
  store_id: string | null;
  store_name?: string | null;
  vendor_id: string | null;
  name: string;
  description: string;
  images: string[];
  image_key?: string;
  category: string;
  category_slugs?: string[] | null;
  audience_slug?: string | null;
  section?: string | null;
  price: number;
  old_price?: number | null;
  discount?: string | null;
  rating?: number | null;
  reviews?: string | null;
  stock: number;
  status: ProductStatus;
  created_at: string;
  subcategory?: string | null;
  subcategory_slugs?: string[] | null;
  specifications?: string[] | null;
};

export type CreateProductInput = {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  categorySlugs?: string[] | null;
  subcategorySlugs?: string[] | null;
  storeId?: string | null;
  audienceSlug?: string;
  section?: string;
  placementTags?: string[] | null;
  price: number;
  oldPrice?: number | null;
  stock: number;
  rating?: number | null;
  reviews?: string | null;
  colorOptions?: string[] | null;
  sizeOptions?: string[] | null;
  specifications?: string[] | null;
  status: ProductStatus;
  imageFiles?: File[] | null;
};

export async function getProducts(token: string) {
  return withFallback<Product[]>(
    async () => {
      const products = await requestJson<BackendProduct[]>("/admin/products", { token });
      return products.map(mapProduct);
    },
    () => mockProducts,
  );
}

function buildProductFormData(input: CreateProductInput) {
  const formData = new FormData();
  formData.append("name", input.name.trim());
  formData.append("description", input.description.trim());
  formData.append("category", input.category.trim());
  formData.append("price", String(input.price));
  formData.append("stock", String(input.stock));
  formData.append("status", input.status);
  if (input.storeId?.trim()) {
    formData.append("store_id", input.storeId.trim());
  }
  if (input.audienceSlug?.trim()) {
    formData.append("audience_slug", input.audienceSlug.trim());
  }
  if (input.section?.trim()) {
    formData.append("section", input.section.trim());
  }
  if (input.subcategory?.trim()) {
    formData.append("subcategory", input.subcategory.trim());
  }
  if (input.categorySlugs?.length) {
    formData.append("category_slugs", input.categorySlugs.join(", "));
  }
  if (input.subcategorySlugs?.length) {
    formData.append("subcategory_slugs", input.subcategorySlugs.join(", "));
  }
  if (typeof input.oldPrice === "number") {
    formData.append("old_price", String(input.oldPrice));
  }
  if (typeof input.rating === "number") {
    formData.append("rating", String(input.rating));
  }
  if (input.reviews?.trim()) {
    formData.append("reviews", input.reviews.trim());
  }
  if (input.placementTags?.length) {
    formData.append("placement_tags", input.placementTags.join(", "));
  }
  if (input.colorOptions?.length) {
    formData.append("color_options", input.colorOptions.join(", "));
  }
  if (input.sizeOptions?.length) {
    formData.append("size_options", input.sizeOptions.join(", "));
  }
  if (input.specifications?.length) {
    formData.append("specifications", input.specifications.join("\n"));
  }
  for (const imageFile of input.imageFiles ?? []) {
    formData.append("images", imageFile);
  }

  return formData;
}

export async function createProduct(token: string, input: CreateProductInput) {
  const formData = buildProductFormData(input);

  const product = await requestJson<BackendProduct>("/admin/products", {
    method: "POST",
    token,
    body: formData,
  });
  return mapProduct(product);
}

export async function updateProduct(token: string, productId: string, input: CreateProductInput) {
  const formData = buildProductFormData(input);

  const product = await requestJson<BackendProduct>(`/admin/products/${productId}`, {
    method: "PATCH",
    token,
    body: formData,
  });
  return mapProduct(product);
}

export async function updateProductStatus(token: string, productId: string, status: ProductStatus) {
  return withFallback<Product>(
    async () => {
      const product = await requestJson<BackendProduct>(`/admin/products/${productId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      return mapProduct(product);
    },
    () => {
      const product = mockProducts.find((item) => item.id === productId);
      if (!product) {
        throw new Error("Product not found");
      }
      product.status = status;
      return product;
    },
  );
}
