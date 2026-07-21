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

function toLocale(raw: string): Locale {
  if (raw === "uz" || raw === "en") return raw;
  return "ru";
}

export function FaqPanel({ locale: rawLocale }: { locale: string }) {
  const locale = toLocale(rawLocale);
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // First-load choreography: pop the launcher in, then float a hint bubble
  // that draws the eye and explains the value, then quietly retire it.
  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setShowHint(true), 2000);
    const t2 = setTimeout(() => setShowHint(false), 9000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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

          <motion.button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? CLOSE_LABEL[locale] : TITLES[locale]}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 17, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            className="relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] pl-4 pr-5 text-[var(--on-accent)] shadow-[0_14px_36px_rgba(220,140,0,0.42)] transition-shadow duration-300 hover:shadow-[0_18px_46px_rgba(220,140,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sun)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--on-accent)]/15">
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
                  <motion.svg
                    key="chat"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
