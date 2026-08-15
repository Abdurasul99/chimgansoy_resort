import Image from "next/image";
import type { Locale } from "@/i18n/config";

const POSTER_PATHS: Record<Locale, string> = {
  ru: "/images/resort/tubing-rules-100cm-ru.jpg",
  uz: "/images/resort/tubing-rules-100cm-uz.jpg",
  en: "/images/resort/tubing-rules-100cm-en.jpg",
};

const COPY: Record<
  Locale,
  { eyebrow: string; title: string; body: string; alt: string; open: string }
> = {
  ru: {
    eyebrow: "Безопасность",
    title: "Правила пользования тюбингами",
    body: "Перед отправкой заявки внимательно ознакомьтесь с правилами для тюбингов диаметром 100 см.",
    alt: "Плакат с правилами пользования тюбингами диаметром 100 см",
    open: "Нажмите на плакат, чтобы открыть его в полном размере",
  },
  uz: {
    eyebrow: "Xavfsizlik",
    title: "Tyubingdan foydalanish qoidalari",
    body: "Ariza yuborishdan oldin diametri 100 sm bo‘lgan tyubinglar qoidalarini diqqat bilan o‘qing.",
    alt: "Diametri 100 sm bo‘lgan tyubinglardan foydalanish qoidalari yozilgan plakat",
    open: "Plakatni to‘liq hajmda ochish uchun uning ustiga bosing",
  },
  en: {
    eyebrow: "Safety",
    title: "Tubing rules",
    body: "Please read the rules for 100 cm tubing equipment carefully before sending your request.",
    alt: "Poster with rules for using 100 cm tubing equipment",
    open: "Select the poster to open it at full size",
  },
};

export function TubingSafetyPoster({ locale }: { locale: Locale }) {
  const copy = COPY[locale] ?? COPY.ru;
  const headingId = `tubing-safety-poster-${locale}`;
  const posterPath = POSTER_PATHS[locale] ?? POSTER_PATHS.ru;

  return (
    <section
      aria-labelledby={headingId}
      className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            {copy.eyebrow}
          </p>
          <h2 id={headingId} className="mt-3 font-serif text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)] sm:text-base">{copy.body}</p>
        </div>

        <figure className="mx-auto max-w-xl">
          <a
            href={posterPath}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${copy.open}. ${copy.alt}`}
            className="group block overflow-hidden border border-[var(--line-strong)] bg-white shadow-[var(--shadow-card)] outline-none transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] focus-visible:ring-2 focus-visible:ring-[var(--sun)] focus-visible:ring-offset-4"
          >
            <Image
              src={posterPath}
              width={1492}
              height={1054}
              sizes="(min-width: 1280px) 560px, (min-width: 640px) 56vw, 90vw"
              alt={copy.alt}
              className="h-auto w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
            />
          </a>
          <figcaption className="mt-3 text-xs leading-5 text-[var(--muted)]">{copy.open}</figcaption>
        </figure>
      </div>
    </section>
  );
}
