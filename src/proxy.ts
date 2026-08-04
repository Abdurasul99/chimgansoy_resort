import { NextResponse, type NextRequest } from "next/server";
import { locales } from "@/i18n/config";
import { defaultLocaleForHost } from "@/i18n/domains";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathnameHasLocale) {
    return;
  }

  const hostDefaultLocale = defaultLocaleForHost(request.headers.get("host"));

  request.nextUrl.pathname = `/${hostDefaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

/**
 * `_vercel` is excluded because it is Vercel's own namespace, not a page.
 * Measured on production before the exclusion: GET /_vercel/insights/script.js
 * answered 307 to /uz/_vercel/insights/script.js. The project has Web Analytics
 * provisioned (it has an id), so the day anyone mounts <Analytics/> it would
 * have collected nothing and looked like a Vercel fault rather than ours.
 *
 * `admin` is excluded for the same reason as `api`: it is not a page of the
 * public site and has no locale. Without it here, /admin is rewritten to
 * /ru/admin and answered by the [locale] segment as though "admin" were a
 * language — verified before the panel existed: GET /admin returned 307 to
 * /ru/admin, exactly as GET /xx does.
 */
export const config = {
  matcher: [
    "/((?!_next|_vercel|api|admin|favicon.ico|icon.svg|apple-icon.png|-/opengraph-image|opengraph-image|robots.txt|sitemap.xml|images|file.svg|globe.svg|next.svg|vercel.svg|window.svg|yandex_ba7cbd0977b91438.html).*)",
  ],
};
