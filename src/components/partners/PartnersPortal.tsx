"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AUCTION_REVIEW_AT,
  AVG_VISIT_HOURS,
  BASE_ANNUAL_TRAFFIC,
  FOUR_SEASONS_INFO,
  LEGAL_RULES,
  PARTNER_CLUSTERS,
  PARTNER_TIERS,
  PORTAL_SCENARIOS,
  RESERVATION_SLOTS,
  RESORT_ZONES,
  TIER_CORRIDORS,
  ZONE_PHOTOS,
  type PortalScenarioId,
} from "@/content/partners-portal";
import { resortImages } from "@/content/images";
import { PartnerRequestForm } from "@/components/sections/PartnerRequestForm";
import { fmtNum, fmtRomi, fmtUzs, portalCalc, scenarioValue } from "@/lib/partners/portal-calc";
import { imageStyle } from "@/lib/images";
import type { Locale } from "@/i18n/config";
import { PortalIcon, type PortalIconName } from "./PortalIcon";

/**
 * Партнёрский B2B-портал (/partners) — по коду владельца
 * chimgan_darbaza_b2b_partner_portal (2).tsx и скриншотам его улучшенной
 * версии. Данные — content/partners-portal.ts, формулы — lib/partners/portal-calc.ts.
 *
 * Отличия от исходника — только там, где он обещал то, чего нет:
 *   • «Подать встречную заявку», «Забронировать», «Запросить предложение» —
 *     настоящая заявка в группу партнёров (была всплывающая надпись);
 *   • «Закрыть» в окне слота закрывает окно (писало «контр-заявка зарегистрирована»);
 *   • таймер — только до настоящей даты пересмотра (считал 48 ч от открытия);
 *   • Board Memo — документ с расчётом партнёра (была пустая шапка).
 */

type Zone = (typeof RESORT_ZONES)[number];
type Tier = (typeof PARTNER_TIERS)[number];
type Slot = (typeof RESERVATION_SLOTS)[number];

const BG = "bg-[#0B0F15]";
const PANEL = "bg-[#111824] border border-slate-800";
const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

function SectionHead({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">{eyebrow}</div>
      <h2 className="mb-4 font-serif text-3xl font-bold text-white sm:text-5xl">{title}</h2>
      {lead && <p className="text-sm font-light text-slate-400 sm:text-base">{lead}</p>}
    </div>
  );
}

function Modal({ onClose, children, wide = false, id }: { onClose: () => void; children: React.ReactNode; wide?: boolean; id?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md sm:items-center sm:p-5" onClick={onClose}>
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        className={`relative my-6 w-full ${wide ? "max-w-4xl" : "max-w-3xl"} overflow-hidden rounded-3xl border border-amber-500/40 bg-[#111824] text-slate-100 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Закрыть" className="cdp-noprint absolute right-4 top-4 z-20 rounded-full border border-slate-700 bg-slate-900/80 p-2.5 text-slate-400 transition-colors hover:text-white">
          <PortalIcon name="X" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function PartnersPortal({ locale }: { locale: Locale }) {
  const [cluster, setCluster] = useState(PARTNER_CLUSTERS[0]);
  const [tier, setTier] = useState<Tier>(PARTNER_TIERS[0]);
  const [scenario, setScenario] = useState<PortalScenarioId>("median");
  const corridor = TIER_CORRIDORS[tier.id];

  // Ползунки стартуют от уровня (бюджет, доля контакта) и кластера (ER, CR, UGC,
  // LTV); сценарий Min/Median/High сдвигает их внутри коридоров. Пересчёт — в
  // обработчике выбора, а не в эффекте: так ручные сдвиги ползунков не теряются
  // при перерисовке и нет лишнего прохода рендера.
  const [vals, setVals] = useState(() => preset(PARTNER_TIERS[0], PARTNER_CLUSTERS[0], "median"));
  const { budget, contactRate, er, cr, ugc, ltv } = vals;
  const choose = (t: Tier, c: (typeof PARTNER_CLUSTERS)[number], s: PortalScenarioId) => {
    setTier(t);
    setCluster(c);
    setScenario(s);
    setVals(preset(t, c, s));
  };
  const setField = (k: keyof typeof vals) => (n: number) => setVals((v) => ({ ...v, [k]: n }));

  const calc = useMemo(
    () => portalCalc({ traffic: BASE_ANNUAL_TRAFFIC, tierPrice: tier.price, budget, contactRate, er, cr, ugc, ltv }),
    [tier.price, budget, contactRate, er, cr, ugc, ltv],
  );

  const [zone, setZone] = useState<Zone>(RESORT_ZONES[2]);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slotTab, setSlotTab] = useState<"model" | "rights">("model");
  const [request, setRequest] = useState<{ message: string; program: string } | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Таймер — только до настоящей даты пересмотра.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!AUCTION_REVIEW_AT) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = AUCTION_REVIEW_AT && now !== null ? Math.max(0, Math.floor((Date.parse(AUCTION_REVIEW_AT) - now) / 1000)) : 0;
  const timer = `${String(Math.floor(left / 3600)).padStart(2, "0")}:${String(Math.floor((left % 3600) / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  // Печать Board Memo: печатается только окно меморандума.
  useEffect(() => {
    document.body.toggleAttribute("data-cdp-print-memo", memoOpen);
    return () => document.body.removeAttribute("data-cdp-print-memo");
  }, [memoOpen]);

  const summary = () =>
    [
      `Расчёт с портала партнёров:`,
      `Отрасль: ${cluster.title}`,
      `Уровень: ${tier.title} (${tier.code}) — ${fmtUzs(tier.price)}`,
      `Бюджет BTL: ${fmtUzs(budget)} · сценарий ${PORTAL_SCENARIOS.find((s) => s.id === scenario)!.label}`,
      `Контакты: ${fmtNum(calc.offlineContacts)} · вовлечения: ${fmtNum(calc.engagements)} · действия: ${fmtNum(calc.targetActions)}`,
      `CPA: ${fmtUzs(calc.cpa)} · ROMI: ${fmtRomi(calc.romi)}`,
    ].join("\n");

  const programFor = (clusterId: string) => (clusterId === "telecom" ? "telecom" : clusterId === "fintech" ? "payments" : "zones");

  const openRequest = (headline: string) => setRequest({ message: `${headline}\n\n${summary()}`, program: programFor(cluster.id) });

  const copyAi = async () => {
    const text = `### CHIMGAN DARBAZA RESORT // B2B COMMERCIAL VALUE AUDIT
- Platform: Chimgan Darbaza Resort (1700m elevation, Bostanlyk, Uzbekistan)
- Official Domain: chimgandarbaza.uz/ru/partners
- Industry Cluster: ${cluster.title} (UGC ${cluster.ugc}x, LTV ${fmtUzs(cluster.ltv)})
- Selected Tier: ${tier.title} (${tier.code})
- Territory Rights Fee (excl. VAT): ${fmtUzs(tier.price)}
- Total Investment with BTL: ${fmtUzs(calc.investment)}
- Resort Territory Coverage: ${tier.zonesCount}
- Scenario: ${PORTAL_SCENARIOS.find((s) => s.id === scenario)!.label}
- Estimated Physical Resort Footfall: ${fmtNum(calc.offlineContacts)} visitors (${AVG_VISIT_HOURS}h average stay)
- Deep Brand Engagements: ${fmtNum(calc.engagements)} interactions
- Viral UGC Social Media Reach: ${fmtNum(calc.ugcViews)} organic views
- Total Campaign Gross Impressions: ${fmtNum(calc.grossTouchpoints)}
- Estimated Target Conversions: ${fmtNum(calc.targetActions)} leads/actions
- Campaign KPIs:
  * CPV (Cost Per Visit): ${fmtUzs(calc.cpv)}
  * Effective CPM: ${fmtUzs(calc.cpm)}
  * CPE (Cost Per Engagement): ${fmtUzs(calc.cpe)}
  * CPA (Cost Per Verified Action): ${fmtUzs(calc.cpa)}
  * Break-even Actions required: ${calc.breakEven || "-"}
  * ROMI: ${fmtRomi(calc.romi)}
- Note: model estimate on resort data (Nov 2026), not a guaranteed result.
- Strict Legal SLAs (Time Burns, 100% Prepayment, Independent Setup) active.`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Структурированные данные скопированы для анализа в ИИ!");
    } catch {
      window.prompt("Скопируйте данные", text);
    }
  };

  const zonePhoto = (z: Zone) => {
    const key = ZONE_PHOTOS[z.id];
    return key ? resortImages[key] : null;
  };

  return (
    <div className={`${BG} min-h-screen overflow-x-clip font-sans text-slate-100 antialiased selection:bg-[#E59819] selection:text-slate-950`}>
      <style>{`
        .cdp-range{-webkit-appearance:none;appearance:none;width:100%;background:transparent}
        .cdp-range::-webkit-slider-runnable-track{height:5px;border-radius:9999px;background:#1E293B}
        .cdp-range::-webkit-slider-thumb{-webkit-appearance:none;height:22px;width:22px;margin-top:-9px;border-radius:50%;background:#E59819;border:3px solid #111824;box-shadow:0 0 15px rgba(229,152,25,.7);cursor:pointer}
        .cdp-range::-moz-range-track{height:5px;border-radius:9999px;background:#1E293B}
        .cdp-range::-moz-range-thumb{height:16px;width:16px;border-radius:50%;background:#E59819;border:3px solid #111824;cursor:pointer}
        @media print{
          body[data-cdp-print-memo] *{visibility:hidden}
          body[data-cdp-print-memo] #cdp-memo, body[data-cdp-print-memo] #cdp-memo *{visibility:visible}
          body[data-cdp-print-memo] #cdp-memo{position:absolute;inset:0 auto auto 0;width:100%;background:#fff;color:#111;border:0}
          body[data-cdp-print-memo] #cdp-memo .cdp-noprint{display:none}
        }
      `}</style>

      {/* Всплывающее сообщение */}
      <div aria-live="polite" className={`fixed right-4 top-24 z-[70] transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-6 opacity-0"}`}>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/50 bg-[#111824] px-5 py-3.5 text-sm text-amber-300 shadow-2xl">
          <PortalIcon name="Sparkles" className="h-5 w-5 shrink-0 text-amber-400" />
          <span className="font-medium">{toast}</span>
        </div>
      </div>

      {/* ── ШАПКА ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B0F15]/95 backdrop-blur-md">
        <div className={`${wrap} flex h-20 items-center justify-between gap-3`}>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="group flex min-w-0 items-center gap-3 text-left">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-slate-900">
              <PortalIcon name="Sparkles" className="h-6 w-6 text-amber-400" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-lg font-bold uppercase leading-none tracking-widest text-white">Chimgan Darbaza</span>
              <span className="mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.22em] text-amber-400/90">B2B Media Valuation Engine • 1700 м</span>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setMethodOpen(true)} className="hidden items-center gap-2 rounded-full border border-slate-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-amber-500/50 lg:inline-flex">
              <PortalIcon name="Info" className="h-4 w-4" /> Методология
            </button>
            <a href="#zones" className="hidden items-center gap-2 rounded-full border border-slate-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-amber-500/50 lg:inline-flex">
              <PortalIcon name="Eye" className="h-4 w-4" /> 7 зон
            </a>
            <button type="button" onClick={() => setMemoOpen(true)} className="hidden items-center gap-2 rounded-full border border-amber-500/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-amber-400 transition hover:bg-amber-500/10 sm:inline-flex">
              <PortalIcon name="FileDown" className="h-4 w-4" /> Board Memo
            </button>
            <button type="button" onClick={copyAi} className="inline-flex items-center gap-2 rounded-full bg-[#E59819] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg transition hover:bg-[#D9822B]">
              <PortalIcon name="Copy" className="h-4 w-4" /> <span className="hidden sm:inline">AI экспорт</span><span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 1. ПЕРВЫЙ ЭКРАН ── */}
      <section className="relative overflow-hidden border-b border-slate-800/80 pb-20 pt-14 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent" />
        <div className={`${wrap} relative z-10 text-center`}>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[11px] uppercase tracking-widest text-amber-400 sm:text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Новая точка притяжения Чимгана • высота 1700 м
          </div>
          <h1 className="mx-auto mb-8 max-w-5xl font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Станьте первым в самом трендовом пространстве Чимгана:{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">интеграция в главный растущий поток</span>
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-base font-light leading-relaxed text-slate-300 sm:text-xl">
            Новейшая рекреационная локация, объединяющая активный отдых, гастрономию и круглогодичный семейный трафик Ташкента.{" "}
            <strong className="font-medium text-white">Важно занять ключевую высоту первыми</strong> — именно здесь формируется основной медийный и потребительский поток на годы вперёд.
          </p>
          <div className="mx-auto mb-12 grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {[
              ["Годовой поток", `${fmtNum(BASE_ANNUAL_TRAFFIC)}+`, "Платёжеспособные гости"],
              ["Время визита", `${String(AVG_VISIT_HOURS).replace(".", ",")} часа`, "Средний контакт одной семьи"],
              ["Виральность", "100% UGC", "Органический шлейф в соцсетях"],
              ["Первенство", "Быть первым", "Новый флагман Чимгана на годы вперёд"],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-3xl border border-amber-500/20 bg-[#111824]/90 p-4 backdrop-blur-md sm:p-5">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-amber-400/80 sm:text-xs">{k}</div>
                <div className="font-serif text-2xl font-bold text-white sm:text-4xl">{v}</div>
                <div className="mt-1 text-[11px] text-slate-400 sm:text-xs">{s}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#calculator" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E59819] px-8 py-4 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-xl transition hover:bg-[#D9822B] sm:w-auto">
              Рассчитать охват для бренда <PortalIcon name="ArrowRight" className="h-4 w-4" />
            </a>
            <a href="#auction" className="w-full rounded-full border border-slate-700 bg-slate-900 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-slate-200 transition hover:border-amber-500/50 sm:w-auto">
              Смотреть слоты
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. 7 ЗОН ── */}
      <section id="zones" className="scroll-mt-20 border-b border-slate-800/80 bg-[#0E141D] py-20 sm:py-24">
        <div className={wrap}>
          <SectionHead eyebrow="Сквозной путь гостя" title="7 ключевых зон физического присутствия" lead="Гость не просто видит логотип мельком — бренд сопровождает его на каждом этапе дня." />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {RESORT_ZONES.map((z) => (
              <button
                type="button"
                key={z.id}
                onClick={() => {
                  setZone(z);
                  setZoneOpen(true);
                }}
                className={`${PANEL} group flex flex-col justify-between rounded-3xl p-6 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:border-amber-500/50 sm:p-7`}
              >
                <div>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      <PortalIcon name={z.icon as PortalIconName} className="h-6 w-6" />
                    </span>
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400/80">{z.time}</span>
                  </div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">{z.subtitle}</div>
                  <h3 className="mb-3 font-serif text-2xl font-bold leading-snug text-white transition-colors group-hover:text-amber-400">{z.title}</h3>
                  <p className="mb-6 text-sm font-light leading-relaxed text-slate-300">{z.desc}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
                  <span className="font-medium text-emerald-400">UGC: {z.ugc.split(" ")[0]}</span>
                  <span className="flex items-center gap-1 font-semibold transition-colors group-hover:text-amber-400">
                    Паспорт зоны <PortalIcon name="ArrowRight" className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. 365 ДНЕЙ ── */}
      <section id="infographic" className="border-b border-slate-800/80 py-20 sm:py-24">
        <div className={wrap}>
          <SectionHead eyebrow="Непрерывный годовой цикл" title="Круглогодичный трафик без пауз" lead="Chimgan Darbaza Resort работает 365 дней в году, адаптируясь под сезонные потребности Ташкента." />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FOUR_SEASONS_INFO.map((s) => (
              <div key={s.name} className={`${PANEL} flex flex-col justify-between rounded-3xl p-6`}>
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-400">{s.months}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.loadColor}`}>{s.load}</span>
                  </div>
                  <h3 className="mb-2 font-serif text-2xl font-bold text-white">{s.name}</h3>
                  <div className="mb-4 text-sm font-semibold text-amber-400">{s.trafficDay}</div>
                  <p className="mb-4 text-xs leading-relaxed text-slate-300">{s.focus}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#16202E]/60 p-3 text-[11px] leading-relaxed text-slate-400">
                  <strong className="mb-1 block text-amber-300/90">Медиа-фокус:</strong>
                  {s.mediaHighlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. КАРТА НОСИТЕЛЕЙ ── */}
      <section id="map" className="scroll-mt-20 border-b border-slate-800/80 bg-[#0E141D] py-20 sm:py-24">
        <div className={wrap}>
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">Физический ландшафт</div>
              <h2 className="font-serif text-3xl font-bold text-white sm:text-5xl">Интерактивная карта носителей</h2>
              <p className="mt-2 max-w-xl text-sm font-light text-slate-400">Нажмите на маркер, чтобы открыть коммерческий паспорт носителя и UGC-потенциал зоны. Подсвечены зоны выбранного уровня.</p>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 md:self-auto">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> {tier.title}: {tier.zonesCount}
            </span>
          </div>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className={`${PANEL} relative overflow-hidden rounded-3xl p-4 shadow-2xl sm:p-6 lg:col-span-7`}>
              <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-[#090D14] sm:h-96">
                <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" viewBox="0 0 600 400" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 400L140 160L320 310L460 110L600 400H0Z" fill="#16202E" />
                  <path d="M60 400L220 200L360 340L540 140L600 280V400H60Z" fill="#1E293B" />
                  <path d="M0 360 C 120 350, 180 320, 240 280" stroke="#E59819" strokeWidth="4" strokeDasharray="6 6" opacity="0.6" />
                  <path d="M300 160 C 290 230, 260 260, 240 370" stroke="#009FE3" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
                </svg>
                {RESORT_ZONES.map((z, idx) => {
                  const on = zone.id === z.id || tier.activeMapZones.includes(idx + 1);
                  return (
                    <button
                      type="button"
                      key={z.id}
                      aria-label={z.title}
                      onClick={() => setZone(z)}
                      style={{ top: z.coord.y, left: z.coord.x }}
                      className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    >
                      <span className="relative flex h-8 w-8 items-center justify-center">
                        {on && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />}
                        <span className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-lg transition-transform group-hover:scale-125 ${on ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300" : "border border-slate-700 bg-slate-900 text-slate-300"}`}>
                          {idx + 1}
                        </span>
                      </span>
                      <span className="absolute left-1/2 top-8 hidden -translate-x-1/2 whitespace-nowrap rounded border border-amber-500/30 bg-slate-950/90 px-2 py-0.5 text-[10px] font-medium text-amber-300 sm:block">
                        {z.title.split(". ")[1]?.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative rounded-3xl border border-amber-500/30 bg-[#111824] p-6 shadow-2xl sm:p-8 lg:col-span-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">{zone.subtitle}</span>
                <button type="button" onClick={() => setZoneOpen(true)} className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-400 underline hover:text-amber-300">
                  <PortalIcon name="Camera" className="h-3.5 w-3.5" /> Фото & паспорт
                </button>
              </div>
              <h3 className="mb-2 font-serif text-2xl font-bold text-white sm:text-3xl">{zone.title}</h3>
              <p className="mb-6 text-sm font-light leading-relaxed text-slate-300">{zone.desc}</p>
              <dl className="mb-6 space-y-3 text-xs sm:text-sm">
                {[
                  ["Формат инвентаря", zone.oohFormat.split(",")[0], "text-white"],
                  ["Охват (OTS в день)", zone.otsDaily, "text-amber-400"],
                  ["Время контакта", zone.time, "text-white"],
                  ["UGC-виральность", zone.ugc, "text-emerald-400"],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-slate-800 py-2">
                    <dt className="text-slate-400">{k}:</dt>
                    <dd className={`max-w-[60%] text-right font-semibold ${c}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" onClick={() => setZoneOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg transition hover:bg-amber-400">
                <PortalIcon name="Eye" className="h-4 w-4" /> Открыть полный коммерческий паспорт
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. КАЛЬКУЛЯТОР (улучшенная версия) ── */}
      <section id="calculator" className="scroll-mt-20 border-b border-slate-800/80 py-20 sm:py-24">
        <div className={wrap}>
          <SectionHead eyebrow="Оценка медиа-эффективности" title="Калькулятор ценности и вирального охвата" lead="Выберите отрасль и уровень прав — двигайте параметры и смотрите, как меняется экономика кампании." />

          {/* Шаг 1 — кластер */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <PortalIcon name="Briefcase" className="h-4 w-4 text-amber-400" /> Шаг 1. Выберите отраслевой кластер вашего бренда:
            </div>
            <span className="font-mono text-[11px] text-amber-400/80">Бенчмарки CAC и LTV — оценка</span>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {PARTNER_CLUSTERS.map((c) => {
              const on = c.id === cluster.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  aria-pressed={on}
                  onClick={() => choose(tier, c, scenario)}
                  className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${on ? "border-amber-500 bg-[#16202E] shadow-[0_0_25px_rgba(229,152,25,0.25)] ring-1 ring-amber-400" : "border-slate-800 bg-[#111824] hover:border-slate-700"}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 font-mono text-[9px] tracking-wider text-amber-400">{c.code}</span>
                    {on && <PortalIcon name="CheckCircle2" className="h-4 w-4 text-amber-400" />}
                  </div>
                  <div className="mb-3 font-serif text-base font-bold leading-tight text-white">{c.title}</div>
                  <div className="border-t border-slate-800 pt-2 font-mono text-[11px] text-slate-400">
                    UGC: <span className="text-emerald-400">{c.ugc}x</span> | LTV: {fmtNum(c.ltv / 1000)}k
                  </div>
                </button>
              );
            })}
          </div>
          <div className={`${PANEL} mb-12 rounded-2xl p-5`}>
            <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <p className="flex items-start gap-3 text-sm text-slate-300">
                <PortalIcon name="Info" className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <span>
                  <strong className="text-white">Контекстный сценарий:</strong> {cluster.scenario}
                </span>
              </p>
              <p className="shrink-0 text-sm text-slate-400">
                Якорные бренды: <span className="font-semibold text-amber-400">{cluster.anchors}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-[#0B0F15] p-4 text-sm">
                <div className="mb-1 text-[11px] uppercase text-slate-500">ЛПР в компании:</div>
                <div className="font-semibold text-amber-400">{cluster.decisionMaker}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#0B0F15] p-4 text-sm">
                <div className="mb-1 text-[11px] uppercase text-slate-500">Боль в Ташкенте:</div>
                <div className="text-slate-200">{cluster.pain}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-[#0B0F15] p-4 text-sm">
                <div className="mb-1 text-[11px] uppercase text-slate-500">Аргумент для правления:</div>
                <div className="text-emerald-400">{cluster.argument}</div>
              </div>
            </div>
          </div>

          {/* Шаг 2 — уровень */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <PortalIcon name="Layers" className="h-4 w-4 text-amber-400" /> Шаг 2. Выберите уровень спонсорских прав:
            </div>
            <span className="font-mono text-[11px] text-slate-400">Цены — без НДС</span>
          </div>
          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PARTNER_TIERS.map((t) => {
              const on = t.id === tier.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  aria-pressed={on}
                  onClick={() => choose(t, cluster, scenario)}
                  className={`flex flex-col rounded-2xl border p-5 text-left transition ${on ? "border-amber-500 bg-[#16202E] shadow-[0_0_25px_rgba(229,152,25,0.25)] ring-1 ring-amber-400" : "border-slate-800 bg-[#111824] hover:border-slate-700"}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 font-mono text-[10px] tracking-wider text-amber-400">{t.code}</span>
                    {on && <PortalIcon name="CheckCircle2" className="h-4 w-4 text-amber-400" />}
                  </div>
                  <div className="mb-2 font-serif text-xl font-bold leading-tight text-white">{t.title}</div>
                  <div className="mb-3 font-serif text-lg font-bold text-amber-400">{t.priceLabel}</div>
                  <div className="mb-4 text-xs text-slate-400">{t.zonesCount}</div>
                  <div className="mt-auto border-t border-slate-800 pt-3">
                    <div className="text-[11px] text-slate-500">Эксклюзив:</div>
                    <div className="text-xs font-semibold text-amber-300">{t.exclusive}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Параметры и результат */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className={`${PANEL} space-y-8 rounded-3xl p-6 shadow-2xl sm:p-8 lg:col-span-6`}>
              <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-400">
                    <PortalIcon name="SlidersHorizontal" className="h-4 w-4" /> Параметры рекламной кампании
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Отраслевые коридоры воронки Chimgan Darbaza</div>
                </div>
                <div className="flex rounded-2xl border border-slate-800 bg-[#0B0F15] p-1" role="radiogroup" aria-label="Сценарий">
                  {PORTAL_SCENARIOS.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      role="radio"
                      aria-checked={scenario === s.id}
                      onClick={() => choose(tier, cluster, s.id)}
                      className={`rounded-xl px-3 py-2 text-xs leading-tight transition ${scenario === s.id ? "bg-[#E59819] font-bold text-slate-950" : "text-slate-400 hover:text-white"}`}
                    >
                      {s.label}
                      <span className="block text-[10px] opacity-80">({s.hint})</span>
                    </button>
                  ))}
                </div>
              </div>

              <Slider label="Бюджет на BTL, застройку и промо-фонд" value={fmtUzs(budget)} min={corridor.budget[0]} max={corridor.budget[2]} step={10_000_000} v={budget} set={setField("budget")}
                foot={[`Мин: ${fmtNum(corridor.budget[0] / 1e6)} млн`, `Медиана: ${fmtNum(corridor.budget[1] / 1e6)} млн`, `Макс: ${fmtNum(corridor.budget[2] / 1e6)} млн`]} />
              <Slider label="Доля прямого контакта с зоной присутствия" value={`${contactRate}% (${fmtNum(calc.offlineContacts)} гостей)`} min={20} max={corridor.contactLimit} step={1} v={contactRate} set={setField("contactRate")}
                foot={[`Коридор: 20% — ${corridor.contactLimit}%`, "", `Лимит зоны пакета: ${corridor.contactLimit}%`]} />
              <Slider label="Конверсия вовлечения в контакт (ER)" value={`${er}% (${fmtNum(calc.engagements)} чел.)`} tone="text-sky-400" min={1} max={50} step={1} v={er} set={setField("er")}
                note={`*Активный отклик гостей при среднем времени отдыха на курорте ${String(AVG_VISIT_HOURS).replace(".", ",")} часа.`} />
              <div>
                <Slider label="Конверсия из вовлечения в целевое действие" value={`${cr}% (${fmtNum(calc.targetActions)} активаций)`} min={1} max={60} step={1} v={cr} set={setField("cr")} />
                <div className="mt-3 rounded-xl border border-slate-800 bg-[#0B0F15] px-4 py-3 text-xs text-slate-300">
                  <span className="font-semibold text-amber-400">Целевой отраслевой KPI:</span> {cluster.kpi}
                </div>
              </div>
              <Slider label="Виральный мультипликатор UGC (соцсети)" value={`${ugc}x просмотров на вовлечение`} tone="text-emerald-400" min={4} max={120} step={1} v={ugc} set={setField("ugc")}
                note={`*Органический шлейф без гонораров блогерам за счёт эстетики горной локации на высоте 1700 м.`} />
              <div className="border-t border-slate-800 pt-6">
                <Slider label="Ценность одного целевого действия (LTV)" value={fmtUzs(ltv)} tone="text-slate-300" min={10_000} max={25_000_000} step={10_000} v={ltv} set={setField("ltv")}
                  note="Задайте свою ценность клиента — калькулятор покажет точку безубыточности и ROMI." />
              </div>
            </div>

            <div className="relative space-y-6 rounded-3xl border-2 border-amber-500/30 bg-[#111824] p-6 shadow-2xl sm:p-8 lg:col-span-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-sm font-bold uppercase tracking-widest text-amber-400">Медиа-ценность и экономическая отдача</div>
                  <div className="mt-1 text-xs text-slate-400">Chimgan Darbaza • модельная оценка на данных курорта</div>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-bold ${calc.romi !== null && calc.romi >= 0 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-rose-500/40 bg-rose-500/10 text-rose-300"}`}>
                  ROMI {fmtRomi(calc.romi)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Kpi icon="Users" label="Офлайн-контакт" value={fmtNum(calc.offlineContacts)} sub={`Гостей в зоне (${String(AVG_VISIT_HOURS).replace(".", ",")} ч контакт)`} />
                <Kpi icon="Share2" label="Виральный UGC" value={fmtNum(calc.ugcViews)} sub="Органических показов в соцсетях" tone="text-emerald-400" />
                <Kpi icon="Activity" label="Глубокие вовлечения" value={fmtNum(calc.engagements)} sub="Интерактивы, сканы и шатры" />
                <Kpi icon="Target" label="Целевые действия" value={fmtNum(calc.targetActions)} sub="Лиды, чеки, активации" tone="text-amber-400" />
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-[#0B0F15] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-white">{cluster.digitalCac ? "Юнит-экономика: курорт vs digital Ташкента" : "Юнит-экономика"}</div>
                  <span className="font-mono text-[11px] text-amber-400">{cluster.code}</span>
                </div>
                <div className={`grid gap-3 ${cluster.digitalCac ? "sm:grid-cols-2" : ""}`}>
                  <div className="rounded-xl border border-slate-800 bg-[#111824] p-4">
                    <div className="text-[11px] uppercase text-slate-500">All-in CPA на курорте (с BTL):</div>
                    <div className="mt-1 font-mono text-xl font-bold text-amber-400">{calc.cpa ? fmtUzs(calc.cpa) : "—"}</div>
                    <div className="mt-1 text-xs text-slate-400">Только права: <b className="text-white">{calc.cpaRightsOnly ? fmtUzs(calc.cpaRightsOnly) : "—"}</b></div>
                  </div>
                  {cluster.digitalCac && (
                    <div className="rounded-xl border border-slate-800 bg-[#111824] p-4">
                      <div className="text-[11px] uppercase text-slate-500">Digital CAC в Ташкенте:</div>
                      <div className="mt-1 font-mono text-xl font-bold text-white">{fmtUzs(cluster.digitalCac)}</div>
                      <div className="mt-1 text-xs text-slate-400">2-летний LTV: <b className="text-emerald-400">{fmtUzs(cluster.ltv)}</b></div>
                    </div>
                  )}
                </div>
                <p className="mt-4 rounded-xl border border-slate-800 bg-[#111824] p-4 text-xs leading-relaxed text-slate-300">
                  <strong className="text-amber-400">Качественное превосходство:</strong> в отличие от обезличенного городского контекста, конверсия на высоте 1700 м происходит при {String(AVG_VISIT_HOURS).replace(".", ",")} часах эмоционального семейного отдыха, формируя лояльность и нулевую баннерную слепоту.
                </p>
              </div>

              <dl className="space-y-2 rounded-2xl border border-slate-800 bg-[#0B0F15] p-5 text-xs">
                {[
                  [`CPV (стоимость ${String(AVG_VISIT_HOURS).replace(".", ",")} часов контакта)`, calc.cpv, "text-amber-400"],
                  ["CPM (эффективная стоимость 1000 показов с UGC)", calc.cpm, "text-emerald-400"],
                  ["CPE (стоимость вовлечённого взаимодействия)", calc.cpe, "text-white"],
                  ["CPA (стоимость целевого действия)", calc.cpa, "text-amber-300"],
                ].map(([k, v, c]) => (
                  <div key={k as string} className="flex justify-between gap-4 border-b border-slate-800/80 py-1.5">
                    <dt className="text-slate-400">{k}:</dt>
                    <dd className={`shrink-0 font-mono font-bold ${c}`}>{(v as number) > 0 ? fmtUzs(v as number) : "—"}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 pt-2 text-sm font-bold text-white">
                  <dt>Точка безубыточности:</dt>
                  <dd className="font-serif text-lg text-amber-400">{calc.breakEven ? `${fmtNum(calc.breakEven)} действий` : "—"}</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => openRequest(`Запрос персонального предложения: ${tier.title}`)} className="flex-1 rounded-full bg-[#E59819] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-[#D9822B]">
                  Запросить предложение с этим расчётом
                </button>
                <button type="button" onClick={() => setMemoOpen(true)} className="rounded-full border border-amber-500/40 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-amber-400 transition hover:bg-amber-500/10">
                  Board Memo
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Модельная оценка по данным курорта (ноябрь 2026) и отраслевым допущениям — не гарантия результата. Гарантируются согласованные зоны, сроки и объём прав.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. СЛОТЫ ── */}
      <section id="auction" className="scroll-mt-20 border-b border-slate-800/80 bg-[#0E141D] py-20 sm:py-24">
        <div className={wrap}>
          <div className="relative mb-14 overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-[#16202E] to-amber-500/10 p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
                  <PortalIcon name="Sparkles" className="h-8 w-8" />
                </span>
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">Специальное условие для первых партнёров</div>
                  <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">Бонус: зима 2027–2028 включена бесплатно</h3>
                  <p className="mt-1 max-w-2xl text-xs font-light text-slate-300 sm:text-sm">
                    При подтверждении годового контракта в текущем пуле вы фиксируете за собой следующий зимний сезон 2027–2028 в подарок — непрерывное присутствие без дополнительных затрат.
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950">Закрепляется в договоре</span>
            </div>
          </div>

          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">Открытый пул & конкурентный аукцион</div>
              <h2 className="mb-3 font-serif text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">Календарь бронирования слотов</h2>
              <p className="max-w-xl text-sm font-light leading-relaxed text-slate-400">
                Прозрачный аукционный лист: бронь Soft Hold действует 72 часа. При появлении контр-заявки приоритет отдаётся партнёру, подтверждающему 100% оплату периода.
              </p>
            </div>
            {AUCTION_REVIEW_AT && left > 0 && (
              <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-amber-500/30 bg-[#111824] p-4 shadow-xl">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Soft Hold: конкурсная заявка</div>
                  <div className="text-xs text-slate-400">До пересмотра приоритета:</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0B0F15] px-3.5 py-1.5 font-mono text-xl font-bold text-amber-400 sm:text-2xl">{timer}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {RESERVATION_SLOTS.map((s) => (
              <div key={s.id} className={`${PANEL} group relative flex flex-col justify-between rounded-3xl p-6 shadow-xl transition hover:border-amber-500/50`}>
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-400">{s.tier}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.badgeClass}`}>{s.status}</span>
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-bold leading-snug text-white transition-colors group-hover:text-amber-400">{s.zone}</h3>
                  <div className="mb-3 text-xs font-semibold text-amber-400">{s.priceLabel}</div>
                  <div className="mb-4 rounded-2xl border border-slate-800/80 bg-[#0B0F15] p-3.5 text-xs">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">{s.available ? "Статус" : "Текущий пул"}</div>
                    <span className="block font-medium leading-relaxed text-slate-200">{s.applicant}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSlot(s);
                      setSlotTab("model");
                    }}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-[#16202E] py-2.5 text-xs font-semibold tracking-wider text-amber-300 transition hover:border-amber-400 hover:bg-slate-800"
                  >
                    <PortalIcon name="Box" className="h-4 w-4 text-amber-400" /> Состав пакета & моделирование
                  </button>
                </div>
                {s.available ? (
                  <button type="button" onClick={() => openRequest(`Бронь слота: ${s.tier} — ${s.zone} (${s.priceLabel})`)} className="w-full rounded-full bg-emerald-500 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg transition hover:bg-emerald-400">
                    Забронировать слот
                  </button>
                ) : s.status === "Soft Hold" ? (
                  <button type="button" onClick={() => openRequest(`Встречная заявка на слот: ${s.tier} — ${s.zone} (${s.priceLabel})`)} className="w-full rounded-full border-2 border-amber-500 py-3 text-xs font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-500 hover:text-slate-950">
                    Подать встречную заявку
                  </button>
                ) : (
                  <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-slate-800 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Слот заблокирован
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. ФИНАНСОВЫЙ РЕГЛАМЕНТ ── */}
      <section className="border-b border-slate-800/80 py-20 sm:py-24">
        <div className={wrap}>
          <SectionHead eyebrow="Юридическая безопасность сделки" title="Финансовый регламент" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {LEGAL_RULES.map((r) => (
              <div key={r.id} className={`${PANEL} rounded-3xl p-6`}>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <PortalIcon name={r.icon as PortalIconName} className="h-6 w-6" />
                </span>
                <h3 className="mb-2 font-serif text-xl font-bold text-white">{r.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. ЗАЯВКА ── */}
      <section id="request" className="scroll-mt-20 bg-[#0E141D] py-20 sm:py-24">
        <div className={`${wrap} grid grid-cols-1 items-start gap-10 lg:grid-cols-2`}>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">Следующий шаг</div>
            <h2 className="mb-4 font-serif text-3xl font-bold text-white sm:text-5xl">Обсудить партнёрство</h2>
            <p className="mb-6 text-sm font-light leading-relaxed text-slate-400">
              Оставьте контакты — пришлём персональное предложение с условиями, ценой и закрытой ссылкой на калькулятор под ваш бренд. Chimgan Darbaza Resort предоставляет площадку и согласованные права; производство, монтаж и обслуживание партнёр организует сам.
            </p>
            <button type="button" onClick={() => openRequest(`Запрос персонального предложения: ${tier.title}`)} className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-amber-400 transition hover:bg-amber-500/10">
              <PortalIcon name="Target" className="h-4 w-4" /> Приложить мой расчёт из калькулятора
            </button>
          </div>
          <div className="rounded-3xl bg-white p-6 text-[var(--ink)] shadow-2xl sm:p-8">
            <PartnerRequestForm locale={locale} />
          </div>
        </div>
      </section>

      {/* ── ОКНА ── */}
      {zoneOpen && (
        <Modal onClose={() => setZoneOpen(false)}>
          {(() => {
            const photo = zonePhoto(zone);
            return photo ? (
              <div className="relative h-60 bg-cover bg-center sm:h-72" style={imageStyle(photo)} role="img" aria-label={photo.alt.ru}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#111824] via-[#111824]/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">Коммерческий паспорт рекламного места (OOH / BTL)</div>
                  <h4 className="font-serif text-2xl font-bold text-white sm:text-3xl">{zone.title}</h4>
                </div>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center border-b border-slate-800 bg-gradient-to-br from-slate-900 via-[#16202E] to-slate-950 p-6 text-center">
                <PortalIcon name={zone.icon as PortalIconName} className="mb-3 h-12 w-12 text-amber-400/70" />
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">Коммерческий паспорт рекламного места (OOH / BTL)</div>
                <h4 className="font-serif text-2xl font-bold text-white sm:text-3xl">{zone.title}</h4>
              </div>
            );
          })()}
          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <h5 className="mb-2 font-serif text-xl font-bold text-white">Характеристика локации и аудиторного контакта</h5>
              <p className="text-sm font-light leading-relaxed text-slate-300">{zone.carrierDetails}</p>
            </div>
            <div className="grid grid-cols-1 gap-3.5 text-xs sm:grid-cols-2">
              {[
                ["Формат рекламного инвентаря", zone.oohFormat, "text-amber-300"],
                ["Габариты и площадь экспонирования", zone.dimensions, "text-white"],
                ["Потенциал охвата (OTS в день)", zone.otsDaily, "text-amber-400"],
                ["Средняя длительность контакта", zone.time, "text-white"],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-2xl border border-slate-800 bg-[#16202E] p-3.5">
                  <span className="mb-1 block text-slate-400">{k}:</span>
                  <strong className={`font-medium ${c}`}>{v}</strong>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0B0F15] p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
                <PortalIcon name="Share2" className="h-4 w-4" /> UGC-ценность и виральный шлейф в соцсетях
              </div>
              <p className="text-xs font-light leading-relaxed text-slate-300">{zone.ugcValue}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B0F15] p-4 text-xs">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Технические требования к материалам и ветровым нагрузкам</span>
              <p className="font-light leading-relaxed text-slate-300">{zone.techSpecs}</p>
            </div>
            <div className="flex flex-col justify-between gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center">
              <span className="text-xs text-slate-500">Производство и монтаж: силами аккредитованной бригады партнёра</span>
              <button type="button" onClick={() => setZoneOpen(false)} className="rounded-full bg-slate-800 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-slate-700">
                Закрыть паспорт
              </button>
            </div>
          </div>
        </Modal>
      )}

      {slot && (
        <Modal wide onClose={() => setSlot(null)}>
          <div className="border-b border-slate-800 bg-[#0B0F15] p-6 pr-16">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">{slot.tier}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${slot.badgeClass}`}>{slot.status}</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">{slot.zone}</h3>
            <p className="mt-2 text-sm text-slate-400">{slot.summary}</p>
          </div>
          <div className="flex gap-6 border-b border-slate-800 bg-[#16202E]/70 px-6 text-xs font-semibold uppercase tracking-wider">
            {([["model", "Box", "Параметры размещения"], ["rights", "Layers", "Права в пакете"]] as const).map(([k, icon, label]) => (
              <button type="button" key={k} onClick={() => setSlotTab(k)} className={`flex items-center gap-2 border-b-2 py-3.5 transition ${slotTab === k ? "border-amber-400 text-amber-300" : "border-transparent text-slate-400"}`}>
                <PortalIcon name={icon} className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <div className="max-h-[62vh] space-y-4 overflow-y-auto p-6 sm:p-8">
            {slotTab === "model" ? (
              <>
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#090D14] via-[#111824] to-[#16202E] p-6 text-center">
                  <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-400/80 bg-amber-500/20 text-amber-300">
                    <PortalIcon name="Box" className="h-7 w-7" />
                  </span>
                  <h4 className="font-serif text-2xl font-bold text-white">{slot.mockupSpecs.type}</h4>
                  <p className="mt-1 text-xs text-slate-400">{slot.coverage}</p>
                </div>
                <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                  {[
                    ["Ветровая нагрузка и материалы", slot.mockupSpecs.windLoad],
                    ["Экспозиция", slot.mockupSpecs.exposure],
                    ["Угол обзора", slot.mockupSpecs.viewAngle],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-slate-800 bg-[#16202E] p-3.5">
                      <dt className="mb-1 text-slate-400">{k}:</dt>
                      <dd className="font-medium text-white">{v}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <ul className="divide-y divide-slate-800">
                {slot.includedRights.map((item) => (
                  <li key={item.category + item.text} className="flex items-start gap-3.5 py-3.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <PortalIcon name="Check" className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="mb-0.5 text-xs font-bold text-white">{item.category}</div>
                      <div className="text-xs font-light leading-relaxed text-slate-300">{item.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 bg-[#0B0F15] p-6 sm:flex-row">
            <span className="font-serif text-lg font-bold text-amber-400">{slot.priceLabel}</span>
            <div className="flex w-full gap-3 sm:w-auto">
              {slot.status !== "Hard Hold" && (
                <button
                  type="button"
                  onClick={() => {
                    const s = slot;
                    setSlot(null);
                    openRequest(`${s.available ? "Бронь слота" : "Встречная заявка на слот"}: ${s.tier} — ${s.zone} (${s.priceLabel})`);
                  }}
                  className="flex-1 rounded-full bg-amber-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 sm:flex-none"
                >
                  {slot.available ? "Забронировать" : "Подать встречную заявку"}
                </button>
              )}
              <button type="button" onClick={() => setSlot(null)} className="flex-1 rounded-full bg-slate-800 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-300 sm:flex-none">
                Закрыть
              </button>
            </div>
          </div>
        </Modal>
      )}

      {memoOpen && (
        <Modal onClose={() => setMemoOpen(false)} id="cdp-memo">
          <div className="p-6 sm:p-10">
            <div className="mb-6 border-b border-amber-500/30 pb-6 pr-10">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">Board Memorandum • Конфиденциально</div>
              <h2 className="font-serif text-3xl font-bold text-white">Обоснование медиа-присутствия в Chimgan Darbaza Resort</h2>
            </div>
            <div className="space-y-5 text-sm leading-relaxed text-slate-300">
              <p>
                <b className="text-white">Предложение.</b> {tier.title} ({tier.code}) — {tier.zonesCount}. {tier.exclusive}. Права на территорию: <b className="text-white">{fmtUzs(tier.price)}</b> без НДС; бюджет BTL {fmtUzs(budget)}; всего {fmtUzs(calc.investment)}.
              </p>
              <p>
                <b className="text-white">Отрасль и сценарий.</b> {cluster.title}. {cluster.scenario} ЛПР: {cluster.decisionMaker}. Целевой KPI: {cluster.kpi}.
              </p>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-800">
                  {[
                    ["Офлайн-контакты", fmtNum(calc.offlineContacts)],
                    ["Глубокие вовлечения", fmtNum(calc.engagements)],
                    ["UGC-показы", fmtNum(calc.ugcViews)],
                    ["Целевые действия", fmtNum(calc.targetActions)],
                    ["CPV / CPM / CPE", `${fmtUzs(calc.cpv)} / ${fmtUzs(calc.cpm)} / ${fmtUzs(calc.cpe)}`],
                    ["CPA (all-in / только права)", `${fmtUzs(calc.cpa)} / ${fmtUzs(calc.cpaRightsOnly)}`],
                    ["Безубыточность", calc.breakEven ? `${fmtNum(calc.breakEven)} действий при LTV ${fmtUzs(ltv)}` : "—"],
                    ["ROMI", fmtRomi(calc.romi)],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <th className="py-2 pr-4 font-normal text-slate-400">{k}</th>
                      <td className="py-2 font-mono font-semibold text-white">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <b className="text-white">Условия.</b> {LEGAL_RULES.map((r) => r.title).join(" · ")}.
              </p>
              <p className="text-xs text-slate-500">
                Параметры: сценарий {PORTAL_SCENARIOS.find((s) => s.id === scenario)!.label}, доля контакта {contactRate}%, ER {er}%, CR {cr}%, UGC {ugc}x, годовой поток {fmtNum(BASE_ANNUAL_TRAFFIC)}. Модельная оценка, не гарантия результата.
              </p>
            </div>
            <div className="cdp-noprint mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950">
                <PortalIcon name="FileDown" className="h-4 w-4" /> Сохранить в PDF
              </button>
              <button type="button" onClick={() => setMemoOpen(false)} className="rounded-full bg-slate-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                Закрыть
              </button>
            </div>
          </div>
        </Modal>
      )}

      {methodOpen && (
        <Modal onClose={() => setMethodOpen(false)}>
          <div className="space-y-4 p-6 text-sm leading-relaxed text-slate-300 sm:p-10">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400">Методология</div>
            <h2 className="pr-10 font-serif text-3xl font-bold text-white">Как считается медиа-ценность</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Офлайн-контакты = годовой поток гостей ({fmtNum(BASE_ANNUAL_TRAFFIC)}) × доля гостей в зоне пакета (не выше лимита уровня).</li>
              <li>Вовлечения = контакты × ER; целевые действия = вовлечения × CR.</li>
              <li>UGC-показы = вовлечения × виральный мультипликатор отрасли.</li>
              <li>Вложения = права на территорию (без НДС) + ваш бюджет BTL.</li>
              <li>CPV, CPM, CPE, CPA — вложения на контакт, тысячу касаний, вовлечение и действие.</li>
              <li>Безубыточность = вложения ÷ ценность действия (LTV); ROMI = (действия × LTV − вложения) ÷ вложения.</li>
            </ol>
            <p>Сценарии Min / Median / High сдвигают конверсии и охват на −25% / 0 / +20% внутри коридоров. Отраслевые бенчмарки — оценка; замените их своими данными, двигая ползунки.</p>
            <p className="text-xs text-slate-500">Гарантируются согласованные зоны, сроки и объём прав при выполнении условий монтажа и запуска. Фактический результат кампании зависит от партнёра.</p>
          </div>
        </Modal>
      )}

      {request && (
        <Modal onClose={() => setRequest(null)}>
          <div className="p-6 sm:p-8">
            <div className="mb-1 pr-10 text-xs font-bold uppercase tracking-widest text-amber-400">Заявка партнёра</div>
            <h2 className="mb-5 pr-10 font-serif text-2xl font-bold text-white">Отправьте — ответим персональным предложением</h2>
            <div className="rounded-2xl bg-white p-5 text-[var(--ink)] sm:p-6">
              <PartnerRequestForm locale={locale} defaultMessage={request.message} defaultProgram={request.program} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Значения ползунков для уровня, отрасли и сценария. */
function preset(t: Tier, c: (typeof PARTNER_CLUSTERS)[number], s: PortalScenarioId) {
  const f = PORTAL_SCENARIOS.find((x) => x.id === s)!.factor;
  const k = TIER_CORRIDORS[t.id];
  return {
    budget: k.budget[s === "min" ? 0 : s === "high" ? 2 : 1],
    contactRate: scenarioValue(t.defaults.contactRate, f, 20, k.contactLimit),
    er: scenarioValue(c.er, f, 1, 50),
    cr: scenarioValue(c.cr, f, 1, 60),
    ugc: scenarioValue(c.ugc, f, 4, 120),
    ltv: c.ltv,
  };
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  v,
  set,
  tone = "text-amber-400",
  foot,
  note,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  set: (n: number) => void;
  tone?: string;
  foot?: [string, string, string];
  note?: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{label}:</span>
        <span className={`shrink-0 text-right font-mono text-sm font-bold ${tone}`}>{value}</span>
      </div>
      <input type="range" className="cdp-range" aria-label={label} min={min} max={max} step={step} value={Math.min(max, Math.max(min, v))} onChange={(e) => set(Number(e.target.value))} />
      {foot && (
        <div className="mt-2 flex justify-between gap-2 text-[10px] text-slate-500">
          <span>{foot[0]}</span>
          <span>{foot[1]}</span>
          <span className="text-amber-400/80">{foot[2]}</span>
        </div>
      )}
      {note && <p className="mt-2 text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone = "text-white" }: { icon: PortalIconName; label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#16202E] p-4">
      <div className="mb-1 flex items-center gap-2 text-[11px] uppercase text-slate-400">
        <PortalIcon name={icon} className="h-3.5 w-3.5 text-amber-400" /> {label}
      </div>
      <div className={`font-serif text-2xl font-bold sm:text-3xl ${tone}`}>{value}</div>
      <div className="mt-1 text-[10px] text-slate-400">{sub}</div>
    </div>
  );
}
