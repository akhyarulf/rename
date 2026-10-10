/**
 * Metadata stripping helpers for Nyasar Nyaman rename tool.
 *
 * Foto hasil crop sudah aman karena di-encode ulang jadi JPEG lewat canvas.
 * Foto yang tidak di-crop masih byte asli; kalau dari HP bisa ada GPS.
 * Fungsi ini dipanggil dari alur unduh (ZIP / unduh per-foto) dan membersihkan
 * metadata sensitif sebelum file masuk ke arsip yang diunduh user.
 */

import type { PhotoItem } from "./rename";

const EXIF_STORAGE_KEY = "nyasar-rename:exif-default:v1";

export async function downloadZipWithExif(
  photos: PhotoItem[],
  settings: {
    slug: string;
    pad?: 2 | 3;
    withSuffix?: boolean;
    withDescription?: boolean;
    format?: "jpg" | "keep";
    lastDescription?: string;
  },
  stripExifDefault = loadExifDefault(),
): Promise<Uint8Array> {
  const entries: Array<[string, ArrayBuffer]> = [];
  for (const photo of photos) {
    const entry = buildFilename(
      settings,
      1,
      photo.originalName,
      photo.description,
    );
    const buffer = await photo.file.arrayBuffer();
    const raw = new Uint8Array(buffer);
    const clean = stripExifDefault
      ? await stripExif(raw)
      : raw.buffer;
    entries.push([entry, clean as ArrayBuffer]);
  }
  const zipped = zipSync(
    entries.reduce(
      (map, [key, value]) => {
        map[key] = value;
        return map;
      },
      {} as Record<string, ArrayBuffer>,
    ),
    { level: 0 },
  );
  const copy = new Uint8Array(zipped.length);
  copy.set(zipped);
  return copy;
}

export function loadExifDefault(): boolean {
  try {
    const raw = localStorage.getItem(EXIF_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

export function saveExifDefault(value: boolean): void {
  try {
    localStorage.setItem(EXIF_STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* abaikan */
  }
}

export async function stripExif(source: Uint8Array): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(
    new Blob([source as Uint8Array<ArrayBuffer>], { type: guessMimeType(source) }),
  );
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung browser ini.");

  const out = await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) return reject(new Error("Gagal memproses gambar."));
        const out = result as Blob;
        const rawBytes = new Uint8Array(out.size);
        resolve(rawBytes);
      },
      "image/jpeg",
      0.95,
    );
  });

  ctx.drawImage(bitmap, 0, 0);
  if (typeof bitmap.close === "function") bitmap.close();
  return out;
}

function guessMimeType(source: Uint8Array): string {
  if (source.length < 4) return "image/jpeg";
  const head = source[0] | (source[1] << 8);
  if (head === 0xffd8) return "image/jpeg";
  if (
    source[0] === 0x89 &&
    source[1] === 0x50 &&
    source[2] === 0x4e &&
    source[3] === 0x47
  )
    return "image/png";
  if (
    source[0] === 0x52 &&
    source[1] === 0x45 &&
    source[2] === 0x47 &&
    source[3] === 0x49 &&
    source[4] === 0x46
  )
    return "image/gif";
  if (
    source[0] === 0x57 &&
    source[1] === 0x50 &&
    source[2] === 0x45 &&
    source[3] === 0x50
  )
    return "image/webp";
  return "image/jpeg";
}

function zipSync(entries: Record<string, ArrayBuffer>, _opts: { level: number }): Uint8Array {
  const parts = Object.values(entries).map((buf) => new Uint8Array(buf));
  if (parts.length === 0) return new Uint8Array(0);

  let total = 0;
  for (const p of parts) {
    total += p.length;
  }

  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

function buildFilename(settings: { slug: string; pad?: 2 | 3; withSuffix?: boolean; withDescription?: boolean; format?: "jpg" | "keep"; lastDescription?: string }, index: number, originalName: string, description: string): string {
  const pad = settings.pad ?? 2;
  const num = String(index).padStart(pad, "0");
  const slug = settings.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "foto";
  const ext = settings.format === "jpg" ? "jpg" : originalName.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || "jpg";
  const parts = [num, slug];
  if (settings.withDescription) {
    const desc = slugifyDescription(description);
    if (desc) parts.push(desc);
  }
  if (settings.withSuffix !== false) parts.push("nyasar-nyaman");
  return `${parts.join("-")}.${ext}`;
}

function slugifyDescription(value: string, maxWords = 4, maxChars = 48): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, maxWords)
    .join("-")
    .slice(0, maxChars)
    .replace(/-+$/, "");
}
