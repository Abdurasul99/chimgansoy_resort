import type { Locale } from "@/i18n/config";
import type { LocalizedString } from "@/content/types";
import { GALLERY_MAX, RESTAURANT_STATES, type RestaurantSettings } from "./model";

/**
 * Правила ресторана без базы и без React: часы работы, настройки по умолчанию
 * и их проверка, выбор языка текста.
 */

// ─── Время по Ташкенту ─────────────────────────────────────────────────────

/** Ташкент — UTC+5 без перехода на летнее время. */
const TZ_OFFSET_MS = 5 * 3600_000;

/** «Сейчас» по Ташкенту как дата и минуты от полуночи. */
export function tashkentNow(now = Date.now()): { date: string; minutes: number } {
  const d = new Date(now + TZ_OFFSET_MS);
  return {
    date: d.toISOString().slice(0, 10),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toMinutes(hhmm: string): number | null {
  const m = HHMM.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Попадает ли время в часы работы.
 *
 * Часы могут переходить через полночь (12:00–02:00) — тогда «открыто» это
 * «после открытия ИЛИ до закрытия». Часы не заданы — ограничения нет.
 * Минута закрытия уже не рабочая.
 */
export function withinHours(settings: Pick<RestaurantSettings, "hoursOpen" | "hoursClose">, minutes: number): boolean {
  const open = toMinutes(settings.hoursOpen);
  const close = toMinutes(settings.hoursClose);
  if (open === null || close === null || open === close) return true;
  if (open < close) return minutes >= open && minutes < close;
  return minutes >= open || minutes < close;
}

// ─── Настройки ─────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: RestaurantSettings = {
  state: "hidden",
  // Рабочее название из ТЗ. Публичное название меняется в админке, а не здесь.
  name: { ru: "Сазанчик", uz: "Sazanchik", en: "Sazanchik" },
  tagline: {
    ru: "Ресторан в CHIMGAN DARBAZA",
    uz: "CHIMGAN DARBAZA’dagi restoran",
    en: "The restaurant at CHIMGAN DARBAZA",
  },
  about: {
    ru: "Ресторан «Сазанчик» — в горах, на территории CHIMGAN DARBAZA. Открыт для всех: приезжайте пообедать или поужинать, даже если не живёте у нас.",
    uz: "«Sazanchik» restorani — tog'larda, CHIMGAN DARBAZA hududida. Hamma uchun ochiq: biznikida yashamasangiz ham tushlik yoki kechki ovqatga keling.",
    en: "Sazanchik is in the mountains, on the grounds of CHIMGAN DARBAZA. It is open to everyone: come for lunch or dinner even if you are not staying with us.",
  },
  announcement: { ru: "", uz: "", en: "" },
  hoursOpen: "",
  hoursClose: "",
  phones: [],
  instagram: "",
  telegram: "",
  heroImage: "",
  gallery: [],
};

/**
 * Прежний текст «О ресторане» звал выбирать блюда на сайте и заказывать
 * доставку. Он сохранён в базе как настройка, поэтому без замены продолжал бы
 * обещать заказ, которого больше нет. Свой текст ресторана не трогается.
 */
const ORDERING_ABOUT_RU = "Выберите блюда на сайте: заберите сами, закажите доставку или подачу в домик.";

function str(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function ls(v: unknown, fallback: LocalizedString, max = 2000): LocalizedString {
  if (!v || typeof v !== "object") return fallback;
  const o = v as Record<string, unknown>;
  return { ru: str(o.ru, max), uz: str(o.uz, max), en: str(o.en, max) };
}

const SAFE_URL = /^https:\/\/[^\s"'<>]+$/;
const IMAGE_URL = /^(https:\/\/|\/)[^\s"'<>]+$/;

/**
 * Настройки из базы → полная и проверенная структура.
 *
 * Никогда не бросает: битая строка в базе не должна ронять страницы. Чего нет
 * или что не прошло проверку — берётся из DEFAULT_SETTINGS. Поля прежних
 * заказов (modes, tables, сборы) молча отбрасываются и при следующем сохранении
 * исчезают из базы.
 */
export function normalizeSettings(raw: unknown): RestaurantSettings {
  const d = DEFAULT_SETTINGS;
  if (!raw || typeof raw !== "object") return { ...d };
  const o = raw as Record<string, unknown>;
  const hours = (v: unknown) => (toMinutes(str(v, 5)) === null ? "" : str(v, 5));
  const url = (v: unknown) => (SAFE_URL.test(str(v, 300)) ? str(v, 300) : "");
  const image = (v: unknown) => (IMAGE_URL.test(str(v, 400)) ? str(v, 400) : "");
  const about = ls(o.about, d.about, 1500);

  return {
    state: o.state === "announce" ? "open" : RESTAURANT_STATES.includes(o.state as never) ? (o.state as RestaurantSettings["state"]) : d.state,
    name: ls(o.name, d.name, 80),
    tagline: ls(o.tagline, d.tagline, 160),
    about: about.ru.includes(ORDERING_ABOUT_RU) ? d.about : about,
    announcement: ls(o.announcement, d.announcement, 300),
    hoursOpen: hours(o.hoursOpen),
    hoursClose: hours(o.hoursClose),
    phones: Array.isArray(o.phones)
      ? o.phones.map((p) => str(p, 32)).filter((p) => /^\+?[\d\s()-]{7,20}$/.test(p)).slice(0, 4)
      : [],
    instagram: url(o.instagram),
    telegram: url(o.telegram),
    heroImage: image(o.heroImage),
    gallery: Array.isArray(o.gallery) ? [...new Set(o.gallery.map(image).filter(Boolean))].slice(0, GALLERY_MAX) : [],
  };
}

export function pickText(value: LocalizedString, locale: Locale): string {
  return value[locale]?.trim() || value.ru?.trim() || value.uz?.trim() || value.en?.trim() || "";
}
