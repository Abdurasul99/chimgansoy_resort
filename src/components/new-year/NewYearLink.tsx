// Без "use client": кнопку вставляет только клиентская шапка (Header.tsx), а
// у точки входа клиента пропсы-функции (onNavigate) были бы запрещены.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { NEW_YEAR_PATH, NEW_YEAR_READY_EVENT, newYearCopy } from "@/content/new-year";
import { text } from "@/lib/localize";
import { Snowflake } from "./Snowflake";

/** Сколько ждать экран, прежде чем поднять занавес всё равно. */
const FAILSAFE_MS = 4500;

type Variant = "pill" | "icon" | "drawer";

type Phase = "idle" | "cover" | "reveal";

type Burst = { x: number; y: number; r: number; flakes: { dx: number; dy: number; s: number; d: number }[] };

const NIGHT = "linear-gradient(180deg, #08111f 0%, #0c1626 45%, #13233b 100%)";

/**
 * Кнопка «Новый год» в шапке и в мобильном меню.
 *
 * Обычный клик — не простой переход: из кнопки вырастает круг ночного неба и
 * разлетаются снежинки, экран заливает темнотой, и уже под ней открывается
 * /novyi-god. Клик с Ctrl/Cmd/Shift, средняя кнопка и «уменьшить движение» —
 * обычная ссылка без занавеса. Со страницы праздника кнопка никуда не ведёт.
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
  const href = localizePath(locale, NEW_YEAR_PATH);
  const here = pathname === href;
  const [phase, setPhase] = useState<Phase>("idle");
  const [burst, setBurst] = useState<Burst | null>(null);
  const pushed = useRef(false);

  // Занавес опущен и переход отправлен: ждём сигнала от экрана (или страховки).
  useEffect(() => {
    if (phase !== "cover") return;
    const lift = () => setPhase("reveal");
    window.addEventListener(NEW_YEAR_READY_EVENT, lift);
    const failsafe = window.setTimeout(lift, FAILSAFE_MS);
    return () => {
      window.removeEventListener(NEW_YEAR_READY_EVENT, lift);
      window.clearTimeout(failsafe);
    };
  }, [phase]);

  const warm = () => {
    if (!here) router.prefetch(href);
  };

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    if (here) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reduced) return;
    e.preventDefault();
    if (phase !== "idle") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;
    const flakes = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 260;
      return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, s: 3 + Math.random() * 6, d: Math.random() * 0.12 };
    });
    pushed.current = false;
    setBurst({ x, y, r, flakes });
    router.prefetch(href);
    setPhase("cover");
  };

  const onCovered = () => {
    if (phase !== "cover" || pushed.current) return;
    pushed.current = true;
    router.push(href);
  };

  const label = text(newYearCopy.button, locale);
  const aria = text(newYearCopy.buttonAria, locale);

  const common = {
    href,
    prefetch: false,
    onClick,
    onPointerEnter: warm,
    onFocus: warm,
    onTouchStart: warm,
    "aria-current": here ? ("page" as const) : undefined,
    "data-new-year-link": variant,
  };

  const overlay =
    phase !== "idle" && burst
      ? createPortal(
          <motion.div
            aria-hidden="true"
            className="pointer-events-auto fixed inset-0 z-[200]"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "reveal" ? 0 : 1 }}
            transition={{ duration: phase === "reveal" ? 0.75 : 0, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => {
              if (phase === "reveal") {
                setPhase("idle");
                setBurst(null);
              }
            }}
          >
            {/* Ночное небо растёт кругом из самой кнопки. */}
            <motion.div
              className="absolute inset-0"
              style={{ background: NIGHT }}
              initial={{ clipPath: `circle(0px at ${burst.x}px ${burst.y}px)` }}
              animate={{ clipPath: `circle(${burst.r}px at ${burst.x}px ${burst.y}px)` }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
              onAnimationComplete={onCovered}
            />
            {burst.flakes.map((f, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: burst.x - f.s / 2,
                  top: burst.y - f.s / 2,
                  width: f.s,
                  height: f.s,
                  boxShadow: "0 0 10px rgba(255,255,255,0.8)",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: f.dx, y: f.dy, opacity: 0, scale: 1 }}
                transition={{ duration: 1, delay: f.d, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
            <motion.span
              className="absolute text-[#ffd27a]"
              style={{ left: burst.x - 14, top: burst.y - 14, width: 28, height: 28 }}
              initial={{ scale: 0.4, opacity: 1, rotate: 0 }}
              animate={{ scale: 2.6, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <Snowflake className="h-full w-full" />
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
          className={`btn-press group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-[#0c1626] px-5 py-4 text-[#eef3fa] ring-1 ring-[#ffd27a]/35 ${className}`}
        >
          <span aria-hidden className="ny-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffd27a]/12 text-[#ffd27a]">
            <Snowflake className="ny-spin h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold leading-tight">{text(newYearCopy.drawer, locale)}</span>
            <span className="mt-0.5 block text-[0.8rem] font-semibold text-[#a6b6cb]">{text(newYearCopy.drawerHint, locale)}</span>
          </span>
          <span aria-hidden className="shrink-0 text-xl font-bold text-[#ffd27a] transition-transform duration-300 group-hover:translate-x-1">
            →
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
          className={`btn-press relative h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c1626] text-[#ffd27a] shadow-[0_6px_20px_-8px_rgba(255,210,122,0.85)] ring-1 ring-[#ffd27a]/50 ${className}`}
        >
          <Snowflake className="ny-spin h-[1.15rem] w-[1.15rem]" />
          <span aria-hidden className="ny-twinkle absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#ff8fa3]" />
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
        className={`btn-press group relative h-10 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-[#0c1626] pl-3 pr-3.5 text-[13px] font-bold text-[#ffe3b0] shadow-[0_8px_24px_-10px_rgba(255,210,122,0.9)] ring-1 ring-[#ffd27a]/50 transition-shadow duration-300 hover:shadow-[0_10px_30px_-8px_rgba(255,210,122,1)] ${className}`}
      >
        <span aria-hidden className="ny-sheen pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <Snowflake className="ny-spin h-4 w-4 text-[#ffd27a]" />
        <span className="relative">{label}</span>
      </Link>
      {overlay}
    </>
  );
}
