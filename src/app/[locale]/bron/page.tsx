import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
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
  return buildMetadata(locale, pageSeo.booking, "/bron");
}

/**
 * Booking page — hosts the Exely Booking Engine only. The head loader (see
 * [locale]/layout.tsx) embeds the engine into #be-booking-form. Per Exely's
 * checklist this page is kept clean: no search form, no contact blocks, no
 * room/promo lists — nothing that distracts from completing the booking.
 */
export default async function BookingPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.booking.title}
        lead={dict.pages.booking.lead}
        image={resortImages.glampingDay}
        eyebrow="CHIMGAN DARBAZA"
      />

      {/* Exely booking engine is injected here by the head loader. */}
      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div id="be-booking-form" suppressHydrationWarning />
      </section>
    </>
  );
}
