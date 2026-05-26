"use client";

import { useState } from "react";
import { bnovoIntegration } from "@/content/integrations";
import type { Locale } from "@/i18n/config";
import { buildBnovoIframeUrl, buildBnovoBookingUrl, type SearchParams } from "@/lib/bnovo";

type BnovoEmbedProps = {
  locale: Locale;
  searchParams?: SearchParams;
};

const copy = {
  ru: { title: "Выберите даты и тип размещения", open: "Открыть в новой вкладке" },
  uz: { title: "Sanalar va turar-joy turini tanlang", open: "Yangi varaqda ochish" },
  en: { title: "Select dates and accommodation type", open: "Open in new tab" },
};

export function BnovoEmbed({ locale, searchParams }: BnovoEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const iframeUrl = process.env.NEXT_PUBLIC_BNOVO_IFRAME_URL;
  const uid = process.env.NEXT_PUBLIC_BNOVO_UID;
  const dict = copy[locale];

  if (!iframeUrl) {
    return (
      <div
        id="bnovo-widget"
        data-bnovo-placeholder="replace-with-official-bnovo-iframe-url"
        data-bnovo-env-url={bnovoIntegration.env.iframeUrl}
        data-bnovo-env-uid={bnovoIntegration.env.uid}
        className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-8 text-center"
      >
        <p className="text-sm font-semibold text-[var(--muted)]">
          {locale === "ru" ? "Онлайн-бронирование" : locale === "uz" ? "Online bron" : "Online booking"}
        </p>
      </div>
    );
  }

  const src = buildBnovoIframeUrl(iframeUrl, searchParams);
  const directUrl = uid ? buildBnovoBookingUrl(uid, searchParams) : src;

  return (
    <div id="bnovo-widget" className="mt-8 overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
      {/* Branded header bar */}
      <div className="flex items-center justify-between border-b border-[color:var(--line)] bg-[var(--surface)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--ink)]">CHIMGAN DARBAZA</p>
          <span className="hidden text-xs text-[var(--muted)] sm:block">·</span>
          <p className="hidden text-xs text-[var(--muted)] sm:block">{dict.title}</p>
        </div>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {dict.open}
        </a>
      </div>

      {/* Skeleton while iframe loads */}
      <div className={`relative transition-opacity duration-500 ${loaded ? "hidden" : "block"}`}>
        <div className="p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>

      <iframe
        title="Онлайн-бронирование CHIMGAN DARBAZA"
        src={src}
        className={`w-full border-0 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
        style={{ height: "820px" }}
        loading="lazy"
        allow="payment"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
