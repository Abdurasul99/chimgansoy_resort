"use client";

import { useEffect, useState } from "react";

// July-2026 shoot — the finished A-frames and the ridge they look out on.
//
// The source frames are portrait 2:3 and the hero is full-bleed, so these are
// stored at 3:2 rather than 16:9 on purpose: a 16:9 master loses too much of
// the sides once `bg-cover` fits it to a tall phone viewport. Each frame was
// checked at BOTH ~1.8:1 (desktop) and ~0.46 (portrait phone) before being
// picked — most of the collection survives neither.
// hero-lawn leads: it is the only frame showing the grounds finished — lawn
// laid, pines grown in. It is also the only one NOT from the July gallery, and
// only 896px was available, so it is upscaled (lanczos3 + unsharp) rather than
// native. That holds up under the hero's dark scrim, but a full-resolution
// original would be a straight upgrade — swap it in here if one turns up.
// Every wide exterior frame in the repo carries a construction artefact, and
// the hero is the one place where that is unmissable:
//   hero-aframe-row  — red/white mast standing in the sky above the roofline
//   hero-lawn        — tower crane between the second and third cabin
//   hero-ridge       — two lattice pylons across the middle of the view
//   hero-aframe-pines / aframe-exterior — geotextile and sand instead of lawn
// So the hero now leads with the finished A-frame interior, cut to 3:2 from the
// 4662×6993 original of the July shoot, and follows with the ridge cropped left
// of the pylons. Both are clean at full size. A retouch of the crane was tried
// and thrown away — it smeared roof texture across the sky.
// A proper wide exterior, shot after the cranes leave, would beat both.
// Pool only, per the operator: the pool is the product they want the homepage
// to lead on.
//
// August 2026: these are photographs. The three frames that stood here were CGI
// — there was no picture of the finished pool anywhere in the repo, and a guest
// who booked off this hero was booking off a drawing. The shoot settled it.
// All three are 2400px wide and 4:3, which survives both the desktop crop
// (~1.8:1) and a portrait phone (~0.46) without losing the subject — the test
// every hero frame on this site has to pass.
const SUMMER_SLIDES = [
  "/images/resort/2026-08/pool-panorama.jpg", // whole pool, swim-up bar, mountains
  "/images/resort/2026-08/pool-cabanas-valley.jpg", // cabanas above the valley
  "/images/resort/2026-08/pool-deck-chalets.jpg", // deck and the chalet row
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
        className="hero-fx-media absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${WINTER_PHOTO})` }}
        role="img"
        aria-label="Winter A-frame cottages in the Chimgan mountains"
      />
    );
  }

  return (
    <>
      <div className="hero-fx-media absolute inset-0 -z-20 overflow-hidden">
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
