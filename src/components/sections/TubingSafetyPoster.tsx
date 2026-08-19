import Image from "next/image";
import type { Locale } from "@/i18n/config";

const POSTER_PATHS: Record<Locale, string> = {
  ru: "/images/resort/tubing-rules-100cm-ru.jpg",
  uz: "/images/resort/tubing-rules-100cm-uz.jpg",
  en: "/images/resort/tubing-rules-100cm-en.jpg",
};

/**
 * Плакат от 19.08.2026 — редакция без совместного спуска: раздела про детей и
 * катание с родителем на нём больше нет вовсе, только «на одном тюбинге
 * разрешается кататься только одному человеку». Возрастной порог (от 4 лет,
 * самостоятельная посадка) на плакате не напечатан и живёт в правилах горки.
 *
 * Оригинал 6299×14173 и 9 МБ; здесь 1400 px по ширине — на экране плакат всё
 * равно открывается меньше, а девять мегабайт на телефоне это половина минуты
 * ожидания.
 */
const POSTER = { width: 1400, height: 3150 };

const COPY: Record<
  Locale,
  { eyebrow: string; title: string; body: string; alt: string; open: string; caption: string }
> = {
  ru: {
    eyebrow: "Безопасность",
    title: "Правила пользования тюбингами",
    body: "Перед отправкой заявки ознакомьтесь с правилами для тюбингов диаметром 100 см: катается один человек, вес до 95 кг.",
    alt: "Плакат с правилами пользования тюбингами диаметром 100 см",
    open: "Открыть плакат целиком",
    caption: "Плакат откроется в полном размере в новой вкладке — там он читается целиком.",
  },
  uz: {
    eyebrow: "Xavfsizlik",
    title: "Tyubingdan foydalanish qoidalari",
    body: "Ariza yuborishdan oldin diametri 100 sm bo‘lgan tyubinglar qoidalari bilan tanishing: bir kishi uchadi, vazn 95 kg gacha.",
    alt: "Diametri 100 sm bo‘lgan tyubinglardan foydalanish qoidalari yozilgan plakat",
    open: "Plakatni to‘liq ochish",
    caption: "Plakat yangi oynada to‘liq hajmda ochiladi — u yerda hammasi o‘qiladi.",
  },
  en: {
    eyebrow: "Safety",
    title: "Tubing rules",
    body: "Before sending your request, read the rules for 100 cm tubes: one rider per tube, up to 95 kg.",
    alt: "Poster with rules for using 100 cm tubing equipment",
    open: "Open the full poster",
    caption: "The poster opens at full size in a new tab, where every line is readable.",
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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
        <div className="max-w-2xl sm:flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            {copy.eyebrow}
          </p>
          <h2 id={headingId} className="mt-3 font-serif text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)] sm:text-base">{copy.body}</p>
        </div>

        {/*
          Раньше плакат печатался во всю ширину карточки. При пропорции 1:2.25
          это полтора экрана прокрутки, на которых мелкий текст всё равно не
          читается: гость и листает долго, и ничего не разбирает.

          Теперь окно фиксированной высоты с верхом плаката — по нему видно, что
          это за документ, — и заметная кнопка «открыть целиком»: читать всё
          равно нужно в полном размере.
        */}
        <figure className="w-full max-w-[300px] shrink-0 sm:max-w-[280px]">
          <a
            href={posterPath}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${copy.open}. ${copy.alt}`}
            className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-[color:var(--line-strong)] bg-white shadow-[var(--shadow-card)] outline-none transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] focus-visible:ring-2 focus-visible:ring-[var(--sun)] focus-visible:ring-offset-4"
          >
            <Image
              src={posterPath}
              width={POSTER.width}
              height={POSTER.height}
              sizes="300px"
              alt={copy.alt}
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.02]"
            />
            {/* Подложка под подписью: без неё белая кнопка теряется на светлом
                верхе плаката — он начинается с неба и снежных вершин. */}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-[rgba(21,29,24,0.88)] via-[rgba(21,29,24,0.72)] to-transparent px-3 pb-3 pt-8 text-xs font-bold text-white">
              {/* Стрелки в углы — «развернуть». В наборе иконок такого знака
                  нет, а заводить его ради одного места незачем. */}
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
                <path
                  d="M5.5 1.5H1.5V5.5M8.5 1.5H12.5V5.5M5.5 12.5H1.5V8.5M8.5 12.5H12.5V8.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              {copy.open}
            </span>
          </a>
          <figcaption className="mt-3 text-xs leading-5 text-[var(--muted)]">{copy.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
