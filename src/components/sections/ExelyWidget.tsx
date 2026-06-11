"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Exely booking widget slot.
 *
 * Status: contract with Exely (exely.com PMS / channel manager) is signed;
 * we're waiting for the operator to finish onboarding and hand us the
 * widget embed script. Until then this component renders NOTHING and the
 * classic request form stays the primary booking path.
 *
 * To activate once Exely sends the embed code:
 *   1. Set NEXT_PUBLIC_EXELY_WIDGET_URL in Vercel env
 *      (the loader <script src> they provide, e.g. https://ibe.exely.com/…/loader.js)
 *   2. If their snippet includes extra data-attributes / a hotel id,
 *      set NEXT_PUBLIC_EXELY_HOTEL_ID and extend the script wiring below
 *      to match their exact embed instructions.
 *   3. Redeploy. The widget renders above the request form on /bron;
 *      the form stays as a fallback for guests who prefer a callback.
 */
const SCRIPT_URL = process.env.NEXT_PUBLIC_EXELY_WIDGET_URL;
const HOTEL_ID = process.env.NEXT_PUBLIC_EXELY_HOTEL_ID;

const TITLES: Record<string, string> = {
  ru: "Онлайн-бронирование",
  uz: "Onlayn bron qilish",
  en: "Book online",
};

export function ExelyWidget({ locale }: { locale: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!SCRIPT_URL || !containerRef.current) return;

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    if (HOTEL_ID) script.dataset.hotelId = HOTEL_ID;
    script.onerror = () => setFailed(true);
    containerRef.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  // Not configured yet (waiting for Exely onboarding) or loader failed —
  // render nothing; the request form handles bookings.
  if (!SCRIPT_URL || failed) return null;

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8" aria-label={TITLES[locale] ?? TITLES.ru}>
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 border-b border-[color:var(--line)] bg-[var(--surface-warm)] px-6 py-4">
            <span className="h-2 w-2 rounded-full bg-[var(--green)]" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--ink)]">
              {TITLES[locale] ?? TITLES.ru}
            </p>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Exely
            </span>
          </div>
          {/* Exely injects its booking form into this container */}
          <div ref={containerRef} id="exely-booking-widget" className="min-h-[320px] p-4" />
        </div>
      </div>
    </section>
  );
}
