import { ApiError, requestJson } from "@/api/client";

/**
 * Tutorial videos for the mobile app's resource-center guides.
 *
 * Uploads go straight from this browser to Cloudinary. The backend only
 * issues a signature and then records the resulting URL, so a 60MB video
 * never occupies an API worker — see `uploadGuideVideoToCloudinary` below.
 */

export type GuideCatalogStep = {
  index: number;
  title: string;
};

export type GuideCatalogEntry = {
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  minutes: number | null;
  starterOrder: number | null;
  steps: GuideCatalogStep[];
  videoCount: number;
  publishedVideoCount: number;
};

export type GuideCatalog = {
  guides: GuideCatalogEntry[];
  /** Slugs holding videos that the shipped app no longer lists. */
  unknownSlugs: string[];
};

export type GuideVideo = {
  id: string;
  guideSlug: string;
  stepIndex: number | null;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  provider: string;
  publicId: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GuideVideoDraft = {
  guideSlug: string;
  stepIndex: number | null;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  provider: string;
  publicId: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  isPublished: boolean;
  sortOrder: number;
};

type BackendGuideCatalogEntry = {
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  minutes: number | null;
  starter_order: number | null;
  steps: GuideCatalogStep[];
  video_count: number;
  published_video_count: number;
};

type BackendGuideCatalog = {
  guides: BackendGuideCatalogEntry[];
  unknown_slugs: string[];
};

type BackendGuideVideo = {
  id: string;
  guide_slug: string;
  step_index: number | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  provider: string;
  public_id: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type BackendUploadSignature = {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
  upload_url: string;
};

/** What Cloudinary hands back once the file is stored. */
export type CloudinaryVideoUploadResult = {
  videoUrl: string;
  thumbnailUrl: string;
  publicId: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};

function mapCatalogEntry(entry: BackendGuideCatalogEntry): GuideCatalogEntry {
  return {
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
    summary: entry.summary,
    minutes: entry.minutes,
    starterOrder: entry.starter_order,
    steps: entry.steps ?? [],
    videoCount: entry.video_count,
    publishedVideoCount: entry.published_video_count,
  };
}

function mapVideo(video: BackendGuideVideo): GuideVideo {
  return {
    id: video.id,
    guideSlug: video.guide_slug,
    stepIndex: video.step_index,
    title: video.title,
    description: video.description,
    videoUrl: video.video_url,
    thumbnailUrl: video.thumbnail_url,
    provider: video.provider,
    publicId: video.public_id,
    durationSeconds: video.duration_seconds,
    width: video.width,
    height: video.height,
    isPublished: video.is_published,
    sortOrder: video.sort_order,
    createdAt: video.created_at,
    updatedAt: video.updated_at,
  };
}

function buildPayload(draft: GuideVideoDraft) {
  const optional = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };

  return {
    guide_slug: draft.guideSlug.trim().toLowerCase(),
    step_index: draft.stepIndex,
    title: draft.title.trim(),
    description: optional(draft.description),
    video_url: draft.videoUrl.trim(),
    thumbnail_url: optional(draft.thumbnailUrl),
    provider: draft.provider.trim() || "cloudinary",
    public_id: optional(draft.publicId),
    duration_seconds: draft.durationSeconds,
    width: draft.width,
    height: draft.height,
    is_published: draft.isPublished,
    sort_order: draft.sortOrder,
  };
}

export function buildGuideVideoDraft(video?: GuideVideo | null): GuideVideoDraft {
  return {
    guideSlug: video?.guideSlug ?? "",
    stepIndex: video?.stepIndex ?? null,
    title: video?.title ?? "",
    description: video?.description ?? "",
    videoUrl: video?.videoUrl ?? "",
    thumbnailUrl: video?.thumbnailUrl ?? "",
    provider: video?.provider ?? "cloudinary",
    publicId: video?.publicId ?? "",
    durationSeconds: video?.durationSeconds ?? null,
    width: video?.width ?? null,
    height: video?.height ?? null,
    isPublished: video?.isPublished ?? true,
    sortOrder: video?.sortOrder ?? 0,
  };
}

export async function getGuideCatalog(token: string): Promise<GuideCatalog> {
  const catalog = await requestJson<BackendGuideCatalog>("/admin/guides/catalog", { token });
  return {
    guides: (catalog.guides ?? []).map(mapCatalogEntry),
    unknownSlugs: catalog.unknown_slugs ?? [],
  };
}

export async function getGuideVideos(token: string): Promise<GuideVideo[]> {
  const videos = await requestJson<BackendGuideVideo[]>("/admin/guides/videos", { token });
  return videos.map(mapVideo);
}

export async function createGuideVideo(token: string, draft: GuideVideoDraft) {
  const video = await requestJson<BackendGuideVideo>("/admin/guides/videos", {
    method: "POST",
    token,
    body: JSON.stringify(buildPayload(draft)),
  });
  return mapVideo(video);
}

export async function updateGuideVideo(token: string, videoId: string, draft: GuideVideoDraft) {
  const video = await requestJson<BackendGuideVideo>(`/admin/guides/videos/${videoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(buildPayload(draft)),
  });
  return mapVideo(video);
}

export async function deleteGuideVideo(token: string, videoId: string) {
  return requestJson<{ success: true }>(`/admin/guides/videos/${videoId}`, {
    method: "DELETE",
    token,
  });
}

/**
 * Upload a video file to Cloudinary directly from the browser.
 *
 * XMLHttpRequest rather than fetch purely for `upload.onprogress` — a video
 * upload takes long enough that a progress bar is the difference between
 * "working" and "frozen". Resolves with the fields the caller then saves
 * against the guide.
 */
export async function uploadGuideVideoToCloudinary(
  token: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryVideoUploadResult> {
  const signature = await requestJson<BackendUploadSignature>(
    "/admin/guides/videos/upload-signature",
    { method: "POST", token },
  );

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.api_key);
  form.append("timestamp", String(signature.timestamp));
  form.append("folder", signature.folder);
  form.append("signature", signature.signature);

  const payload = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", signature.upload_url);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(request.responseText) as Record<string, unknown>;
      } catch {
        reject(new ApiError("Cloudinary returned a response we could not read."));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        const error = parsed.error as { message?: string } | undefined;
        reject(new ApiError(error?.message ?? "Cloudinary rejected the upload.", request.status));
        return;
      }

      resolve(parsed);
    };

    request.onerror = () =>
      reject(new ApiError("The upload could not reach Cloudinary. Check your connection."));
    request.onabort = () => reject(new ApiError("The upload was cancelled."));

    request.send(form);
  });

  const secureUrl = typeof payload.secure_url === "string" ? payload.secure_url : "";
  if (!secureUrl) {
    throw new ApiError("Cloudinary did not return a video URL.");
  }

  const publicId = typeof payload.public_id === "string" ? payload.public_id : "";
  const duration = typeof payload.duration === "number" ? Math.round(payload.duration) : null;
  const width = typeof payload.width === "number" ? payload.width : null;
  const height = typeof payload.height === "number" ? payload.height : null;

  return {
    videoUrl: secureUrl,
    // Cloudinary generates a still from any uploaded video by swapping the
    // extension, so a poster frame costs no extra upload or storage.
    thumbnailUrl: secureUrl.replace(/\.[^./]+$/, ".jpg"),
    publicId,
    durationSeconds: duration,
    width,
    height,
  };
}
