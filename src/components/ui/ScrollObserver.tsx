"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reveals `.motion-reveal*` / `.img-reveal-wrapper` elements as they scroll into
 * view by adding `.is-visible`.
 *
 * It re-queries the LIVE DOM on every scroll (rAF-throttled) rather than caching
 * observed nodes. This is deliberate: a single IntersectionObserver snapshot
 * holds references to specific nodes, so if React replaces those nodes (e.g. a
 * hydration re-render) or an element mounts after the snapshot, they never get
 * revealed and the section stays blank. Re-scanning the live DOM can't go stale.
 */
export function ScrollObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const SELECTOR =
      ".motion-reveal:not(.is-visible),.motion-reveal-left:not(.is-visible),.motion-reveal-scale:not(.is-visible),.img-reveal-wrapper:not(.is-visible)";

    let raf = 0;
    const reveal = () => {
      raf = 0;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        const r = el.getBoundingClientRect();
        // In or near the viewport (and not fully scrolled past above) -> reveal.
        if (r.top < vh * 0.92 && r.bottom > -120) el.classList.add("is-visible");
      });
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(reveal);
    };

    // Initial passes — catch above-the-fold immediately, plus a couple of
    // delayed passes so anything that renders/hydrates late is still revealed.
    reveal();
    const t1 = window.setTimeout(reveal, 150);
    const t2 = window.setTimeout(reveal, 600);
    const t3 = window.setTimeout(reveal, 1500);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
