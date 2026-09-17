import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { languageAlternates, localizedUrl } from "@/i18n/domains";
import { rooms } from "@/content/rooms";
import { services } from "@/content/services";
import { hiddenServiceSlugs } from "@/lib/services-live";
import { poolClosure } from "@/content/pool-closure";
import { policies } from "@/content/policies";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/nomera",
    "/services",
    "/about",
    "/place",
    "/contact",
    "/bron",
    // Day products, each with its own request form.
    "/topchan",
    "/tubing",
  ];
  // Пока бассейн закрыт, его страница не идёт в карту сайта: она объясняет
  // закрытие, а не продаёт услугу, и в выдаче ей делать нечего.
  const roomPaths = rooms
    .filter((room) => !(room.slug === "pool" && poolClosure.closed))
    .map((room) => `/nomera/${room.slug}`);
  // Услуги со своим href живут на собственных страницах — /services/<slug>
  // для них не существует, и класть его в карту сайта значит звать Google на 404.
  // И то же самое про выключенные оператором в /admin/uslugi: их адреса уводят
  // в каталог, звать на них поисковик незачем.
  const hidden = await hiddenServiceSlugs();
  const servicePaths = services
    .filter((service) => !service.href && !hidden.includes(service.slug))
    .map((service) => `/services/${service.slug}`);

  /**
   * Правовые страницы — только те, что помечены indexable.
   *
   * Раньше сюда не попадала ни одна: они все были черновиками под запретом
   * индексации, и звать на них поисковик значило предлагать ему текст-заглушку.
   * Теперь часть из них — настоящие документы оператора (оферта, политики,
   * правила, сертификат), у них robots разрешает индексацию, и расхождение
   * «индексировать можно, но в карте нет» — просто недосмотр.
   *
   * Условие одно и то же в обоих местах: флаг indexable. Разъедутся они только
   * вместе.
   */
  const legalPaths = policies
    .filter((policy) => policy.indexable)
    .map((policy) => `/legal/${policy.slug}`);

  return [...staticPaths, ...roomPaths, ...servicePaths, ...legalPaths].flatMap((path) =>
    locales.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: languageAlternates(path),
      },
    })),
  );
}
