import type { CSSProperties } from "react";
import { Steam } from "./Ornaments";

/**
 * Картинка блюда — фото из админки или «иллюстрация» без фото.
 *
 * ТЗ (п. 3): нет фото — аккуратная заглушка без чужих фотографий, и меню
 * публикуется, не дожидаясь съёмки. Заглушка здесь не серый квадрат, а
 * цветная плитка в палитре иката с первой буквой блюда и паром: меню без
 * единого снимка всё равно выглядит живым, а не недоделанным.
 */
const PAIRS: [string, string][] = [
  ["#d6352b", "#ff8a3d"],
  ["#17a3b0", "#2c9a5b"],
  ["#f4a52a", "#ff6a2b"],
  ["#2c9a5b", "#e4c07a"],
  ["#3a1f16", "#d6352b"],
  ["#17a3b0", "#f4a52a"],
];

export function DishVisual({
  image,
  title,
  seed,
  className = "",
  big = false,
}: {
  image: string;
  title: string;
  seed: number;
  className?: string;
  big?: boolean;
}) {
  if (image) {
    return (
      // Обычный <img>: фото лежат в собственном хранилище /blob/, next/image
      // для них не настроен и не нужен — они уже ужаты при загрузке.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={title} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />
    );
  }
  const [a, b] = PAIRS[Math.abs(seed) % PAIRS.length];
  const letter = (title.trim()[0] ?? "•").toUpperCase();
  return (
    <div
      role="img"
      aria-label={title}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: `radial-gradient(120% 90% at 20% 10%, ${b} 0%, ${a} 55%, #140f0c 130%)` } as CSSProperties}
    >
      {/* Узор абра поверх градиента — полупрозрачной сеткой ромбов. */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden="true">
        <defs>
          <pattern id={`ikat-${seed}`} width="36" height="24" patternUnits="userSpaceOnUse">
            <path d="M18 1 L35 12 L18 23 L1 12 Z" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="2 2" />
            <path d="M18 7 L26 12 L18 17 L10 12 Z" fill="#fff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#ikat-${seed})`} />
      </svg>
      <div className="relative flex flex-col items-center text-white">
        <Steam className={big ? "mb-1 text-white/70" : "mb-0.5 scale-75 text-white/60"} />
        <span className={`font-serif font-bold leading-none drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)] ${big ? "text-8xl" : "text-5xl"}`}>
          {letter}
        </span>
      </div>
    </div>
  );
}
