"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VideoClip } from "@/content/videos";
import { text } from "@/lib/localize";
import type { Locale } from "@/i18n/config";

const COPY: Record<Locale, { eyebrow: string; title: string; lead: string; sound: string; muted: string; close: string }> = {
  ru: {
    eyebrow: "Видео с курорта",
    title: "Как это выглядит вживую",
    lead: "Снято на территории. Нажмите на любое видео — откроется во весь экран со звуком.",
    sound: "Включить звук",
    muted: "Выключить звук",
    close: "Закрыть",
  },
  uz: {
    eyebrow: "Kurortdan video",
    title: "Jonli ko'rinishi",
    lead: "Hududda suratga olingan. Istalgan videoni bosing — ovoz bilan to'liq ekranda ochiladi.",
    sound: "Ovozni yoqish",
    muted: "Ovozni o'chirish",
    close: "Yopish",
  },
  en: {
    eyebrow: "Video from the resort",
    title: "What it actually looks like",
    lead: "Filmed on the grounds. Tap any clip to open it full screen with sound.",
    sound: "Sound on",
    muted: "Sound off",
    close: "Close",
  },
};

/**
 * A row of vertical clips that come alive as they scroll into view.
 *
 * Autoplay is muted and gated on visibility, which is the only way a browser
 * will start a video without a tap — and the only polite way to do it. A clip
 * that leaves the viewport is paused, so a page with five videos never has five
 * decoders running. `preload="none"` keeps the initial page weight to five
 * poster JPEGs; the MP4 is fetched when the card is close enough to matter.
 */
export function VideoReel({ locale, clips }: { locale: Locale; clips: VideoClip[] }) {
  const t = COPY[locale] ?? COPY.ru;
  const [open, setOpen] = useState<VideoClip | null>(null);

  /**
   * One observer for the whole rail, playing only the most-visible clip.
   *
   * Kept in a ref rather than state so a scroll never triggers a React render:
   * the DOM is the only thing that has to change here.
   */
  const ratios = useRef(new Map<HTMLVideoElement, number>());
  const io = useRef<IntersectionObserver | null>(null);

  const apply = useCallback(() => {
    let best: HTMLVideoElement | null = null;
    let bestRatio = 0.35; // below this nothing plays — the rail is off screen
    for (const [el, r] of ratios.current) {
      if (r > bestRatio) {
        bestRatio = r;
        best = el;
      }
    }
    for (const el of ratios.current.keys()) {
      if (el === best) {
        // play() rejects when the browser declines autoplay; that is a normal
        // outcome, not an error — the poster stays and the tap still works.
        void el.play().catch(() => {});
      } else if (!el.paused) {
        el.pause();
      }
    }
  }, []);

  const observer = useCallback(() => {
    if (io.current) return io.current;
    io.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.current.set(e.target as HTMLVideoElement, e.isIntersecting ? e.intersectionRatio : 0);
        }
        apply();
      },
      // A spread of thresholds so "most visible" is meaningful, not binary.
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );
    return io.current;
  }, [apply]);

  const register = useCallback(
    (el: HTMLVideoElement) => {
      if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      ratios.current.set(el, 0);
      observer().observe(el);
    },
    [observer],
  );

  const unregister = useCallback((el: HTMLVideoElement) => {
    ratios.current.delete(el);
    io.current?.unobserve(el);
  }, []);

  useEffect(() => () => io.current?.disconnect(), []);

  return (
    <section className="overflow-hidden bg-[var(--ink)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">{t.eyebrow}</p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-tight text-white">
            {t.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-white/65">{t.lead}</p>
        </div>

        {/* Horizontal snap rail. On a phone it reads as a story reel; on a wide
            screen the whole set is visible at once. Negative margins let the
            first and last card bleed to the screen edge. */}
        <div className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {clips.map((clip, i) => (
            <ReelCard
              key={clip.key}
              clip={clip}
              locale={locale}
              index={i}
              onOpen={() => setOpen(clip)}
              register={register}
              unregister={unregister}
            />
          ))}
        </div>
      </div>

      {open && <Fullscreen clip={open} locale={locale} onClose={() => setOpen(null)} labels={t} />}
    </section>
  );
}

function ReelCard({
  clip,
  locale,
  index,
  onOpen,
  register,
  unregister,
}: {
  clip: VideoClip;
  locale: Locale;
  index: number;
  onOpen: () => void;
  register: (el: HTMLVideoElement) => void;
  unregister: (el: HTMLVideoElement) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  /**
   * Only ONE clip plays at a time, whichever is most centred.
   *
   * A per-card observer looked right on a phone, where one card fills the rail
   * — but from 1024px up all five sit in a visible row, so all five crossed the
   * threshold together and the page fetched 37 MB in five parallel downloads
   * with five H.264 decoders running, next to the booking form. The shared
   * controller in VideoReel decides; the card just registers itself.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    register(el);
    return () => unregister(el);
  }, [register, unregister]);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={text(clip.title, locale)}
      className="group relative w-[74vw] max-w-[280px] shrink-0 snap-center overflow-hidden rounded-3xl bg-black/40 text-left ring-1 ring-white/10 transition-transform duration-500 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sun)] sm:w-[46vw] lg:w-auto lg:flex-1"
      style={{ aspectRatio: "9 / 16" }}
    >
      <video
        ref={ref}
        src={clip.src}
        poster={clip.poster}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
      />
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(10,15,12,0.85)_0%,rgba(10,15,12,0.15)_45%,transparent_70%)]" />

      {/* The first card is the slide itself — marked so it reads as the point
          of the page rather than one clip among five. */}
      {index === 0 && (
        <span className="absolute left-4 top-4 rounded-full bg-[var(--sun)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--on-accent)]">
          {locale === "uz" ? "Trassa" : locale === "en" ? "The track" : "Трасса"}
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="block font-serif text-lg font-semibold leading-tight text-white">
          {text(clip.title, locale)}
        </span>
        <span className="mt-1 block text-xs leading-5 text-white/70">{text(clip.caption, locale)}</span>
      </span>

      <span
        aria-hidden
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
      >
        <svg className="h-4 w-4 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}

function Fullscreen({
  clip,
  locale,
  onClose,
  labels,
}: {
  clip: VideoClip;
  locale: Locale;
  onClose: () => void;
  labels: { sound: string; muted: string; close: string };
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  // The portal target only exists in the browser. A mounted flag set from an
  // effect would do the same job and trip the repo's set-state-in-effect rule.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-black/94 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={text(clip.title, locale)}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate font-serif text-lg font-semibold text-white">
          {text(clip.title, locale)}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const el = ref.current;
              if (!el) return;
              el.muted = !el.muted;
              setMuted(el.muted);
            }}
            className="flex h-11 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            {muted ? labels.sound : labels.muted}
          </button>
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* min-h-0 so the stage can shrink inside the flex column — without it the
          video overflows the viewport and its bottom is cut off. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-6">
        <video
          ref={ref}
          src={clip.src}
          poster={clip.poster}
          autoPlay
          loop
          controls
          playsInline
          className="h-full w-full rounded-2xl object-contain"
        />
      </div>
    </div>,
    document.body,
  );
}
