export type CroppedArea = { x: number; y: number; width: number; height: number };

/** Kotak batas ukuran keluaran; null = ikuti ukuran area crop. */
export type SizePreset = { label: string; width: number | null; height: number | null };

export const SIZE_PRESETS: SizePreset[] = [
  { label: "Ikuti crop", width: null, height: null },
  { label: "1920 × 1080", width: 1920, height: 1080 },
  { label: "1600 × 900", width: 1600, height: 900 },
  { label: "1280 × 720", width: 1280, height: 720 },
  { label: "1200 × 900", width: 1200, height: 900 },
  { label: "800 × 600", width: 800, height: 600 },
  { label: "1080 × 1080", width: 1080, height: 1080 },
  { label: "1080 × 1440", width: 1080, height: 1440 },
  { label: "1080 × 1920", width: 1080, height: 1920 },
  { label: "900 × 1200", width: 900, height: 1200 },
];

export function formatSize(size: { width: number; height: number }): string {
  return `${size.width} × ${size.height} px`;
}

/**
 * Hitung ukuran PNG/JPEG keluaran dari area crop dan batas ukuran yang dipilih.
 * Rasio selalu mengikuti area crop (tidak diregangkan), dan skala hanya mengecil
 * kecuali allowUpscale aktif.
 */
export function resolveOutputSize(
  area: { width: number; height: number },
  preset: SizePreset,
  allowUpscale = false,
): { width: number; height: number } {
  const width = Math.max(1, Math.round(area.width));
  const height = Math.max(1, Math.round(area.height));
  if (!preset.width && !preset.height) return { width, height };
  const maxWidth = preset.width ?? Number.POSITIVE_INFINITY;
  const maxHeight = preset.height ?? Number.POSITIVE_INFINITY;
  let scale = Math.min(maxWidth / width, maxHeight / height);
  if (!allowUpscale) scale = Math.min(1, scale);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Potong area (piksel asli) dari sebuah gambar dan hasilkan JPEG hasil re-encode.
 * createImageBitmap dipakai dulu supaya orientasi EXIF foto HP dihormati; kalau
 * tidak tersedia, fallback ke <img>.
 */
export async function cropToJpegBlob(
  source: Blob,
  area: CroppedArea,
  quality = 0.9,
  outputSize?: { width: number; height: number },
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

    const width = Math.max(1, Math.round(outputSize?.width ?? area.width));
    const height = Math.max(1, Math.round(outputSize?.height ?? area.height));
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
