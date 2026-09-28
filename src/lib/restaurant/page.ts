import type { Locale } from "@/i18n/config";
import type { PageSeo } from "@/content/types";
import { ORDER_MODES, type OrderMode, type RestaurantSettings } from "./model";
import { pickText, tashkentNow, withinHours } from "./rules";
import { restaurantAccess } from "./live";

/**
 * Общее для страниц ресторана: доступ, открытые способы заказа, SEO.
 */
export const FALLBACK_HERO = "/images/resort/stock/plov-lyagan.jpg";

export type RestaurantPage = {
  settings: RestaurantSettings;
  preview: boolean;
  /** Способы, которыми можно заказать прямо сейчас (пусто — заказы закрыты). */
  openModes: OrderMode[];
  tablesOpen: boolean;
};

export async function restaurantPage(): Promise<RestaurantPage> {
  const { settings, preview } = await restaurantAccess();
  const accepting = settings.state === "open" || preview;
  return {
    settings,
    preview,
    openModes: accepting ? ORDER_MODES.filter((m) => settings.modes[m]) : [],
    tablesOpen: accepting && settings.tables,
  };
}

export function heroImage(settings: RestaurantSettings): string {
  return settings.heroImage || FALLBACK_HERO;
}

/** Открыто ли сейчас по часам; null — часы не заданы. */
export function openNow(settings: RestaurantSettings, now = Date.now()): boolean | null {
  if (!settings.hoursOpen || !settings.hoursClose) return null;
  return withinHours(settings, tashkentNow(now).minutes);
}

const SUFFIX: Record<"landing" | "tables", Record<Locale, string>> = {
  landing: { ru: "меню и заказ — ресторан в CHIMGAN DARBAZA", uz: "menyu va buyurtma — CHIMGAN DARBAZA restorani", en: "menu and ordering — restaurant at CHIMGAN DARBAZA" },
  tables: { ru: "бронь стола — CHIMGAN DARBAZA", uz: "stol bandi — CHIMGAN DARBAZA", en: "book a table — CHIMGAN DARBAZA" },
};

export function restaurantSeo(settings: RestaurantSettings, kind: "landing" | "tables"): PageSeo {
  const name = (l: Locale) => pickText(settings.name, l);
  const desc = (l: Locale) => pickText(settings.tagline, l) + ". " + pickText(settings.about, l);
  return {
    title: {
      ru: `«${name("ru")}» — ${SUFFIX[kind].ru}`,
      uz: `«${name("uz")}» — ${SUFFIX[kind].uz}`,
      en: `${name("en")} — ${SUFFIX[kind].en}`,
    },
    description: {
      ru: desc("ru").slice(0, 300),
      uz: desc("uz").slice(0, 300),
      en: desc("en").slice(0, 300),
    },
  };
}
