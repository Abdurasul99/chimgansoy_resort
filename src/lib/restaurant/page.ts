import type { Locale } from "@/i18n/config";
import type { PageSeo } from "@/content/types";
import type { RestaurantSettings } from "./model";
import { pickText, tashkentNow, withinHours } from "./rules";
import { restaurantAccess } from "./live";

/**
 * Общее для страницы ресторана: доступ, обложка, «открыто сейчас», SEO.
 */
export const FALLBACK_HERO = "/images/resort/stock/plov-lyagan.jpg";

export type RestaurantPage = {
  settings: RestaurantSettings;
  preview: boolean;
};

export async function restaurantPage(): Promise<RestaurantPage> {
  return restaurantAccess();
}

export function heroImage(settings: RestaurantSettings): string {
  return settings.heroImage || FALLBACK_HERO;
}

/** Открыто ли сейчас по часам; null — часы не заданы. */
export function openNow(settings: RestaurantSettings, now = Date.now()): boolean | null {
  if (!settings.hoursOpen || !settings.hoursClose) return null;
  return withinHours(settings, tashkentNow(now).minutes);
}

const SUFFIX: Record<Locale, string> = {
  ru: "меню и фото — ресторан в CHIMGAN DARBAZA",
  uz: "menyu va suratlar — CHIMGAN DARBAZA restorani",
  en: "menu and photos — restaurant at CHIMGAN DARBAZA",
};

export function restaurantSeo(settings: RestaurantSettings): PageSeo {
  const name = (l: Locale) => pickText(settings.name, l);
  const desc = (l: Locale) => pickText(settings.tagline, l) + ". " + pickText(settings.about, l);
  return {
    title: {
      ru: `«${name("ru")}» — ${SUFFIX.ru}`,
      uz: `«${name("uz")}» — ${SUFFIX.uz}`,
      en: `${name("en")} — ${SUFFIX.en}`,
    },
    description: {
      ru: desc("ru").slice(0, 300),
      uz: desc("uz").slice(0, 300),
      en: desc("en").slice(0, 300),
    },
  };
}
