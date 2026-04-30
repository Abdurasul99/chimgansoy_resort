"use client";

import { useEffect, useState } from "react";

const SNOWFLAKE_COUNT = 8; // 8 is enough — each extra = more GPU memory

const ANIM_NAMES = ["snow-fall-0", "snow-fall-1", "snow-fall-2"] as const;

function getFlakeProps(i: number) {
  const seed = (i * 137.508 + 42) % 100;
  const left    = ((seed * 9.7 + i * 11.2) % 92).toFixed(1);
  const size    = (0.3 + ((seed * 7.1) % 10) / 10 * 0.7).toFixed(2); // 0.3–1.0rem
  const dur     = (12 + (seed * 0.28) % 10).toFixed(1);               // 12–22s
  const delay   = (-(seed * 0.22) % 10).toFixed(1);                   // stagger start
  const opacity = (0.4 + (seed * 0.05) % 0.35).toFixed(2);            // 0.4–0.75
  return { left, size, dur, delay, opacity, anim: ANIM_NAMES[i % 3] };
}

export function SnowParticles() {
  const [isWinter, setIsWinter] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onMotionChange);

    const readSeason = () =>
      setIsWinter(document.documentElement.getAttribute("data-season") === "winter");
    readSeason();

    const obs = new MutationObserver(readSeason);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });

    return () => {
      obs.disconnect();
      mq.removeEventListener("change", onMotionChange);
    };
  }, []);

  if (!isWinter || reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        overflow: "hidden",
        // ONE will-change on the container — not per-particle
        willChange: "transform",
      }}
    >
      {Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => {
        const { left, size, dur, delay, opacity, anim } = getFlakeProps(i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-5%",
              left: `${left}%`,
              width: `${size}rem`,
              height: `${size}rem`,
              borderRadius: "50%",
              background: `rgba(210, 230, 255, ${opacity})`,
              animationName: anim,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              // NO individual willChange — browser composites transform/opacity natively
            }}
          />
        );
      })}
    </div>
  );
}
