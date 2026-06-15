import { faqItems } from "@/content/faq";
import type { Locale } from "@/i18n/config";
import { localizedUrl } from "@/i18n/domains";
import { text } from "@/lib/localize";

/**
 * Server components that emit JSON-LD structured data. Adding FAQPage and
 * BreadcrumbList markup unlocks rich results in Google (expandable FAQ
 * accordions + breadcrumb trails in the SERP) at zero cost.
 */

function Script({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** FAQPage — render once on a page that shows the FAQ (homepage). */
export function FaqJsonLd({ locale }: { locale: Locale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: text(item.question, locale),
      acceptedAnswer: {
        "@type": "Answer",
        text: text(item.answer, locale),
      },
    })),
  };
  return <Script data={data} />;
}

export type Crumb = { name: string; path: string };

/** BreadcrumbList — pass the trail from Home → … → current page. */
export function BreadcrumbJsonLd({ locale, items }: { locale: Locale; items: Crumb[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: localizedUrl(locale, c.path),
    })),
  };
  return <Script data={data} />;
}
