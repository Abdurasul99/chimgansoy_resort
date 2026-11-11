import type { Locale } from "@/i18n/config";

/**
 * Порция блюда на языке страницы.
 *
 * В базе порция — одна строка без языков (`restaurant_dishes.portion`), её
 * пишут в админке по-русски: «300 г», «0,5 порции», «2 шт.», «за час». На
 * /uz и /en она висела русской рядом с переведённым названием (проверка
 * узбекского, 11.11.2026). Менять схему ради шести единиц незачем — известные
 * единицы переводятся при показе, всё незнакомое остаётся как написано.
 */
type Rule = [RegExp, Record<Exclude<Locale, "ru">, string>];

const END = "(?=$|[\\s.,;)])";
const RULES: Rule[] = [
  [new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*порци[яий]${END}`, "giu"), { uz: "$1 porsiya", en: "$1 portion" }],
  [new RegExp(`на\\s+(\\d+)\\s*персон[ыа]?${END}`, "giu"), { uz: "$1 kishi uchun", en: "for $1" }],
  [new RegExp(`(\\d+)\\s*персон[ыа]?${END}`, "giu"), { uz: "$1 kishilik", en: "for $1" }],
  [new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*кг${END}`, "giu"), { uz: "$1 kg", en: "$1 kg" }],
  [new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*г${END}`, "giu"), { uz: "$1 g", en: "$1 g" }],
  [new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*мл${END}`, "giu"), { uz: "$1 ml", en: "$1 ml" }],
  [new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*л${END}`, "giu"), { uz: "$1 l", en: "$1 l" }],
  [new RegExp(`(\\d+)\\s*шт\\.?`, "giu"), { uz: "$1 dona", en: "$1 pcs" }],
  [/за\s+час/giu, { uz: "soatiga", en: "per hour" }],
];

export function localizePortion(portion: string, locale: Locale): string {
  if (!portion || locale === "ru") return portion;
  return RULES.reduce((s, [re, to]) => s.replace(re, to[locale]), portion);
}
