"use client";

import { useEffect, useState } from "react";

// Fewer particles = better FPS
const SNOWFLAKE_COUNT = 18;

// 3 fixed animation names — NO CSS custom property in transform
// so the browser can GPU-composite every particle
const ANIM_NAMES = ["snow-fall-0", "snow-fall-1", "snow-fall-2"] as const;

function getFlakeProps(i: number) {
  const seed = (i * 137.508 + 42) % 100;
  const left = ((seed * 9.7 + i * 3.6) % 100).toFixed(1);
  const size = (0.25 + ((seed * 7.1) % 10) / 10 * 0.75).toFixed(2); // 0.25–1.0rem
  const dur  = (10 + (seed * 0.25) % 10).toFixed(1);                 // 10–20s
  const delay = (-(seed * 0.21) % 9).toFixed(1);                     // stagger
  const opacity = (0.35 + (seed * 0.06) % 0.45).toFixed(2);          // 0.35–0.80
  const anim = ANIM_NAMES[i % 3];
  return { left, size, dur, delay, opacity, anim };
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
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
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
              // NO box-shadow — causes paint on every frame
              animationName: anim,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              willChange: "transform, opacity", // GPU layer promotion
            }}
          />
        );
      })}
    </div>
  );
}
