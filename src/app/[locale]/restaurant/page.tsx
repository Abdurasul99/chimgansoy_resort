import type { Metadata } from "next";
import { restaurantText } from "@/content/restaurant";
import { localizePath } from "@/i18n/routing";
import { localizedUrl } from "@/i18n/domains";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { getRestaurantMenu } from "@/lib/restaurant/live";
import { heroImage, restaurantPage, restaurantSeo } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import {
  FinalCta,
  FireSection,
  HowItWorks,
  InfoSection,
  PreviewBanner,
  Ticker,
} from "@/components/restaurant/RestaurantSections";
import { DishCard } from "@/components/restaurant/DishCard";
import { CartBar } from "@/components/restaurant/CartBar";
import { GlowLink } from "@/components/restaurant/GlowLink";
import { RestIcon } from "@/components/restaurant/RestIcon";

type PageProps = { params: Promise<{ locale: string }> };

// Наличие блюд и открытость раздела меняются в течение дня, а cookie
// предпросмотра читается на каждом запросе.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const { settings } = await restaurantPage();
  return buildMetadata(locale, restaurantSeo(settings, "landing"), "/restaurant", {
    image: heroImage(settings),
    noindex: settings.state === "hidden",
  });
}

export default async function RestaurantPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const page = await restaurantPage();
  const { settings, preview, openModes, tablesOpen } = page;
  const t = restaurantText(locale);
  const menu = await getRestaurantMenu();
  const name = pickText(settings.name, locale);

  // Превью меню: сначала то, что можно заказать и что с фото, — первое
  // впечатление должно быть «вкусным», а не серым «временно нет».
  const teaser = [...menu.dishes]
    .sort((a, b) => Number(b.availability === "available") - Number(a.availability === "available") || Number(Boolean(b.image)) - Number(Boolean(a.image)))
    .slice(0, 8);
  const catTitles = menu.categories.map((c) => pickText(c.title, locale)).filter(Boolean);
  const words = catTitles.length >= 3 ? catTitles : t.marquee;
  const catName = new Map(menu.categories.map((c) => [c.id, pickText(c.title, locale)]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    description: pickText(settings.tagline, locale),
    url: localizedUrl(locale, "/restaurant"),
    image: new URL(heroImage(settings), "https://chimgandarbaza.uz").toString(),
    hasMenu: localizedUrl(locale, "/restaurant/menu"),
    ...(settings.phones[0] ? { telephone: settings.phones[0] } : {}),
    ...(settings.hoursOpen && settings.hoursClose
      ? { openingHours: `Mo-Su ${settings.hoursOpen}-${settings.hoursClose}` }
      : {}),
    containedInPlace: { "@type": "LodgingBusiness", name: "CHIMGAN DARBAZA", url: localizedUrl(locale, "/") },
  };

  return (
    <div className="rest bg-[#fcf4e6]">
      {preview && <PreviewBanner locale={locale} />}
      {settings.state === "open" || preview ? null : (
        <div className="relative z-[55] bg-[#1f1712] px-4 py-2.5 text-center text-sm font-semibold text-[#ffd9a0]">{t.closedBanner}</div>
      )}
      <RestaurantHero locale={locale} settings={settings} openModes={openModes} tablesOpen={tablesOpen} />
      <Ticker words={words} />
      <HowItWorks locale={locale} />

      <section className="relative bg-gradient-to-b from-[#fcf4e6] via-[#f8ead2] to-[#fcf4e6] px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#c2410c]">{t.teaserEyebrow}</p>
              <h2 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.2rem)] font-bold leading-[0.95] text-[#1f1712]">{t.teaserTitle}</h2>
            </div>
            <GlowLink
              href={localizePath(locale, "/restaurant/menu")}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f1712] px-6 text-sm font-extrabold text-[#ffc46b]"
            >
              {t.teaserCta}
              <RestIcon name="arrow" className="h-4 w-4" />
            </GlowLink>
          </div>
          {teaser.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-dashed border-[#e0c9a4] bg-white/60 px-6 py-14 text-center">
              <RestIcon name="cloche" className="mx-auto h-12 w-12 text-[#ff6a2b]" />
              <p className="mt-4 font-serif text-2xl font-bold text-[#1f1712]">{t.teaserEmpty}</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {teaser.map((d) => (
                <DishCard
                  key={d.id}
                  dish={d}
                  locale={locale}
                  orderable={openModes.length > 0}
                  preorderOpen={openModes.includes("preorder")}
                  category={d.categoryId ? catName.get(d.categoryId) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <FireSection locale={locale} />
      <InfoSection locale={locale} settings={settings} />
      <FinalCta locale={locale} name={name} tablesOpen={tablesOpen} />
      {openModes.length > 0 && <CartBar locale={locale} dishes={menu.dishes} />}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
