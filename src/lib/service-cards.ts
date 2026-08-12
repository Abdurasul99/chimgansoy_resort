import { cache } from "react";
import { resortImages } from "@/content/images";
import type { Locale } from "@/i18n/config";
import { text } from "@/lib/localize";
import { getServices, type LiveService } from "@/lib/services-live";
import { readOverrides, type ServiceCategory } from "@/lib/site-overrides";

/**
 * Одна карточка услуги, уже решённая под язык.
 *
 * Сетки — клиентские компоненты: у них есть фильтр по разделу и они не могут ни
 * читать хранилище, ни вызывать text(). Раньше они брали список услуг прямо из
 * кода, и поэтому услуга, созданная оператором в панели, не появлялась на сайте
 * нигде — она лежала в хранилище, её показывала только сама админка.
 *
 * Теперь сервер отдаёт им готовый список: услуги из кода и услуги оператора в
 * одном виде, в одном порядке. Что откуда пришло, сетке знать незачем.
 */
export type ServiceCard = {
  slug: string;
  /** Адрес без языка: у услуги может быть своя страница вне /services. */
  href: string;
  title: string;
  shortDescription: string;
  category: ServiceCategory;
  /** Строка цены от оператора, если он её задал. */
  priceNote?: string;
  /** Фон карточки: путь из кода или адрес загруженного фото. */
  frame: { src: string; localSrc?: string; position?: string };
  alt: string;
};

/** Фото по умолчанию для своей услуги: оператор мог его не выбрать. */
const FALLBACK_IMAGE = "poolWideChalets" as const;

/**
 * Картинка услуги.
 *
 * У своей услуги в поле image лежит либо ключ реестра, либо адрес загруженного
 * файла. Адрес принимаем только из нашего же хранилища — иначе сохранённый
 * документ мог бы указать сайт на чужой сервер.
 */
function frameFor(service: LiveService, locale: Locale) {
  const key = service.isCustom ? service.custom?.image : service.base?.image;

  if (key && key in resortImages) {
    const image = resortImages[key as keyof typeof resortImages];
    return { frame: image, alt: text(image.alt, locale) };
  }

  if (key && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(key)) {
    return { frame: { src: key }, alt: service.custom?.title ?? "" };
  }

  const fallback = resortImages[FALLBACK_IMAGE];
  return { frame: fallback, alt: text(fallback.alt, locale) };
}

/** Короткое описание своей услуги: отдельное поле, иначе начало основного. */
function shortOf(service: LiveService, locale: Locale): string {
  if (!service.isCustom) return text(service.base!.shortDescription, locale);
  const custom = service.custom!;
  if (custom.shortDescription) return custom.shortDescription;
  return custom.description.length > 140
    ? `${custom.description.slice(0, 137).trimEnd()}…`
    : custom.description;
}

function toCard(service: LiveService, locale: Locale): ServiceCard {
  const { frame, alt } = frameFor(service, locale);
  return {
    slug: service.slug,
    // href из кода ведёт на собственную страницу услуги (бассейн, тюбинг);
    // у остальных — страница в каталоге.
    href: service.base?.href ?? `/services/${service.slug}`,
    title: service.isCustom ? service.custom!.title : text(service.base!.title, locale),
    shortDescription: shortOf(service, locale),
    category: service.isCustom ? service.custom?.category ?? "relax" : service.base!.category,
    priceNote: service.priceNote,
    frame,
    alt,
  };
}

/** Все видимые услуги в порядке, заданном оператором. */
export const serviceCards = cache(async (locale: Locale): Promise<ServiceCard[]> => {
  return (await getServices()).map((s) => toCard(s, locale));
});

/**
 * Карточки для главной.
 *
 * Порядок и состав задаёт оператор: галочка «на главной» и номер. Услуга,
 * снятая с главной, остаётся в каталоге и на своей странице — это разные
 * решения, и панель разделяет их двумя разными переключателями.
 */
export const homeServiceCards = cache(async (locale: Locale): Promise<ServiceCard[]> => {
  const live = (await getServices()).filter((s) => s.showOnHome);
  return live.map((s) => toCard(s, locale));
});

/** Одна услуга для её собственной страницы, или null. */
export async function serviceCard(slug: string, locale: Locale): Promise<ServiceCard | null> {
  const found = (await getServices()).find((s) => s.slug === slug);
  return found ? toCard(found, locale) : null;
}

/** Полное описание своей услуги — для её страницы. */
export async function customServiceBody(slug: string): Promise<string | null> {
  const data = await readOverrides();
  const found = data.customServices.find((c) => c.slug === slug && !c.hidden);
  return found?.description ?? null;
}
