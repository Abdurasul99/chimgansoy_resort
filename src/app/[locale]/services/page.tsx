import type { Metadata } from "next";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { PageHero } from "@/components/sections/PageHero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.services, "/services");
}

export default async function ServicesPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.services.title}
        lead={dict.pages.services.lead}
        image={resortImages.poolLifestyle}
        eyebrow="CHIMGANSOY"
      />
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.thingsTitle} text={dict.home.thingsText} />
          <div className="mt-8">
            <ServicesGrid locale={locale} />
          </div>
        </div>
      </section>
    </>
  );
}
