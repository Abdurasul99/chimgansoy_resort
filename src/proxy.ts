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

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|icon.svg|apple-icon.png|-/opengraph-image|opengraph-image|robots.txt|sitemap.xml|images|file.svg|globe.svg|next.svg|vercel.svg|window.svg|yandex_ba7cbd0977b91438.html).*)",
  ],
};
