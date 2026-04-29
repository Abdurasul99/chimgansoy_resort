import { defaultLocale, locales, type Locale } from "./config";
import { localizePath } from "./routing";

export const internationalDomain = "chimgansoy.com";
export const domesticDomain = "chimgansoy.uz";

export const internationalOrigin = `https://${internationalDomain}`;
export const domesticOrigin = `https://${domesticDomain}`;

const domainDefaultLocales: Record<string, Locale> = {
  [internationalDomain]: "en",
  [`www.${internationalDomain}`]: "en",
  [domesticDomain]: "uz",
  [`www.${domesticDomain}`]: "uz",
};

const localePrimaryOrigins: Record<Locale, string> = {
  en: internationalOrigin,
  ru: domesticOrigin,
  uz: domesticOrigin,
};

export function normalizeHost(host: string | null | undefined) {
  return (host ?? "").split(":")[0].trim().toLowerCase().replace(/\.$/, "");
}

export function defaultLocaleForHost(host: string | null | undefined): Locale {
  return domainDefaultLocales[normalizeHost(host)] ?? defaultLocale;
}

export function originForLocale(locale: Locale) {
  return localePrimaryOrigins[locale];
}

export function localizedUrl(locale: Locale, path = "/") {
  return `${originForLocale(locale)}${localizePath(locale, path)}`;
}

export function languageAlternates(path = "/") {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizedUrl(locale, path)])),
    "x-default": localizedUrl("en", path),
  };
}
