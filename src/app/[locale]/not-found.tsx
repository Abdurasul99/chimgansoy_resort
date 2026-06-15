import Link from "next/link";

/**
 * Branded 404. This file is rendered when notFound() fires (e.g. invalid
 * locale or unknown slug). It can't reliably read the locale param, so the
 * copy is shown in all three languages — short and friendly.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--paper)] px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="font-serif text-[clamp(5rem,18vw,9rem)] font-bold leading-none text-[var(--accent)]">
          404
        </p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-[var(--ink)]">
          Страница не найдена
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Sahifa topilmadi · Page not found
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Возможно, ссылка устарела. Вернитесь на главную или забронируйте отдых.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/ru"
            className="btn-press btn-glow-primary inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-bold"
          >
            На главную
          </Link>
          <Link
            href="/ru/bron"
            className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line-strong)] px-7 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
          >
            Забронировать
          </Link>
        </div>
      </div>
    </main>
  );
}
