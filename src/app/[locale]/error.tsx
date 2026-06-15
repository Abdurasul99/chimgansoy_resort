"use client";

import { useEffect } from "react";

/**
 * Branded error boundary for the locale segment. Catches render/runtime
 * errors in any page and shows a recoverable screen instead of a white page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console so it shows up in Vercel logs / GA error tracking.
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--paper)] px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="font-serif text-[clamp(3rem,10vw,5rem)] font-bold leading-none text-[var(--accent)]">
          Упс
        </p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-[var(--ink)]">
          Что-то пошло не так
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Nimadir xato ketdi · Something went wrong
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Попробуйте обновить страницу. Если не помогло — напишите нам в WhatsApp или Telegram.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-press btn-glow-primary inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-bold"
          >
            Обновить
          </button>
          <a
            href="/ru"
            className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line-strong)] px-7 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
          >
            На главную
          </a>
        </div>
      </div>
    </main>
  );
}
