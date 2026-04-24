"use client";

import { useState, useEffect, useCallback } from "react";
import { galleryImages } from "@/content/images";
import type { ImageAsset } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";

type GalleryProps = {
  locale: Locale;
};

const GRID_SPANS: string[] = [
  "sm:col-span-2 sm:row-span-2", // 0 — large
  "",                             // 1
  "",                             // 2
  "sm:col-span-2",               // 3 — wide
  "",                             // 4
  "sm:row-span-2",               // 5 — tall
  "",                             // 6
  "",                             // 7
  "sm:col-span-2",               // 8 — wide
  "",                             // 9
  "",                             // 10
  "sm:col-span-2",               // 11 — wide
  "",                             // 12
  "",                             // 13
  "sm:col-span-2 sm:row-span-2", // 14 — large
  "",                             // 15
  "",                             // 16
  "",                             // 17
];

const ASPECT: string[] = [
  "aspect-square",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[16/7]",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[16/7]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[16/7]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-square",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
];

function LightboxModal({
  images,
  index,
  locale,
  onClose,
}: {
  images: ImageAsset[];
  index: number;
  locale: Locale;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const img = images[current];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Image */}
      <div
        className="relative mx-4 max-h-[90vh] max-w-5xl w-full overflow-hidden rounded-2xl bg-[var(--ink)]"
        style={{ ...imageStyle(img), backgroundSize: "contain", backgroundRepeat: "no-repeat", aspectRatio: "16/10" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/80"
          aria-label="Закрыть"
        >
          ✕
        </button>

        {/* Prev */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/80"
          aria-label="Предыдущее"
        >
          ←
        </button>

        {/* Next */}
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/80"
          aria-label="Следующее"
        >
          →
        </button>

        {/* Caption */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 py-4">
          <p className="text-sm text-white/80">{text(img.alt, locale)}</p>
          <p className="mt-1 text-xs text-white/50">{current + 1} / {images.length}</p>
        </div>
      </div>
    </div>
  );
}

export function Gallery({ locale }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = galleryImages;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {images.map((image, i) => (
          <button
            key={`${image.localSrc ?? image.src}-${i}`}
            type="button"
            aria-label={text(image.alt, locale)}
            onClick={() => setLightboxIndex(i)}
            className={`group relative overflow-hidden rounded-xl bg-[var(--mist)] bg-cover bg-center ${GRID_SPANS[i] ?? ""} ${ASPECT[i] ?? "aspect-[4/3]"}`}
            style={imageStyle(image)}
          >
            <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
              <span className="rounded-full border border-white/60 bg-black/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Открыть
              </span>
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <LightboxModal
          images={images}
          index={lightboxIndex}
          locale={locale}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
