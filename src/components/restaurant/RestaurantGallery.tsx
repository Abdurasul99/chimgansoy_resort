"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { Lightbox } from "@/components/ui/Lightbox";

/** Сколько кадров в ряду на компьютере; остальные — за плиткой «+N». */
const DESKTOP_ROW = 6;

/**
 * Фотогалерея ресторана — сразу под шапкой, до меню.
 *
 * Под меню её бы не увидели: меню длинное. Поэтому одна строка: на телефоне —
 * лента с прокруткой вбок, на компьютере — шесть кадров и «+N». Любой кадр
 * открывается во весь экран, листается стрелками и свайпом.
 */
export function RestaurantGallery({ photos, name, locale }: { photos: string[]; name: string; locale: Locale }) {
  const t = restaurantText(locale);
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length === 0) return null;

  const images = photos.map((src, i) => ({ src, alt: { ru: `${name} — фото ${i + 1}`, uz: `${name} — ${i + 1}-surat`, en: `${name} — photo ${i + 1}` } }));
  const extra = photos.length - DESKTOP_ROW;

  return (
    <section aria-label={t.gallery.title} className="mt-6">
      <h2 className="text-lg font-bold text-[#1c1c1c]">
        {t.gallery.title} <span className="text-[15px] font-semibold text-[#8c8c8c]">{photos.length}</span>
      </h2>
      <ul className="rest-chips -mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-6 lg:overflow-visible">
        {photos.map((src, i) => (
          <li key={src} className={`shrink-0 snap-start ${i >= DESKTOP_ROW ? "lg:hidden" : ""}`}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={t.gallery.open(i + 1)}
              className="relative block h-32 w-44 cursor-zoom-in overflow-hidden rounded-2xl bg-[#efece6] sm:h-40 sm:w-56 lg:aspect-[4/3] lg:h-auto lg:w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
              {i === DESKTOP_ROW - 1 && extra > 0 && (
                <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-xl font-bold text-white lg:flex">
                  +{extra}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox key={open} images={images} locale={locale} startIndex={open} open onClose={() => setOpen(null)} />}
    </section>
  );
}
