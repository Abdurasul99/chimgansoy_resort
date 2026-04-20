import type { Locale } from "@/i18n/config";

export type LocalizedString = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export type ImageAsset = {
  src: string;
  localSrc?: string;
  position?: string;
  alt: LocalizedString;
};

export type PageSeo = {
  title: LocalizedString;
  description: LocalizedString;
};

export type NavigationItem = {
  label: LocalizedString;
  href: string;
};

export type Feature = {
  label: LocalizedString;
  value?: LocalizedString;
};
