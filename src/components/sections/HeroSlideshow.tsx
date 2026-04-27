"use client";

import { useEffect, useState } from "react";

const SUMMER_SLIDES = [
  "/images/resort/17-workout-padel-zone.jpg",
  "/images/resort/15-pool-aerial.jpg",
  "/images/resort/16-pool-day-lifestyle.jpg",
  "/images/resort/photo_2026-03-31_22-24-14.jpg",
];

const WINTER_SLIDES = [
  "/images/resort/winter-mountains.jpg",
];

const INTERVAL_MS = 5500;

export function HeroSlideshow() {
  const [slides, setSlides] = useState(SUMMER_SLIDES);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const month = new Date().getMonth() + 1;
    const isWinter = month === 12 || month <= 3;
    setSlides(isWinter ? WINTER_SLIDES : SUMMER_SLIDES);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;

    setProgress(0);
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (INTERVAL_MS / 50), 100));
    }, 50);

    const slideTimer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, INTERVAL_MS);

    return () => {
      clearInterval(progressTimer);
      clearInterval(slideTimer);
    };
  }, [active, slides.length]);

  return (
    <>
      {/* Photo layers */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        {slides.map((src, i) => (
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

      {/* Slide indicator — bottom right */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-20 right-6 hidden flex-col items-end gap-2 sm:flex"
          aria-hidden="true"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setProgress(0); }}
              className="group flex items-center gap-2"
            >
              <div
                className={`h-px transition-all duration-500 ${
                  i === active ? "w-8 bg-white" : "w-3 bg-white/30 group-hover:bg-white/60"
                }`}
              />
              <span
                className={`text-[10px] font-bold tabular-nums transition-colors duration-500 ${
                  i === active ? "text-white" : "text-white/30 group-hover:text-white/60"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          ))}

          {/* Progress bar for current slide */}
          <div className="mt-1 h-0.5 w-8 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-[var(--sun)] transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
