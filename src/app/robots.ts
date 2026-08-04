import type { MetadataRoute } from "next";
import { primaryOrigin } from "@/i18n/domains";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The operator's panel. It is behind a password either way — this only
      // keeps the login form out of search results, where it would be the one
      // page on the site inviting strangers to guess a password.
      disallow: ["/admin", "/admin/"],
    },
    sitemap: `${primaryOrigin}/sitemap.xml`,
  };
}
