import {
  CheckCircle2,
  Clock3,
  Edit3,
  Mail,
  MapPin,
  Sparkles,
  Star,
  Tag,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { getCategories } from "@/api/categoriesApi";
import { getProduct, getProductsPage, updateProductStatus } from "@/api/productsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useToast } from "@/hooks/useToast";
import type { Category, Product, ProductStatus } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { normalizeTaxonomyValue } from "@/utils/productStudio";

function ProductDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <div className="mt-2 text-sm text-textStrong">{value}</div>
    </div>
  );
}

export function FullProductsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: products,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getProductsPage,
    getId: (product) => product.id,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [statusProduct, setStatusProduct] = useState<Product | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ProductStatus>("active");
  const [actionLoading, setActionLoading] = useState(false);
  const [productDetailLoading, setProductDetailLoading] = useState(false);
  const [productDetailError, setProductDetailError] = useState<string | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      setCategories(await getCategories(token));
    } catch {
      // category filters still work with empty taxonomy
    }
  }, [token]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

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

  function closeProductDetail() {
    setSelectedProduct(null);
    setProductDetailError(null);
    setProductDetailLoading(false);
    setDetailImageIndex(0);
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

  async function handleStatusUpdate() {
    if (!token || !statusProduct) return;
    setActionLoading(true);
    try {
      const updated = await updateProductStatus(token, statusProduct.id, pendingStatus);
      replaceItem(updated);
      setSelectedProduct((current) => (current?.id === updated.id ? updated : current));
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
      replaceItem(updated);
      setSelectedProduct(updated);
      setStatusProduct((current) => (current?.id === updated.id ? updated : current));
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

  return (
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Products"
        title="Complete product catalog"
        description="Browse, create, edit in studio, and inspect every product listing."
        backRoute="/products"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <Button
            leftIcon={<Sparkles className="size-4" />}
            onClick={() => navigate("/products/full/new")}
          >
            Create in studio
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
        <AdminInfiniteList
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
                      variant="primary"
                      leftIcon={<Edit3 className="size-4" />}
                      onClick={() => navigate(`/products/full/${product.id}/studio`)}
                    >
                      Open studio
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/products/full/${product.id}`)}
                    >
                      Open dossier
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
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={() => void loadMore()}
            onRetry={() => void refresh()}
            emptyTitle="No products found"
            emptyDescription="Create your first product or clear the filters to reveal more inventory."
          />
      </SectionCard>


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
