import type { CSSProperties } from "react";

/**
 * Узоры раздела ресторана: полоса иката, розетка-сюзане, искры.
 *
 * Все рисунки — SVG и CSS, без картинок: раздел должен быть насыщенным и
 * до того, как ресторан пришлёт фотографии, а чужие фотографии блюд выдавать
 * за свои нельзя (см. заметку про фото в images.ts). Цвета — из тарелки
 * с пловом на первом экране: рубин, шафран, бирюза, изумруд на ночном фоне.
 */

export const IKAT_COLORS = ["#d6352b", "#f4a52a", "#17a3b0", "#2c9a5b", "#ff6a2b", "#e4c07a"] as const;

/** Один мотив абра: ромб с «растёкшимися» краями и сердцевиной. */
function Motif({ x, color, core }: { x: number; color: string; core: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M30 1 L59 20 L30 39 L1 20 Z" fill={color} />
      {/* Рваный край — то, чем икат отличается от геометрии по линейке. */}
      <path d="M30 1 L59 20 L30 39 L1 20 Z" fill="none" stroke={color} strokeWidth="3" strokeDasharray="1.5 2.5" transform="translate(30 20) scale(1.12) translate(-30 -20)" opacity="0.7" />
      <path d="M30 9 L47 20 L30 31 L13 20 Z" fill="#140f0c" />
      <path d="M30 14 L39 20 L30 26 L21 20 Z" fill={core} />
    </g>
  );
}

/**
 * Горизонтальная полоса иката. `animated` — медленно плывёт (дублируется
 * вдвое, чтобы петля не рвалась).
 */
export function IkatBand({ height = 28, animated = false, className = "" }: { height?: number; animated?: boolean; className?: string }) {
  // Один отрезок — не уже 2000 px при любой высоте полосы: иначе на широком
  // экране справа оставался пустой хвост, а у бегущей — разрыв петли.
  const count = Math.ceil(2000 / ((60 * height) / 40));
  const tile = (
    <svg
      viewBox={`0 0 ${count * 60} 40`}
      height={height}
      width={(count * 60 * height) / 40}
      aria-hidden="true"
      className="block shrink-0"
    >
      {Array.from({ length: count }, (_, i) => (
        <Motif
          key={i}
          x={i * 60}
          color={IKAT_COLORS[i % IKAT_COLORS.length]}
          core={IKAT_COLORS[(i + 2) % IKAT_COLORS.length]}
        />
      ))}
    </svg>
  );
  return (
    <div className={`overflow-hidden bg-[#140f0c] ${className}`} aria-hidden="true">
      <div className={animated ? "rest-ticker__track rest-ticker__track--slow" : "flex"}>
        {tile}
        {tile}
      </div>
    </div>
  );
}

/** Розетка-сюзане: лепестки по кругу, для углов шапки и пустых мест. */
export function Rosette({ size = 220, className = "", colors = ["#f4a52a", "#d6352b", "#17a3b0"] }: { size?: number; className?: string; colors?: string[] }) {
  const petals = 12;
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} className={className} aria-hidden="true">
      <circle r="96" fill="none" stroke={colors[0]} strokeWidth="1.5" strokeDasharray="2 5" opacity="0.8" />
      {Array.from({ length: petals }, (_, i) => (
        <g key={i} transform={`rotate(${(360 / petals) * i})`}>
          <path d="M0 -88 C 14 -70, 14 -48, 0 -34 C -14 -48, -14 -70, 0 -88 Z" fill={colors[i % 2 === 0 ? 1 : 2]} opacity="0.9" />
          <circle cy="-62" r="4" fill={colors[0]} />
        </g>
      ))}
      <circle r="30" fill={colors[0]} opacity="0.9" />
      <circle r="18" fill="#140f0c" />
      <circle r="9" fill={colors[1]} />
    </svg>
  );
}

/**
 * Искры. Параметры детерминированы индексом — сервер и браузер рисуют одно и
 * то же, гидратации не о чем спорить.
 */
export function Embers({ count = 22 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
        const size = 3 + Math.round(r(1) * 6);
        return (
          <span
            key={i}
            className="rest-ember"
            style={
              {
                left: `${Math.round(r(2) * 100)}%`,
                width: size,
                height: size,
                "--dur": `${7 + r(3) * 8}s`,
                "--delay": `${-r(4) * 12}s`,
                "--drift": `${Math.round((r(5) - 0.5) * 140)}px`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Пар — три струйки над блюдом или над заголовком. */
export function Steam({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none flex gap-2 ${className}`} aria-hidden="true">
      {[0, 1.3, 2.6].map((d) => (
        <svg key={d} width="14" height="40" viewBox="0 0 14 40" className="rest-steam" style={{ "--delay": `${d}s` } as CSSProperties}>
          <path d="M7 38 C 1 30, 13 24, 7 16 C 1 9, 12 5, 7 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}
