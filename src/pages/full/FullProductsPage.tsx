import {
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Package,
  Plus,
  Star,
  Tag,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { getCategories } from "@/api/categoriesApi";
import { getProduct, getProductsPage, updateProductStatus } from "@/api/productsApi";
import { AdminInfiniteList } from "@/components/admin/AdminInfiniteList";
import { AdminFullHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import {
  ProductNameCell,
  ProductsDirectorySkeleton,
  ProductTableActions,
} from "@/components/products/ProductsDirectoryUi";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { TABLE_ACTIONS_COLUMN_CLASS_WIDE } from "@/components/ui/IconButton";
import { ListToolbar, ListToolbarField } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { Category, Product, ProductStatus } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { formatPaginationRange } from "@/utils/paginationUi";
import { normalizeTaxonomyValue } from "@/utils/productStudio";

import { DetailField, DetailFields, DetailSection, DetailStack } from "@/components/ui/DetailList";

const TOOLBAR_CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm shadow-sm";

export function FullProductsPage() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items: products,
    isLoading,
    page,
    pageSize,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
  } = useInfiniteAdminList({
    loadPage: getProductsPage,
    getId: (product) => product.id,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    stockFilter,
  } = useQueueSearchParams({
    statusValues: ["pending", "active", "hidden", "suspended"],
  });
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
      const matchesStock =
        stockFilter !== "low"
          ? true
          : product.stock > 0 && product.stock <= 2 && product.status === "active";

      return matchesQuery && matchesStatus && matchesCategory && matchesStock;
    });
  }, [categoriesBySlug, categoryFilter, products, query, statusFilter, stockFilter]);

  const snapshot = useMemo(() => {
    const active = products.filter((product) => product.status === "active").length;
    const pending = products.filter((product) => product.status === "pending").length;
    return { total: products.length, active, pending };
  }, [products]);

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredProducts.length })}${
    hasMore ? " · more pages available" : ""
  }`;

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
            ? `${updated.name} is approved and active.`
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

  if (isLoading && products.length === 0) {
    return <ProductsDirectorySkeleton />;
  }

  return (
    <div className="space-y-5">
      <AdminFullHeader
        eyebrow="Products"
        title="Product list"
        description={`${snapshot.total} loaded · ${snapshot.pending} pending approval · search, filter, edit, or change status.`}
        backRoute="/products"
        onRefresh={() => void refresh()}
        refreshing={isLoading}
        actions={
          <HeaderActionButton
            leftIcon={<Plus className="size-4" />}
            onClick={() => navigate("/products/full/new")}
          >
            Add product
          </HeaderActionButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="On this page" value={String(snapshot.total)} icon={Package} animationDelay={40} />
        <StatCard
          label="Active"
          value={String(snapshot.active)}
          icon={CheckCircle2}
          tone="success"
          animationDelay={80}
        />
        <StatCard
          label="Pending"
          value={String(snapshot.pending)}
          hint="Needs approval"
          icon={Clock3}
          tone="warning"
          animationDelay={120}
        />
      </div>

      <SectionCard
        compact
        title="All products"
        action={
          <ListToolbar>
            <ListToolbarField className="sm:min-w-[16rem]">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, store, category"
                className={`${TOOLBAR_CONTROL_CLASS} py-0`}
              />
            </ListToolbarField>
            <ListToolbarField className="sm:min-w-[11rem]">
              <FilterSelect
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                options={categoryOptions}
                className={`${TOOLBAR_CONTROL_CLASS} outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10`}
              />
            </ListToolbarField>
            <ListToolbarField className="sm:min-w-[11rem]">
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
                className={`${TOOLBAR_CONTROL_CLASS} outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10`}
              />
            </ListToolbarField>
          </ListToolbar>
        }
        bodyClassName="p-0"
      >
        <AdminInfiniteList
          compact
          listSummary={listSummary}
          columns={[
            {
              key: "product",
              header: "Product",
              className: "min-w-[220px]",
              render: (product) => <ProductNameCell product={product} />,
            },
            {
              key: "store",
              header: "Store",
              className: "min-w-[120px]",
              render: (product) => (
                <p className="truncate text-sm text-textStrong">{product.storeName ?? "ODOS Official"}</p>
              ),
            },
            {
              key: "price",
              header: "Price",
              className: "whitespace-nowrap tabular-nums",
              render: (product) => (
                <div>
                  <p className="font-medium text-textStrong">{formatCurrency(product.price)}</p>
                  {product.oldPrice ? (
                    <p className="text-xs text-textMuted line-through">{formatCurrency(product.oldPrice)}</p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "rating",
              header: "Rating",
              className: "w-[5rem]",
              render: (product) => (
                <div className="flex items-center gap-1 text-sm tabular-nums">
                  <Star className="size-3.5 fill-amber-300 text-amber-300" aria-hidden />
                  {typeof product.rating === "number" ? product.rating.toFixed(1) : "—"}
                </div>
              ),
            },
            {
              key: "stock",
              header: "Stock",
              className: "w-[5rem] tabular-nums text-sm",
              render: (product) => product.stock,
            },
            {
              key: "status",
              header: "Status",
              className: "w-[7.5rem]",
              render: (product) => <StatusBadge status={product.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              className: TABLE_ACTIONS_COLUMN_CLASS_WIDE,
              render: (product) => (
                <ProductTableActions
                  product={product}
                  onEdit={() => navigate(`/products/full/${product.id}/studio`)}
                  onOpenDetail={() => navigate(`/products/full/${product.id}`)}
                  onStatus={() => {
                    setStatusProduct(product);
                    setPendingStatus(product.status);
                  }}
                />
              ),
            },
          ]}
          data={filteredProducts}
          keyExtractor={(product) => product.id}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          isLoadingPage={isLoadingPage}
          hasMore={hasMore}
          error={error}
          onPageChange={goToPage}
          onRetry={() => void refresh()}
          emptyTitle="No products found"
          emptyDescription="Clear filters or add a product."
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
          <DetailStack>
            {productDetailError ? (
              <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                {productDetailError}
              </div>
            ) : null}

            <div className="grid gap-6 border-b border-line/90 pb-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)]">
              <div className="overflow-hidden rounded-lg bg-surfaceMuted ring-1 ring-line/80">
                {selectedProduct.images[detailImageIndex] ? (
                  <img
                    src={selectedProduct.images[detailImageIndex]}
                    alt={selectedProduct.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm text-textMuted">
                    No product image uploaded
                  </div>
                )}
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedProduct.status} />
                    {selectedProduct.status === "pending" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                        <Clock3 className="size-3.5" />
                        Awaiting admin approval
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-textMuted">
                    {selectedProduct.status === "pending"
                      ? "Submitted by a vendor and blocked from the shopper experience until approved."
                      : "Part of the managed catalog. Review listing and merchandising below."}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-textMuted">Gallery</p>
                  {selectedProduct.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setDetailImageIndex(index)}
                          className={`overflow-hidden rounded-lg ring-1 transition ${
                            detailImageIndex === index
                              ? "ring-accent/50"
                              : "ring-line/80 hover:ring-line"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            className="aspect-square w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textMuted">No gallery images uploaded.</p>
                  )}
                </div>
              </div>
            </div>

            {productDetailLoading ? (
              <p className="text-sm text-textMuted">Refreshing full product details…</p>
            ) : null}

            <DetailSection title="Listing details">
              <DetailFields columns={2}>
              <DetailField
                label="Vendor"
                value={
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserRound className="size-4 text-textMuted" />
                      <span>{selectedProduct.vendorName ?? "ODOS Admin"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-textMuted">
                      <Mail className="size-4" />
                      <span>{selectedProduct.vendorEmail ?? "No vendor email"}</span>
                    </div>
                  </div>
                }
              />
              <DetailField
                label="Store"
                value={
                  <div className="space-y-2">
                    <p>{selectedProduct.storeName ?? "ODOS Official"}</p>
                    <p className="text-textMuted">{selectedProduct.storeSlug ?? selectedProduct.storeId ?? "Platform store"}</p>
                    <p className="text-textMuted">{selectedProduct.storeCategory ?? "No store category"}</p>
                  </div>
                }
              />
              <DetailField
                label="Location"
                value={
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-textMuted" />
                      <span>{selectedProduct.storeLocation ?? "No store location"}</span>
                    </div>
                    <p className="text-textMuted">
                      {[selectedProduct.storeCity, selectedProduct.storeRegion].filter(Boolean).join(", ") || "Region not set"}
                    </p>
                  </div>
                }
              />
              <DetailField
                label="Categories"
                value={
                  selectedProduct.categorySlugs?.length
                    ? selectedProduct.categorySlugs
                        .map((slug) => categoriesBySlug.get(slug)?.name ?? slug)
                        .join(", ")
                    : selectedProduct.category
                }
              />
              <DetailField
                label="Subcategories"
                value={
                  selectedProduct.subcategorySlugs?.length
                    ? selectedProduct.subcategorySlugs
                        .map((slug) => subcategoryLabelBySlug.get(normalizeTaxonomyValue(slug)) ?? slug)
                        .join(", ")
                    : selectedProduct.subcategory ?? "Not set"
                }
              />
              <DetailField label="Audience" value={selectedProduct.audienceSlug ?? "All shoppers"} />
              <DetailField label="Section" value={selectedProduct.section ?? "Default placement"} />
              <DetailField
                label="Placements"
                value={selectedProduct.placementTags?.join(", ") ?? "Not set"}
              />
              <DetailField label="Price" value={formatCurrency(selectedProduct.price)} />
              <DetailField
                label="Compare-at price"
                value={selectedProduct.oldPrice ? formatCurrency(selectedProduct.oldPrice) : "Not set"}
              />
              <DetailField
                label="Discount"
                value={selectedProduct.discount ?? "No discount generated"}
              />
              <DetailField label="Stock" value={`${selectedProduct.stock} units`} />
              <DetailField
                label="Rating"
                value={
                  typeof selectedProduct.rating === "number"
                    ? `${selectedProduct.rating.toFixed(1)}${selectedProduct.reviews ? ` · ${selectedProduct.reviews}` : ""}`
                    : "Not set"
                }
              />
              <DetailField
                label="Colors"
                value={selectedProduct.colorOptions?.join(", ") ?? "Not defined"}
              />
              <DetailField
                label="Sizes"
                value={selectedProduct.sizeOptions?.join(", ") ?? "Not defined"}
              />
              <DetailField
                label="Specifications"
                value={
                  selectedProduct.specifications?.length ? (
                    <ul className="list-disc space-y-1 pl-4 text-textStrong">
                      {selectedProduct.specifications.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    "Not defined"
                  )
                }
              />
              <DetailField label="Image key" value={selectedProduct.imageKey} />
              <DetailField label="Product ID" value={selectedProduct.id} />
              <DetailField label="Created" value={formatDate(selectedProduct.createdAt)} />
              <DetailField label="Last updated" value={formatDate(selectedProduct.updatedAt)} />
              </DetailFields>
            </DetailSection>

            <DetailSection title="Copy">
              <DetailFields columns={1}>
              <DetailField label="Description" value={selectedProduct.description} />
              <DetailField
                label="Approval notes"
                value={
                  selectedProduct.status === "pending"
                    ? "Review pricing, images, categories, and store before approving."
                    : "This listing was already reviewed or created from admin."
                }
              />
              </DetailFields>
            </DetailSection>
          </DetailStack>
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
