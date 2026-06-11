import type { Locale } from "@/i18n/config";

/**
 * TextTicker — oversized serif brand words drifting in an endless band.
 * Alternating solid/outline words is a classic premium-editorial device.
 * Pure CSS animation (shares marquee-left keyframes), GPU-composited.
 */

const WORDS: Record<Locale, string[]> = {
  ru: ["Топчан", "Мангал", "Казан", "1700 м", "Чимган", "Курпача", "Горы", "08:00–18:00"],
  uz: ["Topchan", "Mangal", "Qozon", "1700 m", "Chimg'on", "Kurpacha", "Tog'lar", "08:00–18:00"],
  en: ["Topchan", "Mangal", "Kazan", "1700 m", "Chimgan", "Kurpacha", "Mountains", "08:00–18:00"],
};

export function TextTicker({ locale, dark = false }: { locale: Locale; dark?: boolean }) {
  const words = WORDS[locale] ?? WORDS.ru;
  // Track duplicated for a seamless -50% loop
  const loop = [...words, ...words];

  return (
    <div className={`ticker-band ${dark ? "ticker-band--dark" : ""}`} aria-hidden="true">
      <div className="ticker-track">
        {loop.map((word, i) => (
          <span key={i} className="flex items-baseline gap-10">
            <span className={`ticker-word ${i % 2 === 1 ? "ticker-word--ghost" : ""}`}>
              {word}
            </span>
            <span className="ticker-sep">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}
