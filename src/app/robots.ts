import type { MetadataRoute } from "next";
import { domesticOrigin, internationalOrigin } from "@/i18n/domains";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: [
      `${internationalOrigin}/sitemap.xml`,
      `${domesticOrigin}/sitemap.xml`,
    ],
  };
}
