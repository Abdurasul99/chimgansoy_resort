"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { startScrollEngine, pokeScrollEngine } from "@/lib/scroll-engine";

/**
 * Sora-style inertial scrolling.
 *
 * Lenis does NOT transform a wrapper — it eases `window.scrollTo` frame by
 * frame. That distinction is the whole reason it is safe here: `position:
 * sticky` (PriceList photo, service pages, the header) and `position: fixed`
 * (concierge, sticky CTA, mobile drawer) keep working, the native scrollbar
 * still reflects the true position, and keyboard / find-in-page / anchor jumps
 * are unaffected.
 *
 * Deliberately NOT enabled in three cases:
 *   • `prefers-reduced-motion` — smoothing is exactly the thing that setting opts out of.
 *   • `/bron` — the Exely booking engine injects its own scroll containers and a
 *     fixed cart; nothing of ours should be in that path.
 *   • coarse-pointer devices — iOS/Android already have real momentum scrolling.
 *     Re-implementing it in JS is where "smooth scroll" libraries usually go wrong.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // The shared rAF loop runs everywhere — parallax, progress bar and the
    // header react to scrolling even when Lenis itself is switched off.
    const stopEngine = startScrollEngine();

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onBron = /\/bron\/?$/.test(pathname);
    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (reduced || onBron || coarse) {
      document.documentElement.classList.remove("lenis-active");
      return stopEngine;
    }

    const lenis = new Lenis({
      lerp: 0.085,          // the glide. Lower = longer tail; 0.085 lands close to Sora.
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,     // leave touch to the OS — see the note above
      anchors: { offset: -80 }, // clear the 4.5rem sticky header on #links
      allowNestedScroll: true,  // dropdowns / the concierge list scroll on their own
      autoRaf: false,           // driven below, so scroll + effects share one frame
      stopInertiaOnNavigate: true,
    });

    window.__lenis = lenis;
    document.documentElement.classList.add("lenis-active");

    let rafId = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    // The intro overlay locks the page and hides the shell; once it hands off,
    // the real document height finally exists and Lenis must re-measure.
    const onIntroDone = () => {
      lenis.resize();
      pokeScrollEngine();
    };
    window.addEventListener("logo-intro:done", onIntroDone);

    // Fonts and lazy images change the document height after first paint.
    const onLoad = () => lenis.resize();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("logo-intro:done", onIntroDone);
      window.removeEventListener("load", onLoad);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
      document.documentElement.classList.remove("lenis-active");
      stopEngine();
    };
  }, [pathname]);

  return null;
}

export default SmoothScroll;
