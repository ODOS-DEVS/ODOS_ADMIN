import { mockCategories } from "@/data/mockData";
import type { Category } from "@/types";
import { mapCategory } from "@/api/mappers";
import { requestJson, withFallback } from "@/api/client";

export async function getCategories(token: string) {
  return withFallback<Category[]>(
    async () => {
      const categories = await requestJson<
        Array<{
          id: string;
          name: string;
          slug: string;
          description: string;
          image?: string | null;
          image_url?: string | null;
          subcategories?: string[] | null;
          status: Category["status"];
          created_at: string;
        }>
      >("/admin/categories", { token });
      return categories.map(mapCategory);
    },
    () => mockCategories,
  );
}

type CategoryDraft = Pick<
  Category,
  "name" | "slug" | "description" | "image" | "status" | "subcategories"
> & {
  imageFile?: File | null;
};

export async function createCategory(token: string, payload: CategoryDraft) {
  return withFallback<Category>(
    async () => {
      const formData = new FormData();
      formData.append("name", payload.name.trim());
      formData.append("slug", payload.slug.trim());
      formData.append("description", payload.description.trim());
      formData.append("status", payload.status);
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
    },
    () => {
      const category: Category = {
        id: `category-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...payload,
        imageUrl: payload.imageFile ? URL.createObjectURL(payload.imageFile) : null,
      };
      mockCategories.unshift(category);
      return category;
    },
  );
}

export async function updateCategory(token: string, categoryId: string, payload: CategoryDraft) {
  return withFallback<Category>(
    async () => {
      const formData = new FormData();
      formData.append("name", payload.name.trim());
      formData.append("slug", payload.slug.trim());
      formData.append("description", payload.description.trim());
      formData.append("status", payload.status);
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
    },
    () => {
      const index = mockCategories.findIndex((item) => item.id === categoryId);
      if (index < 0) {
        throw new Error("Category not found");
      }
      mockCategories[index] = {
        ...mockCategories[index],
        ...payload,
        imageUrl: payload.imageFile
          ? URL.createObjectURL(payload.imageFile)
          : mockCategories[index].imageUrl ?? null,
      };
      return mockCategories[index];
    },
  );
}

export async function deleteCategory(token: string, categoryId: string) {
  return withFallback<{ success: true }>(
    () =>
      requestJson(`/admin/categories/${categoryId}`, {
        method: "DELETE",
        token,
      }),
    () => {
      const category = mockCategories.find((item) => item.id === categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      category.status = "disabled";
      return { success: true as const };
    },
  );
}
