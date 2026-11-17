"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";

/**
 * Branded error boundary for the locale segment. Catches render/runtime
 * errors in any page and shows a recoverable screen instead of a white page.
 *
 * На языке страницы. До 17.11.2026 экран был русским для всех, а «На главную»
 * вела на /ru — гость с /uz после сбоя оказывался на русской главной.
 */
const COPY: Record<Locale, { oops: string; title: string; hint: string; retry: string; home: string }> = {
  ru: {
    oops: "Упс",
    title: "Что-то пошло не так",
    hint: "Попробуйте обновить страницу. Если не помогло — напишите нам в WhatsApp или Telegram.",
    retry: "Обновить",
    home: "На главную",
  },
  uz: {
    oops: "Voy",
    title: "Nimadir xato ketdi",
    hint: "Sahifani yangilab ko'ring. Yordam bermasa — bizga WhatsApp yoki Telegram orqali yozing.",
    retry: "Yangilash",
    home: "Bosh sahifaga",
  },
  en: {
    oops: "Oops",
    title: "Something went wrong",
    hint: "Try reloading the page. If that doesn't help, message us on WhatsApp or Telegram.",
    retry: "Reload",
    home: "Back to home",
  },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const locale: Locale = params?.locale && isLocale(params.locale) ? params.locale : "ru";
  const c = COPY[locale];

  useEffect(() => {
    // Surface to the console so it shows up in server logs / GA error tracking.
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--paper)] px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="font-serif text-[clamp(3rem,10vw,5rem)] font-bold leading-none text-[var(--accent)]">{c.oops}</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-[var(--ink)]">{c.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{c.hint}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-press btn-glow-primary inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-bold"
          >
            {c.retry}
          </button>
          <Link
            href={`/${locale}`}
            className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line-strong)] px-7 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
          >
            {c.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
