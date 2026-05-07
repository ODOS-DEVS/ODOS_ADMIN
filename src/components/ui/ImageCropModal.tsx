import Cropper from "react-easy-crop";
import { useEffect, useMemo, useState } from "react";

import { cropImageFile, type CroppedAreaPixels } from "@/utils/cropImage";

type ImageCropModalProps = {
  file: File | null;
  open: boolean;
  aspect?: number;
  eyebrow?: string;
  title?: string;
  description?: string;
  outputLabel?: string;
  outputDescription?: string;
  onClose: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropModal({
  file,
  open,
  aspect = 4 / 5,
  eyebrow = "Crop Image",
  title = "Choose the framing shoppers will see",
  description = "Move and zoom the image until the most important part sits nicely in the frame.",
  outputLabel = "4:5 portrait crop",
  outputDescription = "Best for product cards, detail galleries, and clean merchandising.",
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsSaving(false);
    }
  }, [open]);

  if (!open || !file || !imageUrl) {
    return null;
  }

  async function handleConfirm() {
    if (!croppedAreaPixels || !file) {
      return;
    }

    setIsSaving(true);
    try {
      const croppedFile = await cropImageFile(file, croppedAreaPixels);
      onConfirm(croppedFile);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-6xl rounded-[28px] border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">{eyebrow}</p>
            <h3 className="mt-2 text-2xl font-semibold text-textStrong">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm text-textMuted">{description}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-textStrong transition hover:border-white/20 hover:bg-white/5"
            onClick={onClose}
            disabled={isSaving}
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative h-[560px] overflow-hidden rounded-[24px] border border-white/10 bg-slate-950">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <label className="block text-sm font-medium text-textStrong">Zoom</label>
            <input
              className="mt-3 w-full accent-accent"
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            <p className="mt-2 text-xs text-textMuted">Use the slider to tighten or relax the crop.</p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Output</p>
              <p className="mt-3 text-sm text-textStrong">{outputLabel}</p>
              <p className="mt-2 text-sm text-textMuted">
                {outputDescription}
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm text-textStrong transition hover:border-white/20 hover:bg-white/5"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => void handleConfirm()}
                disabled={isSaving || !croppedAreaPixels}
              >
                {isSaving ? "Cropping..." : "Use crop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
