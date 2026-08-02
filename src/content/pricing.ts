import type { LocalizedString } from "./types";

export type PriceItem = {
  key: string;
  icon: "car" | "topchan" | "kurpacha" | "kazan" | "mangal" | "firewood" | "charcoal";
  title: LocalizedString;
  subtitle?: LocalizedString;
  weekday: number;
  weekend: number;
};

/**
 * Day visits are closed, so this is no longer a day-use price list.
 *
 * `retiredDayUse` holds the two positions that only existed for day visitors —
 * the per-car entry fee and the topchan rental. They are kept, not deleted, so
 * the numbers are on hand if the format ever reopens, but nothing renders them
 * and `venueFacts()` must not quote them: an AI answer with a live topchan
 * price is a booking the venue can't honour.
 *
 * `priceList` keeps the cooking extras, which services.ts already describes as
 * rentals available to staying guests.
 *
 * ASSUMPTION worth confirming with the operator: that these four keep the same
 * Mon–Thu / Fri–Sun prices now that they're sold to overnight guests rather
 * than as part of a day package.
 */
export const retiredDayUse: PriceItem[] = [
  {
    key: "entry",
    icon: "car",
    title: { ru: "Въезд", uz: "Kirish", en: "Entry fee" },
    subtitle: { ru: "1 автомобиль", uz: "1 avtomobil", en: "per car" },
    weekday: 50_000,
    weekend: 100_000,
  },
  {
    key: "topchan",
    icon: "topchan",
    title: { ru: "Топчан", uz: "Topchan", en: "Topchan" },
    subtitle: { ru: "аренда, до 8 чел.", uz: "ijara, 8 kishigacha", en: "rental, up to 8 people" },
    weekday: 150_000,
    weekend: 300_000,
  },
];

export const priceList: PriceItem[] = [
  {
    key: "kazan",
    icon: "kazan",
    title: { ru: "Аренда казана", uz: "Qozon ijarasi", en: "Kazan rental" },
    weekday: 50_000,
    weekend: 100_000,
  },
  {
    key: "mangal",
    icon: "mangal",
    title: { ru: "Аренда мангала", uz: "Mangal ijarasi", en: "BBQ grill rental" },
    weekday: 50_000,
    weekend: 50_000,
  },
  {
    key: "firewood",
    icon: "firewood",
    title: { ru: "Дрова", uz: "O'tin", en: "Firewood" },
    subtitle: { ru: "1 пучок", uz: "1 dasta", en: "1 bundle" },
    weekday: 50_000,
    weekend: 50_000,
  },
  {
    key: "charcoal",
    icon: "charcoal",
    title: { ru: "Уголь", uz: "Ko'mir", en: "Charcoal" },
    subtitle: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
    weekday: 30_000,
    weekend: 30_000,
  },
];

/**
 * `dayUseInfo`, `whatToBring` and `includedPerks` lived here too. All three were
 * read only by <PriceList>, which is deleted along with the day visit, and all
 * three were day-visit copy ("Продукты для шашлыка", "Чистая зона отдыха",
 * hours 08:00–18:00). Removed rather than left as dead exports; `git show
 * HEAD~1:src/content/pricing.ts` has them if the format reopens.
 */
/**
 * Pool day pass — fixed, unlike the stay rates, which the booking engine sets
 * per date.
 *
 * ASSUMPTION worth confirming: these are per person. venue-facts.ts already
 * says the pool is priced per person, and the
 * form says «с человека» on the strength of that. If the figure is per booking
 * instead, change `perPerson` here and the form, the FAQ and the AI knowledge
 * base all follow.
 */
/**
 * Pool day pass, from the operator's own tariff poster.
 *
 * Two age bands and two day bands. The weekend band is Пт–Вс — Friday counts
 * as a weekend day here, which is what the poster says and what the retired
 * day-use list also used. (An earlier revision had it as Сб–Вс on a verbal
 * correction; the poster overrides that.)
 *
 * `holidaysAsWeekend` is documented rather than implemented: the poster prices
 * public holidays at the weekend rate, but there is no holiday calendar in the
 * codebase, so the site quotes the weekday rate on a weekday holiday and the
 * administrator corrects it at confirmation.
 */
export const poolPricing = {
  hours: "08:00–20:00",
  freeForStayingGuests: true,
  holidaysAsWeekend: true,

  /** Adults and children 15 and over. */
  adult: { weekday: 100_000, weekend: 200_000 },
  /** Children 5–15. Under 5 are free when accompanied by an adult. */
  child: { weekday: 50_000, weekend: 100_000 },
  freeChildUnder: 5,

  /** Paid extras. Bungalow rental does NOT include entry tickets. */
  extras: {
    towel: 30_000,
    bungalow4: 300_000,
    bungalow10: 500_000,
  },

  weekdayLabel: { ru: "Пн–Чт", uz: "Du–Pay", en: "Mon–Thu" } satisfies LocalizedString,
  weekendLabel: { ru: "Пт–Вс и праздники", uz: "Ju–Yak va bayramlar", en: "Fri–Sun & holidays" } satisfies LocalizedString,
  perPersonLabel: { ru: "с человека", uz: "bir kishidan", en: "per person" } satisfies LocalizedString,
};

/**
 * Entry / parking for one car — the fee the day-use poster calls «Въезд» and
 * the newer one calls «Парковка». Charged to visitors who are not staying;
 * guests park free by their cabin.
 */
export const parkingPricing = {
  weekday: 50_000,
  weekend: 100_000,
};

export const priceLabels = {
  weekdaysLabel: { ru: "Пн–Чт", uz: "Du–Pay", en: "Mon–Thu" } satisfies LocalizedString,
  weekendLabel: { ru: "Пт–Вс", uz: "Ju–Yak", en: "Fri–Sun" } satisfies LocalizedString,
  currencyShort: { ru: "сум", uz: "so'm", en: "UZS" } satisfies LocalizedString,
};
