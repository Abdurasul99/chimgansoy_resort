import type { Promotion } from "@/content/promotions";

type Sticker = NonNullable<Promotion["sticker"]>;

/**
 * Стикер акции — круглая наклейка с фестончатым краем, как на подарочных
 * сертификатах (владелец, 12.11.2026: «оформите как Яндекс подарок — стикер»).
 *
 * Один рисунок на все акции, два тона: золотой — фирменный, для акций
 * проживания; розовый — праздничный, для дня рождения. Чистый SVG, без
 * картинок и скриптов; декоративный (aria-hidden) — цифра акции есть в тексте
 * карточки.
 *
 * `uid` нужен для id градиента и тени: на странице несколько стикеров, а
 * одинаковые id у SVG-определений ломают заливку, если первый из них скрыт.
 */
const TONES = {
  gold: { from: "#ffd76e", to: "#f4a52a", ink: "#1f2a33", ring: "#ffffff", ringOpacity: 0.75, shadow: "#8a5a00" },
  rose: { from: "#ff5a7a", to: "#ff8a3d", ink: "#ffffff", ring: "#ffffff", ringOpacity: 0.55, shadow: "#b3261e" },
} as const;

export function PromoSticker({ sticker, uid, className = "" }: { sticker: Sticker; uid: string; className?: string }) {
  const t = TONES[sticker.tone];
  const g = `ps-${uid}-g`;
  const s = `ps-${uid}-s`;
  const m = `ps-${uid}-m`;
  const big = sticker.label.length <= 3;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <defs>
        {/* userSpaceOnUse — чтобы «вырез» луны той же заливкой совпадал с фоном. */}
        <linearGradient id={g} gradientUnits="userSpaceOnUse" x1="14" y1="14" x2="106" y2="106">
          <stop offset="0" stopColor={t.from} />
          <stop offset="1" stopColor={t.to} />
        </linearGradient>
        <filter id={s} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={t.shadow} floodOpacity="0.26" />
        </filter>
        {sticker.icon === "moon" ? (
          <mask id={m}>
            <rect width="120" height="120" fill="#fff" />
            <circle cx="64" cy="40" r="9.5" fill="#000" />
          </mask>
        ) : null}
      </defs>
      <g filter={`url(#${s})`}>
        {/* Фестончатый край: круг + пунктир из точек с круглыми концами. */}
        <circle cx="60" cy="60" r="46" fill={`url(#${g})`} />
        <circle cx="60" cy="60" r="46" fill="none" stroke={`url(#${g})`} strokeWidth="10" strokeLinecap="round" strokeDasharray="0 18.06" />
      </g>
      <circle cx="60" cy="60" r="40.5" fill="none" stroke={t.ring} strokeOpacity={t.ringOpacity} strokeWidth="1.5" strokeDasharray="3 4" />
      <StickerIcon icon={sticker.icon} color={t.ink} mask={m} />
      <text
        x="60"
        y={big ? 90 : 87}
        textAnchor="middle"
        fontSize={big ? 30 : 23}
        fontWeight="800"
        fill={t.ink}
        fontFamily="inherit"
        letterSpacing="-0.5"
      >
        {sticker.label}
      </text>
    </svg>
  );
}

function StickerIcon({ icon, color, mask }: { icon: Sticker["icon"]; color: string; mask: string }) {
  if (icon === "gift") {
    return (
      <g fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M44 40h32v8H44z" fill={color} fillOpacity="0.18" />
        <path d="M47 48v12h26V48" />
        <path d="M60 40v20" />
        <path d="M60 40c-3-8-13-8-12-2 1 4 8 3 12 2zM60 40c3-8 13-8 12-2-1 4-8 3-12 2z" />
      </g>
    );
  }
  if (icon === "house") {
    return (
      <g fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M43 50 60 35l17 15" />
        <path d="M48 46v14h24V46" />
        <path d="M57 60v-7h6v7" />
      </g>
    );
  }
  // Луна со звёздами — «ночи»: третья ночь в подарок.
  return (
    <g fill={color}>
      <circle cx="57" cy="45" r="12" mask={`url(#${mask})`} />
      <path d="M73 33.5l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2z" />
      <circle cx="70" cy="52" r="1.6" />
    </g>
  );
}

/**
 * Конфетти вокруг стикера — по краю круга и только там, где нет текста.
 * `right` — стикер в углу карточки: слева и снизу от него бейдж, заголовок и
 * описание, поэтому точки сверху и справа. `top` — стикер в корешке: под ним
 * заголовок условий, поэтому точки по верхней половине.
 * Позиции фиксированы — без случайностей при рендере.
 */
const CONFETTI: Record<"right" | "top", Array<[number, number, number, "r" | "c"]>> = {
  // [угол в градусах от «трёх часов» по часовой, радиус, поворот, форма]
  right: [
    [-115, 45, 20, "r"], [-90, 47, -35, "c"], [-65, 44, 50, "r"], [-40, 47, 10, "c"],
    [-15, 45, -60, "r"], [10, 47, 30, "c"], [35, 44, -15, "r"], [58, 47, 70, "c"],
  ],
  top: [
    [165, 45, 20, "r"], [-170, 47, 0, "c"], [-145, 44, -35, "r"], [-120, 47, 50, "c"], [-95, 45, 10, "r"],
    [-70, 47, -60, "c"], [-45, 44, 30, "r"], [-20, 47, -15, "c"], [5, 45, 70, "r"], [20, 47, 0, "c"],
  ],
};

export function StickerConfetti({ side, className = "" }: { side: "right" | "top"; className?: string }) {
  const colors = ["#ff4d6d", "#f4a52a", "#3fb0e5", "#2f7a3e", "#ff8a3d"];
  const bits = CONFETTI[side];
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {bits.map(([deg, r, rot, kind], i) => {
        const a = (deg * Math.PI) / 180;
        const x = +(50 + r * Math.cos(a)).toFixed(2);
        const y = +(50 + r * Math.sin(a)).toFixed(2);
        const fill = colors[i % colors.length];
        return kind === "c" ? (
          <circle key={i} cx={x} cy={y} r="1.5" fill={fill} />
        ) : (
          <rect key={i} x={x - 2.2} y={y - 0.9} width="4.4" height="1.8" rx="0.5" fill={fill} transform={`rotate(${rot} ${x} ${y})`} />
        );
      })}
    </svg>
  );
}
