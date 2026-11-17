"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";

/**
 * Branded 404 — на языке страницы.
 *
 * Серверный not-found не получает params, поэтому раньше текст был на трёх
 * языках сразу, а кнопки — русские и вели на /ru и /ru/bron с любого языка.
 * Клиентский компонент читает язык из адреса (useParams) и ведёт туда же,
 * где гость был. Без языка в адресе — русский, как раньше.
 */
const COPY: Record<Locale, { title: string; hint: string; home: string; book: string }> = {
  ru: {
    title: "Страница не найдена",
    hint: "Возможно, ссылка устарела. Вернитесь на главную или забронируйте отдых.",
    home: "На главную",
    book: "Забронировать",
  },
  uz: {
    title: "Sahifa topilmadi",
    hint: "Havola eskirgan bo'lishi mumkin. Bosh sahifaga qayting yoki dam olishni bron qiling.",
    home: "Bosh sahifaga",
    book: "Bron qilish",
  },
  en: {
    title: "Page not found",
    hint: "The link may be out of date. Head back home or book your stay.",
    home: "Back to home",
    book: "Book now",
  },
};

export function NotFoundView() {
  const params = useParams<{ locale?: string }>();
  const locale: Locale = params?.locale && isLocale(params.locale) ? params.locale : "ru";
  const c = COPY[locale];

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--paper)] px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="font-serif text-[clamp(5rem,18vw,9rem)] font-bold leading-none text-[var(--accent)]">404</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-[var(--ink)]">{c.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{c.hint}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}`}
            className="btn-press btn-glow-primary inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-bold"
          >
            {c.home}
          </Link>
          <Link
            href={`/${locale}/bron`}
            className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line-strong)] px-7 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
          >
            {c.book}
          </Link>
        </div>
      </div>
    </main>
  );
}
