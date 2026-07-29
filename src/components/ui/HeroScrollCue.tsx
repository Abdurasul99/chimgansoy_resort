"use client";

import type { Locale } from "@/i18n/config";

const LABEL: Record<Locale, string> = {
  ru: "Листайте",
  uz: "Pastga",
  en: "Scroll",
};

const ARIA: Record<Locale, string> = {
  ru: "Перейти к содержимому",
  uz: "Kontentga o'tish",
  en: "Scroll to content",
};

/**
 * Scroll cue at the foot of the hero.
 *
 * A hairline with a light travelling down it, rather than a bouncing chevron —
 * quieter, and it reads as direction rather than as a button that needs
 * pressing. It IS pressable though: clicking hands off to Lenis so the jump
 * uses the same eased scroll as everything else (and falls back to native
 * smooth scrolling wherever Lenis is switched off — touch, /bron,
 * reduced-motion).
 */
export function HeroScrollCue({ locale }: { locale: Locale }) {
  const go = () => {
    const hero = document.querySelector<HTMLElement>("[data-hero-fx]");
    // Land just past the hero; fall back to one viewport if it isn't found.
    const target = hero ? hero.getBoundingClientRect().bottom + window.scrollY : window.innerHeight;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(target, { duration: 1.1 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={go}
      aria-label={ARIA[locale]}
      className="hero-scroll-cue group flex flex-col items-center gap-3"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45 transition-colors duration-300 group-hover:text-white/75">
        {LABEL[locale]}
      </span>
      <span aria-hidden className="hero-scroll-cue__track">
        <span className="hero-scroll-cue__beam" />
      </span>
    </button>
  );
}
