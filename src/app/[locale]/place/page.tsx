import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { attractions } from "@/content/attractions";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.place, "/place");
}

export default async function AttractionsPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.place.title}
        lead={dict.pages.place.lead}
        image={resortImages.territoryAerial}
        eyebrow="CHIMGAN DARBAZA"
      />
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.pages.place.title} text={dict.pages.place.lead} />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {attractions.map((item) => (
              <article key={text(item.title, locale)} className="grid overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)] transition-shadow duration-500 hover:shadow-[var(--shadow-card-hover)] sm:grid-cols-[0.9fr_1.1fr]">
                <ImageFrame image={resortImages[item.image]} locale={locale} className="min-h-64 rounded-none" />
                <div className="p-6">
                  <p className="text-xs font-bold uppercase text-[var(--accent-strong)]">{text(item.distance, locale)}</p>
                  <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--ink)]">{text(item.title, locale)}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text(item.description, locale)}</p>
                  <ButtonLink href={localizePath(locale, "/services/experience")} variant="ghost" className="mt-5">
                    {dict.details}
                  </ButtonLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
