import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { formatNewsDate } from "@/content/news";
import { resortImages } from "@/content/images";
import { mainNavigation } from "@/content/navigation";
import { pageSeo } from "@/content/seo";
import { getLocaleParam, getNewsSorted } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.news, "/news");
}

const copy = {
  ru: { title: "Новости и события", lead: "Что нового в CHIMGAN DARBAZA — сезон, услуги, предложения.", read: "Читать" },
  uz: { title: "Yangiliklar va tadbirlar", lead: "CHIMGAN DARBAZA'da nima yangilik — mavsum, xizmatlar, takliflar.", read: "O'qish" },
  en: { title: "News & events", lead: "What's new at CHIMGAN DARBAZA — season, services, offers.", read: "Read" },
} as const;

export default async function NewsPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const t = copy[locale];
  const items = getNewsSorted();

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: text(mainNavigation[0].label, locale), path: "/" },
          { name: t.title, path: "/news" },
        ]}
      />
      <PageHero locale={locale} title={t.title} lead={t.lead} image={resortImages.nature} eyebrow="CHIMGAN DARBAZA" />

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const image = resortImages[item.image];
              return (
                <Link
                  key={item.slug}
                  href={localizePath(locale, `/news/${item.slug}`)}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div
                    className="relative h-52 bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                    style={imageStyle(image)}
                    role="img"
                    aria-label={text(image.alt, locale)}
                  >
                    <span className="absolute left-4 top-4 rounded-full bg-[var(--ink)]/85 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--paper)] backdrop-blur-sm">
                      {text(item.category, locale)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold text-[var(--muted)]">{formatNewsDate(item.date, locale)}</p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-[var(--ink)]">
                      {text(item.title, locale)}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-7 text-[var(--muted)]">{text(item.excerpt, locale)}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent-strong)]">
                      {t.read}
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
