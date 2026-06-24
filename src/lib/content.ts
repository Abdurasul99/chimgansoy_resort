import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { rooms } from "@/content/rooms";
import { services } from "@/content/services";
import { policies } from "@/content/policies";

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

export type LocaleParams = Promise<{ locale: Locale }>;
