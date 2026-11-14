"use client";

import { useEffect, useRef, useState } from "react";
import { PACKAGES } from "@/lib/partners/economics";
import { fmtMln } from "@/lib/partners/format";
import { mapBlock, zones, type ZonePassport } from "@/content/partners-b2b";
import { trackEvent } from "@/lib/analytics";
import { useWorkbench } from "./Workbench";

/**
 * Схематичная карта семи зон (из макета владельца, перекрашена в палитру
 * сайта). Клик или Enter по зоне открывает паспорт; «Включить в расчёт»
 * переключает пакет калькулятора и прокручивает к нему.
 */

const GOLD = "#d98a14";
const SKY = "#2d8fbf";

function priceLine(z: ZonePassport): string {
  const p = PACKAGES[z.pkg];
  if (z.pkg === "title") return `Титульный пакет (зоны 1+2+3+7) · ${fmtMln(p.price as number)} / год`;
  return `${fmtMln(p.price as number)} / ${p.period}`;
}

export function ZoneMap() {
  const { state, setPackage } = useWorkbench();
  const [open, setOpen] = useState<ZonePassport | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const openZone = (id: string) => {
    const z = zones.find((x) => x.id === id) ?? null;
    setOpen(z);
    if (z) trackEvent("partner_zone_open", { zone: z.id });
  };

  const zoneProps = (id: string) => {
    const z = zones.find((x) => x.id === id)!;
    const selected = PACKAGES[z.pkg] && state.pkg === z.pkg;
    return {
      className: `cd-zone ${z.season === "summer" ? "is-summer" : ""} ${selected ? "is-selected" : ""}`,
      role: "button" as const,
      tabIndex: 0,
      "aria-label": `${z.num}: ${z.name}. Открыть паспорт зоны`,
      onClick: () => openZone(id),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openZone(id);
        }
      },
    };
  };

  const beacon = (cx: number, cy: number, summer = false) => (
    <g className="cd-beacon" color={summer ? SKY : GOLD}>
      <circle className="cd-ring" cx={cx} cy={cy} r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="3.5" fill="currentColor" />
    </g>
  );

  return (
    <div>
      <style>{`
        .cd-map .cd-zone { cursor: pointer; outline: none; }
        .cd-map .cd-zone .cd-hit { fill: transparent; }
        .cd-map .cd-zone .cd-shape { fill: rgba(244,165,42,.12); stroke: ${GOLD}; stroke-opacity: .55; stroke-width: 1.4; transition: fill .2s, stroke-opacity .2s, stroke-width .2s; }
        .cd-map .cd-zone.is-summer .cd-shape { fill: rgba(63,176,229,.12); stroke: ${SKY}; }
        .cd-map .cd-zone:hover .cd-shape, .cd-map .cd-zone:focus-visible .cd-shape { fill: rgba(244,165,42,.26); stroke-opacity: 1; stroke-width: 2.2; }
        .cd-map .cd-zone.is-summer:hover .cd-shape, .cd-map .cd-zone.is-summer:focus-visible .cd-shape { fill: rgba(63,176,229,.26); }
        .cd-map .cd-zone.is-selected .cd-shape { stroke-opacity: 1; stroke-width: 2.6; fill: rgba(244,165,42,.3); }
        .cd-map .cd-zone.is-summer.is-selected .cd-shape { fill: rgba(63,176,229,.3); }
        .cd-map .cd-zone:focus-visible .cd-label { text-decoration: underline; }
        .cd-map .cd-num { font: 700 11px var(--font-sans), sans-serif; letter-spacing: .14em; text-transform: uppercase; fill: ${GOLD}; }
        .cd-map .is-summer .cd-num { fill: ${SKY}; }
        .cd-map .cd-label { font: 700 15px var(--font-sans), sans-serif; fill: #1f2a33; }
        .cd-map .cd-route { fill: none; stroke: rgba(31,42,51,.35); stroke-width: 1.6; stroke-dasharray: 4 6; }
        .cd-map .cd-ring { transform-box: fill-box; transform-origin: center; animation: cd-pulse 2.4s ease-out infinite; }
        @keyframes cd-pulse { 0% { transform: scale(.6); opacity: .9 } 100% { transform: scale(2.2); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .cd-map .cd-ring { animation: none; } .cd-map .cd-cabin { display: none; } }
        .cd-dialog::backdrop { background: rgba(31,42,51,.45); backdrop-filter: blur(2px); }
      `}</style>

      <div className="cd-map overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <svg viewBox="0 0 1000 640" className="block h-auto w-full" role="img" aria-label="Схематичная карта курорта CHIMGAN DARBAZA с семью зонами размещения">
          <defs>
            <linearGradient id="cdSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbf8f2" />
              <stop offset="1" stopColor="#f1ecdf" />
            </linearGradient>
            <radialGradient id="cdPool" cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#3fb0e5" stopOpacity=".42" />
              <stop offset="1" stopColor="#3fb0e5" stopOpacity=".08" />
            </radialGradient>
          </defs>
          <rect width="1000" height="640" fill="url(#cdSky)" />
          <path d="M0,320 L80,222 L150,266 L262,140 L372,236 L470,166 L585,216 L700,96 L812,186 L905,150 L1000,236 L1000,640 L0,640 Z" fill="#ebe4d2" />
          <path d="M262,140 L300,176 L282,174 L262,190 L244,170 Z M700,96 L742,140 L720,136 L700,152 L680,132 Z" fill="#fbf8f2" opacity=".9" />
          <path d="M0,405 Q165,342 330,382 Q520,305 700,362 Q860,322 1000,372 L1000,640 L0,640 Z" fill="#e4ddca" />
          <g fill="none" stroke="rgba(31,42,51,.07)">
            <path d="M40,430 Q250,395 460,428 T960,415" />
            <path d="M40,500 Q260,462 470,498 T960,485" />
            <path d="M40,575 Q250,540 480,570 T960,558" />
          </g>
          <path className="cd-route" d="M500,556 C470,505 420,468 372,420" />
          <path className="cd-route" d="M392,400 C480,378 530,352 588,346" />
          <path className="cd-route" d="M705,402 C712,416 718,424 722,436" />

          {/* Зона 7 — апарт-отель */}
          <g {...zoneProps("z7")}>
            <rect className="cd-hit" x="100" y="150" width="210" height="115" />
            <rect className="cd-shape" x="112" y="182" width="58" height="68" rx="3" />
            <rect className="cd-shape" x="182" y="196" width="52" height="54" rx="3" />
            <rect className="cd-shape" x="246" y="172" width="48" height="78" rx="3" />
            <g fill="rgba(217,138,20,.55)">
              {[[122, 192], [138, 192], [154, 192], [122, 210], [138, 210], [154, 210], [192, 206], [208, 206], [256, 182], [272, 182], [256, 200], [272, 200]].map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" />
              ))}
            </g>
            {beacon(205, 165)}
            <text className="cd-num" x="112" y="140">Зона 7</text>
            <text className="cd-label" x="178" y="140">Апарт-отель</text>
          </g>

          {/* Зона 2 — гондола */}
          <g {...zoneProps("z2")}>
            <line x1="432" y1="470" x2="752" y2="148" stroke="transparent" strokeWidth="40" />
            <line x1="432" y1="470" x2="752" y2="148" stroke={GOLD} strokeOpacity=".7" strokeWidth="2" strokeDasharray="2 5" />
            <rect className="cd-shape" x="410" y="460" width="30" height="20" rx="3" />
            <rect className="cd-shape" x="742" y="128" width="30" height="20" rx="3" />
            <g className="cd-cabin">
              <rect x="-9" y="-1" width="18" height="13" rx="2" fill={GOLD} />
              <animateMotion dur="18s" repeatCount="indefinite" path="M432,470 L752,148" />
            </g>
            <g className="cd-cabin" opacity=".7">
              <rect x="-9" y="-1" width="18" height="13" rx="2" fill="#b98a3e" />
              <animateMotion dur="18s" begin="-9s" repeatCount="indefinite" path="M432,470 L752,148" />
            </g>
            {beacon(592, 309)}
            <text className="cd-num" x="560" y="214" textAnchor="end">Зона 2</text>
            <text className="cd-label" x="560" y="232" textAnchor="end">Гондола</text>
          </g>

          {/* Зона 3 — сервис-центр */}
          <g {...zoneProps("z3")}>
            <rect className="cd-hit" x="288" y="318" width="155" height="100" />
            <polygon className="cd-shape" points="298,352 362,326 426,352" />
            <rect className="cd-shape" x="298" y="352" width="128" height="52" rx="3" />
            <rect x="350" y="366" width="24" height="38" fill="rgba(217,138,20,.35)" />
            {beacon(362, 316)}
            <text className="cd-num" x="236" y="300">Зона 3</text>
            <text className="cd-label" x="302" y="300">Сервис-центр</text>
          </g>

          {/* Зона 5 — магазин */}
          <g {...zoneProps("z5")}>
            <rect className="cd-hit" x="240" y="440" width="115" height="76" />
            <rect className="cd-shape" x="250" y="458" width="96" height="50" rx="3" />
            <rect x="286" y="476" width="22" height="32" fill="rgba(217,138,20,.35)" />
            {beacon(298, 448)}
            <text className="cd-num" x="160" y="536">Зона 5</text>
            <text className="cd-label" x="226" y="536">Магазин</text>
          </g>

          {/* Зона 4 — топчаны */}
          <g {...zoneProps("z4")}>
            <rect className="cd-hit" x="580" y="285" width="228" height="118" />
            <rect className="cd-shape" x="588" y="298" width="212" height="98" rx="12" />
            <g fill="rgba(63,176,229,.2)" stroke={SKY} strokeOpacity=".7">
              {[[622, 326], [672, 326], [722, 326], [622, 368], [672, 368], [722, 368]].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="11" />
              ))}
            </g>
            <rect x="758" y="316" width="28" height="64" rx="3" fill="none" stroke={SKY} strokeOpacity=".5" strokeDasharray="3 4" />
            {beacon(694, 288, true)}
            <text className="cd-num" x="820" y="330">Зона 4</text>
            <text className="cd-label" x="820" y="348">Топчаны</text>
          </g>

          {/* Зона 6 — аквазона */}
          <g {...zoneProps("z6")}>
            <rect className="cd-hit" x="618" y="428" width="212" height="122" />
            <rect className="cd-shape" x="626" y="440" width="200" height="104" rx="14" />
            <ellipse cx="726" cy="492" rx="72" ry="34" fill="url(#cdPool)" stroke={SKY} strokeOpacity=".7" />
            <path d="M672,486 q12,-8 24,0 q12,8 24,0 q12,-8 24,0" fill="none" stroke={SKY} strokeOpacity=".7" strokeWidth="1.6" />
            <path d="M678,502 q12,-8 24,0 q12,8 24,0 q12,-8 24,0" fill="none" stroke={SKY} strokeOpacity=".45" strokeWidth="1.4" />
            {beacon(726, 430, true)}
            <text className="cd-num" x="840" y="486">Зона 6</text>
            <text className="cd-label" x="840" y="504">Аквазона</text>
          </g>

          {/* Зона 1 — ворота */}
          <g {...zoneProps("z1")}>
            <rect className="cd-hit" x="415" y="505" width="170" height="105" />
            <path d="M432,606 L432,560 Q500,512 568,560 L568,606" fill="none" stroke={GOLD} strokeWidth="6" strokeOpacity=".75" />
            <rect className="cd-shape" x="418" y="560" width="16" height="46" />
            <rect className="cd-shape" x="566" y="560" width="16" height="46" />
            {beacon(500, 512)}
            <text className="cd-num" x="598" y="572">Зона 1</text>
            <text className="cd-label" x="598" y="590">Ворота «Дарбаза»</text>
          </g>

          <g opacity=".6" stroke="#1f2a33" fill="#1f2a33">
            <line x1="950" y1="600" x2="950" y2="568" strokeWidth="1.4" />
            <polygon points="950,560 945,572 955,572" />
            <text x="950" y="620" textAnchor="middle" fontSize="11" letterSpacing="2" stroke="none">С · 1700 м</text>
          </g>
        </svg>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: GOLD, background: "rgba(244,165,42,.2)" }} />{mapBlock.legendAll}</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: SKY, background: "rgba(63,176,229,.2)" }} />{mapBlock.legendSummer}</li>
        <li className="flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dashed border-[var(--ink)]/40" />{mapBlock.legendRoutes}</li>
      </ul>

      {/* Список зон — тот же вход без карты: телефон, клавиатура, скринридер. */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {zones.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => openZone(z.id)}
            className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition hover:border-[var(--sun)] ${
              state.pkg === z.pkg ? "border-[var(--sun)] bg-[var(--sun)]/10" : "border-[var(--line)] bg-white"
            }`}
          >
            <span className={`block text-[11px] font-bold uppercase tracking-[0.14em] ${z.season === "summer" ? "text-[var(--sky-dark)]" : "text-[var(--sun-dark)]"}`}>{z.num}</span>
            <span className="block font-semibold leading-snug text-[var(--ink)]">{z.name}</span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(null);
        }}
        className="cd-dialog m-auto w-[min(560px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl bg-[var(--paper)] p-0 text-[var(--ink)] shadow-[var(--shadow-card-hover)]"
        aria-labelledby="cd-zone-title"
      >
        {open && (
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                  open.season === "summer" ? "bg-[var(--sky)]/15 text-[var(--sky-dark)]" : "bg-[var(--sun)]/15 text-[var(--sun-dark)]"
                }`}
              >
                {open.season === "summer" ? `Тёплый сезон: ${PACKAGES[open.pkg].windowLabel}` : "Всесезонная"}
              </span>
              <button type="button" onClick={() => setOpen(null)} className="-mr-2 -mt-2 rounded-full p-2 text-xl leading-none text-[var(--muted)] hover:bg-[var(--surface-warm)]" aria-label="Закрыть">
                ✕
              </button>
            </div>
            <h3 id="cd-zone-title" className="mt-4 font-serif text-3xl font-bold leading-tight">
              {open.num} · {open.name}
            </h3>
            <p className="mt-2 text-lg font-bold text-[var(--sun-dark)]">{priceLine(open)}</p>
            <h4 className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Форматы носителей</h4>
            <ul className="mt-2 space-y-1.5">
              {open.formats.map((f) => (
                <li key={f} className="flex gap-2 text-[15px] leading-6">
                  <span aria-hidden className="text-[var(--sun-dark)]">•</span>
                  {f}
                </li>
              ))}
            </ul>
            <h4 className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Технические требования</h4>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{open.tech}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(null);
                setPackage(open.pkg, { scroll: true, source: "map" });
              }}
              className="mt-7 w-full rounded-full bg-[var(--sun)] px-6 py-3.5 font-bold text-[var(--on-accent)] transition hover:bg-[var(--sun-dark)] hover:text-white"
            >
              Включить зону в расчёт
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
