"use client";

import { useEffect, useRef, useState } from "react";
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

function toLocale(raw: string): Locale {
  if (raw === "uz" || raw === "en") return raw;
  return "ru";
}

export function FaqPanel({ locale: rawLocale }: { locale: string }) {
  const locale = toLocale(rawLocale);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape + trap Tab focus inside the panel while open (WCAG 2.4.3).
  // On close, focus returns to the element that was focused before opening.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    // Move initial focus into the panel (the chat input is the natural target)
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
      // Wrap focus at the edges
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
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-3xl border-t border-[color:var(--line)] bg-[var(--paper)] shadow-[0_-8px_40px_rgba(21,29,24,0.18)] sm:bottom-24 sm:left-auto sm:right-4 sm:h-[560px] sm:w-[420px] sm:rounded-3xl sm:border sm:shadow-[0_24px_80px_rgba(21,29,24,0.22)]"
          style={{ height: "min(82vh, 560px)" }}
        >
          {/* Header — text uses --paper (the contrasting pair of --ink) so it
              stays legible when the winter theme flips --ink to a light color. */}
          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--line)] bg-[var(--ink)] px-5 py-4 text-[var(--paper)]">
            <div>
              <p className="font-serif text-lg font-semibold leading-tight">{TITLES[locale]}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--paper)]/55">
                {SUBTITLES[locale]}
              </p>
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
        </div>
      )}

      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? CLOSE_LABEL[locale] : TITLES[locale]}
        className="fixed bottom-[4.5rem] right-4 z-40 flex h-14 items-center gap-2.5 rounded-full bg-[var(--sun)] pl-4 pr-5 text-[var(--on-accent)] shadow-[0_12px_32px_rgba(220,140,0,0.32)] transition-all duration-300 hover:bg-[var(--sun-dark)] hover:shadow-[0_16px_40px_rgba(220,140,0,0.40)] sm:bottom-6 sm:right-6"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--on-accent)]/10">
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </span>
        <span className="text-sm font-semibold">{TOGGLE_LABEL[locale]}</span>
      </button>
    </>
  );
}
