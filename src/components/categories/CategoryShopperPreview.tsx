import { ArrowRight, Grid3x3, Smartphone } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Category } from "@/types";

type CategoryShopperPreviewProps = {
  name: string;
  description: string;
  imageUrl?: string | null;
  subcategories: string[];
  status: Category["status"];
  slug: string;
};

export function CategoryShopperPreview({
  name,
  description,
  imageUrl,
  subcategories,
  status,
  slug,
}: CategoryShopperPreviewProps) {
  const displayName = name.trim() || "Category title";
  const displayDescription =
    description.trim() || "Category description will appear on browse cards and detail screens.";
  const previewSubcategories = subcategories.length > 0 ? subcategories : ["Subcategory"];
  const activeChip = previewSubcategories[0];

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
              <p className="text-xs text-textMuted">Live mobile rendering</p>
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
            <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5">{displayName}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-4 text-[#6b7280]">
                    {displayDescription}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f766e]">
                    Browse · {previewSubcategories.length} subcategories
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#0f172a] px-2.5 py-1 text-[10px] font-semibold text-white">
                    Shop subcategories
                    <ArrowRight className="size-3" />
                  </div>
                </div>
                <div className="size-20 shrink-0 overflow-hidden rounded-[18px] bg-[#f3f4f6]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1 px-2 text-center text-[9px] text-[#9ca3af]">
                      <Grid3x3 className="size-4" />
                      Image pending
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-3">
              <p className="text-[11px] font-semibold text-[#0f172a]">Category detail</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#6b7280]">
                {displayDescription}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {previewSubcategories.slice(0, 4).map((subcategory) => {
                  const active = subcategory === activeChip;
                  return (
                    <span
                      key={subcategory}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        active
                          ? "bg-[#0f172a] text-white"
                          : "border border-[#e5e7eb] bg-[#eef2f6] text-[#0f172a]"
                      }`}
                    >
                      {subcategory}
                    </span>
                  );
                })}
                {previewSubcategories.length > 4 ? (
                  <span className="rounded-full border border-[#e5e7eb] bg-[#eef2f6] px-2.5 py-1 text-[10px] font-semibold text-[#6b7280]">
                    +{previewSubcategories.length - 4}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {previewSubcategories.slice(0, 2).map((subcategory) => (
                <div
                  key={`tile-${subcategory}`}
                  className="overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white"
                >
                  <div className="h-16 bg-[#f3f4f6]">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="size-full object-cover opacity-90" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[#9ca3af]">
                        <Grid3x3 className="size-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-[10px] font-semibold text-[#0f172a]">
                      {subcategory}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#0f766e]">Browse collection</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-accentSoft">Catalog slug</p>
          <p className="mt-1 font-mono text-xs text-textStrong">/{slug || "category-slug"}</p>
        </div>
      </div>
    </div>
  );
}
