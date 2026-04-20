import { defaultLocale, isLocale, type Locale } from "./config";

export function localizePath(locale: Locale, path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (normalized === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalized}`;
}

export function switchLocalePath(pathname: string, targetLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = targetLocale;
    return `/${segments.join("/")}`;
  }

  return localizePath(targetLocale, pathname || "/");
}

export function stripLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && isLocale(segments[0])) {
    return `/${segments.slice(1).join("/")}`;
  }

  return pathname || "/";
}

export function localeFromUnknown(value: string | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}
