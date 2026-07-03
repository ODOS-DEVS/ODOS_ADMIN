import {
  CheckCircle2,
  Circle,
  ImagePlus,
  MapPin,
  MousePointerClick,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCategories } from "@/api/categoriesApi";
import { createPromoBanner, getPromoBanner, updatePromoBanner } from "@/api/promoBannersApi";
import { getProductsPage } from "@/api/productsApi";
import { getStores } from "@/api/storesApi";
import { AdminPageSkeleton } from "@/components/admin/AdminShell";
import { PromoBannerShopperPreview } from "@/components/promo-banners";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTabSection } from "@/hooks/useTabSection";
import { useToast } from "@/hooks/useToast";
import type { Category, Product, PromoBanner, Store } from "@/types";
import {
  DEFAULT_PROMO_BANNER_FORM,
  PROMO_CAMPAIGN_OPTIONS,
  PROMO_DESTINATION_OPTIONS,
  PROMO_PLACEMENT_OPTIONS,
  buildPromoBannerForm,
  buildPromoBannerPayload,
  describePromoDestinationOption,
  describePromoPlacement,
  validatePromoBannerForm,
  type PromoBannerFormState,
} from "@/utils/promoBannerStudio";

type StudioSection = "creative" | "placement" | "destination" | "publish";

const SECTIONS: Array<{ id: StudioSection; label: string; hint: string }> = [
  { id: "creative", label: "Creative", hint: "Headline, artwork, button" },
  { id: "placement", label: "Placement", hint: "Where shoppers see it" },
  { id: "destination", label: "Tap action", hint: "Where tapping goes" },
  { id: "publish", label: "Publish", hint: "Schedule and go live" },
];

export function PromoBannerStudioPage() {
  const navigate = useNavigate();
  const { bannerId } = useParams();
  const isCreate = !bannerId;
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const { activeSection, setActiveSection } = useTabSection<StudioSection>("creative");

  const [record, setRecord] = useState<PromoBanner | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(!isCreate);
  const [form, setForm] = useState<PromoBannerFormState>(DEFAULT_PROMO_BANNER_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const referenceDataLoadedRef = useRef(false);
  const loadedBannerIdRef = useRef<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const destinationOption = useMemo(
    () => PROMO_DESTINATION_OPTIONS.find((entry) => entry.value === form.linkType),
    [form.linkType],
  );

  const destinationLabel = useMemo(
    () =>
      describePromoDestinationOption(
        form.linkType,
        form.linkType === "campaign" ? form.campaignTag || form.destinationTarget : form.destinationTarget,
      ),
    [form.campaignTag, form.destinationTarget, form.linkType],
  );

  const readiness = useMemo(() => {
    const validationError = validatePromoBannerForm(form);
    return [
      { id: "title", label: "Headline added", done: Boolean(form.title.trim()) },
      { id: "placement", label: "Placement chosen", done: Boolean(form.placement) },
      {
        id: "destination",
        label: "Tap destination set",
        done: !validationError || validationError.includes("headline"),
      },
      { id: "schedule", label: "Schedule optional", done: true },
    ];
  }, [form]);

  useEffect(() => {
    if (isCreate) {
      loadedBannerIdRef.current = null;
      setRecord(null);
      setLoadError(null);
      setIsInitialLoading(false);
      return;
    }
    if (!token || !bannerId) {
      return;
    }
    if (loadedBannerIdRef.current === bannerId) {
      return;
    }

    let cancelled = false;
    setRecord(null);
    setForm(DEFAULT_PROMO_BANNER_FORM);
    setPreviewUrl(null);
    setIsInitialLoading(true);
    setLoadError(null);

    void getPromoBanner(token, bannerId)
      .then((banner) => {
        if (cancelled) {
          return;
        }
        loadedBannerIdRef.current = bannerId;
        setRecord(banner);
        setForm(buildPromoBannerForm(banner));
        setPreviewUrl(banner.imageUrl ?? null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        loadedBannerIdRef.current = null;
        setRecord(null);
        setLoadError(error instanceof Error ? error.message : "Unable to load promo banner.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bannerId, isCreate, token]);

  useEffect(() => {
    if (!token) {
      referenceDataLoadedRef.current = false;
      return;
    }
    if (referenceDataLoadedRef.current) {
      return;
    }

    referenceDataLoadedRef.current = true;
    void Promise.all([
      getCategories(token),
      getStores(token),
      getProductsPage(token, { limit: 60, offset: 0 }),
    ])
      .then(([categoryList, storeList, productPage]) => {
        setCategories(categoryList);
        setStores(storeList);
        setProducts(productPage.items);
      })
      .catch(() => {
        // pickers can still fall back to manual entry
      });
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateForm<K extends keyof PromoBannerFormState>(key: K, value: PromoBannerFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    updateForm("imageFile", file);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : record?.imageUrl ?? null);
    event.target.value = "";
  }

  function handleDestinationChange(linkType: PromoBannerFormState["linkType"]) {
    const option = PROMO_DESTINATION_OPTIONS.find((entry) => entry.value === linkType);
    setForm((current) => ({
      ...current,
      linkType,
      destinationTarget: "",
      campaignTag: "",
      ctaLabel: option?.defaultCtaLabel ?? current.ctaLabel,
    }));
  }

  async function reloadBanner() {
    if (!token || !bannerId) {
      return;
    }

    loadedBannerIdRef.current = null;
    setIsInitialLoading(true);
    setLoadError(null);

    try {
      const banner = await getPromoBanner(token, bannerId);
      loadedBannerIdRef.current = bannerId;
      setRecord(banner);
      setForm(buildPromoBannerForm(banner));
      setPreviewUrl(banner.imageUrl ?? null);
    } catch (error) {
      loadedBannerIdRef.current = null;
      setRecord(null);
      setLoadError(error instanceof Error ? error.message : "Unable to load promo banner.");
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function handleSave() {
    if (!token) return;
    const validationError = validatePromoBannerForm(form);
    if (validationError) {
      showToast({ title: "Almost there", description: validationError, tone: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPromoBannerPayload(form);
      if (record) {
        await updatePromoBanner(token, record.id, payload);
        showToast({
          title: "Promo banner updated",
          description: "Shoppers will see the new creative on their next refresh.",
          tone: "success",
        });
      } else {
        await createPromoBanner(token, payload);
        showToast({
          title: "Promo banner published",
          description: "Your banner is ready in the mobile app.",
          tone: "success",
        });
      }
      navigate("/promo-banners/full");
    } catch (error) {
      showToast({
        title: "Unable to save banner",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!isCreate && isInitialLoading && !record) {
    return <AdminPageSkeleton blocks={3} />;
  }

  if (loadError) {
    return <ErrorState description={loadError} onRetry={() => void reloadBanner()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
            Promo banner studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">
            {isCreate ? "Create a shopper banner" : `Edit ${record?.title ?? "banner"}`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-textMuted">
            No technical links required. Choose where the banner appears, what it says, and where tapping
            should take shoppers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate("/promo-banners/full")}>
            Back to library
          </Button>
          <Button leftIcon={<Save className="size-4" />} isLoading={isSaving} onClick={() => void handleSave()}>
            {isCreate ? "Publish banner" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.03] p-3">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                activeSection === section.id
                  ? "bg-accent/15 text-textStrong"
                  : "text-textMuted hover:bg-white/[0.04] hover:text-textStrong"
              }`}
            >
              <p className="text-sm font-medium">{section.label}</p>
              <p className="mt-1 text-xs opacity-80">{section.hint}</p>
            </button>
          ))}
        </aside>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          {activeSection === "creative" ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-textStrong">Creative</h2>
                <p className="mt-1 text-sm text-textMuted">
                  Write the message shoppers see on the card. Keep it short and action-oriented.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-textMuted">Headline</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                  placeholder="E.g. Payday deals up to 40% off"
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-textMuted">Supporting line</span>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                  placeholder="Tell shoppers why they should tap."
                  value={form.subtitle}
                  onChange={(event) => updateForm("subtitle", event.target.value)}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Button label</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.ctaLabel}
                    onChange={(event) => updateForm("ctaLabel", event.target.value)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Color mood</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.accent}
                    onChange={(event) =>
                      updateForm("accent", event.target.value as PromoBannerFormState["accent"])
                    }
                  >
                    <option value="gold">Warm gold</option>
                    <option value="teal">Fresh teal</option>
                    <option value="default">Neutral slate</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-textMuted">Banner artwork</span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-textMuted">
                    <ImagePlus className="size-4" />
                    Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                  ) : null}
                </div>
              </label>
            </div>
          ) : null}

          {activeSection === "placement" ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-textStrong">Placement</h2>
                <p className="mt-1 text-sm text-textMuted">
                  Home screen banners swipe as a carousel when more than one is active.
                </p>
              </div>

              <div className="grid gap-3">
                {PROMO_PLACEMENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateForm("placement", option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      form.placement === option.value
                        ? "border-accent/30 bg-accent/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 text-accentSoft" />
                      <div>
                        <p className="font-medium text-textStrong">{option.label}</p>
                        <p className="mt-1 text-sm text-textMuted">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Carousel order</span>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.sortOrder}
                    onChange={(event) => updateForm("sortOrder", Number(event.target.value) || 1)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Starts</span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.startsAt}
                    onChange={(event) => updateForm("startsAt", event.target.value)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Ends</span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.endsAt}
                    onChange={(event) => updateForm("endsAt", event.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {activeSection === "destination" ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-textStrong">Tap action</h2>
                <p className="mt-1 text-sm text-textMuted">
                  Each banner can open a different screen — deals, a category, a product, a store, and more.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {PROMO_DESTINATION_OPTIONS.filter((option) => option.value !== "screen").map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleDestinationChange(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      form.linkType === option.value
                        ? "border-accent/30 bg-accent/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MousePointerClick className="mt-0.5 size-4 text-accentSoft" />
                      <div>
                        <p className="font-medium text-textStrong">{option.label}</p>
                        <p className="mt-1 text-sm text-textMuted">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {destinationOption?.needsTarget === "category" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Category</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.destinationTarget}
                    onChange={(event) => updateForm("destinationTarget", event.target.value)}
                  >
                    <option value="">Choose a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {destinationOption?.needsTarget === "store" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Store</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.destinationTarget}
                    onChange={(event) => updateForm("destinationTarget", event.target.value)}
                  >
                    <option value="">Choose a store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {destinationOption?.needsTarget === "product" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Product</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.destinationTarget}
                    onChange={(event) => updateForm("destinationTarget", event.target.value)}
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {destinationOption?.needsTarget === "search" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Search keyword (optional)</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    placeholder="E.g. sneakers, rice cooker, perfume"
                    value={form.destinationTarget}
                    onChange={(event) => updateForm("destinationTarget", event.target.value)}
                  />
                </label>
              ) : null}

              {destinationOption?.needsTarget === "campaign" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Campaign theme</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    value={form.campaignTag}
                    onChange={(event) => {
                      updateForm("campaignTag", event.target.value);
                      updateForm("destinationTarget", event.target.value);
                    }}
                  >
                    <option value="">Choose a campaign</option>
                    {PROMO_CAMPAIGN_OPTIONS.map((campaign) => (
                      <option key={campaign.value} value={campaign.value}>
                        {campaign.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {destinationOption?.needsTarget === "percent" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Minimum vendor discount (%)</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    inputMode="numeric"
                    placeholder="e.g. 20"
                    value={form.destinationTarget}
                    onChange={(event) => updateForm("destinationTarget", event.target.value)}
                  />
                  <p className="text-xs leading-5 text-textMuted">
                    Shoppers only see products where a shop set their own sale price at this
                    discount or higher. ODOS never changes vendor pricing.
                  </p>
                </label>
              ) : null}

              {destinationOption?.needsTarget === "url" ? (
                <label className="block space-y-2">
                  <span className="text-sm text-textMuted">Website URL</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                    placeholder="https://example.com/offer"
                    value={form.destinationTarget}
                    onChange={(event) => updateForm("destinationTarget", event.target.value)}
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {activeSection === "publish" ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-textStrong">Publish</h2>
                <p className="mt-1 text-sm text-textMuted">Review the checklist, then publish when ready.</p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-textMuted">Status</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", event.target.value as PromoBannerFormState["status"])
                  }
                >
                  <option value="active">Active — visible in app</option>
                  <option value="disabled">Disabled — hidden from shoppers</option>
                </select>
              </label>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                {readiness.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <Circle className="size-4 text-textMuted" />
                    )}
                    <span className={item.done ? "text-textStrong" : "text-textMuted"}>{item.label}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                leftIcon={<Upload className="size-4" />}
                isLoading={isSaving}
                onClick={() => void handleSave()}
              >
                {isCreate ? "Publish banner" : "Save changes"}
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-textStrong">
              <Sparkles className="size-4 text-accentSoft" />
              Shopper preview
            </div>
            <PromoBannerShopperPreview
              title={form.title}
              subtitle={form.subtitle}
              ctaLabel={form.ctaLabel}
              imageUrl={previewUrl}
              accent={form.accent}
              placementLabel={describePromoPlacement(form.placement)}
              destinationLabel={destinationLabel}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
