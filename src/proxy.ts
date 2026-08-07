import { NextResponse, type NextRequest } from "next/server";
import { locales } from "@/i18n/config";
import { defaultLocaleForHost } from "@/i18n/domains";
import { adminHost, isAdminHost, requestHost } from "@/lib/admin-host";

const PUBLIC_SITE = "https://chimgandarbaza.uz";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const configured = adminHost();

  /**
   * Host split, when ADMIN_HOST is configured.
   *
   * Two rules, and both are needed for the move to mean anything:
   *
   *  • the panel answers ONLY on the admin host. Leaving /admin live on the
   *    public domain as well would make moving it a rename, not a move.
   *  • the admin host serves ONLY the panel. Without this the entire resort
   *    site is duplicated on a second domain, which splits its own search
   *    ranking and gives guests two addresses for the same pages.
   *
   * Everything else on the admin host is sent to the public site rather than
   * 404'd: somebody who mistypes the address should land on the resort, not on
   * an error page.
   */
  if (configured) {
    const onAdminHost = isAdminHost(host);
    const wantsAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

    if (wantsAdmin && !onAdminHost) {
      // Not a redirect: a redirect would advertise where the panel moved to.
      return new NextResponse(null, { status: 404 });
    }

    if (onAdminHost && !wantsAdmin) {
      const target = new URL(pathname === "/" ? "/" : pathname, PUBLIC_SITE);
      target.search = request.nextUrl.search;
      return NextResponse.redirect(target, 308);
    }
  }

  /**
   * The panel has no locale and must never be rewritten to one.
   *
   * This used to be handled by excluding `admin` from the matcher, but the host
   * split above needs to see those requests in order to refuse them on the
   * public domain — so the exclusion moved here, where it is a return rather
   * than an absence. Verified before the panel existed: without it, GET /admin
   * answered 307 to /ru/admin, exactly as GET /xx does.
   */
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return;
  }

  // Locale routing for the public site. The admin host never reaches this,
  // because everything that is not /admin has already been redirected away.
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathnameHasLocale) {
    return;
  }

  const hostDefaultLocale = defaultLocaleForHost(requestHost(host));

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
 * `admin` is NO LONGER excluded: the host split above has to see those requests
 * to answer 404 for them on the public domain. It is still never rewritten to a
 * locale — the branch above returns before the locale logic on the admin host,
 * and on the public host /admin is refused outright.
 */
export const config = {
  matcher: [
    "/((?!_next|_vercel|api|favicon.ico|icon.svg|apple-icon.png|-/opengraph-image|opengraph-image|robots.txt|sitemap.xml|images|file.svg|globe.svg|next.svg|vercel.svg|window.svg|yandex_ba7cbd0977b91438.html).*)",
  ],
};
