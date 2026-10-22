import { CircleAlert, Pencil, Plus, Trash2, Upload, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildGuideVideoDraft,
  createGuideVideo,
  deleteGuideVideo,
  getGuideCatalog,
  getGuideVideos,
  updateGuideVideo,
  uploadGuideVideoToCloudinary,
  type GuideCatalog,
  type GuideCatalogEntry,
  type GuideVideo,
  type GuideVideoDraft,
} from "@/api/guideVideosApi";
import { AdminPageSkeleton } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { Toggle } from "@/components/ui/Toggle";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";

/** Cloudinary's own hard limit on an unchunked upload. */
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const ACCEPTED_VIDEO_TYPES = "video/mp4,video/quicktime,video/webm,video/x-m4v";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return "—";
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function describeSlot(video: GuideVideo, guide: GuideCatalogEntry | undefined) {
  if (video.stepIndex === null) {
    return "Whole guide";
  }
  const step = guide?.steps.find((entry) => entry.index === video.stepIndex);
  return step ? `Step ${video.stepIndex + 1}: ${step.title}` : `Step ${video.stepIndex + 1}`;
}

export function GuideVideosPage() {
  const { token } = useAdminAuth();
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState<GuideCatalog | null>(null);
  const [videos, setVideos] = useState<GuideVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GuideVideo | null>(null);
  const [draft, setDraft] = useState<GuideVideoDraft>(() => buildGuideVideoDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GuideVideo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [loadedCatalog, loadedVideos] = await Promise.all([
        getGuideCatalog(token),
        getGuideVideos(token),
      ]);
      setCatalog(loadedCatalog);
      setVideos(loadedVideos);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load guide videos.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const guidesBySlug = useMemo(() => {
    const map = new Map<string, GuideCatalogEntry>();
    for (const guide of catalog?.guides ?? []) {
      map.set(guide.slug, guide);
    }
    return map;
  }, [catalog]);

  const videosBySlug = useMemo(() => {
    const map = new Map<string, GuideVideo[]>();
    for (const video of videos) {
      const existing = map.get(video.guideSlug) ?? [];
      existing.push(video);
      map.set(video.guideSlug, existing);
    }
    return map;
  }, [videos]);

  const selectedGuide = guidesBySlug.get(draft.guideSlug);

  const coverage = useMemo(() => {
    const guides = catalog?.guides ?? [];
    const withVideo = guides.filter((guide) => guide.publishedVideoCount > 0).length;
    return { total: guides.length, withVideo };
  }, [catalog]);

  const openEditor = (video: GuideVideo | null, slug?: string) => {
    const nextDraft = buildGuideVideoDraft(video);
    setDraft(slug ? { ...nextDraft, guideSlug: slug } : nextDraft);
    setEditing(video);
    setUploadPercent(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving || uploadPercent !== null) {
      return;
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file || !token) {
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      showToast({
        title: "That video is too large",
        description: `${formatBytes(file.size)} exceeds the ${formatBytes(MAX_VIDEO_BYTES)} limit. Compress it and try again.`,
        tone: "error",
      });
      return;
    }

    setUploadPercent(0);
    try {
      const result = await uploadGuideVideoToCloudinary(token, file, setUploadPercent);
      setDraft((current) => ({
        ...current,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        publicId: result.publicId,
        durationSeconds: result.durationSeconds,
        width: result.width,
        height: result.height,
        provider: "cloudinary",
        // Save people naming every upload by hand; they can still overwrite it.
        title: current.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      showToast({
        title: "Video uploaded",
        description: "Add a title if you need one, then save to attach it to the guide.",
        tone: "success",
      });
    } catch (uploadError) {
      showToast({
        title: "Upload failed",
        description: uploadError instanceof Error ? uploadError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setUploadPercent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!token) {
      return;
    }

    if (!draft.guideSlug.trim()) {
      showToast({ title: "Pick a guide first", tone: "error" });
      return;
    }
    if (!draft.title.trim()) {
      showToast({ title: "Give the video a title", tone: "error" });
      return;
    }
    if (!draft.videoUrl.trim()) {
      showToast({
        title: "No video yet",
        description: "Upload a file, or paste a direct .mp4 or .m3u8 link.",
        tone: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        await updateGuideVideo(token, editing.id, draft);
      } else {
        await createGuideVideo(token, draft);
      }
      showToast({
        title: editing ? "Video updated" : "Video attached",
        description: draft.isPublished
          ? "It is live in the app's resource center now."
          : "Saved as unpublished — shoppers will not see it yet.",
        tone: "success",
      });
      setEditorOpen(false);
      setEditing(null);
      await load();
    } catch (saveError) {
      showToast({
        title: "Unable to save",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !pendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteGuideVideo(token, pendingDelete.id);
      showToast({ title: "Video removed", tone: "success" });
      setPendingDelete(null);
      await load();
    } catch (deleteError) {
      showToast({
        title: "Unable to remove video",
        description: deleteError instanceof Error ? deleteError.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  const orphaned = catalog?.unknownSlugs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Guide videos"
        description="Attach tutorial videos to the step-by-step guides in the app's resource center. A guide with no video simply shows no video section — shoppers never see an empty player."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => openEditor(null)}>
            Add video
          </Button>
        }
      />

      <SectionCard
        title="Coverage"
        description={`${coverage.withVideo} of ${coverage.total} guides have a published video.`}
      >
        <div className="h-2 w-full overflow-hidden rounded-full bg-surfaceMuted">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{
              width: `${coverage.total > 0 ? (coverage.withVideo / coverage.total) * 100 : 0}%`,
            }}
          />
        </div>
      </SectionCard>

      {orphaned.length > 0 ? (
        <SectionCard>
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" />
            <div>
              <p className="font-medium text-textStrong">
                {orphaned.length} video{orphaned.length === 1 ? "" : "s"} point at a guide the app no
                longer has
              </p>
              <p className="mt-1 text-sm text-textMuted">
                These were probably attached before a guide was renamed, and nothing in the app will
                play them: {orphaned.join(", ")}. Re-point or delete them below.
              </p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {(catalog?.guides.length ?? 0) === 0 ? (
        <EmptyState
          title="No guides found"
          description="The backend has no snapshot of the app's guides yet. Run `npm run export:guide-catalog` in the mobile repo and redeploy the backend, then this list will fill in."
        />
      ) : null}

      {catalog?.guides.map((guide) => {
        const guideVideos = videosBySlug.get(guide.slug) ?? [];

        return (
          <SectionCard
            key={guide.slug}
            title={guide.title}
            description={`${guide.category} · ${guide.steps.length} steps${
              guideVideos.length > 0 ? ` · ${guideVideos.length} video${guideVideos.length === 1 ? "" : "s"}` : ""
            }`}
            action={
              <Button
                variant="secondary"
                leftIcon={<Plus className="size-4" />}
                onClick={() => openEditor(null, guide.slug)}
              >
                Add
              </Button>
            }
          >
            {guideVideos.length === 0 ? (
              <p className="text-sm text-textMuted">
                No video yet. The guide reads perfectly well without one — add a walkthrough when you
                have filmed it.
              </p>
            ) : (
              <ul className="space-y-3">
                {guideVideos.map((video) => (
                  <li
                    key={video.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surfaceMuted p-4"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="h-16 w-28 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-surface">
                        <Video className="size-5 text-textMuted" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-textStrong">{video.title}</p>
                      <p className="mt-1 text-sm text-textMuted">
                        {describeSlot(video, guide)} · {formatDuration(video.durationSeconds)} ·{" "}
                        {video.isPublished ? "Published" : "Hidden"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        leftIcon={<Pencil className="size-4" />}
                        onClick={() => openEditor(video)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        leftIcon={<Trash2 className="size-4" />}
                        onClick={() => setPendingDelete(video)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        );
      })}

      <Modal
        open={editorOpen}
        title={editing ? "Edit video" : "Add a guide video"}
        description="Uploads go straight from this browser to Cloudinary, so large files do not pass through the API."
        onClose={closeEditor}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} isLoading={isSaving}>
              {editing ? "Save changes" : "Attach video"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <FormField label="Guide" required helper="Which guide in the app this video belongs to.">
            <select
              className="app-input"
              value={draft.guideSlug}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  guideSlug: event.target.value,
                  // The old step number means nothing in a different guide.
                  stepIndex: null,
                }))
              }
            >
              <option value="">Select a guide…</option>
              {catalog?.guides.map((guide) => (
                <option key={guide.slug} value={guide.slug}>
                  {guide.title}
                </option>
              ))}
              {draft.guideSlug && !guidesBySlug.has(draft.guideSlug) ? (
                <option value={draft.guideSlug}>{draft.guideSlug} (not in the current app)</option>
              ) : null}
            </select>
          </FormField>

          <FormField
            label="Placement"
            helper="A whole-guide video plays at the top. Pick a step to have it play inline at that step instead."
          >
            <select
              className="app-input"
              value={draft.stepIndex === null ? "" : String(draft.stepIndex)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  stepIndex: event.target.value === "" ? null : Number(event.target.value),
                }))
              }
              disabled={!selectedGuide}
            >
              <option value="">Whole guide (plays at the top)</option>
              {selectedGuide?.steps.map((step) => (
                <option key={step.index} value={String(step.index)}>
                  Step {step.index + 1}: {step.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Video file" helper={`MP4, MOV or WebM, up to ${formatBytes(MAX_VIDEO_BYTES)}.`}>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_VIDEO_TYPES}
                className="hidden"
                onChange={(event) => void handleFileSelected(event.target.files?.[0])}
              />
              <Button
                variant="secondary"
                leftIcon={<Upload className="size-4" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPercent !== null}
              >
                {uploadPercent !== null ? `Uploading… ${uploadPercent}%` : "Choose a video"}
              </Button>

              {uploadPercent !== null ? (
                <div className="h-2 w-full overflow-hidden rounded-full bg-surfaceMuted">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              ) : null}

              {draft.thumbnailUrl ? (
                <img
                  src={draft.thumbnailUrl}
                  alt=""
                  className="h-28 w-48 rounded-lg border border-line object-cover"
                />
              ) : null}
            </div>
          </FormField>

          <FormField
            label="Video URL"
            required
            helper="Filled in automatically after an upload. You can also paste a direct .mp4 or .m3u8 link — page links like YouTube cannot play in the app."
          >
            <input
              className="app-input"
              value={draft.videoUrl}
              onChange={(event) =>
                setDraft((current) => ({ ...current, videoUrl: event.target.value }))
              }
              placeholder="https://res.cloudinary.com/…/video.mp4"
            />
          </FormField>

          <FormField label="Title" required helper="Shown beneath the player in the app.">
            <input
              className="app-input"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="e.g. Paying with mobile money"
            />
          </FormField>

          <FormField label="Description" optional>
            <textarea
              className="app-input min-h-20"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="One line on what the video shows."
            />
          </FormField>

          <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-surfaceMuted px-4 py-4">
            <div className="min-w-0">
              <p className="font-medium text-textStrong">Published</p>
              <p className="mt-1 text-sm text-textMuted">
                Unpublished videos stay hidden in the app, so you can upload ahead of time.
              </p>
            </div>
            <Toggle
              checked={draft.isPublished}
              onChange={(value) => setDraft((current) => ({ ...current, isPublished: value }))}
              label="Published"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this video?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed from the app and deleted from Cloudinary. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete video"
        confirmVariant="danger"
        isLoading={isDeleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

export default GuideVideosPage;
