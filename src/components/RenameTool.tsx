import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Button, fieldClass } from "./ui";
import Lightbox from "./Lightbox";
import {
  buildAllFilenames,
  formatBytes,
  move,
  reorderTo,
  slugify,
  slugifyDescription,
  SUFFIX,
  type PhotoItem,
  type Settings,
} from "../lib/rename";
import {
  cropToJpegBlob,
  formatSize,
  resolveOutputSize,
  SIZE_PRESETS,
  withJpegExtension,
  type CroppedArea,
  type SizePreset,
} from "../lib/crop";
import { copyText, downloadSingle, downloadZip } from "../lib/download";

const STORAGE_KEY = "nyasar-rename:settings:v1";
const UPLOADS_URL = "https://blog.nyasarnyaman.my.id/wp-content/uploads";

const RATIOS = [
  { label: "Bebas", value: null },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "1:1", value: 1 },
] as const;

const QUICK_DESCRIPTIONS = [
  "panorama gunung",
  "pemandangan luas",
  "sunrise",
  "puncak",
  "kami di kamp",
  "suasana jalur",
];

type Notice = { tone: "ok" | "warn"; text: string } | null;

type CropEntry = PhotoItem & { originalFile: File; cropped: boolean; cropInfo: string };

export const CROP_STORAGE_KEY = "nyasar-rename:crop:v1";

function loadSettings(): Settings {
  const fallback: Settings = {
    slug: "",
    pad: 2,
    withSuffix: true,
    withDescription: true,
    format: "keep",
    lastDescription: "",
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      slug: typeof parsed.slug === "string" ? parsed.slug : fallback.slug,
      pad: parsed.pad === 3 ? 3 : 2,
      withSuffix: parsed.withSuffix !== false,
      withDescription: parsed.withDescription !== false,
      format: parsed.format === "jpg" ? "jpg" : "keep",
      lastDescription:
        typeof parsed.lastDescription === "string" ? parsed.lastDescription : "",
    };
  } catch {
    return fallback;
  }
}

export default function RenameTool({ initialPhotos = [] }: { initialPhotos?: PhotoItem[] }) {
  const [photos, setPhotos] = useState<CropEntry[]>(() =>
    initialPhotos.map((photo): CropEntry => ({
      ...photo,
      originalFile: photo.file,
      cropped: false,
      cropInfo: "",
    })),
  );
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [notice, setNotice] = useState<Notice>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [cropTarget, setCropTarget] = useState<{ index: number; url: string } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<number | null>(null);
  const [area, setArea] = useState<CroppedArea | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [allowUpscale, setAllowUpscale] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);
  const urls = useRef<string[]>([]);
  const cropUrls = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Isi kolom deskripsi cepat dengan deskripsi terakhir yang dipakai.
  useEffect(() => {
    setShared(settings.lastDescription);
  }, []);

  // Simpan & pulihkan status crop per foto biar tidak hilang saat halaman di-refresh.
  useEffect(() => {
    try {
      const id = cropTarget?.url;
      if (!id) return;
      const raw = localStorage.getItem(`${CROP_STORAGE_KEY}:${id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          crop: { x: number; y: number };
          zoom: number;
          ratio: number | null;
          presetIndex: number;
          allowUpscale: boolean;
        }>;
        if (parsed.crop) setCrop(parsed.crop);
        if (typeof parsed.zoom === "number") setZoom(parsed.zoom);
        if (parsed.ratio !== undefined) setRatio(parsed.ratio);
        if (typeof parsed.presetIndex === "number") setPresetIndex(parsed.presetIndex);
        if (typeof parsed.allowUpscale === "boolean") setAllowUpscale(parsed.allowUpscale);
      }
    } catch {
      /* abaikan */
    }
  }, [cropTarget?.url]);

  useEffect(() => {
    try {
      const id = cropTarget?.url;
      if (!id) return;
      localStorage.setItem(
        `${CROP_STORAGE_KEY}:${id}`,
        JSON.stringify({
          crop,
          zoom,
          ratio,
          presetIndex,
          allowUpscale,
        }),
      );
    } catch {
      /* abaikan */
    }
  }, [cropTarget?.url, crop, zoom, ratio, presetIndex, allowUpscale]);

  const names = useMemo(() => buildAllFilenames(photos, settings), [photos, settings]);
  const totalSize = useMemo(
    () => photos.reduce((sum, photo) => sum + photo.file.size, 0),
    [photos],
  );

  const slugPreview = slugify(settings.slug);
  const sampleDescription = settings.withDescription
    ? slugifyDescription(shared)
    : "";
  const sample = [
    String(1).padStart(settings.pad, "0"),
    slugPreview || "foto",
    sampleDescription,
    settings.withSuffix ? SUFFIX : "",
  ]
    .filter(Boolean)
    .join("-") + ".jpg";

  const closePreview = useCallback(() => setPreviewIndex(null), []);
  const closeCrop = useCallback(() => setCropTarget(null), []);
  const showPrev = useCallback(
    () =>
      setPreviewIndex((current) =>
        current === null ? null : (current - 1 + photos.length) % photos.length,
      ),
    [photos.length],
  );
  const showNext = useCallback(
    () =>
      setPreviewIndex((current) =>
        current === null ? null : (current + 1) % photos.length,
      ),
    [photos.length],
  );

  function setAllDescriptions(value: string) {
    setPhotos((current) => current.map((photo) => ({ ...photo, description: value })));
  }

  function setDescription(id: string, value: string) {
    setPhotos((current) =>
      current.map((photo) => (photo.id === id ? { ...photo, description: value } : photo)),
    );
  }

  function handleSharedChange(value: string) {
    setShared(value);
    setSettings((s) => ({ ...s, lastDescription: value }));
    if (applyToAll) setAllDescriptions(value);
  }

  function applyPasteList() {
    const lines = pasteText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      flash("Tulis minimal satu deskripsi per baris.", "warn");
      return;
    }
    setPhotos((current) =>
      current.map((photo, i) => ({
        ...photo,
        description: lines[i] ?? photo.description,
      })),
    );
    const extra = lines.length - photos.length;
    flash(
      extra > 0
        ? `${Math.min(lines.length, photos.length)} foto diberi deskripsi, ${extra} baris tidak terpakai.`
        : `${Math.min(lines.length, photos.length)} foto diberi deskripsi.`,
      extra > 0 ? "warn" : "ok",
    );
  }

  function flash(text: string, tone: "ok" | "warn" = "ok") {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 4000);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const images = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    const skipped = fileList.length - images.length;
    if (images.length === 0) {
      flash("Hanya file foto (JPG/PNG/WebP) yang bisa dimasukkan.", "warn");
      return;
    }
    const next = images.map((file) => {
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      return {
        id: `${url}-${file.name}`,
        file,
        url,
        originalName: file.name,
        description: "",
        originalFile: file,
        cropped: false,
        cropInfo: "",
      } satisfies CropEntry;
    });
    setPhotos((current) => [...current, ...next]);
    if (skipped > 0) flash(`${next.length} foto masuk, ${skipped} berkas lain dilewati.`, "warn");
    else flash(`${next.length} foto ditambahkan.`);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const found = current.find((photo) => photo.id === id);
      if (found) {
        const croppedUrl = cropUrls.current.get(id);
        if (croppedUrl) cropUrls.current.delete(id);
        const stale = croppedUrl ?? found.url;
        URL.revokeObjectURL(found.url);
        if (croppedUrl) URL.revokeObjectURL(croppedUrl);
        urls.current = urls.current.filter(
          (url) => url !== found.url && url !== stale,
        );
      }
      return current.filter((photo) => photo.id !== id);
    });
  }

  function clearAll() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    urls.current = [];
    cropUrls.current.clear();
    setPhotos([]);
  }

  async function handleZip() {
    setBusy(true);
    try {
      await downloadZip(photos, settings);
      flash(`ZIP ${photos.length} foto sedang diunduh.`);
    } catch {
      flash("Gagal membuat ZIP. Coba dengan foto yang lebih sedikit.", "warn");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy(kind: "list" | "markdown") {
    const text =
      kind === "list"
        ? names.join("\n")
        : photos
            .map((photo, i) => {
              const alt = photo.description.trim() || names[i].replace(/\.[^.]+$/, "");
              return `![${alt}](${UPLOADS_URL}/${names[i]})`;
            })
            .join("\n");
    const ok = await copyText(text);
    flash(
      ok
        ? kind === "list"
          ? "Daftar nama file tersalin."
          : "Kode Markdown tersalin."
        : "Browser menolak akses clipboard. Salin manual dari daftar nama.",
      ok ? "ok" : "warn",
    );
  }

  // ---- crop per foto ----
  function openCrop(index: number) {
    const photo = photos[index];
    if (!photo) return;
    setCropTarget({ index, url: photo.url });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setRatio(null);
    setPresetIndex(0);
    setAllowUpscale(false);
  }

  const onCropComplete = useCallback(
    (_: unknown, pixelArea: CroppedArea) => setArea(pixelArea),
    [],
  );

  async function saveCrop() {
    if (!cropTarget || !area) {
      flash("Geser kotak crop dulu di atas fotonya.", "warn");
      return;
    }
    const current = photos[cropTarget.index];
    if (!current) return;
    setBusy(true);
    try {
      const preset: SizePreset = SIZE_PRESETS[presetIndex] ?? SIZE_PRESETS[0];
      const size = resolveOutputSize(area, preset, allowUpscale);
      const blob = await cropToJpegBlob(current.originalFile, area, 0.9, size);
      const croppedFile = new File([blob], withJpegExtension(current.originalName), {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(croppedFile);
      urls.current.push(url);
      cropUrls.current.set(current.id, url);
      setPhotos((all) =>
        all.map((photo, i) =>
          i === cropTarget.index
            ? { ...photo, file: croppedFile, url, cropped: true, cropInfo: formatSize(size) }
            : photo,
        ),
      );
      flash("Hasil crop menggantikan foto ini. Foto lain tetap asli.");
      setCropTarget(null);
    } catch {
      flash("Gagal memotong foto. Coba lagi.", "warn");
    } finally {
      setBusy(false);
    }
  }

  function resetCrop(id: string) {
    const entry = photos.find((photo) => photo.id === id);
    if (!entry || !entry.cropped) return;
    const croppedUrl = cropUrls.current.get(id);
    if (croppedUrl) {
      URL.revokeObjectURL(croppedUrl);
      cropUrls.current.delete(id);
      urls.current = urls.current.filter((url) => url !== croppedUrl);
    }
    const url = URL.createObjectURL(entry.originalFile);
    urls.current.push(url);
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === id
          ? {
              ...photo,
              file: photo.originalFile,
              url,
              originalName: photo.originalFile.name,
              cropped: false,
              cropInfo: "",
            }
          : photo,
      ),
    );
    flash("Foto kembali ke versi asli.");
  }

  const currentPreset: SizePreset = SIZE_PRESETS[presetIndex] ?? SIZE_PRESETS[0];
  const outputSize = useMemo(
    () => (area ? resolveOutputSize(area, currentPreset, allowUpscale) : null),
    [area, currentPreset, allowUpscale],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        {/* Step 0 — ringkasan nama & deskripsi kecil di atas judul jaket */}
        <div className="rounded-3xl border border-moss-200/70 bg-white p-6 shadow-sm shadow-moss-900/5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-sm font-semibold tracking-wide text-ember-600 uppercase">Deskripsi</span>
              <input
                id="desc-preview"
                className={`${fieldClass} flex-1 min-w-0`}
                value={shared}
                onChange={(event) => handleSharedChange(event.target.value)}
                placeholder="misal: panorama dari puncak gunung"
              />
            </div>
            {applyToAll && (
              <div className="rounded-lg border border-ember-300/50 bg-ember-300/10 px-3 py-1.5 text-xs text-ember-700">
                Widget deskripsi sedang diterapkan ke semua foto.
              </div>
            )}
          </div>
        </div>

        {/* Step 1 — nama jalur */}
        <section className="rounded-3xl border border-moss-200/70 bg-white p-6 shadow-sm shadow-moss-900/5">
          <StepBadge step={1} title="Tulis nama gunung & jalur" />
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="slug" className="text-sm font-semibold text-moss-800">
                Nama gunung dan jalur
              </label>
              <input
                id="slug"
                className={`${fieldClass} mt-2`}
                placeholder="lawu-via-cemoro-sewu"
                value={settings.slug}
                onChange={(event) =>
                  setSettings((s) => ({ ...s, slug: slugify(event.target.value) }))
                }
              />
              <p className="mt-2 text-xs text-ink-500">
                Huruf besar dan spasi otomatis jadi strip. Contoh:{" "}
                <span className="font-mono text-moss-700">Gunung Lawu via Cemoro Sewu</span> →
                {" "}
                <span className="font-mono text-moss-700">gunung-lawu-via-cemoro-sewu</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-moss-200 bg-sand-50 px-3 py-2">
                <span className="text-sm text-ink-700">Nomor</span>
                <select
                  aria-label="Jumlah digit nomor"
                  className="rounded-lg border border-moss-200 bg-white px-2 py-1 text-sm font-semibold text-moss-800 outline-none focus:border-moss-500"
                  value={settings.pad}
                  onChange={(event) =>
                    setSettings((s) => ({ ...s, pad: Number(event.target.value) as 2 | 3 }))
                  }
                >
                  <option value={2}>01, 02, 03</option>
                  <option value={3}>001, 002, 003</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-moss-200 bg-sand-50 px-3 py-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-moss-600"
                  checked={settings.withSuffix}
                  onChange={(event) =>
                    setSettings((s) => ({ ...s, withSuffix: event.target.checked }))
                  }
                />
                Akhiri dengan <span className="font-mono text-moss-700">-nyasar-nyaman</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-moss-200 bg-sand-50 px-3 py-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-moss-600"
                  checked={settings.withDescription}
                  onChange={(event) =>
                    setSettings((s) => ({ ...s, withDescription: event.target.checked }))
                  }
                />
                Sisipkan <span className="font-mono text-moss-700">deskripsi</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-moss-200 bg-sand-50 px-3 py-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-moss-600"
                  checked={settings.format === "jpg"}
                  onChange={(event) =>
                    setSettings((s) => ({ ...s, format: event.target.checked ? "jpg" : "keep" }))
                  }
                />
                Paksa ekstensi <span className="font-mono text-moss-700">.jpg</span>
              </label>
            </div>

            <div className="rounded-2xl bg-moss-800 px-4 py-3 font-mono text-sm text-sand-100">
              {sample}
            </div>
          </div>
        </section>

        {/* Step 2 — foto */}
        <section className="rounded-3xl border border-moss-200/70 bg-white p-6 shadow-sm shadow-moss-900/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StepBadge step={2} title="Masukkan foto" />
            {photos.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-ink-500 underline-offset-4 hover:text-moss-700 hover:underline"
              >
                Hapus semua
              </button>
            )}
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            onClick={() => fileInput.current?.click()}
            className={`mt-4 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragging
                ? "border-moss-500 bg-moss-50"
                : "border-moss-300 bg-sand-50 hover:border-moss-500 hover:bg-moss-50/60"
            }`}
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-moss-100 text-moss-700">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-3 font-semibold text-moss-800">Tarik foto ke sini atau klik untuk pilih</p>
            <p className="mt-1 text-sm text-ink-500">Bisa pilih banyak file sekaligus. Foto tetap di perangkatmu.</p>
          </div>

          {photos.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-500">
              <span>
                <strong className="text-moss-800">{photos.length}</strong> foto · total {formatBytes(totalSize)}
              </span>
              <span>Urutkan dengan tombol ↑ ↓ atau tulis nomor yang kamu mau.</span>
            </div>
          )}
        </section>

        {/* Step 3 — urutan & deskripsi */}
        <section className="rounded-3xl border border-moss-200/70 bg-white p-6 shadow-sm shadow-moss-900/5">
          <StepBadge step={3} title="Atur urutan, nomor & deskripsi" />

          {/* Kontrol deskripsi sudah ada di atas; di sini hanya tempel daftar. */}
          {photos.length > 0 && (
            <div className="mt-3 rounded-2xl border border-moss-200 bg-moss-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-moss-800">Tempel daftar deskripsi</p>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => setPasteOpen((open) => !open)}
                >
                  {pasteOpen ? "Tutup tempel daftar" : "Tempel daftar (1 per baris)"}
                </Button>
              </div>
              {pasteOpen && (
                <div className="mt-3">
                  <textarea
                    value={pasteText}
                    onChange={(event) => setPasteText(event.target.value)}
                    rows={4}
                    placeholder="baris 1 = foto 01\nbaris 2 = foto 02"
                    className={`${fieldClass} font-mono text-sm`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={photos.length === 0}
                      onClick={applyPasteList}
                    >
                      Terapkan sesuai urutan
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={photos.length === 0}
                      onClick={() => {
                        setPasteText("");
                        flash("Daftar kosong. Tulis tiap deskripsi di baris baru.");
                      }}
                    >
                      Kosongkan
                    </Button>
                  </div>
                </div>
              )}
              {!pasteOpen && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_DESCRIPTIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSharedChange(preset)}
                      className="rounded-lg border border-moss-200 bg-white px-2.5 py-1 text-xs text-moss-800 transition hover:border-moss-500 hover:bg-moss-100"
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShared("");
                      setAllDescriptions("");
                      flash("Deskripsi di reset ke kosong.");
                    }}
                    className="rounded-lg border border-moss-200 bg-white px-2.5 py-1 text-xs text-ink-500 transition hover:text-ember-600"
                  >
                    reset ke kosong
                  </button>
                </div>
              )}
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-moss-600"
                  checked={applyToAll}
                  onChange={(event) => setApplyToAll(event.target.checked)}
                /                >
                 Terapkan otomatis ke semua foto saat saya mengetik di deskripsi
              </label>
            </div>
          )}

          {photos.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {photos.map((photo, index) => (
                <li
                  key={photo.id}
                  className="flex flex-col gap-3 rounded-2xl border border-moss-100 bg-sand-50 p-3 transition hover:border-moss-300 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3 sm:contents">
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(index)}
                      aria-label={`Perbesar ${photo.originalName}`}
                      title="Klik untuk melihat besar"
                      className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-moss-100 ring-1 ring-moss-200 transition hover:ring-moss-500 sm:h-16 sm:w-20"
                    >
                      <img
                        src={photo.url}
                        alt={photo.originalName}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-moss-900/40 text-sand-50 opacity-0 transition group-hover:opacity-100">
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
                          <circle cx="11" cy="11" r="6" />
                          <path d="M20 20l-3.5-3.5M11 8.5v5M8.5 11h5" strokeLinecap="round" />
                        </svg>
                      </span>
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-ink-500">
                        {photo.originalName} · {formatBytes(photo.file.size)}
                      </p>
                      <p className="mt-1 font-mono text-[13px] leading-snug font-semibold break-all text-moss-800 sm:text-sm">
                        {names[index]}
                      </p>
                      <input
                        ref={(node) => {
                          descriptionRefs.current[index] = node;
                        }}
                        value={photo.description}
                        onChange={(event) => setDescription(photo.id, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            descriptionRefs.current[index + 1]?.focus();
                          }
                        }}
                        placeholder="deskripsi foto ini…"
                        aria-label={`Deskripsi untuk ${photo.originalName}`}
                        className="mt-2 w-full rounded-lg border border-moss-200 bg-white px-2.5 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-500/60 focus:border-moss-500 focus:ring-2 focus:ring-moss-500/15"
                      />
                      <p className="mt-1 hidden text-xs text-ink-500 sm:block">
                        Enter → foto berikutnya
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:flex-nowrap sm:gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      No
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={photos.length}
                        aria-label={`Nomor untuk ${photo.originalName}`}
                        value={index + 1}
                        onChange={(event) => {
                          const target = Number.parseInt(event.target.value, 10);
                          if (Number.isNaN(target)) return;
                          setPhotos((current) => reorderTo(current, index, target));
                        }}
                        className="h-10 w-16 rounded-lg border border-moss-200 bg-white px-2 text-center font-mono text-base text-moss-800 outline-none focus:border-moss-500 sm:h-9 sm:text-sm"
                      />
                    </label>

                    <div className="flex items-center gap-1.5 sm:ml-1">
                      <button
                        type="button"
                        aria-label={`Naikkan ${photo.originalName}`}
                        disabled={index === 0}
                        onClick={() => setPhotos((current) => move(current, index, -1))}
                        className="h-10 w-10 rounded-lg border border-moss-200 bg-white text-moss-800 transition hover:bg-moss-100 disabled:opacity-35 sm:h-9 sm:w-9"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Turunkan ${photo.originalName}`}
                        disabled={index === photos.length - 1}
                        onClick={() => setPhotos((current) => move(current, index, 1))}
                        className="h-10 w-10 rounded-lg border border-moss-200 bg-white text-moss-800 transition hover:bg-moss-100 disabled:opacity-35 sm:h-9 sm:w-9"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Unduh ${names[index]}`}
                        onClick={() => downloadSingle(photo, names[index])}
                        className="h-10 w-10 rounded-lg border border-moss-200 bg-white text-moss-800 transition hover:bg-moss-100 sm:h-9 sm:w-9"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="mx-auto h-4 w-4" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M12 4v11m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 19h14" strokeLinecap="round" />
                        </svg>
                      </button>
                      {photo.cropped ? (
                        <button
                          type="button"
                          aria-label={`Kembalikan asli ${photo.originalName}`}
                          onClick={() => resetCrop(photo.id)}
                          className="h-10 w-10 rounded-lg border border-moss-200 bg-white text-ember-600 transition hover:bg-ember-300/20 sm:h-9 sm:w-9"
                        >
                          ↺
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Crop ${photo.originalName}`}
                          onClick={() => openCrop(index)}
                          className="h-10 w-10 rounded-lg border border-moss-200 bg-white text-moss-800 transition hover:bg-moss-100 sm:h-9 sm:w-9"
                        >
                          ✂
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Hapus ${photo.originalName}`}
                        onClick={() => removePhoto(photo.id)}
                        className="h-10 w-10 rounded-lg border border-moss-200 bg-white text-ember-600 transition hover:bg-ember-300/20 sm:h-9 sm:w-9"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-moss-200 bg-sand-50 px-4 py-6 text-center text-sm text-ink-500">
              Tambahkan foto dulu, lalu urutkan dan isi deskripsi setiap fotonya di sini.
            </p>
          )}
        </section>
      </div>

      {/* Action panel */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-moss-200/70 bg-moss-800 p-6 text-sand-100 shadow-lg shadow-moss-900/15">
          <h3 className="font-display text-xl font-semibold">Hasil</h3>
          <p className="mt-1 text-sm text-sand-200/80">
            {photos.length > 0
              ? `${photos.length} foto siap diunduh${photos.some((p) => p.cropped) ? " (beberapa sudah di-crop)" : ""}.`
              : "Tambahkan foto dulu untuk melihat hasilnya."}
          </p>

          <div className="mt-4 max-h-64 space-y-1.5 overflow-y-auto rounded-2xl bg-moss-900/60 p-3 font-mono text-xs">
            {names.length === 0 ? (
              <p className="font-sans text-sand-200/70">Belum ada nama file.</p>
            ) : (
              names.map((name) => (
                <p key={name} className="break-all text-sand-100">
                  {name}
                </p>
              ))
            )}
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-sm text-sand-200/80">
              {names.length > 0
                ? "Ketik di sini, lalu simpan. Deskripsi akan mengikuti hasil rename; potongan tetap dipotong dari versi asli."
                : "Tambahkan foto dulu untuk melihat hasilnya."}
            </p>
            <textarea
              value={shared}
              onChange={(event) => handleSharedChange(event.target.value)}
              rows={3}
              placeholder="misal: panorama dari puncak gunung"
              className="w-full rounded-xl border border-sand-300 bg-sand-50/80 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-500/60 outline-none focus:border-moss-500 resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={photos.length === 0}
                onClick={() => handleCopy("markdown")}
              >
                Salin Markdown
              </Button>
              <Button
                variant="outline"
                disabled={photos.length === 0}
                onClick={() => handleCopy("list")}
              >
                Salin nama file
              </Button>
              <Button
                size="lg"
                variant="onDark"
                className="flex-1"
                disabled={photos.length === 0 || busy}
                onClick={handleZip}
              >
                {busy ? "Sedang diunduh…" : `Unduh ZIP (${photos.length} foto)`}
              </Button>
            </div>

            {photos.length > 0 && (
              <div className="mt-2 rounded-2xl bg-moss-900/60 p-3">
                <p className="mb-2 text-xs font-semibold text-sand-200/80">Potong satu foto</p>
                <p className="text-xs text-sand-200/70 mb-3">
                  Pilih foto, geser kotak, pilih ukuran keluarannya, lalu simpan. Foto yang tidak
                  dipotong tetap asli.
                </p>
                <Button
                  variant="cream"
                  className="w-full"
                  disabled={photos.length === 0}
                  onClick={() => {
                    const firstUncropped = photos.findIndex((p) => !p.cropped);
                    if (firstUncropped >= 0) {
                      openCrop(firstUncropped);
                    } else if (photos.length > 0) {
                      openCrop(0);
                    }
                  }}
                >
                  Buka potong ✂
                </Button>
              </div>
            )}

            {notice && (
              <p
                className={`mt-4 rounded-xl px-3 py-2 text-xs ${
                  notice.tone === "ok" ? "bg-moss-700 text-sand-100" : "bg-ember-500/20 text-ember-300"
                }`}
              >
                {notice.text}
              </p>
            )}

            <p className="mt-4 border-t border-moss-700 pt-4 text-xs leading-relaxed text-sand-200/70">
              Foto diproses sepenuhnya di browser — tidak diunggah ke server mana pun. Namamu
              tersimpan otomatis di perangkat ini biar cepat dipakai lagi.
            </p>
          </div>
        </div>
      </aside>

      {previewIndex !== null && photos[previewIndex] && (
        <Lightbox
          photo={photos[previewIndex]}
          filename={names[previewIndex]}
          index={previewIndex}
          total={photos.length}
          onClose={closePreview}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}

      {cropTarget && photos[cropTarget.index] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Potong foto"
          className="fixed inset-0 z-50 flex flex-col bg-ink-900/85 p-4 backdrop-blur-sm sm:p-6"
        >
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-xs text-sand-100">
              {String(cropTarget.index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </span>
            <Button variant="cream" size="sm" onClick={closeCrop}>
              Tutup ✕
            </Button>
          </div>

          <div className="mx-auto mt-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-black/60">
            <div className="relative h-[55vh] w-full sm:h-[60vh]">
              <Cropper
                image={cropTarget.url}
                crop={crop}
                zoom={zoom}
                aspect={ratio ?? undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition
              />
            </div>
          </div>

          {/* Kontrol: rasio, ukuran hasil, zoom, simpan/batal */}
          <div className="mx-auto mt-4 w-full max-w-3xl space-y-3 rounded-2xl bg-white/10 px-4 py-3 text-sand-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-sand-200/80">Rasio</span>
              {RATIOS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setRatio(option.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    ratio === option.value
                      ? "bg-sand-100 text-moss-900"
                      : "bg-white/10 text-sand-100 hover:bg-white/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-sand-200/80">Ukuran hasil</span>
              {SIZE_PRESETS.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setPresetIndex(index)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    presetIndex === index
                      ? "bg-sand-100 text-moss-900"
                      : "bg-white/10 text-sand-100 hover:bg-white/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <label className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-sand-100">
                <input
                  type="checkbox"
                  checked={allowUpscale}
                  onChange={(event) => setAllowUpscale(event.target.checked)}
                  className="accent-moss-300"
                />
                Perbesar jika perlu
              </label>
            </div>
            <p className="text-xs text-sand-200/80">
              {area && outputSize
                ? `Keluar: ${formatSize(outputSize)} (rasio mengikuti kotak crop)`
                : "Geser kotak crop dulu untuk melihat ukuran keluarannya."}
            </p>
            <label className="flex items-center gap-3 text-xs text-sand-200/80">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-1.5 flex-1 accent-moss-300"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button variant="soft" onClick={closeCrop}>
                Batal
              </Button>
              <Button
                variant="cream"
                disabled={busy || !area}
                onClick={saveCrop}
              >
                {busy ? "Memotong…" : "Simpan hasil crop"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepBadge({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-moss-700 font-display text-sm font-semibold text-sand-100">
        {step}
      </span>
      <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
    </div>
  );
}
