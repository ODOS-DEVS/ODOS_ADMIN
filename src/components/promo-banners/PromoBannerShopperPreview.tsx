import { ArrowRight } from "lucide-react";

import type { PromoBannerAccent } from "@/types";

type PromoBannerPreviewProps = {
  title: string;
  subtitle?: string | null;
  ctaLabel: string;
  imageUrl?: string | null;
  accent?: PromoBannerAccent | null;
  placementLabel?: string;
  destinationLabel?: string;
};

function gradientClass(accent: PromoBannerAccent | null | undefined) {
  if (accent === "teal") {
    return "from-cyan-950 via-teal-900 to-slate-900";
  }
  if (accent === "default") {
    return "from-slate-900 via-slate-800 to-slate-700";
  }
  return "from-amber-950 via-orange-900 to-slate-900";
}

export function PromoBannerShopperPreview({
  title,
  subtitle,
  ctaLabel,
  imageUrl,
  accent = "gold",
  placementLabel = "Home screen carousel",
  destinationLabel = "Deals hub",
}: PromoBannerPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-textMuted">
        <span className="rounded-full border border-white/10 px-3 py-1">{placementLabel}</span>
        <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-accentSoft">
          Tap opens · {destinationLabel}
        </span>
      </div>

      <div
        className={`overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${gradientClass(accent)} p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
              Today&apos;s deals
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {title.trim() || "Your campaign headline"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/75">
              {subtitle?.trim() || "Add a short shopper-friendly line about the offer."}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">
              {ctaLabel.trim() || "Shop now"}
              <ArrowRight className="size-4" />
            </div>
          </div>

          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/10">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-white/50">
                Artwork
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-textMuted">
        Multiple active home banners automatically rotate as a swipeable carousel in the mobile app.
      </p>
    </div>
  );
}
