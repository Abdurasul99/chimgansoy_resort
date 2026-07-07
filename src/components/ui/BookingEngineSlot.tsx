"use client";

import { useEffect, useRef, useState } from "react";
import { contacts } from "@/content/contacts";

const failBtn =
  "btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition";

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
  call: string;
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
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[color:var(--line-strong)] bg-[var(--surface)] px-6 py-12 text-center">
          <div>
            <p className="font-serif text-lg font-bold text-[var(--ink)]">{copy.failedHeading}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{copy.failedSub}</p>
          </div>
          {/* Direct-contact buttons — shown only when the engine fails to load. */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`tel:${contacts.phone.replaceAll(" ", "")}`}
              className={`${failBtn} bg-[var(--sun)] text-[var(--on-accent)] hover:bg-[var(--sun-dark)]`}
            >
              {copy.call} {contacts.phone}
            </a>
            <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" className={`${failBtn} border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)]`}>
              Telegram
            </a>
            <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" className={`${failBtn} border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)]`}>
              WhatsApp
            </a>
            <a href={`mailto:${contacts.email}`} className={`${failBtn} border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)]`}>
              {contacts.email}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
