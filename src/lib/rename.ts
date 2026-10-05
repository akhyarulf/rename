export type PhotoItem = {
  id: string;
  file: File;
  url: string;
  originalName: string;
  description: string;
};

export type Settings = {
  slug: string;
  pad: 2 | 3;
  withSuffix: boolean;
  withDescription: boolean;
  format: "jpg" | "keep";
  /** Deskripsi terakhir yang dipakai, dipakai lagi di sesi berikutnya. */
  lastDescription: string;
};

export const SUFFIX = "nyasar-nyaman";
export const FALLBACK_SLUG = "foto";

/** Ubah input bebas jadi slug: huruf kecil, spasi/non-alnum jadi strip, squeeze. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deskripsi jadi potongan nama file: maksimal 4 kata, biar filename tidak kepanjangan. */
export function slugifyDescription(value: string, maxWords = 4, maxChars = 48): string {
  return slugify(value)
    .split("-")
    .filter(Boolean)
    .slice(0, maxWords)
    .join("-")
    .slice(0, maxChars)
    .replace(/-+$/, "");
}

export function padIndex(index: number, pad: number): string {
  return String(index).padStart(pad, "0");
}

export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : "jpg";
}

export function buildFilename(
  settings: Settings,
  index: number,
  originalName: string,
  description = "",
): string {
  const slug = slugify(settings.slug) || FALLBACK_SLUG;
  const ext =
    settings.format === "jpg" ? "jpg" : extensionOf(originalName);
  const parts = [padIndex(index, settings.pad), slug];
  // Deskripsi disisipkan di belakang slug, sebelum penanda blog, supaya
  // format lama (angka-namagunungdanjalur-nyasarnyaman) tetap utuh.
  if (settings.withDescription) {
    const desc = slugifyDescription(description);
    if (desc) parts.push(desc);
  }
  if (settings.withSuffix) parts.push(SUFFIX);
  return `${parts.join("-")}.${ext}`;
}

export function buildAllFilenames(
  photos: PhotoItem[],
  settings: Settings,
): string[] {
  return photos.map((photo, i) =>
    buildFilename(settings, i + 1, photo.originalName, photo.description),
  );
}

/** Pindahkan foto ke posisi target (1-based), tanpa menghasilkan nomor duplikat. */
export function reorderTo<T>(items: T[], from: number, target: number): T[] {
  const next = [...items];
  const clamped = Math.min(Math.max(target, 1), next.length);
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return items;
  next.splice(clamped - 1, 0, moved);
  return next;
}

export function move<T>(items: T[], from: number, delta: number): T[] {
  return reorderTo(items, from, from + 1 + delta);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
