import { zipSync } from "fflate";
import type { PhotoItem, Settings } from "./rename";
import { buildAllFilenames, slugifyDescription } from "./rename";
import { stripExif } from "./exif";

const EXIF_STORAGE_KEY = "nyasar-rename:exif-default:v1";

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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadZip(
  photos: PhotoItem[],
  settings: Settings,
  stripExifDefault = loadExifDefault(),
): Promise<void> {
  const names = buildAllFilenames(photos, settings);
  const entries: Record<string, Uint8Array> = {};

  await Promise.all(
    photos.map(async (photo, i) => {
      const buffer = await photo.file.arrayBuffer();
      const raw = new Uint8Array(buffer);
      const clean = stripExifDefault ? await stripExif(raw) : raw;
      entries[names[i]] = clean;
    }),
  );

  // Foto biasanya sudah terkompresi, level 0 jauh lebih cepat tanpa menurunkan kualitas.
  const zipped = zipSync(entries, { level: 0 });
  const copy = new Uint8Array(zipped.length);
  copy.set(zipped);
  const blob = new Blob([copy.buffer], { type: "application/zip" });
  const folder = slugifyDescription(settings.slug, 6, 60) || "foto";
  triggerDownload(blob, `${folder}.zip`);
}

export function downloadSingle(
  photo: PhotoItem,
  newName: string,
  stripExifDefault = loadExifDefault(),
): void {
  photo.file.arrayBuffer().then((buffer) => {
    const raw = new Uint8Array(buffer);
    if (stripExifDefault) {
      stripExif(raw).then((cleaned) => {
        triggerDownload(new Blob([cleaned as Uint8Array<ArrayBuffer>]), newName);
      });
    } else {
      triggerDownload(new Blob([raw as Uint8Array<ArrayBuffer>]), newName);
    }
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
