import { defaultLocale, type Locale } from "@/i18n/config";
import type { LocalizedList, LocalizedString } from "@/content/types";

export function text(value: LocalizedString, locale: Locale) {
  return value[locale] || value[defaultLocale];
}

export function list(value: LocalizedList, locale: Locale) {
  return value[locale] || value[defaultLocale];
}
