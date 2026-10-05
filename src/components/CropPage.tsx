import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Button, fieldClass } from "./ui";
import {
  buildAllFilenames,
  formatBytes,
  slugify,
  SUFFIX,
  type PhotoItem,
  type Settings,
} from "../lib/rename";
import { copyText, downloadZip } from "../lib/download";
import { cropToJpegBlob, withJpegExtension, type CroppedArea } from "../lib/crop";

const RATIOS = [
  { label: "Bebas", value: null },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
] as const;

type CropTarget = { index: number; url: string };

type Notice = { tone: "ok" | "warn"; text: string } | null;

type CropEntry = PhotoItem & { originalFile: File; cropped: boolean };

export default function CropPage() {
  const [photos, setPhotos] = useState<CropEntry[]>([]);
  const [slug, setSlug] = useState("");
  const [pad, setPad] = useState<2 | 3>(2);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<CropTarget | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<number | null>(null);
  const [area, setArea] = useState<CroppedArea | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const cropUrls = useRef<Map<string, string>>(new Map());

  const settings: Settings = useMemo(
    () => ({ slug, pad, withSuffix: true, withDescription: false, format: "keep", lastDescription: "" }),
    [slug, pad],
  );

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nyasar-crop:slug");
      if (saved) setSlug(saved);
    } catch {
      /* abaikan */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("nyasar-crop:slug", slug);
    } catch {
      /* abaikan */
    }
  }, [slug]);

  const names = useMemo(() => buildAllFilenames(photos, settings), [photos, settings]);

  function flash(text: string, tone: "ok" | "warn" = "ok") {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 4000);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const images = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
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
        originalFile: file,
        url,
        originalName: file.name,
        description: "",
        cropped: false,
      } satisfies CropEntry;
    });
    setPhotos((current) => [...current, ...next]);
    flash(`${next.length} foto ditambahkan.`);
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

  function openCrop(index: number) {
    setTarget({ index, url: photos[index].url });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setRatio(null);
  }

  const onCropComplete = useCallback(
    (_: unknown, pixelArea: CroppedArea) => setArea(pixelArea),
    [],
  );

  async function saveCrop() {
    if (!target || !area) {
      flash("Geser kotak crop dulu di atas fotonya.", "warn");
      return;
    }
    const original = photos[target.index];
    setBusy(true);
    try {
      const blob = await cropToJpegBlob(original.file, area);
      const croppedFile = new File([blob], withJpegExtension(original.originalName), {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(croppedFile);
      urls.current.push(url);
      // Simpan URL hasil crop agar bisa dibuang saat reset.
      cropUrls.current.set(original.id, url);
      setPhotos((current) =>
        current.map((photo, i) =>
          i === target.index
            ? { ...photo, file: croppedFile, url, cropped: true }
            : photo,
        ),
      );
      flash("Hasil crop menggantikan foto ini. Foto lain tetap asli.");
      setTarget(null);
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
            }
          : photo,
      ),
    );
    flash("Foto kembali ke versi asli.");
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

  async function handleCopy() {
    const ok = await copyText(names.join("\n"));
    flash(
      ok
        ? "Daftar nama file tersalin."
        : "Browser menolak akses clipboard. Salin manual dari daftar nama.",
      ok ? "ok" : "warn",
    );
  }

  const sample = [
    String(1).padStart(pad, "0"),
    slugify(slug) || "foto",
    settings.withSuffix ? SUFFIX : "",
  ]
    .filter(Boolean)
    .join("-") + ".jpg";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-ember-600 uppercase">
          Halaman kedua
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Crop Foto
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-700">
          Potong foto sebelum di-upload — cocok untuk header artikel 16:9. Hasil crop
          di-encode ulang sebagai JPEG kualitas 90; foto yang tidak kamu potong tetap
          byte asli, sama seperti halaman Rename.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-moss-200/70 bg-white p-6 shadow-sm shadow-moss-900/5">
            <h2 className="font-display text-xl font-semibold">Nama file</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="crop-slug" className="text-sm font-semibold text-moss-800">
                  Nama gunung dan jalur
                </label>
                <input
                  id="crop-slug"
                  className={`${fieldClass} mt-2`}
                  placeholder="buthak-via-panderman"
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 rounded-xl border border-moss-200 bg-sand-50 px-3 py-2 text-sm text-ink-700">
                    Nomor
                    <select
                      aria-label="Jumlah digit nomor"
                      className="rounded-lg border border-moss-200 bg-white px-2 py-1 text-sm font-semibold text-moss-800 outline-none focus:border-moss-500"
                      value={pad}
                      onChange={(event) => setPad(Number(event.target.value) as 2 | 3)}
                    >
                      <option value={2}>01, 02, 03</option>
                      <option value={3}>001, 002, 003</option>
                    </select>
                  </label>
                  <span className="rounded-2xl bg-moss-800 px-4 py-2.5 font-mono text-sm text-sand-100">
                    {sample}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-moss-200/70 bg-white p-6 shadow-sm shadow-moss-900/5">
            <h2 className="font-display text-xl font-semibold">Foto</h2>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
              onClick={() => fileInput.current?.click()}
              className="mt-4 cursor-pointer rounded-2xl border-2 border-dashed border-moss-300 bg-sand-50 px-6 py-8 text-center transition hover:border-moss-500 hover:bg-moss-50/60"
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
              <p className="font-semibold text-moss-800">Tarik foto ke sini atau klik untuk pilih</p>
              <p className="mt-1 text-sm text-ink-500">Foto tetap di perangkatmu.</p>
            </div>

            {photos.length > 0 && (
              <ul className="mt-4 space-y-3">
                {photos.map((photo, index) => (
                  <li
                    key={photo.id}
                    className="flex flex-col gap-3 rounded-2xl border border-moss-100 bg-sand-50 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3 sm:contents">
                      <button
                        type="button"
                        onClick={() => openCrop(index)}
                        aria-label={`Crop ${photo.originalName}`}
                        className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-moss-100 ring-1 ring-moss-200 transition hover:ring-moss-500 sm:h-16 sm:w-20"
                      >
                        <img src={photo.url} alt={photo.originalName} className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-moss-900/40 text-sand-50 opacity-0 transition group-hover:opacity-100">
                          ✂
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-ink-500">
                          {photo.originalName} · {formatBytes(photo.file.size)}
                        </p>
                        <p className="mt-1 font-mono text-[13px] leading-snug font-semibold break-all text-moss-800 sm:text-sm">
                          {names[index]}
                        </p>
                        {photo.cropped ? (
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-ember-600">
                            sudah di-crop (JPEG q90)
                            <button
                              type="button"
                              onClick={() => resetCrop(photo.id)}
                              className="rounded-lg border border-moss-200 bg-white px-2 py-0.5 text-xs font-semibold text-moss-800 transition hover:bg-moss-50"
                            >
                              kembalikan asli
                            </button>
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-ink-500">asli, belum di-crop</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:flex-nowrap">
                      <Button variant="outline" size="sm" onClick={() => openCrop(index)}>
                        ✂ Crop
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePhoto(photo.id)}
                        aria-label={`Hapus ${photo.originalName}`}
                      >
                        Hapus
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-moss-200/70 bg-moss-800 p-6 text-sand-100 shadow-lg shadow-moss-900/15">
            <h3 className="font-display text-xl font-semibold">Hasil</h3>
            <p className="mt-1 text-sm text-sand-200/80">
              {photos.length > 0
                ? `${photos.length} foto siap diunduh.`
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
              <Button
                variant="onDark"
                size="lg"
                className="w-full"
                disabled={photos.length === 0 || busy}
                onClick={handleZip}
              >
                {busy ? "Membuat ZIP…" : `Unduh ZIP (${photos.length} foto)`}
              </Button>
              <Button
                variant="soft"
                className="w-full"
                disabled={photos.length === 0}
                onClick={handleCopy}
              >
                Salin nama file
              </Button>
            </div>
            {notice && (
              <p
                className={`mt-4 rounded-xl px-3 py-2 text-xs ${
                  notice.tone === "ok"
                    ? "bg-moss-700 text-sand-100"
                    : "bg-ember-500/20 text-ember-300"
                }`}
              >
                {notice.text}
              </p>
            )}
            <p className="mt-4 border-t border-moss-700 pt-4 text-xs leading-relaxed text-sand-200/70">
              Foto diproses sepenuhnya di browser. Nama jalur tersimpan otomatis di
              perangkat ini.
            </p>
          </div>
        </aside>
      </div>

      {target && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Potong foto"
          className="fixed inset-0 z-50 flex flex-col bg-ink-900/85 p-4 backdrop-blur-sm sm:p-6"
        >
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-xs text-sand-100">
              {String(target.index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </span>
            <Button variant="cream" size="sm" onClick={() => setTarget(null)}>
              Tutup ✕
            </Button>
          </div>

          <div className="mx-auto mt-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-black/60">
            <div className="relative h-[55vh] w-full sm:h-[60vh]">
              <Cropper
                image={target.url}
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
              <Button variant="soft" onClick={() => setTarget(null)}>
                Batal
              </Button>
              <Button variant="cream" disabled={busy || !area} onClick={saveCrop}>
                {busy ? "Memotong…" : "Simpan hasil crop"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
