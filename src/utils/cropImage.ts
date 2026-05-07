export type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

async function createImage(url: string) {
  const image = new Image();
  image.src = url;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to load image for cropping."));
  });
  return image;
}

export async function cropImageFile(
  file: File,
  croppedAreaPixels: CroppedAreaPixels,
) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await createImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create crop canvas.");
    }

    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, file.type || "image/jpeg", 0.92);
    });

    if (!blob) {
      throw new Error("Unable to prepare cropped image.");
    }

    return new File([blob], file.name, {
      type: blob.type || file.type || "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
