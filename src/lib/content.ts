import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { rooms } from "@/content/rooms";
import { services } from "@/content/services";
import { policies } from "@/content/policies";
import { news } from "@/content/news";

export async function getLocaleParam(params: Promise<{ locale: string }>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return locale;
}

export function getRoom(slug: string) {
  const room = rooms.find((item) => item.slug === slug);

  if (!room) {
    notFound();
  }

  return room;
}

export function getService(slug: string) {
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    notFound();
  }

  return service;
}

export function getPolicy(slug: string) {
  const policy = policies.find((item) => item.slug === slug);

  if (!policy) {
    notFound();
  }

  return policy;
}

export function getNewsItem(slug: string) {
  const item = news.find((entry) => entry.slug === slug);

  if (!item) {
    notFound();
  }

  return item;
}

/** News sorted newest-first by ISO date (string compare is correct for YYYY-MM-DD). */
export function getNewsSorted() {
  return [...news].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export type LocaleParams = Promise<{ locale: Locale }>;
