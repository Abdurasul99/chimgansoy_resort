import { useId } from "react";

/**
 * Силуэт хребта в три слоя: дальние горы, вершина Большого Чимгана со снежной
 * шапкой и ближний склон с огнями домиков. Слои — отдельные SVG, чтобы сцена
 * могла сдвигать их с разной скоростью (параллакс); привязаны к низу блока и
 * на телефоне обрезаются с боков, а не сжимаются.
 */

const VIEW = "0 0 1440 400";

const FAR =
  "M0 262 L90 214 L160 236 L250 172 L330 214 L420 152 L520 206 L610 162 L700 202 L820 134 L930 192 L1030 152 L1130 206 L1240 162 L1340 212 L1440 182 L1440 400 L0 400 Z";

// Главная вершина — посередине (x=720): на компьютере она встаёт между
// текстом и шаром, на телефоне попадает в центральную обрезку. Не выше y≈115:
// на широком экране слой показывает только нижние ~300 единиц из 400.
const MID =
  "M0 300 L110 262 L200 284 L300 236 L400 266 L500 214 L590 240 L660 170 L720 118 L772 152 L840 196 L930 230 L1030 204 L1120 246 L1230 222 L1330 256 L1440 232 L1440 400 L0 400 Z";

// Снег по склонам вершины, рваный снизу. Точки лежат на линиях MID.
const CAP = "M671 160 L720 118 L769 150 L752 147 L740 156 L728 146 L716 160 L703 149 L690 158 L680 152 Z";

/** Только гребень MID — под лунную кромку (без нижних углов). */
const MID_RIDGE = MID.replace(/ L1440 400 L0 400 Z$/, "");

const NEAR = "M0 334 Q180 292 360 318 T720 304 T1080 324 T1440 298 L1440 400 L0 400 Z";

/**
 * Высота гребня ближнего склона в точке x — те же четыре кривые, что в NEAR
 * (у каждой контрольная точка посередине по x, поэтому t линейно от x).
 */
const NEAR_SEGMENTS: [x0: number, y0: number, control: number, y1: number][] = [
  [0, 334, 292, 318],
  [360, 318, 344, 304],
  [720, 304, 264, 324],
  [1080, 324, 384, 298],
];

function ridgeY(x: number): number {
  const [x0, y0, c, y1] = NEAR_SEGMENTS[Math.min(3, Math.floor(x / 360))];
  const t = (x - x0) / 360;
  return (1 - t) ** 2 * y0 + 2 * (1 - t) * t * c + t ** 2 * y1;
}

/** Огни на ближнем склоне — домики курорта, чуть ниже гребня. */
const LIGHTS: [number, number][] = [
  262, 284, 305, 329, 352, 376, 401, 430, 458, 486, 940, 962, 988, 1012, 1038, 1062, 1090,
].map((x, i) => [x, Math.round(ridgeY(x) + 8 + ((i * 5) % 9))]);

export type MountainLayerName = "far" | "mid" | "near";

export function MountainLayer({ layer, className = "" }: { layer: MountainLayerName; className?: string }) {
  const id = useId().replace(/:/g, "");
  const common = {
    viewBox: VIEW,
    preserveAspectRatio: "xMidYMax slice" as const,
    "aria-hidden": true,
    focusable: false,
    className: `absolute inset-0 h-full w-full ${className}`,
  };

  if (layer === "far") {
    return (
      <svg {...common}>
        <path d={FAR} fill="#1a2b47" />
      </svg>
    );
  }

  if (layer === "mid") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={`${id}-mid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f1b30" />
            <stop offset="1" stopColor="#0b1526" />
          </linearGradient>
        </defs>
        {/* Темнее неба и дальнего хребта, иначе склон сливается с небом и
            снежная шапка висит в воздухе. Кромка — лунный свет по гребню. */}
        <path d={MID} fill={`url(#${id}-mid)`} />
        <path d={MID_RIDGE} fill="none" stroke="#9fb6d9" strokeOpacity={0.28} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        <path d={CAP} fill="#e6eefb" opacity={0.85} />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={NEAR} fill="#0a1322" />
      {LIGHTS.map(([x, y], i) => (
        <g key={`${x}-${y}`}>
          <circle
            cx={x}
            cy={y}
            r={9}
            fill={`url(#${id}-glow)`}
            className="ny-twinkle"
            style={{ ["--t" as string]: `${2.2 + ((i * 7) % 10) / 5}s`, ["--d" as string]: `${((i * 13) % 20) / 10}s` }}
          />
          <circle cx={x} cy={y} r={1.9} fill="#ffe2a8" />
        </g>
      ))}
    </svg>
  );
}
