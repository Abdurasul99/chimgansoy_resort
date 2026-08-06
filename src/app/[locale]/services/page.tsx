import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { resolveServices } from "@/lib/services-live";
import { readOverrides } from "@/lib/site-overrides";
import { buildMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.services, "/services");
}


/**
 * The operator switches, resolved once per render.
 *
 * Hidden services drop out of the grid AND their own page 404s — a card that
 * vanishes while its URL still sells the thing is worse than either state.
 */
async function operatorServices() {
  const overrides = await readOverrides();
  const all = resolveServices(overrides);
  return {
    hiddenSlugs: all.filter((s) => s.hidden).map((s) => s.slug),
    priceNotes: Object.fromEntries(
      all.filter((s) => s.priceNote).map((s) => [s.slug, s.priceNote as string]),
    ),
  };
}
export default async function ServicesPage({ params }: PageProps) {
  const { hiddenSlugs, priceNotes } = await operatorServices();
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.services.title}
        lead={dict.pages.services.lead}
        // Was aframeLawnWide — a tower crane stands in the sky above the third
        // cabin's roofline, at the top of the page that lists what we offer.
        image={resortImages.poolWideChalets}
        eyebrow="CHIMGAN DARBAZA"
      />

      {/* Search widget — dates/guests -> Exely engine on /bron (Exely SEO tip) */}
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.thingsTitle} text={dict.home.thingsText} />
          <div className="mt-8">
            <ServicesGrid locale={locale} hiddenSlugs={hiddenSlugs} priceNotes={priceNotes} />
          </div>
        </div>
      </section>

    </>
  );
}
