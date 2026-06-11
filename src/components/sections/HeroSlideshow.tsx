"use client";

import { useEffect, useState } from "react";

// Real June-2026 photography — topchans against the Chimgan ridge
const SUMMER_SLIDES = [
  "/images/resort/gallery/gal-territory-panorama.jpg",
  "/images/resort/gallery/gal-topchan-row.jpg",
  "/images/resort/gallery/gal-pathway.jpg",
  "/images/resort/gallery/gal-aframe-trio.jpg",
];

const WINTER_PHOTO = "/images/resort/winter-google-aframe.jpg";

const INTERVAL_MS = 5500;

export function HeroSlideshow() {
  const [isWinter, setIsWinter] = useState(false);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("cgs_season");
    const month = new Date().getMonth() + 1;
    const autoWinter = month === 12 || month <= 3;
    setIsWinter(saved === "winter" || (!saved && autoWinter));

    const observer = new MutationObserver(() => {
      const season = document.documentElement.getAttribute("data-season");
      setIsWinter(season === "winter");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isWinter) return;

    // NOTE: `active` is mutated by this effect itself via setActive((prev)=>...).
    // It must NOT be in the deps array — otherwise the effect re-runs every
    // slide, recreating both intervals and leaking the previous pair.
    setProgress(0);
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (INTERVAL_MS / 50), 100));
    }, 50);
    const slideTimer = setInterval(() => {
      setActive((prev) => (prev + 1) % SUMMER_SLIDES.length);
      setProgress(0);
    }, INTERVAL_MS);

    return () => {
      clearInterval(progressTimer);
      clearInterval(slideTimer);
    };
  }, [isWinter]);

  if (isWinter) {
    return (
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${WINTER_PHOTO})` }}
        role="img"
        aria-label="Winter A-frame cottages in the Chimgan mountains"
      />
    );
  }

  return (
    <>
      <div className="absolute inset-0 -z-20 overflow-hidden">
        {SUMMER_SLIDES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === active ? 1 : 0,
              transform: i === active ? "scale(1.0)" : "scale(1.06)",
              transition: "opacity 1400ms ease-in-out, transform 7000ms ease-out",
            }}
            aria-hidden={i !== active}
          />
        ))}
      </div>

      <div
        className="absolute bottom-20 right-6 hidden flex-col items-end gap-2 sm:flex"
        aria-hidden="true"
      >
        {SUMMER_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setProgress(0); }}
            className="group flex items-center gap-2"
          >
            <div className={`h-px transition-all duration-500 ${i === active ? "w-8 bg-white" : "w-3 bg-white/30 group-hover:bg-white/60"}`} />
            <span className={`text-[10px] font-bold tabular-nums transition-colors duration-500 ${i === active ? "text-white" : "text-white/30 group-hover:text-white/60"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
        <div className="mt-1 h-0.5 w-8 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-[var(--sun)] transition-none" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </>
  );
}
