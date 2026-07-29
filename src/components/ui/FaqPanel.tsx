"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AiChat } from "@/components/ui/AiChat";

type Locale = "ru" | "uz" | "en";

const TITLES: Record<Locale, string> = {
  ru: "Консьерж",
  uz: "Konserj",
  en: "Concierge",
};

const SUBTITLES: Record<Locale, string> = {
  ru: "CHIMGAN DARBAZA",
  uz: "CHIMGAN DARBAZA",
  en: "CHIMGAN DARBAZA",
};

const TOGGLE_LABEL: Record<Locale, string> = {
  ru: "Консьерж",
  uz: "Konserj",
  en: "Concierge",
};

const CLOSE_LABEL: Record<Locale, string> = {
  ru: "Закрыть",
  uz: "Yopish",
  en: "Close",
};

const HINT: Record<Locale, string> = {
  ru: "Спросите меня — цены и свободные даты 👋",
  uz: "Mendan so'rang — narx va bo'sh sanalar 👋",
  en: "Ask me — prices & free dates 👋",
};

/** Once-per-session flag for the arrival star. */
const STAR_SEEN_KEY = "cgd_star_seen";
/** Matches the .cg-burst delay in globals.css — the moment the star lands. */
const STAR_LAND_MS = 1600;

function toLocale(raw: string): Locale {
  if (raw === "uz" || raw === "en") return raw;
  return "ru";
}

export function FaqPanel({ locale: rawLocale }: { locale: string }) {
  const locale = toLocale(rawLocale);
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Arrival choreography.
  //   mode    — decided the instant we mount, BEFORE the star is due to launch.
  //             Deciding late let the launcher spring in, then snap back to
  //             scale 0 when the star started, then spring in again.
  //   star    — the flight is actually on screen now.
  //   landed  — the burst has fired; the launcher springs out of it.
  const [mode, setMode] = useState<"pending" | "star" | "plain">("pending");
  const [star, setStar] = useState(false);
  const [landed, setLanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reveal the launcher exactly when the star bursts on it.
  useEffect(() => {
    if (!star) return;
    const t = window.setTimeout(() => setLanded(true), STAR_LAND_MS);
    return () => window.clearTimeout(t);
  }, [star]);

  // Held back until the arrival has resolved one way or the other.
  const hideLauncher = mode === "pending" || (mode === "star" && !landed);

  // First-load choreography: a star sweeps in and bursts on the launcher,
  // the launcher lights up out of the flash, then a hint bubble floats up to
  // explain the value and quietly retires.
  //
  // The star only flies once per session — the whole point is that it feels
  // like a small event, and an event that repeats on every page view is an
  // irritation. Repeat views just get the launcher, popped in quickly.
  useEffect(() => {
    setMounted(true);

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alreadyFlown = true;
    try {
      alreadyFlown = sessionStorage.getItem(STAR_SEEN_KEY) === "1";
    } catch {
      // Private mode / storage disabled — treat as seen and skip the flourish.
    }

    const timers: number[] = [];
    const hintAfter = (ms: number) => {
      timers.push(window.setTimeout(() => setShowHint(true), ms));
      timers.push(window.setTimeout(() => setShowHint(false), ms + 7000));
    };

    if (reduced || alreadyFlown) {
      setMode("plain");
      hintAfter(2000);
      return () => timers.forEach(window.clearTimeout);
    }

    // Decided now, not when the flight starts — see the note on `mode`.
    setMode("star");
    try {
      sessionStorage.setItem(STAR_SEEN_KEY, "1");
    } catch {}

    const launch = () => {
      setStar(true);
      // Hint waits until the star has landed and the launcher has settled.
      hintAfter(2900);
    };

    // On the homepage the logo intro owns the screen first; a star flying
    // behind that overlay would simply be missed.
    const gate = document.documentElement.getAttribute("data-intro");
    if (gate) {
      const onDone = () => {
        window.removeEventListener("logo-intro:done", onDone);
        timers.push(window.setTimeout(launch, 260));
      };
      window.addEventListener("logo-intro:done", onDone);
      // Failsafe: the intro has its own 4s/6s escape hatches, so never wait longer.
      timers.push(
        window.setTimeout(() => {
          window.removeEventListener("logo-intro:done", onDone);
          launch();
        }, 6500),
      );
      return () => {
        window.removeEventListener("logo-intro:done", onDone);
        timers.forEach(window.clearTimeout);
      };
    }

    timers.push(window.setTimeout(launch, 420));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (open) setShowHint(false);
  }, [open]);

  // Close on Escape + trap Tab focus inside the panel while open (WCAG 2.4.3).
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    const first = focusables()[0];
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = Array.from(focusables());
      if (els.length === 0) return;
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      {/* Panel + backdrop */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[rgba(15,20,16,0.4)] backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-label={TITLES[locale]}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-3xl border-t border-[color:var(--line)] bg-[var(--paper)] shadow-[0_-8px_40px_rgba(21,29,24,0.22)] sm:bottom-24 sm:left-auto sm:right-6 sm:h-[560px] sm:w-[420px] sm:rounded-3xl sm:border sm:shadow-[0_28px_90px_rgba(21,29,24,0.28)]"
              style={{ height: "min(82vh, 560px)", transformOrigin: "bottom right" }}
              initial={{ opacity: 0, scale: 0.86, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.9 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[color:var(--line)] bg-[var(--ink)] px-5 py-4 text-[var(--paper)]">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.12 }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] text-[var(--on-accent)] shadow-[0_6px_16px_rgba(220,140,0,0.45)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.span>
                  <div>
                    <p className="font-serif text-lg font-semibold leading-tight">{TITLES[locale]}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--paper)]/55">
                      {SUBTITLES[locale]}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={CLOSE_LABEL[locale]}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--paper)]/70 transition-colors hover:bg-[var(--paper)]/10 hover:text-[var(--paper)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* AI concierge chat fills the rest of the panel */}
              <AiChat locale={locale} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Launcher cluster (hint + button) */}
      <div className="fixed bottom-[4.5rem] right-4 z-40 flex items-center gap-2.5 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {showHint && !open && (
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, x: 14, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 14, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="max-w-[210px] rounded-2xl rounded-br-sm bg-[var(--ink)] px-3.5 py-2.5 text-left text-xs font-medium leading-snug text-[var(--paper)] shadow-[0_10px_30px_rgba(21,29,24,0.28)]"
            >
              {HINT[locale]}
            </motion.button>
          )}
        </AnimatePresence>

        <div className="relative">
          {/* Breathing halo — signals the widget is alive/interactive */}
          {mounted && !open && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -inset-1.5 -z-10 rounded-full bg-[var(--sun)]/45 blur-lg"
              animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.96, 1.08, 0.96] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Presence pings — CSS, not framer-motion: they run on the
              compositor and cost no main-thread work while idle.
              Held back until the star has landed, so nothing pulses on an
              empty spot before the launcher exists. */}
          {mounted && !open && !hideLauncher && (
            <>
              <span aria-hidden className="cg-ping" />
              <span aria-hidden className="cg-ping cg-ping--late" />
            </>
          )}

          {/* The wishing star: sweeps across the viewport, glitter trailing,
              and bursts here. Purely decorative — hidden from assistive tech,
              pointer-events off, and removed once it has played. */}
          {star && !landed && (
            <span aria-hidden className="cg-star">
              <span className="cg-star__core" />
            </span>
          )}
          {star && !landed && (
            <>
              <span aria-hidden className="cg-star cg-star__mote cg-star__mote--1" />
              <span aria-hidden className="cg-star cg-star__mote cg-star__mote--2" />
              <span aria-hidden className="cg-star cg-star__mote cg-star__mote--3" />
            </>
          )}
          {star && <span aria-hidden className="cg-burst" />}

          <motion.button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? CLOSE_LABEL[locale] : TITLES[locale]}
            initial={{ scale: 0, opacity: 0 }}
            // While the star is inbound the launcher is held at scale 0 and
            // then springs out of the burst; otherwise it pops in after load.
            animate={hideLauncher ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={
              mode === "star"
                ? { type: "spring", stiffness: 300, damping: 15 }
                : { type: "spring", stiffness: 260, damping: 17, delay: 0.6 }
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            className={`cg-btn relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] pl-4 pr-5 text-[var(--on-accent)] shadow-[0_14px_36px_rgba(220,140,0,0.42)] transition-shadow duration-300 hover:shadow-[0_18px_46px_rgba(220,140,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sun)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] ${open ? "cg-quiet" : ""}`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ${
                open ? "bg-[var(--on-accent)]/15" : "bg-[#0f1928] ring-1 ring-[var(--on-accent)]/25"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.svg
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </motion.svg>
                ) : (
                  /* Sunrise over Chimgan — the logo's sun + ridge, alive.
                     The ridge paints over the sun, so the sun rises out from
                     behind the mountains rather than sliding across them. */
                  <motion.svg
                    key="mark"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="cg-mark"
                    viewBox="0 0 40 40"
                    aria-hidden="true"
                  >
                    <defs>
                      <clipPath id="cg-clip">
                        <circle cx="20" cy="20" r="20" />
                      </clipPath>
                      <radialGradient id="cg-glow-grad">
                        <stop offset="0%" stopColor="#f4a52a" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#f4a52a" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <g clipPath="url(#cg-clip)">
                      {/* Night-sky base — the dark disc the scene sits in */}
                      <rect width="40" height="40" fill="#0f1928" />

                      {/* Sun glow, then the sun itself */}
                      <circle className="cg-glow" cx="20" cy="25" r="13" fill="url(#cg-glow-grad)" />
                      <circle className="cg-sun" cx="20" cy="25" r="6" fill="#f4a52a" />

                      {/* Ridge — two peaks, echoing the brand mark. Kept low
                          enough that the sun clears it at the top of its arc;
                          that emerging disc is the whole point of the mark. */}
                      <path
                        d="M-4 40 L6 28 L12 32.5 L21 22 L27 28.5 L33 25 L44 40 Z"
                        fill="#0b1420"
                      />
                      {/* Snow line on the main peak */}
                      <path d="M21 22 L24.2 25.4 L21.6 25.9 L19.4 24.8 Z" fill="#2f4256" />
                    </g>

                    {/* AI sparks above the ridge */}
                    <g fill="#ffd98a">
                      <path
                        className="cg-spark-a"
                        d="M11 8.4 L11.9 10.1 L13.6 11 L11.9 11.9 L11 13.6 L10.1 11.9 L8.4 11 L10.1 10.1 Z"
                      />
                      <path
                        className="cg-spark-b"
                        d="M29 5.6 L29.7 7 L31.1 7.7 L29.7 8.4 L29 9.8 L28.3 8.4 L26.9 7.7 L28.3 7 Z"
                      />
                      <path
                        className="cg-spark-c"
                        d="M32 15.2 L32.5 16.2 L33.5 16.7 L32.5 17.2 L32 18.2 L31.5 17.2 L30.5 16.7 L31.5 16.2 Z"
                      />
                    </g>
                  </motion.svg>
                )}
              </AnimatePresence>
            </span>
            <span className="text-sm font-semibold">{TOGGLE_LABEL[locale]}</span>
          </motion.button>
        </div>
      </div>
    </>
  );
}
