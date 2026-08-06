import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { resortImages } from "@/content/images";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { readOverrides } from "@/lib/site-overrides";
import type { Locale } from "@/i18n/config";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * Published within a minute of the operator pressing the button.
 *
 * The save calls revalidatePath, so this is normally instant; the window is
 * insurance for the case where a revalidation is lost — a news page that shows
 * yesterday's list for an hour is a worse failure here than on a tariff, because
 * the operator posts precisely when something has just changed.
 */
export const revalidate = 60;

const COPY: Record<Locale, { title: string; lead: string; empty: string }> = {
  ru: {
    title: "Новости",
    lead: "Что происходит на курорте: сезонные изменения, новые услуги и объявления.",
    empty: "Пока новостей нет. Загляните позже — здесь появятся объявления курорта.",
  },
  uz: {
    title: "Yangiliklar",
    lead: "Kurortda nima bo'layotgani: mavsumiy o'zgarishlar, yangi xizmatlar va e'lonlar.",
    empty: "Hozircha yangilik yo'q. Keyinroq kiring — bu yerda kurort e'lonlari paydo bo'ladi.",
  },
  en: {
    title: "News",
    lead: "What is happening at the resort: seasonal changes, new services and announcements.",
    empty: "No news yet. Check back later for announcements from the resort.",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const copy = COPY[locale];
  return buildMetadata(
    locale,
    {
      title: { ru: `${COPY.ru.title} — CHIMGAN DARBAZA`, uz: `${COPY.uz.title} — CHIMGAN DARBAZA`, en: `${COPY.en.title} — CHIMGAN DARBAZA` },
      description: { ru: COPY.ru.lead, uz: COPY.uz.lead, en: COPY.en.lead },
    },
    "/novosti",
  );
}

/** "2026-08-06" → "6 августа 2026" / "6 avgust 2026" / "6 August 2026". */
function formatDate(iso: string, locale: Locale): string {
  const months: Record<Locale, string[]> = {
    ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
    uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${Number(d)} ${months[locale][Number(mo) - 1]} ${y}`;
}

export default async function NewsPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const copy = COPY[locale];
  const overrides = await readOverrides();
  const items = overrides.news
    .filter((n) => n.published)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow="CHIMGAN DARBAZA"
        title={copy.title}
        lead={copy.lead}
        image={resortImages.galTerritoryPanorama}
      />

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {items.length === 0 ? (
            <p className="text-base leading-8 text-[var(--muted)]">{copy.empty}</p>
          ) : (
            <ul className="space-y-12">
              {items.map((n, i) => (
                <li key={n.id} className="motion-reveal" data-delay={String(Math.min(i, 4) * 60)}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                    {formatDate(n.date, locale)}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold leading-snug text-[var(--ink)] sm:text-3xl">
                    {n.title}
                  </h2>
                  {/* whitespace-pre-line, not a markdown renderer: the operator
                      types into a textarea, and their paragraph breaks are the
                      only formatting they have. */}
                  <p className="mt-4 whitespace-pre-line text-base leading-8 text-[var(--muted)]">
                    {n.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
