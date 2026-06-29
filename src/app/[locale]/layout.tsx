import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollObserver } from "@/components/ui/ScrollObserver";
import { FaqPanel } from "@/components/ui/FaqPanel";
import { SeasonDetector } from "@/components/ui/SeasonDetector";
import { AnalyticsEvents } from "@/components/ui/AnalyticsEvents";
import { LogoIntro } from "@/components/ui/LogoIntro";
import { StickyBookingCta } from "@/components/layout/StickyBookingCta";
import { dictionaries } from "@/content/translations";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedUrl, originForLocale } from "@/i18n/domains";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"], // dropped 500 and 800 — unused; trims ~80kb font payload
  display: "swap",
  preload: true,
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
    telephone: "+998701760011",
    sameAs: [
      "https://www.instagram.com/chimgandarbaza/",
      "https://t.me/+998701760011",
      "https://wa.me/998701760011",
    ],
    image: `${originForLocale(locale)}/images/resort/hero.jpg`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "UZ",
      addressRegion: "Tashkent",
      addressLocality: "Chimgan",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.5193897,
      longitude: 69.9904599,
    },
    priceRange: "$$",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Glamping", value: true },
      { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
      { "@type": "LocationFeatureSpecification", name: "Free parking", value: true },
    ],
  });

  return (
    <html
      lang={locale}
      className={`${sans.variable} ${serif.variable}`}
      // The pre-hydration intro-gate script sets data-intro on <html> before
      // React hydrates. Without this, React 19 sees an attribute mismatch on
      // <html> and re-renders the whole tree on the client — which swaps out the
      // DOM nodes the scroll-reveal observer is watching, leaving sections stuck
      // at opacity:0 (blank). suppressHydrationWarning makes React accept it.
      suppressHydrationWarning
    >
      <head>
        {/* Pre-hydration intro gate: hides the page shell on home paths BEFORE
            React loads so the logo intro is always the first thing seen.
            Plain inline <script> (not next/script) — must run synchronously
            during HTML parsing, before first paint. The 4s failsafe unhides
            the site if the JS bundle ever fails to load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var p=location.pathname.replace(/\\/+$/,"")||"/";var h=/^\\/(ru|uz|en)$/.test(p);var rm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(h&&!rm){d.setAttribute("data-intro","pending");setTimeout(function(){if(d.getAttribute("data-intro")==="pending"){d.removeAttribute("data-intro")}},4000);setTimeout(function(){if(d.getAttribute("data-intro")){d.removeAttribute("data-intro")}},6000)}}catch(e){}})();`,
          }}
        />
        {/* Resource hints — establish connections to external domains early */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cbu.uz" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />

        {/* ── Exely Booking Engine — head loader (hotel 514200). Loads the
            Exely integration and auto-embeds the search form into
            #be-search-form and the booking engine into #be-booking-form.
            The context lang is set per locale (ru/uz/en match Exely's codes). */}
        <meta name="google-site-verification" content="8dVDfmmZ_xQLLonKp7OAXJL5jV_SWm_pdwZciODsKRk" />
        <link rel="dns-prefetch" href="https://ibe.hopenapi.com" />
        <link rel="dns-prefetch" href="https://uz-ibe.hopenapi.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=location.pathname;if(p.charAt(p.length-1)==="/")p=p.slice(0,-1);if(p.slice(-5)!=="/bron")return;!function(e,n){var t="bookingengine",o="integration",i=e[t]=e[t]||{},a=i[o]=i[o]||{},r="__cq",c="__loader",d="getElementsByTagName";if(n=n||[],a[r]=a[r]?a[r].concat(n):n,!a[c]){a[c]=!0;var l=e.document,g=l[d]("head")[0]||l[d]("body")[0];!function n(i){if(0!==i.length){var a=l.createElement("script");a.type="text/javascript",a.async=!0,a.src="https://"+i[0]+"/integration/loader.js",a.onerror=a.onload=function(n,i){return function(){e[t]&&e[t][o]&&e[t][o].loaded||(g.removeChild(n),i())}}(a,(function(){n(i.slice(1,i.length))})),g.appendChild(a)}}(["uz-ibe.hopenapi.com","ibe.hopenapi.com","ibe.behopenapi.com"])}}(window,[["setContext","BE-INT-chimgandarbaza-uz_2026-06-24","${locale}"],["embed","booking-form",{container:"be-booking-form"}]]);})();`,
          }}
        />

        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main" className="skip-link">
          {locale === "uz" ? "Asosiy qismga o'tish" : locale === "en" ? "Skip to content" : "К содержимому"}
        </a>
        <Header locale={locale as Locale} />
        <main id="main">{children}</main>
        <Footer locale={locale as Locale} />
        <ScrollObserver />
        <FaqPanel key={locale} locale={locale} />
        <StickyBookingCta locale={locale as Locale} />
        <SeasonDetector />
        <AnalyticsEvents />
        <LogoIntro locale={locale as Locale} />
        {/* GA4 — lazyOnload so analytics doesn't block first paint/LCP */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S7FS7C573H"
          strategy="lazyOnload"
        />
        <Script id="ga4-init" strategy="lazyOnload">{`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','G-S7FS7C573H',{send_page_view:true});
        `}</Script>
      </body>
    </html>
  );
}
