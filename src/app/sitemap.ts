import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { languageAlternates, localizedUrl } from "@/i18n/domains";
import { rooms } from "@/content/rooms";
import { services } from "@/content/services";

export default function sitemap(): MetadataRoute.Sitemap {
  // Legal pages are intentionally excluded — they're noindex (placeholder
  // text pending lawyer approval), so they shouldn't be advertised in the sitemap.
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
  const roomPaths = rooms.map((room) => `/nomera/${room.slug}`);
  // Услуги со своим href живут на собственных страницах — /services/<slug>
  // для них не существует, и класть его в карту сайта значит звать Google на 404.
  const servicePaths = services
    .filter((service) => !service.href)
    .map((service) => `/services/${service.slug}`);

  return [...staticPaths, ...roomPaths, ...servicePaths].flatMap((path) =>
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
