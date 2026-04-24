"use client";

import { useEffect, useState } from "react";

const PHRASES: Record<string, string[]> = {
  ru: ["Тишина.", "Горы.", "Покой."],
  uz: ["Jimjitlik.", "Tog'lar.", "Hordiq."],
  en: ["Silence.", "Mountains.", "Stillness."],
};

export function EmotionCycle({ locale }: { locale: string }) {
  const phrases = PHRASES[locale] ?? PHRASES.ru;
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % phrases.length);
        setFade(true);
      }, 320);
    }, 2600);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <p
      className="font-serif text-xl italic text-white/40"
      style={{
        opacity: fade ? 1 : 0,
        transition: "opacity 0.32s ease",
        minHeight: "1.75rem",
        letterSpacing: "0.04em",
      }}
    >
      {phrases[index]}
    </p>
  );
}
