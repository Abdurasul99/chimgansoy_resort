"use client";

import { useState } from "react";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import Link from "next/link";

type BookingDrawerProps = {
  locale: Locale;
  roomTitle: string;
  priceFrom: string;
};

export function BookingDrawer({ locale, roomTitle, priceFrom }: BookingDrawerProps) {
  const [open, setOpen] = useState(false);
  const dict = dictionaries[locale];
  const uid = process.env.NEXT_PUBLIC_BNOVO_UID;
  const iframeBase = process.env.NEXT_PUBLIC_BNOVO_IFRAME_URL;

  return (
    <>
      {/* Sticky panel */}
      <div className="rounded-3xl border border-[color:var(--line)] bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGANSOY</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-[var(--ink)]">{roomTitle}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{priceFrom}</p>

        <div className="mt-6 h-px bg-[color:var(--line)]" />

        <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
          {[
            locale === "ru" ? "Бесплатная отмена до 24 часов" : locale === "uz" ? "24 soatgacha bekor qilish" : "Free cancellation 24h prior",
            locale === "ru" ? "Завтрак по запросу" : locale === "uz" ? "So'rov bo'yicha nonushta" : "Breakfast on request",
            locale === "ru" ? "Подтверждение сразу" : locale === "uz" ? "Darhol tasdiqlash" : "Instant confirmation",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            className="btn-press w-full rounded-full bg-[var(--accent)] py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-[var(--accent-strong)] hover:shadow-[var(--shadow-glow)]"
            onClick={() => setOpen(true)}
          >
            {dict.bookNow}
          </button>
          <Link
            href={localizePath(locale, "/bron")}
            className="btn-press flex items-center justify-center rounded-full border border-[color:var(--line)] py-3.5 text-sm font-semibold text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
          >
            {dict.book}
          </Link>
        </div>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card-hover)]">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[color:var(--line)] bg-[var(--surface)] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--ink)]">CHIMGANSOY</p>
                <span className="text-xs text-[var(--muted)]">·</span>
                <p className="text-xs text-[var(--muted)]">{roomTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                aria-label={dict.close}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Iframe or fallback */}
            {iframeBase ? (
              <iframe
                title={`Бронирование — ${roomTitle}`}
                src={iframeBase}
                className="w-full border-0"
                style={{ height: "600px" }}
                loading="lazy"
                allow="payment"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <p className="font-serif text-2xl font-semibold text-[var(--ink)]">
                  {locale === "ru" ? "Свяжитесь с нами" : locale === "uz" ? "Biz bilan bog'laning" : "Contact us"}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {locale === "ru" ? "Мы поможем с бронированием" : locale === "uz" ? "Bron qilishda yordam beramiz" : "We'll help you book"}
                </p>
                <Link
                  href={localizePath(locale, "/bron")}
                  className="btn-press mt-6 rounded-full bg-[var(--accent)] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-strong)]"
                  onClick={() => setOpen(false)}
                >
                  {dict.bookNow}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
