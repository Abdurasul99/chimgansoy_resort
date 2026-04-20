import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyBookingCta } from "@/components/layout/StickyBookingCta";
import { dictionaries } from "@/content/translations";
import { isLocale, locales, type Locale } from "@/i18n/config";

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

  return {
    title: {
      default: "CHIMGANSOY",
      template: "%s | CHIMGANSOY",
    },
    description: dictionaries[locale].brandLine,
    applicationName: "CHIMGANSOY",
    metadataBase: new URL("https://chimgansoy.uz"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Header locale={locale as Locale} />
        <main>{children}</main>
        <StickyBookingCta locale={locale as Locale} />
        <Footer locale={locale as Locale} />
      </body>
    </html>
  );
}
