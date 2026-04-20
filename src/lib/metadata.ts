import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import type { PageSeo } from "@/content/types";
import { text } from "./localize";

const siteUrl = "https://chimgansoy.uz";

export function buildMetadata(locale: Locale, seo: PageSeo, path = "/"): Metadata {
  const title = text(seo.title, locale);
  const description = text(seo.description, locale);
  const ogImage = `${siteUrl}/-/opengraph-image`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: localizePath(locale, path),
      languages: Object.fromEntries(
        locales.map((item) => [item, localizePath(item, path)]),
      ),
    },
    openGraph: {
      title,
      description,
      url: localizePath(locale, path),
      siteName: "CHIMGANSOY",
      locale,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "CHIMGANSOY",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
