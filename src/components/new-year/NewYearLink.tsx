// Без "use client": кнопку вставляет только клиентская шапка (Header.tsx), а
// у точки входа клиента пропсы-функции (onNavigate) были бы запрещены.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { NEW_YEAR_PATH, NEW_YEAR_READY_EVENT, newYearCopy } from "@/content/new-year";
import { text } from "@/lib/localize";
import { Snowflake } from "./Snowflake";

/** Сколько ждать экран, прежде чем поднять занавес всё равно. */
const FAILSAFE_MS = 4500;

/** Откуда гость ушёл на праздник — путь без языка, чтобы пережить смену языка. */
const FROM_KEY = "ny-from";

type Variant = "pill" | "icon" | "drawer";

type Phase = "idle" | "cover" | "reveal";

/** "in" — на праздник (ночь), "out" — обратно на обычный сайт (день). */
type Direction = "in" | "out";

type Burst = {
  dir: Direction;
  x: number;
  y: number;
  r: number;
  flakes: { dx: number; dy: number; s: number; d: number }[];
};

const NIGHT = "linear-gradient(180deg, #08111f 0%, #0c1626 45%, #13233b 100%)";
const DAY = "radial-gradient(60rem 32rem at 50% 0%, #fff4dc 0%, rgba(255,244,220,0) 70%), #faf7f1";

function Sun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </svg>
  );
}

function stripLocale(path: string) {
  return path.replace(/^\/(ru|uz|en)(?=\/|$)/, "") || "/";
}

function readFrom(): string | null {
  try {
    const v = sessionStorage.getItem(FROM_KEY);
    return v && v.startsWith("/") && !v.startsWith("//") && v !== NEW_YEAR_PATH ? v : null;
  } catch {
    return null;
  }
}

/**
 * Кнопка «Новый год» в шапке и в мобильном меню.
 *
 * Обычный клик — не простой переход: из кнопки вырастает круг ночного неба и
 * разлетаются снежинки, экран заливает темнотой, и уже под ней открывается
 * /novyi-god. Клик с Ctrl/Cmd/Shift, средняя кнопка и «уменьшить движение» —
 * без занавеса.
 *
 * На самом новогоднем экране та же кнопка — «Обычный сайт» (27.11.2026:
 * владелец не нашёл, как вернуться). Ведёт туда, откуда пришли на праздник,
 * а если пришли по прямой ссылке — на главную; занавес — круг дневного света.
 */
export function NewYearLink({
  locale,
  variant,
  className = "",
  onNavigate,
}: {
  locale: Locale;
  variant: Variant;
  className?: string;
  /** Например, закрыть мобильное меню. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const nyHref = localizePath(locale, NEW_YEAR_PATH);
  const homeHref = localizePath(locale);
  const here = pathname === nyHref;
  const href = here ? homeHref : nyHref;
  const [phase, setPhase] = useState<Phase>("idle");
  const [burst, setBurst] = useState<Burst | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [pushed, setPushed] = useState(false);

  // Туда: занавес поднимает сам экран праздника (или страховка).
  // Обратно: страница меняется — значит, новая уже под занавесом.
  useEffect(() => {
    if (phase !== "cover") return;
    const lift = () => setPhase("reveal");
    if (burst?.dir === "in") window.addEventListener(NEW_YEAR_READY_EVENT, lift);
    const failsafe = window.setTimeout(lift, FAILSAFE_MS);
    return () => {
      window.removeEventListener(NEW_YEAR_READY_EVENT, lift);
      window.clearTimeout(failsafe);
    };
  }, [phase, burst?.dir]);

  const leftHoliday = burst?.dir === "out" && pushed && pathname !== nyHref;
  const shownPhase: Phase = phase === "cover" && leftHoliday ? "reveal" : phase;

  const backTarget = () => {
    const from = readFrom();
    return from ? localizePath(locale, from) : homeHref;
  };

  const warm = () => {
    router.prefetch(here ? backTarget() : nyHref);
  };

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (phase !== "idle") return;

    const dir: Direction = here ? "out" : "in";
    const to = dir === "out" ? backTarget() : nyHref;
    if (dir === "in") {
      try {
        sessionStorage.setItem(FROM_KEY, stripLocale(pathname));
      } catch {
        // Без хранилища «обратно» просто поведёт на главную.
      }
    }
    if (reduced) {
      router.push(to);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;
    const flakes = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 260;
      return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, s: 3 + Math.random() * 6, d: Math.random() * 0.12 };
    });
    setPushed(false);
    setTarget(to);
    setBurst({ dir, x, y, r, flakes });
    router.prefetch(to);
    setPhase("cover");
  };

  const onCovered = () => {
    if (phase !== "cover" || pushed || !target) return;
    setPushed(true);
    router.push(target);
  };

  const label = text(here ? newYearCopy.back : newYearCopy.button, locale);
  const aria = text(here ? newYearCopy.backAria : newYearCopy.buttonAria, locale);

  const common = {
    href,
    prefetch: false,
    onClick,
    onPointerEnter: warm,
    onFocus: warm,
    onTouchStart: warm,
    "data-new-year-link": variant,
    "data-new-year-back": here ? "" : undefined,
  };

  const day = burst?.dir === "out";
  const overlay =
    phase !== "idle" && burst
      ? createPortal(
          <motion.div
            aria-hidden="true"
            className="pointer-events-auto fixed inset-0 z-[200]"
            initial={{ opacity: 1 }}
            animate={{ opacity: shownPhase === "reveal" ? 0 : 1 }}
            transition={{ duration: shownPhase === "reveal" ? 0.75 : 0, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => {
              if (shownPhase === "reveal") {
                setPhase("idle");
                setBurst(null);
                setTarget(null);
                setPushed(false);
              }
            }}
          >
            {/* Туда — ночное небо, обратно — дневной свет; круг растёт из кнопки. */}
            <motion.div
              className="absolute inset-0"
              style={{ background: day ? DAY : NIGHT }}
              initial={{ clipPath: `circle(0px at ${burst.x}px ${burst.y}px)` }}
              animate={{ clipPath: `circle(${burst.r}px at ${burst.x}px ${burst.y}px)` }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
              onAnimationComplete={onCovered}
            />
            {burst.flakes.map((f, i) => (
              <motion.span
                key={i}
                className={`absolute rounded-full ${day ? "bg-[#f2a65a]" : "bg-white"}`}
                style={{
                  left: burst.x - f.s / 2,
                  top: burst.y - f.s / 2,
                  width: f.s,
                  height: f.s,
                  boxShadow: day ? "0 0 10px rgba(242,166,90,0.7)" : "0 0 10px rgba(255,255,255,0.8)",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: f.dx, y: f.dy, opacity: 0, scale: 1 }}
                transition={{ duration: 1, delay: f.d, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
            <motion.span
              className={`absolute ${day ? "text-[#f2a65a]" : "text-[#ffd27a]"}`}
              style={{ left: burst.x - 14, top: burst.y - 14, width: 28, height: 28 }}
              initial={{ scale: 0.4, opacity: 1, rotate: 0 }}
              animate={{ scale: 2.6, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {day ? <Sun className="h-full w-full" /> : <Snowflake className="h-full w-full" />}
            </motion.span>
          </motion.div>,
          document.body,
        )
      : null;

  if (variant === "drawer") {
    return (
      <>
        <Link
          {...common}
          className={`btn-press group relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 ${
            here ? "bg-[#fff4dc] text-[#2a1a05] ring-1 ring-[#f2a65a]/45" : "bg-[#0c1626] text-[#eef3fa] ring-1 ring-[#ffd27a]/35"
          } ${className}`}
        >
          {!here && (
            <span aria-hidden className="ny-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          )}
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              here ? "bg-[#f2a65a]/15 text-[#e08a2e]" : "bg-[#ffd27a]/12 text-[#ffd27a]"
            }`}
          >
            {here ? <Sun className="h-6 w-6" /> : <Snowflake className="ny-spin h-6 w-6" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold leading-tight">
              {text(here ? newYearCopy.backDrawer : newYearCopy.drawer, locale)}
            </span>
            <span className={`mt-0.5 block text-[0.8rem] font-semibold ${here ? "text-[#7a5a32]" : "text-[#a6b6cb]"}`}>
              {text(here ? newYearCopy.backDrawerHint : newYearCopy.drawerHint, locale)}
            </span>
          </span>
          <span
            aria-hidden
            className={`shrink-0 text-xl font-bold transition-transform duration-300 ${
              here ? "text-[#e08a2e] group-hover:-translate-x-1" : "text-[#ffd27a] group-hover:translate-x-1"
            }`}
          >
            {here ? "←" : "→"}
          </span>
        </Link>
        {overlay}
      </>
    );
  }

  if (variant === "icon") {
    return (
      <>
        <Link
          {...common}
          aria-label={aria}
          title={label}
          className={`btn-press relative h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${
            here
              ? "bg-[#fff4dc] text-[#e08a2e] shadow-[0_6px_20px_-8px_rgba(242,166,90,0.9)] ring-[#f2a65a]/60"
              : "bg-[#0c1626] text-[#ffd27a] shadow-[0_6px_20px_-8px_rgba(255,210,122,0.85)] ring-[#ffd27a]/50"
          } ${className}`}
        >
          {here ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <>
              <Snowflake className="ny-spin h-[1.15rem] w-[1.15rem]" />
              <span aria-hidden className="ny-twinkle absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#ff8fa3]" />
            </>
          )}
        </Link>
        {overlay}
      </>
    );
  }

  return (
    <>
      <Link
        {...common}
        aria-label={aria}
        className={`btn-press group relative h-10 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full pl-3 pr-3.5 text-[13px] font-bold ring-1 transition-shadow duration-300 ${
          here
            ? "bg-[#fff4dc] text-[#2a1a05] shadow-[0_8px_24px_-10px_rgba(242,166,90,0.9)] ring-[#f2a65a]/60 hover:shadow-[0_10px_30px_-8px_rgba(242,166,90,1)]"
            : "bg-[#0c1626] text-[#ffe3b0] shadow-[0_8px_24px_-10px_rgba(255,210,122,0.9)] ring-[#ffd27a]/50 hover:shadow-[0_10px_30px_-8px_rgba(255,210,122,1)]"
        } ${className}`}
      >
        {here ? (
          <Sun className="h-4 w-4 text-[#e08a2e]" />
        ) : (
          <>
            <span aria-hidden className="ny-sheen pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <Snowflake className="ny-spin h-4 w-4 text-[#ffd27a]" />
          </>
        )}
        <span className="relative">{label}</span>
      </Link>
      {overlay}
    </>
  );
}
