import { defaultLocale, locales, type Locale } from "./config";
import { localizePath } from "./routing";

/**
 * Single-domain setup: chimgandarbaza.uz serves all three locales.
 *
 * HISTORY / WARNING: the code used to point the EN locale at
 * chimgandarbaza.com, but that domain was never purchased. Having
 * canonical/hreflang/sitemap URLs on a dead domain breaks SEO for the
 * whole hreflang cluster (Google validates alternates and x-default).
 * Do NOT reintroduce a second domain here unless it is actually
 * registered and pointed at the deployment.
 */
export const primaryDomain = "chimgandarbaza.uz";
export const primaryOrigin = `https://${primaryDomain}`;

// Kept for backwards compatibility with existing imports.
export const internationalDomain = primaryDomain;
export const domesticDomain = primaryDomain;
export const internationalOrigin = primaryOrigin;
export const domesticOrigin = primaryOrigin;

const domainDefaultLocales: Record<string, Locale> = {
  [primaryDomain]: "uz",
  [`www.${primaryDomain}`]: "uz",
};

export function normalizeHost(host: string | null | undefined) {
  return (host ?? "").split(":")[0].trim().toLowerCase().replace(/\.$/, "");
}

export function defaultLocaleForHost(host: string | null | undefined): Locale {
  return domainDefaultLocales[normalizeHost(host)] ?? defaultLocale;
}

export function originForLocale(_locale: Locale) {
  return primaryOrigin;
}

export function localizedUrl(locale: Locale, path = "/") {
  return `${originForLocale(locale)}${localizePath(locale, path)}`;
}

export function languageAlternates(path = "/") {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizedUrl(locale, path)])),
    // x-default = fallback for users whose language matches none of the
    // alternates (i.e. international visitors) → the EN page on .uz.
    "x-default": localizedUrl("en", path),
  };
}
