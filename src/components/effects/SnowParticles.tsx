"use client";

import { useEffect, useState } from "react";

const SNOWFLAKE_COUNT = 28;

function getFlakeProps(i: number) {
  const seed = (i * 137.508 + 42) % 100;
  const left = ((seed * 9.7 + i * 3.6) % 100).toFixed(2);
  const size = (0.3 + (((seed * 7.1) % 10) / 10) * 0.9).toFixed(2);
  const dur = (8 + (seed * 0.23) % 12).toFixed(1);
  const delay = (-(seed * 0.19) % 8).toFixed(2);
  const drift = ((seed % 2 === 0 ? 1 : -1) * (10 + (seed * 0.31) % 30)).toFixed(0);
  const opacity = (0.3 + ((seed * 0.08) % 0.5)).toFixed(2);
  return { left, size, dur, delay, drift, opacity };
}

export function SnowParticles() {
  const [isWinter, setIsWinter] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onMotionChange);

    const readSeason = () => {
      setIsWinter(document.documentElement.getAttribute("data-season") === "winter");
    };
    readSeason();

    const observer = new MutationObserver(readSeason);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", onMotionChange);
    };
  }, []);

  if (!isWinter || reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}
    >
      {Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => {
        const { left, size, dur, delay, drift, opacity } = getFlakeProps(i);
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
              background: `rgba(200, 222, 255, ${opacity})`,
              boxShadow: `0 0 ${parseFloat(size) * 4}px rgba(180, 220, 255, 0.6)`,
              animationName: "snow-fall",
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              ["--drift" as string]: `${drift}px`,
            }}
          />
        );
      })}
    </div>
  );
}
