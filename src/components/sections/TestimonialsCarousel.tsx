"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { testimonials } from "@/content/testimonials";
import { resortImages } from "@/content/images";
import { imageStyle } from "@/lib/images";
import type { Locale } from "@/i18n/config";
import { text } from "@/lib/localize";

type Props = { locale: Locale };

export function TestimonialsCarousel({ locale }: Props) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = testimonials.length;

  const go = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => { setActive(next); setVisible(true); }, 380);
  }, []);

  const goPrev = () => go((active - 1 + total) % total);
  const goNext = () => go((active + 1) % total);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => go((active + 1) % total), 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, paused, go, total]);

  const t = testimonials[active];
  const bg = resortImages.tapchanAerial;

  return (
    <section
      className="relative overflow-hidden bg-[var(--ink)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Atmospheric background */}
      <div
        className="absolute inset-0 scale-[1.04] bg-cover bg-center opacity-[0.16]"
        style={{ ...imageStyle(bg), filter: "blur(4px)" }}
        role="presentation"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,18,14,0.96)_0%,rgba(12,18,14,0.88)_100%)]" />

      {/* Decorative accent line */}
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">

        {/* Quote content */}
        <div
          className="grid gap-8 transition-opacity duration-[380ms] lg:grid-cols-[1.4fr_0.6fr] lg:items-center lg:gap-16"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {/* Left — quote */}
          <div>
            <p
              className="select-none font-serif text-[var(--accent)] leading-none"
              style={{ fontSize: "clamp(4rem,12vw,8rem)", opacity: 0.2, marginBottom: "-0.5rem" }}
              aria-hidden="true"
            >
              "
            </p>
            <p
              className="font-serif italic leading-snug text-white"
              style={{ fontSize: "clamp(1.25rem,2.8vw,2.1rem)" }}
            >
              {text(t.quote, locale)}
            </p>
          </div>

          {/* Right — guest */}
          <div className="flex flex-col gap-5 lg:items-start">
            <div className="flex gap-0.5" aria-label="5 stars">
              {"★★★★★".split("").map((s, i) => (
                <span key={i} className="text-xl text-yellow-400">{s}</span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/18 font-serif text-2xl font-bold text-[var(--accent)]">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-base font-bold text-white">{t.name}</p>
                <p className="mt-0.5 text-sm text-white/45">{text(t.meta, locale)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 text-white/50 transition-all hover:border-white/45 hover:text-white"
              aria-label="Previous"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to review ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-400 ${
                    i === active ? "w-8 bg-[var(--accent)]" : "w-1.5 bg-white/22 hover:bg-white/45"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 text-white/50 transition-all hover:border-white/45 hover:text-white"
              aria-label="Next"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Google Maps pill */}
          <Link
            href="https://maps.app.goo.gl/AE7scBBU9DykP3st5"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/8 px-4 py-2 text-sm font-semibold text-yellow-300 transition-all hover:bg-yellow-400/15 hover:border-yellow-400/50"
          >
            <span>★ 4.8</span>
            <span className="text-white/30">·</span>
            <span className="text-white/60">Google Maps</span>
            <svg className="h-3 w-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  );
}
