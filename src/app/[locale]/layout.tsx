import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollObserver } from "@/components/ui/ScrollObserver";
import { AiAssistant } from "@/components/ui/AiAssistant";
import { SeasonDetector } from "@/components/ui/SeasonDetector";
import { dictionaries } from "@/content/translations";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedUrl, originForLocale } from "@/i18n/domains";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const siteUrl = originForLocale(locale);

  return {
    title: {
      default: "CHIMGAN DARBAZA",
      template: "%s | CHIMGAN DARBAZA",
    },
    description: dictionaries[locale].brandLine,
    applicationName: "CHIMGAN DARBAZA",
    metadataBase: new URL(siteUrl),
    robots: { index: true, follow: true },
    openGraph: {
      siteName: "CHIMGAN DARBAZA",
      type: "website",
      locale: locale === "uz" ? "uz_UZ" : locale === "en" ? "en_US" : "ru_RU",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "CHIMGAN DARBAZA Resort",
    url: localizedUrl(locale, "/"),
    telephone: "+998712000000",
    image: `${originForLocale(locale)}/images/resort/hero.jpg`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "UZ",
      addressRegion: "Tashkent",
      addressLocality: "Chimgan",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6117,
      longitude: 70.0133,
    },
    priceRange: "$$",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Glamping", value: true },
      { "@type": "LocationFeatureSpecification", name: "Swimming Pool", value: true },
      { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
    ],
  });

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <head>
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      </head>
      <body suppressHydrationWarning>
        <Header locale={locale as Locale} />
        <main>{children}</main>
        <Footer locale={locale as Locale} />
        <ScrollObserver />
        <AiAssistant key={locale} locale={locale} />
        <SeasonDetector />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S7FS7C573H"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','G-S7FS7C573H',{send_page_view:true});
        `}</Script>
      </body>
    </html>
  );
}
