import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { languageAlternates, localizedUrl } from "@/i18n/domains";
import { rooms } from "@/content/rooms";
import { services } from "@/content/services";
import { policies } from "@/content/policies";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/nomera", "/services", "/about", "/place", "/contact", "/bron"];
  const roomPaths = rooms.map((room) => `/nomera/${room.slug}`);
  const servicePaths = services.map((service) => `/services/${service.slug}`);
  const policyPaths = policies.map((policy) => `/legal/${policy.slug}`);

  return [...staticPaths, ...roomPaths, ...servicePaths, ...policyPaths].flatMap((path) =>
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
