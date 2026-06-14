import { Edit3, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

import {
  createPromoBanner,
  deletePromoBanner,
  getPromoBanners,
  updatePromoBanner,
} from "@/api/promoBannersApi";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { PromoBanner, PromoBannerAccent } from "@/types";
import { formatDate } from "@/utils/format";

type PromoBannerFormValues = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  accent: PromoBannerAccent;
  sortOrder: number;
  status: PromoBanner["status"];
  startsAt: string;
  endsAt: string;
  imageFile: File | null;
};

const initialForm: PromoBannerFormValues = {
  title: "",
  subtitle: "",
  ctaLabel: "Browse deals",
  ctaLink: "/screens/deals",
  accent: "gold",
  sortOrder: 1,
  status: "active",
  startsAt: "",
  endsAt: "",
  imageFile: null,
};

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

export function PromoBannersPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [bannerForm, setBannerForm] = useState<PromoBannerFormValues>(initialForm);
  const [deleteTarget, setDeleteTarget] = useState<PromoBanner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadBanners = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setBanners(await getPromoBanners(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load promo banners.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const haystack = [banner.title, banner.subtitle, banner.ctaLabel, banner.ctaLink]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : banner.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [banners, query, statusFilter]);

  function resetEditorState() {
    setBannerForm(initialForm);
    setEditingBanner(null);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  function openCreateModal() {
    resetEditorState();
    setIsEditorOpen(true);
  }

  function openEditModal(banner: PromoBanner) {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      ctaLabel: banner.ctaLabel,
      ctaLink: banner.ctaLink ?? "",
      accent: banner.accent ?? "gold",
      sortOrder: banner.sortOrder,
      status: banner.status,
      startsAt: toDateTimeLocal(banner.startsAt),
      endsAt: toDateTimeLocal(banner.endsAt),
      imageFile: null,
    });
    setPreviewUrl(banner.imageUrl ?? null);
    setIsEditorOpen(true);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setBannerForm((current) => ({ ...current, imageFile: file }));
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : editingBanner?.imageUrl ?? null);
    event.target.value = "";
  }

  async function handleSave() {
    if (!token) return;
    if (!bannerForm.title.trim()) {
      showToast({
        title: "Title required",
        description: "Add a banner title before saving.",
        tone: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim() || null,
        ctaLabel: bannerForm.ctaLabel.trim() || "Browse deals",
        ctaLink: bannerForm.ctaLink.trim() || null,
        accent: bannerForm.accent,
        sortOrder: bannerForm.sortOrder,
        status: bannerForm.status,
        startsAt: toIsoString(bannerForm.startsAt),
        endsAt: toIsoString(bannerForm.endsAt),
        imageFile: bannerForm.imageFile,
      };

      if (editingBanner) {
        const updated = await updatePromoBanner(token, editingBanner.id, payload);
        setBanners((current) =>
          current.map((banner) => (banner.id === updated.id ? updated : banner)),
        );
        showToast({
          title: "Promo banner updated",
          description: `${updated.title} is live in the mobile feed.`,
          tone: "success",
        });
      } else {
        const created = await createPromoBanner(token, payload);
        setBanners((current) => [created, ...current]);
        showToast({
          title: "Promo banner created",
          description: `${created.title} is ready for the mobile app.`,
          tone: "success",
        });
      }

      setIsEditorOpen(false);
      resetEditorState();
    } catch (saveError) {
      showToast({
        title: "Unable to save banner",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchive() {
    if (!token || !deleteTarget) return;
    setActionLoading(true);
    try {
      await deletePromoBanner(token, deleteTarget.id);
      setBanners((current) =>
        current.map((banner) =>
          banner.id === deleteTarget.id ? { ...banner, status: "disabled" } : banner,
        ),
      );
      showToast({
        title: "Promo banner archived",
        description: `${deleteTarget.title} has been hidden from the app.`,
        tone: "success",
      });
      setDeleteTarget(null);
    } catch (archiveError) {
      showToast({
        title: "Unable to archive banner",
        description: archiveError instanceof Error ? archiveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading promo banners..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadBanners()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Merchandising"
        title="Promo banners"
        description="Create and schedule home-screen promotional banners for the ODOS mobile app."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreateModal}>
            Create banner
          </Button>
        }
      />

      <SectionCard
        title="Banner library"
        description="Lower sort order values appear first. Use schedule windows for timed campaigns."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search banners"
              className="sm:w-80"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Disabled", value: "disabled" },
              ]}
            />
          </div>
        }
      >
        {filteredBanners.length === 0 ? (
          <EmptyState
            title="No promo banners found"
            description="Create a banner or broaden the current search."
          />
        ) : (
          <DataTable<PromoBanner>
            columns={[
              {
                key: "banner",
                header: "Banner",
                render: (banner) => (
                  <div className="flex items-center gap-4">
                    <div className="size-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt={banner.title} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[11px] text-textMuted">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{banner.title}</p>
                      {banner.subtitle ? (
                        <p className="mt-1 text-xs text-textMuted">{banner.subtitle}</p>
                      ) : null}
                    </div>
                  </div>
                ),
              },
              {
                key: "cta",
                header: "CTA",
                render: (banner) => (
                  <div className="text-sm">
                    <p>{banner.ctaLabel}</p>
                    <p className="mt-1 text-xs text-textMuted">{banner.ctaLink || "No link"}</p>
                  </div>
                ),
              },
              {
                key: "schedule",
                header: "Schedule",
                render: (banner) => (
                  <div className="text-sm">
                    <p>{banner.startsAt ? formatDate(banner.startsAt) : "Live now"}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {banner.endsAt ? `Until ${formatDate(banner.endsAt)}` : "No end date"}
                    </p>
                  </div>
                ),
              },
              {
                key: "order",
                header: "Order",
                render: (banner) => banner.sortOrder,
              },
              {
                key: "status",
                header: "Status",
                render: (banner) => <StatusBadge status={banner.status} />,
              },
              {
                key: "actions",
                header: "Actions",
                render: (banner) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Edit3 className="size-4" />}
                      onClick={() => openEditModal(banner)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => setDeleteTarget(banner)}
                    >
                      Archive
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredBanners}
            keyExtractor={(banner) => banner.id}
          />
        )}
      </SectionCard>

      <Modal
        open={isEditorOpen}
        title={editingBanner ? "Edit promo banner" : "Create promo banner"}
        description="Banner content is served to the mobile home feed through the catalog API."
        onClose={() => {
          setIsEditorOpen(false);
          resetEditorState();
        }}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditorOpen(false);
                resetEditorState();
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} isLoading={actionLoading}>
              {editingBanner ? "Save changes" : "Create banner"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Title</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={bannerForm.title}
              onChange={(event) =>
                setBannerForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Subtitle</span>
            <textarea
              className="min-h-20 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
              value={bannerForm.subtitle}
              onChange={(event) =>
                setBannerForm((current) => ({ ...current, subtitle: event.target.value }))
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">CTA label</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={bannerForm.ctaLabel}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, ctaLabel: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">CTA link</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                placeholder="/screens/deals"
                value={bannerForm.ctaLink}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, ctaLink: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Accent</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={bannerForm.accent}
                onChange={(event) =>
                  setBannerForm((current) => ({
                    ...current,
                    accent: event.target.value as PromoBannerAccent,
                  }))
                }
              >
                <option value="gold">Gold</option>
                <option value="default">Default</option>
                <option value="teal">Teal</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Sort order</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={bannerForm.sortOrder}
                onChange={(event) =>
                  setBannerForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Status</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={bannerForm.status}
                onChange={(event) =>
                  setBannerForm((current) => ({
                    ...current,
                    status: event.target.value as PromoBanner["status"],
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Starts at</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={bannerForm.startsAt}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, startsAt: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-textMuted">Ends at</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-textStrong outline-none"
                value={bannerForm.endsAt}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, endsAt: event.target.value }))
                }
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-textMuted">Banner image</span>
            <div className="flex items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-textMuted">
                <ImagePlus className="size-4" />
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {previewUrl ? (
                <img src={previewUrl} alt="Banner preview" className="h-20 w-20 rounded-2xl object-cover" />
              ) : null}
            </div>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive promo banner?"
        description="This banner will be hidden from the mobile app."
        confirmLabel="Archive"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={() => void handleArchive()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
