"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Карта Google — только когда блок рядом с экраном.
 *
 * loading="lazy" у iframe не спасал: пока на главной идёт заставка, всё
 * содержимое скрыто (visibility:hidden), а скрытые iframe Chrome грузит
 * сразу. Карта внизу страницы (12 000 px) тянула 15 запросов и ~450 КБ
 * на второй секунде, наравне с первым экраном (замер 27.11.2026).
 */
export function LazyMapFrame({ title, src, className }: { title: string; src: string; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setNear(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(box);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={boxRef} className={className}>
      {near && (
        <iframe
          title={title}
          src={src}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      )}
    </div>
  );
}
