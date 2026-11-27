import { NextResponse, type NextRequest } from "next/server";
import { locales } from "@/i18n/config";
import { defaultLocaleForHost } from "@/i18n/domains";
import { adminHost, isAdminHost, requestHost } from "@/lib/admin-host";
import { ADMIN_COOKIE, homeFor, roleCanOpen, sessionFromToken } from "@/lib/admin-session";
import { policies } from "@/content/policies";
import { rooms } from "@/content/rooms";

const PUBLIC_SITE = "https://chimgandarbaza.uz";

/**
 * Неизвестный домик или документ — честный 404 ещё до рендера.
 *
 * Страницы под [locale] обёрнуты в loading.tsx (Suspense), поэтому ответ
 * уходит потоком: код 200 отправлен раньше, чем страница доходит до
 * notFound(). До 17.11.2026 /ru/legal/stay-rules и /ru/nomera/что-угодно
 * отвечали 200 с «Страница не найдена» внутри — и ботам тоже; спасал только
 * noindex, который Next дописывает в поток. Search Console считает такое
 * «мягким 404».
 *
 * Списки — те же, что у самих страниц (getPolicy, roomOr404): новый документ
 * или домик в content/ попадает сюда сам. /services/[slug] не здесь: услуги
 * приходят из базы, и proxy их не знает.
 */
const KNOWN_SLUGS: Record<string, Set<string>> = {
  legal: new Set(policies.map((p) => p.slug)),
  nomera: new Set(rooms.filter((r) => r.available !== false).map((r) => r.slug)),
};
const DETAIL_PATH = /^\/[a-z]{2}\/(legal|nomera)\/([^/]+)\/?$/;

/**
 * Разделы верхнего уровня под [locale] — ровно папки src/app/[locale]/.
 * Неизвестный раздел (/ru/nomeraa) — сразу 404, иначе ловушка [...missing]
 * отдала бы фирменную страницу с кодом 200. Список сверяет с папками тест
 * src/lib/__tests__/proxy-not-found.test.ts: новую страницу без строки здесь
 * он не пропустит.
 */
export const LOCALE_SECTIONS = new Set([
  "about", "adminpartners", "bron", "contact", "legal", "nomera", "notfound", "novosti",
  "novyi-god", "opengraph-image", "partners", "place", "restaurant", "services", "topchan", "tubing",
]);

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
      /**
       * Корень админского домена — это панель, а не витрина.
       *
       * Здесь стоял общий редирект «всё, что не /admin, — на публичный сайт», и
       * под него попадал сам корень: chimgansoy.com отвечал 308 на
       * chimgandarbaza.uz. Адрес панели невозможно было просто открыть — его
       * приходилось знать целиком, вместе с /admin.
       *
       * /login — тот же вход: незалогиненного встречает форма пароля на
       * /admin, и увести его на публичный сайт означало бы, что человек с
       * паролем никуда не попадёт.
       */
      if (pathname === "/" || pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url, 307);
      }

      // Остальное — на публичный сайт: опечатка в адресе должна приводить к
      // курорту, а не к пустой странице, и второй копии сайта на втором домене
      // быть не должно.
      const target = new URL(pathname, PUBLIC_SITE);
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
    /*
     * Права — здесь, а не только в layout панели. Layout не перерисовывается
     * при переходах внутри панели, и проверку в нём можно обойти собранным
     * вручную RSC-запросом. Proxy видит каждый запрос.
     *
     *  • без входа — только /admin, где форма пароля;
     *  • вход ресторана — только свой раздел, остальное уводит в него.
     */
    const session = sessionFromToken(request.cookies.get(ADMIN_COOKIE)?.value);
    const target = !session ? (pathname === "/admin" ? null : "/admin") : roleCanOpen(session.role, pathname) ? null : homeFor(session.role);
    // Вызов server action (заголовок Next-Action) не уводим: редирект POST-а
    // браузер повторил бы на /admin, и вместо «Нет прав — войдите снова»
    // человек увидел бы страницу ошибки. Права действие проверит само.
    const isAction = request.method === "POST" && request.headers.has("next-action");
    if (target && target !== pathname && !isAction) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      url.search = "";
      return NextResponse.redirect(url, 307);
    }
    /*
     * Путь — в заголовок запроса для layout панели: layout не получает
     * pathname, а ему нужно решить, пускать ли на эту страницу вход ресторана
     * (у менеджера и официантов «Сазанчика» свой пароль и только свой раздел).
     * Заголовок ставится здесь и перезаписывает всё, что прислал браузер.
     */
    const headers = new Headers(request.headers);
    headers.set("x-admin-path", pathname);
    return NextResponse.next({ request: { headers } });
  }

  // Locale routing for the public site. The admin host never reaches this,
  // because everything that is not /admin has already been redirected away.
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathnameHasLocale) {
    const section = pathname.split("/")[2];
    const detail = pathname.match(DETAIL_PATH);
    const unknownSection = section !== undefined && section !== "" && !LOCALE_SECTIONS.has(section);
    if (unknownSection || (detail && !KNOWN_SLUGS[detail[1]].has(safeDecode(detail[2])))) {
      // Фирменная страница 404 с настоящим кодом 404.
      const url = request.nextUrl.clone();
      url.pathname = `${pathname.slice(0, 3)}/notfound`;
      return NextResponse.rewrite(url, { status: 404 });
    }
    return;
  }

  const hostDefaultLocale = defaultLocaleForHost(requestHost(host));

  request.nextUrl.pathname = `/${hostDefaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * `_vercel` is excluded because it is Vercel's own namespace, not a page.
 * Measured on production before the exclusion: GET /_vercel/insights/script.js
 * answered 307 to /uz/_vercel/insights/script.js. The project has Web Analytics
 * provisioned (it has an id), so the day anyone mounts <Analytics/> it would
 * have collected nothing and looked like a Vercel fault rather than ours.
 *
 * `documents` — папка с PDF (сертификат): без исключения запрос за файлом
 * получал 307 на /uz/documents/… и скачивание ломалось так же, как ломались
 * бы картинки без своего исключения.
 *
 * `admin` is NO LONGER excluded: the host split above has to see those requests
 * to answer 404 for them on the public domain. It is still never rewritten to a
 * locale — the branch above returns before the locale logic on the admin host,
 * and on the public host /admin is refused outright.
 */
export const config = {
  matcher: [
    "/((?!_next|_vercel|api|favicon.ico|icon.svg|apple-icon.png|-/opengraph-image|opengraph-image|robots.txt|sitemap.xml|images|documents|file.svg|globe.svg|next.svg|vercel.svg|window.svg|yandex_ba7cbd0977b91438.html).*)",
  ],
};
