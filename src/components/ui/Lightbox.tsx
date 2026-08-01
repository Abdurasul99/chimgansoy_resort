"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ImageAsset } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { text } from "@/lib/localize";

/**
 * Full-screen photo viewer for a room's gallery.
 *
 * Opened by clicking a room card's photo — until now that image was inert, and
 * the only way to see the rest of a room's shoot was to open its page. Keyboard
 * and swipe both work, and the trigger stays a real <button> so it is reachable
 * without a mouse.
 */

type Props = {
  images: ImageAsset[];
  locale: Locale;
  /** Index the viewer opens on, and the one the trigger shows. */
  startIndex?: number;
  open: boolean;
  onClose: () => void;
};

export function Lightbox({ images, locale, startIndex = 0, open, onClose }: Props) {
  // No mount flag and no "reset on open" effect: the parent mounts this only
  // while a gallery is open and keys it by room, so every open is a fresh
  // component and the initial state is already correct. Both of those as
  // effects would have been setState-in-effect for no gain.
  const [index, setIndex] = useState(startIndex);

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + images.length) % images.length),
    [images.length],
  );

  // Escape closes, arrows page. Registered only while open so the page keeps
  // its own key handling the rest of the time.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    // Lock the page behind the overlay, and put the scrollbar's width back so
    // the layout doesn't jump as it disappears.
    const prev = document.body.style.overflow;
    const pad = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (pad > 0) document.body.style.paddingRight = `${pad}px`;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      document.body.style.paddingRight = "";
    };
  }, [open, onClose, go]);

  // createPortal needs a real document; bail out during server render.
  if (typeof document === "undefined" || !open || images.length === 0) return null;

  const img = images[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text(img.alt, locale)}
      className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Bar: counter + close */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-sm font-bold tabular-nums text-white/70">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Stage — click-through guarded so taps on the photo don't close it */}
      <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16">
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Предыдущее фото"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-5"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.localSrc ?? img.src}
          alt={text(img.alt, locale)}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        />

        {images.length > 1 && (
          <button
            type="button"
            aria-label="Следующее фото"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-5"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnails — the fastest way to reach a specific shot */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-5 scrollbar-none sm:justify-center sm:px-6"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((thumb, i) => (
            <button
              key={`${thumb.localSrc ?? thumb.src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all ${
                i === index ? "ring-2 ring-[var(--sun)]" : "opacity-50 hover:opacity-90"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb.localSrc ?? thumb.src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
