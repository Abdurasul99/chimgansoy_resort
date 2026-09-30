"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { GalleryImage } from "@/lib/rooms-live";
import { frameStyle } from "@/lib/images";
import { Lightbox } from "@/components/ui/Lightbox";

/**
 * «Фотографии» на странице домика.
 *
 * На телефоне — две колонки, первый кадр во всю ширину. Раньше каждый кадр
 * шёл во всю ширину экрана: семнадцать фото шале растягивались на восемь
 * экранов, и до формы брони под ними почти никто не доходил. Кадр нажимается
 * и открывается во весь экран — раньше это были просто картинки.
 */
export function RoomGallery({ frames, locale }: { frames: GalleryImage[]; locale: Locale }) {
  const [open, setOpen] = useState<number | null>(null);
  const images = frames.map((f) => ({ src: f.src, localSrc: f.localSrc, position: f.position, alt: { ru: f.alt, uz: f.alt, en: f.alt } }));

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {frames.map((frame, i) => (
          <button
            key={frame.src}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={frame.alt}
            className={`cursor-zoom-in overflow-hidden rounded-xl bg-cover bg-center transition-transform duration-700 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sun)] sm:rounded-2xl ${
              i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-[4/3]"
            }`}
            style={frameStyle(frame)}
          />
        ))}
      </div>
      {open !== null && (
        <Lightbox key={open} images={images} locale={locale} startIndex={open} open onClose={() => setOpen(null)} />
      )}
    </>
  );
}
