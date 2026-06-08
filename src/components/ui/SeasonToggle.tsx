"use client";

import { useEffect, useState, useCallback } from "react";
import { toggleSeason } from "./SeasonDetector";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";

export function SeasonToggle({ onDark, locale }: { onDark: boolean; locale: Locale }) {
  const dict = dictionaries[locale];
  const [season, setSeason] = useState<"summer" | "winter">("summer");
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const read = () => {
      const s = document.documentElement.getAttribute("data-season") as "summer" | "winter" | null;
      setSeason(s ?? "summer");
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
    return () => observer.disconnect();
  }, []);

  const handleToggle = useCallback(() => {
    setFlashing(true);
    setTimeout(() => {
      toggleSeason();
      setSeason((prev) => (prev === "summer" ? "winter" : "summer"));
      setFlashing(false);
    }, 200);
  }, []);

  const isWinter = season === "winter";
  const nextLabel = isWinter ? dict.summer : dict.winter;
  const nextIcon = isWinter ? "☀️" : "❄️";

  return (
    <>
      {/* Full-page flash overlay on switch */}
      {flashing && (
        <div
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{
            background: isWinter
              ? "rgba(255, 251, 240, 0.6)"
              : "rgba(240, 249, 255, 0.6)",
            animation: "season-flash 400ms ease forwards",
          }}
        />
      )}

      <button
        type="button"
        onClick={handleToggle}
        title={`${nextLabel} режим`}
        aria-label={`Switch to ${nextLabel} theme`}
        className={`group inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-all duration-300 ${
          isWinter
            ? onDark
              ? "border border-sky-400/40 bg-sky-500/20 text-sky-200 hover:bg-sky-500/35"
              : "border border-sky-300 bg-sky-50 text-sky-600 hover:bg-sky-100"
            : onDark
            ? "border border-amber-300/30 bg-amber-400/15 text-amber-200 hover:bg-amber-400/28"
            : "border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
        }`}
      >
        <span className="text-sm leading-none transition-transform duration-300 group-hover:scale-110">
          {isWinter ? "❄️" : "☀️"}
        </span>
        <span className="hidden sm:inline">{isWinter ? dict.winter : dict.summer}</span>
        <span
          className="hidden opacity-0 transition-opacity group-hover:opacity-100 lg:inline"
          aria-hidden="true"
        >
          → {nextIcon}
        </span>
      </button>
    </>
  );
}
