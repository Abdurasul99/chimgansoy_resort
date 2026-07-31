import { services } from "@/content/services";
import { resortImages } from "@/content/images";
import type { Locale } from "@/i18n/config";
import type { LocalizedString } from "@/content/types";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";

/**
 * "Развлечения и отдых" — brand-styled showcase of the day's leisure types
 * (topchan, BBQ, kitchen, picnic, activities). Uses the Alpine-Editorial
 * palette — cream cards, gold category chips, forest-green links, serif ink
 * titles — to match the logo (green mountain + gold sun) and theme.
 */

const COPY: Record<Locale, { eyebrow: string; title: string; subtitle: string; details: string; viewAll: string }> = {
  ru: {
    eyebrow: "На территории",
    title: "Чем занять день",
    subtitle: "Кухня и ресторан, мангал и казан, зоны отдыха и горные маршруты рядом — из этого складывается день между заездом и выездом.",
    details: "Подробнее",
    viewAll: "Все услуги",
  },
  uz: {
    eyebrow: "Hududda",
    title: "Kunni nima bilan to'ldirish",
    subtitle: "Oshxona va restoran, mangal va qozon, dam olish zonalari va yaqindagi tog' marshrutlari — kirish va chiqish orasidagi kun shundan tashkil topadi.",
    details: "Batafsil",
    viewAll: "Barcha xizmatlar",
  },
  en: {
    eyebrow: "On the grounds",
    title: "How the day fills up",
    subtitle: "The kitchen and restaurant, BBQ and kazan, lounge areas, and mountain trails nearby — this is what happens between check-in and check-out.",
    details: "Details",
    viewAll: "All services",
  },
};

const CATEGORY_LABEL: Record<string, LocalizedString> = {
  relax: { ru: "Отдых", uz: "Dam", en: "Relax" },
  food: { ru: "Еда", uz: "Taom", en: "Food" },
  activity: { ru: "Активности", uz: "Faollik", en: "Activity" },
};

/**
 * `limit` trims the grid on the homepage. services[] is ordered so the BBQ card
 * sits last, which means limit={3} drops exactly that one — the coals-and-fire
 * frame was the last of the shashlik story on the homepage. The service itself
 * is untouched and still listed in full on /services.
 */
export function LeisureShowcase({ locale, limit }: { locale: Locale; limit?: number }) {
  const t = COPY[locale];
  const visible = typeof limit === "number" ? services.slice(0, limit) : services;

  return (
    <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="leisure-title">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="motion-reveal max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">{t.eyebrow}</p>
            <h2 id="leisure-title" className="motion-reveal-mask mt-3 font-serif text-4xl font-bold leading-[1.05] text-[var(--ink)] sm:text-5xl">
              {t.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">{t.subtitle}</p>
          </div>
          <a
            href={localizePath(locale, "/services")}
            className="motion-reveal group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[color:var(--line-strong)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)] lg:mb-1"
            data-delay="100"
          >
            {t.viewAll}
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        {/* Cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s, index) => {
            const image = resortImages[s.image];
            return (
              <a
                key={s.slug}
                href={localizePath(locale, `/services/${s.slug}`)}
                className="motion-reveal group flex flex-col overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                data-delay={String((index % 3) * 80)}
                aria-label={text(s.title, locale)}
              >
                {/* Photo + gold category chip */}
                <div className="relative h-56 overflow-hidden">
                  <div
                    // 18% bleed top and bottom gives the drift room to move
                    // without ever exposing an edge inside the rounded card.
                    data-parallax="0.04"
                    className="absolute -inset-y-[18%] inset-x-0 bg-cover bg-center transition-transform duration-[1.3s] ease-out group-hover:scale-[1.05]"
                    style={imageStyle(image)}
                    role="img"
                    aria-label={text(image.alt, locale)}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(31,42,51,0.30)_0%,transparent_55%)]" />
                  <span className="absolute left-4 top-4 rounded-full bg-[var(--sun)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--on-accent)] shadow-[var(--shadow-float)]">
                    {text(CATEGORY_LABEL[s.category] ?? CATEGORY_LABEL.relax, locale)}
                  </span>
                </div>

                {/* Cream info block */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="font-serif text-2xl font-bold leading-tight text-[var(--ink)]">{text(s.title, locale)}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{text(s.shortDescription, locale)}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--forest-dark)] transition-colors group-hover:text-[var(--accent-strong)]">
                    {t.details}
                    <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
