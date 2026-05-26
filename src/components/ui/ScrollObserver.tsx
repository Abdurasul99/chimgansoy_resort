"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Re-run on every route change — reset already-visible state for new page
    const selector =
      ".motion-reveal, .motion-reveal-left, .motion-reveal-scale, .img-reveal-wrapper";

    // Small delay so Next.js has finished rendering the new page DOM
    const timer = setTimeout(() => {
      const els = document.querySelectorAll<HTMLElement>(selector);
      if (!els.length) return;

      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add("is-visible");
              observer.unobserve(e.target);
            }
          }),
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );

      els.forEach((el) => {
        // If element is already above the fold or fully visible, reveal immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          el.classList.add("is-visible");
        } else {
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }, 80);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
