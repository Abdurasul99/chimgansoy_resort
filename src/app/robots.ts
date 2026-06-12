import type { MetadataRoute } from "next";
import { primaryOrigin } from "@/i18n/domains";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${primaryOrigin}/sitemap.xml`,
  };
}
