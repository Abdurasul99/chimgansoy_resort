"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { storyAlt, type StoryGroup } from "@/content/restaurant-media";
import { lock, unlock } from "@/lib/scroll-lock";
import { RestIcon } from "./RestIcon";

/** Сколько показывается кадр, мс — как история в Instagram. */
const FRAME_MS = 5200;
/** Короче — касание (листает), дольше — удержание (пауза). */
const TAP_MS = 260;

/**
 * Истории ресторана во весь экран — как «Актуальное» в его Instagram.
 *
 * Кадр сам сменяется по концу полоски наверху (CSS-анимация, её конец и есть
 * таймер — без setTimeout, который пришлось бы сверять с паузой). Касание
 * справа — дальше, слева — назад, удержание — пауза, стрелки и Esc — с
 * клавиатуры. После последнего кадра группы — следующая группа, после
 * последней группы окно закрывается. С «уменьшить движение» кадры сами не
 * листаются.
 */
export function StoryViewer({
  groups,
  start,
  locale,
  onClose,
}: {
  groups: StoryGroup[];
  start: number;
  locale: Locale;
  onClose: () => void;
}) {
  const t = restaurantText(locale);
  const [g, setG] = useState(start);
  const [f, setF] = useState(0);
  const [paused, setPaused] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pressedAt = useRef(0);
  const group = groups[g];
  const frame = group.frames[f];

  const closeLatest = useRef(onClose);
  useEffect(() => {
    closeLatest.current = onClose;
  });

  const next = useCallback(() => {
    if (f < group.frames.length - 1) setF(f + 1);
    else if (g < groups.length - 1) {
      setG(g + 1);
      setF(0);
    } else closeLatest.current();
  }, [f, g, group.frames.length, groups.length]);

  const prev = useCallback(() => {
    if (f > 0) setF(f - 1);
    else if (g > 0) {
      setG(g - 1);
      setF(groups[g - 1].frames.length - 1);
    }
  }, [f, g, groups]);

  useEffect(() => {
    lock();
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      unlock();
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLatest.current();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Следующий кадр — заранее, чтобы смена не мигала пустотой.
  useEffect(() => {
    const upcoming = group.frames[f + 1] ?? groups[g + 1]?.frames[0];
    if (upcoming) new Image().src = upcoming.src;
  }, [f, g, group.frames, groups]);

  const onPointerDown = () => {
    pressedAt.current = performance.now();
    setPaused(true);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setPaused(false);
    if (performance.now() - pressedAt.current > TAP_MS) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX - box.left < box.width * 0.33) prev();
    else next();
  };

  const alt = storyAlt(frame, locale);

  return createPortal(
    <div
      className="sz sz-fade fixed inset-0 z-[80] flex items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={group.title[locale]}
    >
      {/* Стрелки по бокам — на компьютере, за краем кадра. */}
      <button
        type="button"
        onClick={prev}
        aria-label={t.look.prev}
        disabled={g === 0 && f === 0}
        className="mr-4 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-0 sm:flex"
      >
        <RestIcon name="arrow" className="h-5 w-5 rotate-180" />
      </button>

      <div className="relative h-[100svh] w-full max-w-[calc(100svh*9/16)] overflow-hidden bg-[#0d0907] sm:h-[min(92svh,54rem)] sm:max-w-[calc(min(92svh,54rem)*9/16)] sm:rounded-[1.4rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={frame.src} src={frame.src} alt={alt} className="sz-fade absolute inset-0 h-full w-full object-cover" draggable={false} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />

        {/* Касания: вся площадь кадра, под шапкой с кнопкой «закрыть». */}
        <div
          className="absolute inset-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1" aria-hidden>
            {group.frames.map((fr, i) => (
              <span key={fr.src} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                {i < f && <span className="block h-full w-full bg-white" />}
                {i === f && (
                  <span
                    key={`${g}-${f}`}
                    className="sz-story-bar block h-full w-full bg-white"
                    data-paused={paused}
                    style={{ "--sz-story-ms": `${FRAME_MS}ms` } as React.CSSProperties}
                    onAnimationEnd={next}
                  />
                )}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="sz-ring rounded-full p-[2px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={group.cover} alt="" className="block h-8 w-8 rounded-full border-2 border-black object-cover" />
            </span>
            <span className="text-sm font-semibold text-white">{group.title[locale]}</span>
            <span className="text-xs text-white/60">{t.look.frameOf(f + 1, group.frames.length)}</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => closeLatest.current()}
              aria-label={t.menu.close}
              className="pointer-events-auto ml-auto flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <RestIcon name="close" className="h-6 w-6" />
            </button>
          </div>
        </div>

        <p className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] font-serif text-xl italic leading-snug text-white">
          {alt}
        </p>
      </div>

      <button
        type="button"
        onClick={next}
        aria-label={t.look.next}
        className="ml-4 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:flex"
      >
        <RestIcon name="arrow" className="h-5 w-5" />
      </button>
    </div>,
    document.body,
  );
}
