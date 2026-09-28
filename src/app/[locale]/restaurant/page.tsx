import type { Metadata } from "next";
import { restaurantText } from "@/content/restaurant";
import { localizedUrl } from "@/i18n/domains";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { getRestaurantMenu } from "@/lib/restaurant/live";
import { ORDER_MODES, type OrderMode } from "@/lib/restaurant/model";
import { heroImage, restaurantPage, restaurantSeo } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { MenuBrowser } from "@/components/restaurant/MenuBrowser";
import { Notice, PreviewBanner, StoreHeader } from "@/components/restaurant/RestaurantSections";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

/**
 * Ресторан — одна страница-витрина, как карточка заведения в приложении
 * доставки: сверху ресторан, ниже сразу меню с корзиной. Отдельная страница
 * «Меню» теперь ведёт сюда (redirects в next.config.ts).
 */
export default async function RestaurantPage({ params, searchParams }: PageProps) {
  const locale = await getLocaleParam(params);
  const page = await restaurantPage();
  const { settings, preview, openModes, tablesOpen } = page;
  const t = restaurantText(locale);
  const menu = await getRestaurantMenu();
  const name = pickText(settings.name, locale);
  const sp = await searchParams;
  const modeParam = typeof sp.mode === "string" ? sp.mode : "";
  const initialMode = ORDER_MODES.includes(modeParam as OrderMode) ? (modeParam as OrderMode) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    description: pickText(settings.tagline, locale),
    url: localizedUrl(locale, "/restaurant"),
    image: new URL(heroImage(settings), "https://chimgandarbaza.uz").toString(),
    hasMenu: localizedUrl(locale, "/restaurant"),
    ...(settings.phones[0] ? { telephone: settings.phones[0] } : {}),
    ...(settings.hoursOpen && settings.hoursClose
      ? { openingHours: `Mo-Su ${settings.hoursOpen}-${settings.hoursClose}` }
      : {}),
    containedInPlace: { "@type": "LodgingBusiness", name: "CHIMGAN DARBAZA", url: localizedUrl(locale, "/") },
  };

  return (
    <div className="rest bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-20">
        {/* «Приём заказов скоро, меню уже можно посмотреть» — только когда
            меню есть; пустую витрину объясняет её собственная заглушка. */}
        {(preview || (openModes.length === 0 && menu.dishes.length > 0)) && (
          <div className="mb-4">
            {preview ? <PreviewBanner locale={locale} /> : <Notice tone="info">{t.closedBanner}</Notice>}
          </div>
        )}
        <StoreHeader locale={locale} settings={settings} tablesOpen={tablesOpen} />
        <div className="mt-8">
          <MenuBrowser
            locale={locale}
            categories={menu.categories}
            dishes={menu.dishes}
            openModes={openModes}
            initialMode={initialMode}
            fees={{ deliveryFee: settings.deliveryFee, roomFee: settings.roomFee }}
          />
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
