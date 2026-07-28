"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onScrollFrame } from "@/lib/scroll-engine";

const SELECTOR =
  ".motion-reveal,.motion-reveal-left,.motion-reveal-scale,.motion-reveal-mask,.img-reveal-wrapper";

/**
 * Reveals `.motion-reveal*` / `.img-reveal-wrapper` elements as they scroll into
 * view by adding `.is-visible`.
 *
 * Uses one IntersectionObserver plus a MutationObserver that feeds newly mounted
 * nodes into it. The MutationObserver is the important half: a plain IO snapshot
 * holds references to specific nodes, so anything React mounts later (route
 * change, hydration re-render, a lazily rendered section) would never be
 * observed and its section would stay stuck at `opacity: 0`.
 *
 * Previously this re-queried the whole document on every scroll event. That was
 * affordable while scroll events only fired on real input — with smooth
 * scrolling they fire every animation frame, and a full `querySelectorAll` over
 * a 13 000px page each frame is a guaranteed dropped-frame source.
 */
export function ScrollObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reveal = (el: Element) => el.classList.add("is-visible");

    // No IntersectionObserver (very old browser) — show everything rather than
    // leaving the page blank.
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(SELECTOR).forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Reveal on entering view, and also anything already sitting above the
          // fold — an element that is scrolled past never intersects again.
          if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) continue;
          reveal(entry.target);
          io.unobserve(entry.target); // one-shot: the class is never removed
        }
      },
      // Fire slightly before the element reaches the fold so the transition has
      // already started by the time it is properly on screen.
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const scan = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.classList.contains("is-visible")) return;
        io.observe(el);
      });
    };

    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // Belt-and-braces passes for anything that lands between the scan and the
    // MutationObserver being wired up (or that mounts with a delay of its own).
    const timers = [150, 600, 1500].map((ms) => window.setTimeout(scan, ms));

    // Jump guard. IntersectionObserver samples once per frame, so a scroll that
    // covers more than a viewport in a single frame — an anchor link, browser
    // scroll restoration, a "jump to bottom" — can carry an element from below
    // the fold to above it between two samples. Its intersection state never
    // changes, no callback ever fires, and it would stay invisible for good.
    //
    // Only jumps can do that; continuous scrolling (and Lenis's easing in
    // particular) always steps through the fold. So this does nothing at all on
    // a normal scroll and only walks the DOM on the rare teleport.
    let lastY = window.scrollY;
    const unsubscribe = onScrollFrame(({ y }) => {
      const jumped = Math.abs(y - lastY) > window.innerHeight * 0.9;
      lastY = y;
      if (!jumped) return;
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.classList.contains("is-visible")) return;
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0) {
          // Jumped clean past it — show it in its final state.
          reveal(el);
          io.unobserve(el);
        }
      });
    });

    return () => {
      io.disconnect();
      mo.disconnect();
      unsubscribe();
      timers.forEach(window.clearTimeout);
    };
  }, [pathname]);

  return null;
}
