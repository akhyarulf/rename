import { zipSync } from "fflate";
import type { PhotoItem, Settings } from "./rename";
import { buildAllFilenames } from "./rename";

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
): Promise<void> {
  const names = buildAllFilenames(photos, settings);
  const entries: Record<string, Uint8Array> = {};

  await Promise.all(
    photos.map(async (photo, i) => {
      const buffer = await photo.file.arrayBuffer();
      entries[names[i]] = new Uint8Array(buffer);
    }),
  );

  // Foto biasanya sudah terkompresi, level 0 jauh lebih cepat tanpa menurunkan kualitas.
  const zipped = zipSync(entries, { level: 0 });
  const copy = new Uint8Array(zipped.length);
  copy.set(zipped);
  const blob = new Blob([copy.buffer], { type: "application/zip" });
  triggerDownload(blob, `${names[0].replace(/\.[^.]+$/, "")}.zip`);
}

export function downloadSingle(photo: PhotoItem, newName: string) {
  triggerDownload(photo.file, newName);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
