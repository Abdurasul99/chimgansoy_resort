import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { mainNavigation } from "@/content/navigation";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { text } from "@/lib/localize";
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
 * Six hours matches the unstable_cache TTL in lib/room-price.ts, so this adds no
 * outbound requests — it only lets a bad build heal itself.
 */
export const revalidate = 21600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  // Rooms are live and bookable — fully indexable.
  return buildMetadata(locale, pageSeo.rooms, "/nomera");
}

const copy = {
  ru: {
    perksTitle: "В каждом размещении",
    perks: [
      "Бассейн включён в стоимость",
      "Панорама Чимгана из окна",
      "Собственная терраса и парковка у домика",
      "Кухня и готовое меню на территории",
    ],
  },
  uz: {
    perksTitle: "Har bir turar joyda",
    perks: [
      "Basseyn narxga kiritilgan",
      "Derazadan Chimg'on panoramasi",
      "Xususiy terrasa va uycha yonida parking",
      "Hududda oshxona va tayyor menyu",
    ],
  },
  en: {
    perksTitle: "Every stay includes",
    perks: [
      "The pool, included in the rate",
      "Chimgan views from the window",
      "A private terrace and parking by the cabin",
      "Kitchen and ready-made menu on site",
    ],
  },
} as const;

export default async function RoomsPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);

  // Live "от …" prices from the booking engine, resolved on the server because
  // RoomCatalog is a client component. Six-hour cache, and an unreachable
  // engine simply yields no chip — see lib/room-price.ts.
  const prices = await getRoomPrices();
  const priceChips = Object.fromEntries(
    Object.entries(prices).map(([slug, value]) => [slug, priceChip(value, locale)]),
  );
  const dict = dictionaries[locale];
  const t = copy[locale];

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: text(mainNavigation[0].label, locale), path: "/" },
          { name: dict.pages.rooms.title, path: "/nomera" },
        ]}
      />
      <PageHero
        locale={locale}
        title={dict.pages.rooms.title}
        lead={dict.pages.rooms.lead}
        image={resortImages.aframeLawnBanner}
        eyebrow="CHIMGAN DARBAZA"
      />

      {/* Search widget — dates/guests -> Exely engine on /bron (Exely SEO tip) */}
      <BookingWidget locale={locale} />

      {/* Room catalog — glamping + cottage, both bookable */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.roomsTitle} text={dict.home.roomsText} />
          <div className="mt-10">
            <RoomCatalog locale={locale} priceChips={priceChips} />
          </div>

          {/* What every stay includes */}
          <div className="mt-14 rounded-[4px] bg-[var(--mountain)] p-7 text-white sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">
              {t.perksTitle}
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {t.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-sm leading-6 text-white/85">
                  <span aria-hidden className="mt-2 inline-block h-1 w-3 shrink-0 bg-[var(--sun)]" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
