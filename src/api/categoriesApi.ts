import type { Category } from "@/types";
import { mapCategory } from "@/api/mappers";
import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

type BackendCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string | null;
  image_url?: string | null;
  subcategories?: string[] | null;
  status: Category["status"];
  created_at: string;
};

const categoriesListApi = createPaginatedAdminApi<BackendCategory, Category>({
  path: "/admin/categories",
  mapItem: mapCategory,
});

export const getCategoriesPage = categoriesListApi.getPage;
export const getCategories = categoriesListApi.getAll;

type CategoryDraft = Pick<
  Category,
  "name" | "description" | "status" | "subcategories"
> & {
  slug?: string;
  image?: string | null;
  imageFile?: File | null;
};

export async function createCategory(token: string, payload: CategoryDraft) {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("description", payload.description.trim());
  formData.append("status", payload.status);
  if (payload.slug?.trim()) {
    formData.append("slug", payload.slug.trim());
  }
  if (payload.image?.trim()) {
    formData.append("image", payload.image.trim());
  }
  if (payload.subcategories?.length) {
    formData.append("subcategories", payload.subcategories.join("\n"));
  }
  if (payload.imageFile) {
    formData.append("image_file", payload.imageFile);
  }

  const category = await requestJson<{
    id: string;
    name: string;
    slug: string;
    description: string;
    image?: string | null;
    image_url?: string | null;
    subcategories?: string[] | null;
    status: Category["status"];
    created_at: string;
  }>("/admin/categories", {
    method: "POST",
    token,
    body: formData,
  });
  return mapCategory(category);
}

export async function updateCategory(
  token: string,
  categoryId: string,
  payload: CategoryDraft,
) {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("description", payload.description.trim());
  formData.append("status", payload.status);
  if (payload.slug?.trim()) {
    formData.append("slug", payload.slug.trim());
  }
  if (payload.image?.trim()) {
    formData.append("image", payload.image.trim());
  }
  if (payload.subcategories?.length) {
    formData.append("subcategories", payload.subcategories.join("\n"));
  }
  if (payload.imageFile) {
    formData.append("image_file", payload.imageFile);
  }

  const category = await requestJson<{
    id: string;
    name: string;
    slug: string;
    description: string;
    image?: string | null;
    image_url?: string | null;
    subcategories?: string[] | null;
    status: Category["status"];
    created_at: string;
  }>(`/admin/categories/${categoryId}`, {
    method: "PATCH",
    token,
    body: formData,
  });
  return mapCategory(category);
}

export async function deleteCategory(
  token: string,
  categoryId: string,
  options?: { permanent?: boolean },
) {
  const suffix = options?.permanent ? "?permanent=true" : "";
  return requestJson<{ success: true }>(
    `/admin/categories/${categoryId}${suffix}`,
    {
      method: "DELETE",
      token,
    },
  );
}
