import {
  CheckCircle2,
  Clock3,
  Download,
  Mail,
  MapPin,
  Package,
  PackageX,
  Plus,
  Star,
  Tag,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { getCategories } from "@/api/categoriesApi";
import { getProduct, getProductsPage, updateProductStatus } from "@/api/productsApi";
import { DirectoryFooter } from "@/components/directory/DirectoryFooter";
import { DirectoryTable, type DirectoryColumn, type SortState } from "@/components/directory/DirectoryTable";
import { DirectoryToolbar } from "@/components/directory/DirectoryToolbar";
import { MetricStat } from "@/components/directory/MetricStat";
import { SegmentedTabs, type SegmentedTab } from "@/components/directory/SegmentedTabs";
import { SelectionAction, SelectionBar } from "@/components/directory/SelectionBar";
import { StatePill } from "@/components/directory/StatePill";
import { StockMeter } from "@/components/directory/StockMeter";
import { labelForStatus, toneForStatus } from "@/components/directory/statusTone";
import { AdminFullHeader, HeaderActionButton } from "@/components/admin/AdminShell";
import {
  ProductMark,
  ProductsDirectorySkeleton,
  ProductTableActions,
} from "@/components/products/ProductsDirectoryUi";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { TABLE_ACTIONS_COLUMN_CLASS_WIDE } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useInfiniteAdminList } from "@/hooks/useInfiniteAdminList";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { Category, Product, ProductStatus } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { exportCsv } from "@/utils/exportCsv";
import { formatPaginationRange } from "@/utils/paginationUi";
import { normalizeTaxonomyValue } from "@/utils/productStudio";

import { DetailField, DetailFields, DetailSection, DetailStack } from "@/components/ui/DetailList";

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
    const outOfStock = products.filter((product) => product.stock <= 0).length;
    return { total: products.length, active, pending, outOfStock };
  }, [products]);

  const listSummary = `${formatPaginationRange({ page, pageSize, itemCount: filteredProducts.length })}${
    hasMore ? " · more pages available" : ""
  }`;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ key: "created", direction: "desc" });

  const statusTabs = useMemo<Array<SegmentedTab<string>>>(() => {
    const countFor = (status: string) =>
      products.filter((product) => product.status === status).length;
    return [
      { value: "all", label: "All", count: products.length },
      { value: "active", label: "Active", count: countFor("active") },
      { value: "pending", label: "Pending", count: countFor("pending") },
      { value: "hidden", label: "Hidden", count: countFor("hidden") },
      { value: "suspended", label: "Suspended", count: countFor("suspended") },
    ];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (!sort) return filteredProducts;
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filteredProducts].sort((left, right) => {
      switch (sort.key) {
        case "product":
          return left.name.localeCompare(right.name) * direction;
        case "price":
          return (left.price - right.price) * direction;
        case "stock":
          return (left.stock - right.stock) * direction;
        case "created":
        default:
          return (
            (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction
          );
      }
    });
  }, [filteredProducts, sort]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((previous) => {
      const allSelected = ids.length > 0 && ids.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...ids]);
    });
  }, []);

  const changeSort = useCallback((key: string) => {
    setSort((previous) => {
      if (previous?.key === key) {
        return { key, direction: previous.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const exportProducts = useCallback((rows: Product[]) => {
    exportCsv(`odos-products-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
      { header: "Product", value: (product) => product.name },
      { header: "Store", value: (product) => product.storeName ?? "ODOS Official" },
      { header: "Category", value: (product) => product.category },
      { header: "Price", value: (product) => product.price },
      { header: "Compare at", value: (product) => product.oldPrice ?? "" },
      { header: "Stock", value: (product) => product.stock },
      { header: "Status", value: (product) => product.status },
      { header: "Created", value: (product) => product.createdAt },
    ]);
  }, []);

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

  const productColumns = useMemo<Array<DirectoryColumn<Product>>>(
    () => [
      {
        key: "product",
        header: "Product name",
        sortable: true,
        className: "min-w-[15rem]",
        render: (product) => (
          <div className="flex min-w-0 items-center gap-3">
            <ProductMark name={product.name} imageUrl={product.images[0]} />
            <div className="min-w-0">
              <p className="truncate font-medium text-textStrong">{product.name}</p>
              <p className="truncate text-xs text-textMuted">
                {product.category}
                {product.storeName ? ` · ${product.storeName}` : ""}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "created",
        header: "ID & created",
        sortable: true,
        className: "min-w-[10rem]",
        render: (product) => (
          <div className="min-w-0">
            <p className="truncate font-mono text-[13px] text-textStrong">#{product.id}</p>
            <p className="mt-0.5 text-xs text-textMuted">{formatDate(product.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "price",
        header: "Price",
        sortable: true,
        className: "whitespace-nowrap",
        render: (product) => (
          <div>
            <p className="font-semibold tabular-nums text-textStrong">
              {formatCurrency(product.price)}
            </p>
            {product.oldPrice ? (
              <p className="mt-0.5 text-xs tabular-nums text-textMuted line-through">
                {formatCurrency(product.oldPrice)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "stock",
        header: "Stock",
        sortable: true,
        className: "w-[7.5rem]",
        render: (product) => <StockMeter stock={product.stock} />,
      },
      {
        key: "status",
        header: "Status",
        className: "w-[8.5rem]",
        render: (product) => (
          <StatePill
            label={labelForStatus(product.status)}
            tone={toneForStatus(product.status)}
          />
        ),
      },
      {
        key: "actions",
        header: "Action",
        className: TABLE_ACTIONS_COLUMN_CLASS_WIDE,
        render: (product) => (
          <ProductTableActions
            product={product}
            onEdit={() => navigate(`/products/full/${product.id}/studio`)}
            onOpenDetail={() => void openProductDetail(product)}
            onStatus={() => {
              setStatusProduct(product);
              setPendingStatus(product.status);
            }}
          />
        ),
      },
    ],
    // openProductDetail is a stable function declaration on this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate],
  );

  if (isLoading && products.length === 0) {
    return <ProductsDirectorySkeleton />;
  }

  return (
    <div className="space-y-4">
      <AdminFullHeader
        eyebrow="Products"
        title="Product list"
        description="Manage inventory, pricing and availability across every store."
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricStat
          label="Total products"
          value={snapshot.total.toLocaleString()}
          icon={Package}
          caption="Loaded on this page"
          animationDelay={40}
        />
        <MetricStat
          label="Active"
          value={snapshot.active.toLocaleString()}
          icon={CheckCircle2}
          tone="success"
          caption="Live in the shopper catalog"
          animationDelay={80}
        />
        <MetricStat
          label="Pending review"
          value={snapshot.pending.toLocaleString()}
          icon={Clock3}
          tone="warning"
          caption="Waiting on approval"
          animationDelay={120}
        />
        <MetricStat
          label="Out of stock"
          value={snapshot.outOfStock.toLocaleString()}
          icon={PackageX}
          tone="danger"
          caption="Hidden from shoppers until restocked"
          animationDelay={160}
        />
      </div>

      <DirectoryToolbar
        search={
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Product, store or category"
            className="h-10 py-0"
          />
        }
        filters={
          <FilterSelect
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            options={categoryOptions}
            className="h-10"
          />
        }
        trailing={
          <SegmentedTabs
            ariaLabel="Filter products by status"
            tabs={statusTabs}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        }
      />

      <section className="animate-fade-up rounded-2xl border border-line bg-surface opacity-0 shadow-card">
        <header className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-textStrong">
              All products{" "}
              <span className="font-normal tabular-nums text-textMuted">
                ({visibleProducts.length})
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-textMuted">{listSummary}</p>
          </div>
          <Button
            variant="secondary"
            leftIcon={<Download className="size-4" />}
            onClick={() => exportProducts(visibleProducts)}
            disabled={visibleProducts.length === 0}
            className="h-10 py-0"
          >
            Export page
          </Button>
        </header>

        {error ? (
          <div className="p-4">
            <ErrorState description={error} onRetry={() => void refresh()} />
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <LoadingState label="Loading products..." />
          </div>
        ) : (
          <>
            <DirectoryTable
              columns={productColumns}
              data={visibleProducts}
              keyExtractor={(product) => product.id}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              sort={sort}
              onSortChange={changeSort}
              emptyState={
                <div className="p-4">
                  <EmptyState
                    title="No products found"
                    description="Clear the filters or add a product."
                  />
                </div>
              }
            />
            <DirectoryFooter
              page={page}
              pageSize={pageSize}
              onPageChange={goToPage}
              hasMore={hasMore}
              isLoading={isLoadingPage}
              loadedLabel={`per page · ${products.length} loaded`}
            />
          </>
        )}
      </section>

      <SelectionBar
        count={selectedIds.size}
        noun="product"
        onClear={() => setSelectedIds(new Set())}
      >
        <SelectionAction
          icon={<Download className="size-4" />}
          onClick={() => {
            exportProducts(visibleProducts.filter((product) => selectedIds.has(product.id)));
            setSelectedIds(new Set());
          }}
        >
          Export
        </SelectionAction>
      </SelectionBar>


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
                    <StatePill
                      label={labelForStatus(selectedProduct.status)}
                      tone={toneForStatus(selectedProduct.status)}
                    />
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
