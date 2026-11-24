import type { Metadata } from "next";
import { localizedUrl } from "@/i18n/domains";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { getRestaurantMenu } from "@/lib/restaurant/live";
import { heroImage, openNow, restaurantPage, restaurantSeo } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { contacts } from "@/content/contacts";
import { MenuBoard } from "@/components/restaurant/MenuBoard";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { RestaurantInfo } from "@/components/restaurant/RestaurantInfo";
import { PreviewBanner } from "@/components/restaurant/RestaurantSections";
import { SignatureDishes } from "@/components/restaurant/SignatureDishes";

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
 * Ресторан — одна страница: первый экран с историями, блюда с фото, меню и
 * «с собой».
 *
 * С 12.10.2026 (решение владельца) здесь нет заказов, корзины и брони столов:
 * гость смотрит блюда, цены и фото, а вопросы задаёт по телефону. Прежние
 * адреса /restaurant/checkout, /tables, /order/… и /menu ведут сюда
 * (redirects в next.config.ts).
 *
 * С 24.11.2026 страница тёмная, в стиле Instagram ресторана (владелец: «чтобы
 * было вау»). Шапка сайта над ней прозрачная, потом — тёмное стекло
 * (Header.tsx, darkPage).
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

  const hours = settings.hoursOpen && settings.hoursClose ? `${settings.hoursOpen}–${settings.hoursClose}` : "";

  return (
    <div className="rest sz sz-page">
      {preview && (
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <PreviewBanner locale={locale} />
        </div>
      )}
      <RestaurantHero
        locale={locale}
        name={name}
        hours={hours}
        open={openNow(settings)}
        phone={settings.phones[0] ?? contacts.phone}
        announcement={pickText(settings.announcement, locale)}
        gallery={settings.gallery}
      />
      <SignatureDishes dishes={menu.dishes} locale={locale} />
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6 lg:px-8">
        <MenuBoard locale={locale} categories={menu.categories} dishes={menu.dishes} />
      </div>
      <RestaurantInfo locale={locale} about={pickText(settings.about, locale)} instagram={settings.instagram} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
