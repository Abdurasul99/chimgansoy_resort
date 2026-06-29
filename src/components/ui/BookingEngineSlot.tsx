"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Host element for the Exely booking engine (#be-booking-form), with graceful
 * loading + failure states so the page is never just an empty void.
 *
 * The head loader (layout.tsx) injects the engine into #be-booking-form. We can't
 * read inside Exely's cross-origin iframe, but we CAN tell whether the loader put
 * anything into the container:
 *   • nothing yet            → show a spinner ("loading the booking module…")
 *   • children appear        → engine arrived, hide our overlay
 *   • still empty after ~9s  → show a clear "couldn't load" note pointing to the
 *                              always-present direct-contact card below.
 *
 * Keep the `id="be-booking-form"` element stable — Exely targets it by id.
 */

type SlotCopy = {
  loading: string;
  failedHeading: string;
  failedSub: string;
};

export function BookingEngineSlot({ copy }: { copy: SlotCopy }) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hasContent = () => el.childElementCount > 0;
    const observer = new MutationObserver(() => {
      if (hasContent()) {
        setState("ready");
        observer.disconnect();
        window.clearTimeout(initial);
        window.clearTimeout(timer);
      }
    });
    observer.observe(el, { childList: true, subtree: true });
    // Initial check (deferred so it runs from a timer, not synchronously in the
    // effect body) — catches the case where Exely injected before we observed.
    const initial = window.setTimeout(() => {
      if (hasContent()) setState("ready");
    }, 0);
    // Give up after ~9s and show the graceful failure message.
    const timer = window.setTimeout(() => {
      observer.disconnect();
      setState(hasContent() ? "ready" : "failed");
    }, 9000);
    return () => {
      observer.disconnect();
      window.clearTimeout(initial);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-[420px]">
      {/* Exely injects the engine here. */}
      <div id="be-booking-form" ref={ref} suppressHydrationWarning />

      {state === "loading" && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
          aria-live="polite"
        >
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--line)] border-t-[var(--sun)]" />
          <p className="text-sm font-semibold text-[var(--muted)]">{copy.loading}</p>
        </div>
      )}

      {state === "failed" && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[color:var(--line-strong)] bg-[var(--surface)] px-6 py-12 text-center">
          <p className="font-serif text-lg font-bold text-[var(--ink)]">{copy.failedHeading}</p>
          <p className="max-w-md text-sm leading-6 text-[var(--muted)]">{copy.failedSub}</p>
        </div>
      )}
    </div>
  );
}
