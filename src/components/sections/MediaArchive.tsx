"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";
import { resortImages } from "@/content/images";
import type { ImageKey, VideoAsset } from "@/content/day-products";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import type { Locale } from "@/i18n/config";

const COPY: Record<Locale, { photos: string; videos: string; count: (n: number) => string }> = {
  ru: { photos: "Фотоархив", videos: "Видео", count: (n) => `${n} фото` },
  uz: { photos: "Fotoarxiv", videos: "Video", count: (n) => `${n} ta foto` },
  en: { photos: "Photo archive", videos: "Video", count: (n) => `${n} photos` },
};

type Props = {
  locale: Locale;
  /** Keys into content/images.ts. */
  images: readonly ImageKey[];
  /**
   * Keys already shown ABOVE this block on the same page.
   *
   * Every page that carries an archive also carries a hero, and often a gallery
   * — and the archive lists were written independently of both, so the pool page
   * printed five photographs twice and the topchan page printed its hero again
   * two screens down. Filtering here rather than curating each list by hand
   * means the rule cannot rot: change a hero and the archive follows.
   */
  exclude?: readonly string[];
  videos?: VideoAsset[];
};

/**
 * The photo and video archive that sits under each day-product request form.
 *
 * A guest who has just read a price wants to see what they are paying for, so
 * this goes below the form rather than above it: the booking action stays in
 * the first screen, and the proof is the reward for scrolling.
 *
 * The video row renders only when there are videos. There are none yet — the
 * operator has not shot any — and an empty "Видео" heading over blank space
 * would read as a broken page rather than as a section awaiting content.
 */
export function MediaArchive({ locale, images, videos = [], exclude = [] }: Props) {
  const t = COPY[locale] ?? COPY.ru;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const shown = images.filter((key) => !exclude.includes(key));
  const assets = shown.map((key) => resortImages[key]).filter(Boolean);
  if (assets.length === 0 && videos.length === 0) return null;

  return (
    <div>
      {assets.length > 0 && (
        <>
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.photos}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]/70">
              {t.count(assets.length)}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {assets.map((asset, i) => (
              <button
                key={shown[i]}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setOpen(true);
                }}
                aria-label={text(asset.alt, locale)}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-[color:var(--line)] transition-transform duration-500 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sun)]"
                style={imageStyle(asset)}
              >
                <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.45)_0%,transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            ))}
          </div>
          {/* Mounted only while open and keyed by the tile that opened it.
              Lightbox seeds its own index from startIndex on mount and ignores
              later prop changes, so a permanently-mounted instance would open
              on photo 1 no matter which tile was clicked. */}
          {open && (
            <Lightbox
              key={index}
              images={assets}
              locale={locale}
              startIndex={index}
              open
              onClose={() => setOpen(false)}
            />
          )}
        </>
      )}

      {videos.length > 0 && (
        <div className={assets.length > 0 ? "mt-10" : ""}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.videos}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {videos.map((v) => (
              <div key={v.url} className="overflow-hidden rounded-2xl ring-1 ring-[color:var(--line)]">
                {/* Hosted elsewhere on purpose: video files are far too heavy to
                    sit in the repository, and Vercel would serve them uncached. */}
                <iframe
                  src={v.url}
                  title={text(v.title, locale)}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
