import type { Metadata } from "next";
import { restaurantText } from "@/content/restaurant";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { getRestaurantMenu } from "@/lib/restaurant/live";
import { ORDER_MODES, type OrderMode } from "@/lib/restaurant/model";
import { heroImage, restaurantPage, restaurantSeo } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { MenuBrowser } from "@/components/restaurant/MenuBrowser";
import { PreviewBanner, RestaurantPageHead } from "@/components/restaurant/RestaurantSections";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const { settings } = await restaurantPage();
  return buildMetadata(locale, restaurantSeo(settings, "menu"), "/restaurant/menu", {
    image: heroImage(settings),
    noindex: settings.state === "hidden",
  });
}

export default async function RestaurantMenuPage({ params, searchParams }: PageProps) {
  const locale = await getLocaleParam(params);
  const page = await restaurantPage();
  const { settings, preview, openModes } = page;
  const t = restaurantText(locale);
  const menu = await getRestaurantMenu();
  const sp = await searchParams;
  const modeParam = typeof sp.mode === "string" ? sp.mode : "";
  const initialMode = ORDER_MODES.includes(modeParam as OrderMode) ? (modeParam as OrderMode) : null;

  return (
    <div className="rest bg-[#fcf4e6]">
      {preview && <PreviewBanner locale={locale} />}
      <RestaurantPageHead
        eyebrow={t.menu.eyebrow}
        title={t.menu.title}
        lead={openModes.length ? t.menu.lead : t.closedBanner}
        name={pickText(settings.name, locale)}
      />
      <section className="px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <MenuBrowser
            locale={locale}
            categories={menu.categories}
            dishes={menu.dishes}
            openModes={openModes}
            initialMode={initialMode}
          />
        </div>
      </section>
    </div>
  );
}
