"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

/** Три режима огней: тёплые, разноцветные, снежные. */
export const GARLAND_PALETTES = [
  ["#ffd27a", "#ffc25c", "#ffe3a6", "#ffb347"],
  ["#ff5d5d", "#ffd27a", "#58d68d", "#5aa9ff", "#ff8fd1"],
  ["#eaf4ff", "#cfe6ff", "#ffffff"],
] as const;

type Bulb = { x: number; y: number };

const H = 40;

/**
 * Гирлянда поперёк экрана, сразу под шапкой. Провод провисает пролётами по
 * ~360 px, лампы через ~48 px. При загрузке и при смене огней лампы
 * зажигаются слева направо; дальше мерцают сами (CSS, только opacity).
 */
function layout(w: number): { d: string; bulbs: Bulb[] } {
  if (w <= 0) return { d: "", bulbs: [] };
  const spans = Math.max(2, Math.round(w / 360));
  const step = w / spans;
  let d = "M0 4";
  for (let i = 0; i < spans; i++) d += ` Q${(step * i + step / 2).toFixed(1)} 32 ${(step * (i + 1)).toFixed(1)} 4`;
  const count = Math.max(8, Math.round(w / 48));
  const bulbs: Bulb[] = [];
  for (let j = 0; j < count; j++) {
    const u = ((j + 0.5) / count) * spans;
    const k = Math.min(spans - 1, Math.floor(u));
    const t = u - k;
    const x0 = step * k;
    // Квадратичная кривая: концы на y=4, контрольная точка посередине на y=32.
    const x = x0 + t * step;
    const y = (1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * 32 + t * t * 4;
    bulbs.push({ x, y });
  }
  return { d, bulbs };
}

/**
 * `wave` — сколько раз гость сменил огни (0 — первая загрузка). Палитра идёт
 * по кругу, каждая смена заново зажигает лампы волной.
 */
export function Garland({ wave, firstDelay = 0.5 }: { wave: number; firstDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const id = useId().replace(/:/g, "");
  const colors = GARLAND_PALETTES[wave % GARLAND_PALETTES.length];
  const geo = useMemo(() => layout(w), [w]);
  // Первая волна — с задержкой под общий выход сцены, следующие — сразу.
  const delay = wave === 0 ? firstDelay : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // ResizeObserver сообщает размер и сразу после подключения — отдельный
    // замер при монтировании не нужен.
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(Math.round(el.getBoundingClientRect().width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-[2] h-10">
      {w > 0 && (
        <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} className="block overflow-visible">
          <defs>
            {colors.map((c, i) => (
              <radialGradient key={c} id={`${id}-g${i}`}>
                <stop offset="0" stopColor={c} stopOpacity="0.75" />
                <stop offset="1" stopColor={c} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          <path d={geo.d} fill="none" stroke="#24382e" strokeWidth={2} />
          {geo.bulbs.map((b, i) => {
            const ci = i % colors.length;
            return (
              <g key={i} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
                <rect x={-2.5} y={0} width={5} height={4} rx={1} fill="#2c3e35" />
                <motion.g
                  key={wave}
                  initial={{ opacity: 0.12 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + i * 0.035, duration: 0.3 }}
                >
                  <circle
                    cx={0}
                    cy={9}
                    r={14}
                    fill={`url(#${id}-g${ci})`}
                    className="ny-twinkle"
                    style={{ ["--t" as string]: `${1.8 + ((i * 7) % 18) / 10}s`, ["--d" as string]: `${((i * 11) % 24) / 10}s` }}
                  />
                  <ellipse cx={0} cy={9} rx={4.2} ry={6} fill={colors[ci]} />
                </motion.g>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
