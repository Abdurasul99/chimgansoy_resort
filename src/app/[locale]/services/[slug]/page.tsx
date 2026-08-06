import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { MenuBoard } from "@/components/sections/MenuBoard";
import { PageHero } from "@/components/sections/PageHero";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { services } from "@/content/services";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { getLocaleParam, getService } from "@/lib/content";
import { getService as getLiveService } from "@/lib/services-live";
import { buildMetadata } from "@/lib/metadata";
import { list, text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";
import { getRoomPrices, priceChip } from "@/lib/room-price";

/**
 * Revalidated every six hours because the «от …» chip is a LIVE price.
 *
 * Without this the page is fully static and the price is whatever the booking
 * engine happened to answer during the build. Exely returns an empty offer list
 * often enough — sold out, or simply slow — and when that lands on a build, every
 * room page ships «Цена при бронировании» and stays that way until somebody
 * redeploys. The operator saw exactly that on the chalet page on 2026-08-06.
 *
 * Fifteen minutes, not six hours: page revalidation reads the six-hour data
 * cache in lib/room-price.ts, so a short window costs no extra outbound
 * requests — it only decides how long a bad build stays visible. Six hours of
 * «Цена при бронировании» on a page the engine is happily quoting is too long.
 */
export const revalidate = 900;

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

// Without this, any slug outside generateStaticParams is rendered on demand and
// answers 200 with an empty page instead of 404 — so /services/tapchan-zone,
// retired with the day visit but already indexed, kept returning a live URL.
// (nomera/[slug] has always set this; services/[slug] never did, which means
// every invalid service URL has been answering 200.)
export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const service = getService(slug);

  return buildMetadata(
    locale,
    {
      title: {
        ru: `${text(service.title, "ru")} CHIMGAN DARBAZA`,
        uz: `${text(service.title, "uz")} CHIMGAN DARBAZA`,
        en: `${text(service.title, "en")} at CHIMGAN DARBAZA`,
      },
      description: service.shortDescription,
    },
    `/services/${service.slug}`,
  );
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocaleParam(params);

  // Live "от …" prices from the booking engine, resolved on the server because
  // RoomCatalog is a client component. Six-hour cache, and an unreachable
  // engine simply yields no chip — see lib/room-price.ts.
  const prices = await getRoomPrices();
  const priceChips = Object.fromEntries(
    Object.entries(prices).map(([slug, value]) => [slug, priceChip(value, locale)]),
  );
  const service = getService(slug);
  // A service the operator switched off must not keep answering on its own URL.
  if (!(await getLiveService(slug))) notFound();
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={text(service.title, locale)}
        lead={text(service.shortDescription, locale)}
        image={resortImages[service.image]}
        eyebrow={text(service.bestFor, locale)}
      />
      <BookingWidget locale={locale} />

      {/* The kitchen page is the one place a full menu belongs. */}
      {service.slug === "restaurant" && <MenuBoard locale={locale} />}

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          {/* A DIFFERENT photograph from the hero. Both frames used service.image, so
              every service page printed the same picture twice on one scroll. */}
          <ImageFrame image={resortImages[service.secondImage]} locale={locale} className="aspect-[4/5] lg:sticky lg:top-28" priority />
          <div>
            <SectionHeader title={text(service.title, locale)} text={text(service.description, locale)} />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {list(service.highlights, locale).map((item) => (
                <div key={item} className="rounded-xl border border-[color:var(--line)] bg-[var(--paper)] p-4 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-card)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary" reload>
                {dict.bookNow}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/nomera")} variant="ghost">
                {dict.pages.rooms.title}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.roomsTitle} text={dict.home.roomsText} />
          <div className="mt-8">
            <RoomCatalog locale={locale} priceChips={priceChips} />
          </div>
        </div>
      </section>
    </>
  );
}
