"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollObserver() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Re-run on every route change — reset already-visible state for new page
    const selector =
      ".motion-reveal, .motion-reveal-left, .motion-reveal-scale, .img-reveal-wrapper";

    // Small delay so Next.js has finished rendering the new page DOM
    const timer = setTimeout(() => {
      const els = document.querySelectorAll<HTMLElement>(selector);
      if (!els.length) return;

      observerRef.current?.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add("is-visible");
              observerRef.current?.unobserve(e.target);
            }
          }),
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
      );

      els.forEach((el) => {
        // If element is already above the fold or fully visible, reveal immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          el.classList.add("is-visible");
        } else {
          observerRef.current?.observe(el);
        }
      });
    }, 80);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [pathname]);

  return null;
}
