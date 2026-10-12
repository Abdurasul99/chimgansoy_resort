import type { Metadata } from "next";
import { localizedUrl } from "@/i18n/domains";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { getRestaurantMenu } from "@/lib/restaurant/live";
import { heroImage, restaurantPage, restaurantSeo } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { MenuBrowser } from "@/components/restaurant/MenuBrowser";
import { RestaurantGallery } from "@/components/restaurant/RestaurantGallery";
import { PreviewBanner, StoreHeader } from "@/components/restaurant/RestaurantSections";

type PageProps = { params: Promise<{ locale: string }> };

// Наличие блюд меняется в течение дня, а cookie предпросмотра читается на
// каждом запросе.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const { settings } = await restaurantPage();
  return buildMetadata(locale, restaurantSeo(settings), "/restaurant", {
    image: heroImage(settings),
    noindex: settings.state === "hidden",
  });
}

/**
 * Ресторан — одна страница: шапка заведения, фотогалерея и меню.
 *
 * С 12.10.2026 (решение владельца) здесь нет заказов, корзины и брони столов:
 * гость смотрит блюда, цены и фото, а вопросы задаёт по телефону. Прежние
 * адреса /restaurant/checkout, /tables, /order/… и /menu ведут сюда
 * (redirects в next.config.ts).
 */
export default async function RestaurantPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const { settings, preview } = await restaurantPage();
  const menu = await getRestaurantMenu();
  const name = pickText(settings.name, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    description: pickText(settings.tagline, locale),
    url: localizedUrl(locale, "/restaurant"),
    image: [heroImage(settings), ...settings.gallery].map((src) => new URL(src, "https://chimgandarbaza.uz").toString()),
    hasMenu: localizedUrl(locale, "/restaurant"),
    ...(settings.phones[0] ? { telephone: settings.phones[0] } : {}),
    ...(settings.hoursOpen && settings.hoursClose
      ? { openingHours: `Mo-Su ${settings.hoursOpen}-${settings.hoursClose}` }
      : {}),
    containedInPlace: { "@type": "LodgingBusiness", name: "CHIMGAN DARBAZA", url: localizedUrl(locale, "/") },
  };

  return (
    <div className="rest bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        {preview && (
          <div className="mb-4">
            <PreviewBanner locale={locale} />
          </div>
        )}
        <StoreHeader locale={locale} settings={settings} />
        <RestaurantGallery photos={settings.gallery} name={name} locale={locale} />
        <div className="mt-8">
          <MenuBrowser locale={locale} categories={menu.categories} dishes={menu.dishes} />
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
