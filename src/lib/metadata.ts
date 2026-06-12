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

  // The root layout applies "%s | CHIMGAN DARBAZA". If a page's title already
  // contains the brand (e.g. the homepage), use an absolute title so we don't
  // end up with "… CHIMGAN DARBAZA | CHIMGAN DARBAZA". Otherwise pass the plain
  // string and let the template append the brand once.
  const hasBrand = /CHIMGAN DARBAZA/i.test(title);
  const titleField: Metadata["title"] = hasBrand ? { absolute: title } : title;

  return {
    metadataBase: new URL(siteUrl),
    title: titleField,
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
