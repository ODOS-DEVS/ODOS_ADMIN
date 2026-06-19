import type { PromoBanner, PromoBannerAccent, PromoBannerLinkType, PromoBannerPlacement } from "@/types";

export const PROMO_PLACEMENT_OPTIONS: Array<{
  value: PromoBannerPlacement;
  label: string;
  description: string;
}> = [
  {
    value: "home",
    label: "Home screen",
    description: "Shows in the hero carousel at the top of the shopper home feed.",
  },
  {
    value: "deals",
    label: "Deals & promos screen",
    description: "Shows at the top of the dedicated deals hub.",
  },
];

export const PROMO_DESTINATION_OPTIONS: Array<{
  value: PromoBannerLinkType;
  label: string;
  description: string;
  defaultCtaLabel: string;
  needsTarget?: "category" | "product" | "store" | "search" | "url" | "campaign" | "screen";
}> = [
  {
    value: "deals",
    label: "Deals hub",
    description: "Opens the deals & promos screen with live offers.",
    defaultCtaLabel: "Browse deals",
  },
  {
    value: "flash_sales",
    label: "Flash sales",
    description: "Takes shoppers to timed flash sale events.",
    defaultCtaLabel: "Shop flash sales",
  },
  {
    value: "popular",
    label: "Popular products",
    description: "Opens the trending products collection.",
    defaultCtaLabel: "See popular",
  },
  {
    value: "vouchers",
    label: "Voucher wallet",
    description: "Opens saved promos in the shopper wallet.",
    defaultCtaLabel: "View vouchers",
  },
  {
    value: "campaign",
    label: "Seasonal campaign",
    description: "Highlights a themed campaign on the deals screen.",
    defaultCtaLabel: "Shop campaign",
    needsTarget: "campaign",
  },
  {
    value: "category",
    label: "Category browse",
    description: "Opens a specific category shelf.",
    defaultCtaLabel: "Shop category",
    needsTarget: "category",
  },
  {
    value: "product",
    label: "Product page",
    description: "Opens one product detail screen.",
    defaultCtaLabel: "View product",
    needsTarget: "product",
  },
  {
    value: "store",
    label: "Store page",
    description: "Opens a vendor store storefront.",
    defaultCtaLabel: "Visit store",
    needsTarget: "store",
  },
  {
    value: "search",
    label: "Search results",
    description: "Runs a product search with your keyword.",
    defaultCtaLabel: "Search now",
    needsTarget: "search",
  },
  {
    value: "external",
    label: "Website link",
    description: "Opens an external page in the browser.",
    defaultCtaLabel: "Learn more",
    needsTarget: "url",
  },
  {
    value: "screen",
    label: "Advanced app route",
    description: "For technical staff only — raw in-app path.",
    defaultCtaLabel: "Continue",
    needsTarget: "screen",
  },
];

export const PROMO_CAMPAIGN_OPTIONS = [
  { value: "christmas", label: "Christmas Deals" },
  { value: "easter", label: "Easter Offers" },
  { value: "eid", label: "Eid Specials" },
  { value: "valentine", label: "Valentine Offers" },
  { value: "black-friday", label: "Black Friday Ghana" },
  { value: "independence", label: "Independence Day Deals" },
  { value: "republic-day", label: "Republic Day Deals" },
  { value: "back-to-school", label: "Back to School" },
  { value: "payday", label: "Salary Week Deals" },
  { value: "student", label: "Student Deals" },
  { value: "free-delivery", label: "Free Delivery" },
  { value: "weekend-market", label: "ODOS Weekend Market" },
  { value: "made-in-ghana", label: "Made in Ghana Deals" },
  { value: "campus", label: "Campus Deals" },
  { value: "hot-deals", label: "Hot Deals Today" },
] as const;

export type PromoBannerFormState = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  accent: PromoBannerAccent;
  sortOrder: number;
  status: PromoBanner["status"];
  placement: PromoBannerPlacement;
  linkType: PromoBannerLinkType;
  destinationTarget: string;
  campaignTag: string;
  startsAt: string;
  endsAt: string;
  imageFile: File | null;
};

export const DEFAULT_PROMO_BANNER_FORM: PromoBannerFormState = {
  title: "",
  subtitle: "",
  ctaLabel: "Shop now",
  accent: "gold",
  sortOrder: 1,
  status: "active",
  placement: "home",
  linkType: "deals",
  destinationTarget: "",
  campaignTag: "",
  startsAt: "",
  endsAt: "",
  imageFile: null,
};

export function buildPromoBannerForm(banner?: PromoBanner | null): PromoBannerFormState {
  if (!banner) {
    return { ...DEFAULT_PROMO_BANNER_FORM };
  }

  let linkType = banner.linkType ?? "deals";
  let destinationTarget = banner.ctaLink ?? "";
  let campaignTag = banner.campaignTag ?? "";

  if (!banner.linkType && banner.ctaLink) {
    const legacy = banner.ctaLink.trim().toLowerCase();
    if (legacy.includes("deals")) linkType = "deals";
    else if (legacy.includes("flash")) linkType = "flash_sales";
    else if (legacy.includes("popular")) linkType = "popular";
    else if (legacy.includes("voucher")) linkType = "vouchers";
    else if (legacy.startsWith("http")) linkType = "external";
    else linkType = "screen";
    destinationTarget = banner.ctaLink;
  }

  if (linkType === "campaign") {
    destinationTarget = campaignTag || destinationTarget;
  }

  return {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    ctaLabel: banner.ctaLabel,
    accent: banner.accent ?? "gold",
    sortOrder: banner.sortOrder,
    status: banner.status,
    placement: banner.placement ?? "home",
    linkType,
    destinationTarget,
    campaignTag,
    startsAt: toDateTimeLocal(banner.startsAt),
    endsAt: toDateTimeLocal(banner.endsAt),
    imageFile: null,
  };
}

export function describePromoPlacement(placement: PromoBannerPlacement) {
  return PROMO_PLACEMENT_OPTIONS.find((option) => option.value === placement)?.label ?? placement;
}

export function describePromoDestinationOption(linkType: PromoBannerLinkType, target?: string | null) {
  const option = PROMO_DESTINATION_OPTIONS.find((entry) => entry.value === linkType);
  const base = option?.label ?? "App screen";
  const cleaned = target?.trim();
  if (!cleaned) {
    return base;
  }
  if (linkType === "campaign") {
    const campaign = PROMO_CAMPAIGN_OPTIONS.find((entry) => entry.value === cleaned);
    return campaign ? `${base} · ${campaign.label}` : `${base} · ${cleaned}`;
  }
  return `${base} · ${cleaned}`;
}

export function buildPromoBannerPayload(form: PromoBannerFormState) {
  const destinationOption = PROMO_DESTINATION_OPTIONS.find((entry) => entry.value === form.linkType);
  const target = form.destinationTarget.trim();
  const campaignTag = form.linkType === "campaign" ? (form.campaignTag || target).trim() : null;

  let ctaLink: string | null = null;
  if (form.linkType === "campaign") {
    ctaLink = campaignTag;
  } else if (destinationOption?.needsTarget) {
    ctaLink = target || null;
  }

  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    ctaLabel: form.ctaLabel.trim() || destinationOption?.defaultCtaLabel || "Shop now",
    ctaLink,
    accent: form.accent,
    sortOrder: form.sortOrder,
    status: form.status,
    placement: form.placement,
    linkType: form.linkType,
    campaignTag,
    startsAt: toIsoString(form.startsAt),
    endsAt: toIsoString(form.endsAt),
    imageFile: form.imageFile,
  };
}

export function validatePromoBannerForm(form: PromoBannerFormState): string | null {
  if (!form.title.trim()) {
    return "Add a headline shoppers will recognize.";
  }

  const destination = PROMO_DESTINATION_OPTIONS.find((entry) => entry.value === form.linkType);
  if (destination?.needsTarget === "category" && !form.destinationTarget.trim()) {
    return "Choose which category this banner should open.";
  }
  if (destination?.needsTarget === "product" && !form.destinationTarget.trim()) {
    return "Choose which product this banner should open.";
  }
  if (destination?.needsTarget === "store" && !form.destinationTarget.trim()) {
    return "Choose which store this banner should open.";
  }
  if (destination?.needsTarget === "url") {
    const url = form.destinationTarget.trim();
    if (!url) {
      return "Add the website link shoppers should visit.";
    }
    if (!/^https?:\/\//i.test(url)) {
      return "Website links must start with http:// or https://";
    }
  }
  if (destination?.needsTarget === "campaign" && !(form.campaignTag || form.destinationTarget).trim()) {
    return "Choose a seasonal campaign for this banner.";
  }
  if (destination?.needsTarget === "screen" && !form.destinationTarget.trim()) {
    return "Add the in-app route for this banner.";
  }

  return null;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}
