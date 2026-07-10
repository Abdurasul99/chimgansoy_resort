import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ExelyBookingEngine } from "@/components/sections/ExelyBookingEngine";
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
 * Booking page — hosts the Exely Booking Engine. The head loader (see
 * [locale]/layout.tsx) embeds the engine into #be-booking-form. Kept clean per
 * Exely's checklist: no search form, no room/promo lists. The only extra is a
 * direct-contact fallback that appears ONLY if the engine fails to load (it
 * can't reach its Uzbekistan data host from some countries) — see
 * ExelyBookingEngine.
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
        image={resortImages.galTerritoryPanorama}
        eyebrow="CHIMGAN DARBAZA"
      />

      <ExelyBookingEngine locale={locale} />
    </>
  );
}
