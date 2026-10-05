export type CroppedArea = { x: number; y: number; width: number; height: number };

/**
 * Potong area (piksel asli) dari sebuah gambar dan hasilkan JPEG hasil re-encode.
 * createImageBitmap dipakai dulu supaya orientasi EXIF foto HP dihormati; kalau
 * tidak tersedia, fallback ke <img>.
 */
export async function cropToJpegBlob(
  source: Blob,
  area: CroppedArea,
  quality = 0.9,
): Promise<Blob> {
  let objectUrl: string | null = null;
  let loaded: ImageBitmap | HTMLImageElement | null = null;

  try {
    loaded =
      typeof createImageBitmap === "function"
        ? await createImageBitmap(source, { imageOrientation: "from-image" }).catch(() => null)
        : null;

    if (!loaded) {
      objectUrl = URL.createObjectURL(source);
      loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Gagal memuat gambar."));
        img.src = objectUrl as string;
      });
    }

    const width = Math.max(1, Math.round(area.width));
    const height = Math.max(1, Math.round(area.height));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak didukung browser ini.");

    ctx.drawImage(
      loaded as CanvasImageSource,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      width,
      height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), "image/jpeg", quality),
    );
    if (!blob) throw new Error("Gagal memproses gambar.");
    return blob;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (loaded && "close" in loaded && typeof loaded.close === "function") {
      (loaded as ImageBitmap).close();
    }
  }
}

export function withJpegExtension(name: string): string {
  return `${name.replace(/\.[^.]+$/, "")}.jpg`;
}
