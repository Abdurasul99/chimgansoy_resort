import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { languageAlternates, localizedUrl, originForLocale } from "@/i18n/domains";
import type { PageSeo } from "@/content/types";
import { text } from "./localize";

export function buildMetadata(locale: Locale, seo: PageSeo, path = "/"): Metadata {
  const siteUrl = originForLocale(locale);
  const title = text(seo.title, locale);
  const description = text(seo.description, locale);
  const ogImage = `${siteUrl}/-/opengraph-image`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: localizedUrl(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: localizedUrl(locale, path),
      siteName: "CHIMGAN DARBAZA",
      locale,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "CHIMGAN DARBAZA",
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
