import { useEffect, useRef } from "react";
import { Button } from "./ui";
import type { PhotoItem } from "../lib/rename";

type LightboxProps = {
  photo: PhotoItem;
  filename: string;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onChangeDescription?: (value: string) => void;
  onOpenCrop?: () => void;
  disabled?: boolean;
};

export default function Lightbox({
  photo,
  filename,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  onChangeDescription,
  onOpenCrop,
  disabled = false,
}: LightboxProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const descriptionInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, onPrev, onNext]);

  function commitDescription(value: string) {
    onChangeDescription?.(value);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau foto ${filename}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col bg-ink-900/85 p-3 pb-20 backdrop-blur-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 text-sand-100">
        <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-xs">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          ref={closeButton}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Tutup pratinjau"
          className="rounded-xl bg-white/10 px-3 py-1.5 text-sm font-semibold text-sand-100 transition hover:bg-white/20"
        >
          Tutup ✕
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 py-3 sm:gap-4">
        {total > 1 && (
          <Button
            variant="soft"
            aria-label="Foto sebelumnya"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            className="h-11 w-11 shrink-0 rounded-full text-lg"
          >
            ←
          </Button>
        )}

        <img
          src={photo.url}
          alt={photo.description || filename}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full min-w-0 max-w-full rounded-2xl bg-black/40 object-contain shadow-2xl"
        />

        {total > 1 && (
          <Button
            variant="soft"
            aria-label="Foto berikutnya"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            className="h-11 w-11 shrink-0 rounded-full text-lg"
          >
            →
          </Button>
        )}
      </div>

      {/* Kartu deskripsi + potong: di HP stays di atas browser bar, di desktop ada harapan bawah. */}
      <div
        onClick={(event) => event.stopPropagation()}
        className="m-3 w-full overflow-hidden rounded-2xl bg-white/10 sm:mx-4 sm:mt-4 sm:max-w-3xl sm:rounded-2xl sm:border sm:border-white/10"
      >
        <div className="flex items-center justify-between gap-2 overflow-hidden rounded-t-2xl p-3 sm:rounded-none sm:border-b sm:border-white/10">
          <p className="min-w-0 flex-1 break-all font-mono text-sm font-semibold">{filename}</p>
          {onOpenCrop && (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onOpenCrop();
              }}
              className="shrink-0"
            >
              Buka potong ✂
            </Button>
          )}
        </div>

        <div className="p-3">
          <div className="flex flex-col gap-2">
            <input
              ref={descriptionInput}
              type="text"
              value={photo.description}
              onChange={(event) => {
                event.stopPropagation();
              }}
              onBlur={(event) => commitDescription(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  commitDescription(event.currentTarget.value);
                  descriptionInput.current?.blur();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  descriptionInput.current?.blur();
                }
              }}
              placeholder="deskripsi foto ini…"
              className="w-full rounded-lg border border-moss-200/70 bg-sand-100/60 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500/60 outline-none focus:border-moss-500"
              onClick={(event) => event.stopPropagation()}
            />
            <p className="text-xs text-sand-200/70">
              Simpan otomatis saat keluar dari input. ← → pindah foto, Esc tutup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
