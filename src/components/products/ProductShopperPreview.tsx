import { Heart, ShoppingBag, Smartphone, Star } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ProductStatus } from "@/types";
import { formatCurrency } from "@/utils/format";

type ProductShopperPreviewProps = {
  name: string;
  description: string;
  imageUrl?: string | null;
  price: string;
  oldPrice: string;
  rating: string;
  reviews: string;
  colorOptions: string;
  sizeOptions: string;
  storeName: string;
  categoryLabel: string;
  status: ProductStatus;
};

export function ProductShopperPreview({
  name,
  description,
  imageUrl,
  price,
  oldPrice,
  rating,
  reviews,
  colorOptions,
  sizeOptions,
  storeName,
  categoryLabel,
  status,
}: ProductShopperPreviewProps) {
  const displayName = name.trim() || "Product name";
  const displayDescription =
    description.trim() || "Product story, materials, and fit notes appear on the detail screen.";
  const parsedPrice = Number(price);
  const parsedOldPrice = oldPrice.trim() ? Number(oldPrice) : null;
  const parsedRating = rating.trim() ? Number(rating) : null;
  const colors = colorOptions
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
  const sizes = sizeOptions
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  const hasDiscount =
    parsedOldPrice !== null && Number.isFinite(parsedOldPrice) && parsedOldPrice > parsedPrice;

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-panel/90 shadow-glow">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-accent/15 p-2 text-accentSoft">
              <Smartphone className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-textStrong">Shopper preview</p>
              <p className="text-xs text-textMuted">Browse card + product page</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="mx-auto w-full max-w-[280px] rounded-[32px] border border-white/15 bg-[#050b14] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-[10px] font-medium text-white/50">9:41</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
              ODOS
            </span>
          </div>

          <div className="space-y-3 rounded-[24px] bg-[#f8fafc] p-3 text-[#0f172a]">
            <div className="overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white">
              <div className="relative aspect-[4/5] bg-[#f3f4f6]">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 text-[10px] text-[#9ca3af]">
                    <ShoppingBag className="size-5" />
                    Hero image pending
                  </div>
                )}
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[#0f172a] shadow"
                  aria-label="Wishlist"
                >
                  <Heart className="size-3.5" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
                  {categoryLabel}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{displayName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-[#f59e0b]">
                    <Star className="size-3 fill-current" />
                    <span className="font-semibold text-[#0f172a]">
                      {parsedRating && Number.isFinite(parsedRating) ? parsedRating.toFixed(1) : "—"}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6b7280]">{reviews.trim() || "No reviews yet"}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-base font-bold text-[#0f172a]">
                    {Number.isFinite(parsedPrice) ? formatCurrency(parsedPrice) : "GHS —"}
                  </span>
                  {hasDiscount ? (
                    <span className="text-[11px] text-[#9ca3af] line-through">
                      {formatCurrency(parsedOldPrice!)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] text-[#6b7280]">{storeName}</p>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-3">
              <p className="text-[11px] font-semibold text-[#0f172a]">Product detail</p>
              <p className="mt-1 line-clamp-3 text-[10px] leading-4 text-[#6b7280]">
                {displayDescription}
              </p>

              {colors.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                    Colors
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {colors.map((color, index) => (
                      <span
                        key={color}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          index === 0
                            ? "bg-[#0f172a] text-white"
                            : "border border-[#e5e7eb] bg-[#eef2f6] text-[#0f172a]"
                        }`}
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {sizes.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                    Sizes
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {sizes.map((size, index) => (
                      <span
                        key={size}
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                          index === 0
                            ? "bg-[#0f172a] text-white"
                            : "border border-[#e5e7eb] bg-[#eef2f6] text-[#0f172a]"
                        }`}
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                className="mt-4 w-full rounded-full bg-[#0f172a] px-4 py-2.5 text-[11px] font-semibold text-white"
              >
                Add to bag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
