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
 * Day products are sold again.
 *
 * The topchan was withdrawn when the site was repositioned as a resort, and
 * these two positions sat here unrendered so the numbers would survive. The
 * operator has since put them back on the public tariff poster and asked for a
 * booking form, so `dayUse` is live again and quoted by both assistants.
 *
 * Every figure below is verbatim from that poster — do not "tidy" them: the
 * mangal, firewood and charcoal genuinely cost the same seven days a week,
 * while the topchan, entry and kazan double at the weekend.
 */
export const dayUse: PriceItem[] = [
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

/**
 * Topchan rental — the day product the whole booking form is built around.
 *
 * `inventory` is deliberately NOT rendered anywhere a guest can see it. The
 * operator's instruction was to track how many of the thirty are taken, not to
 * advertise the number: "осталось 2 из 30" invents urgency the venue never
 * asked for, and "осталось 29" reads as an empty resort. It exists so the
 * Telegram bot can answer "сколько свободно на субботу" from the request log.
 */
export const topchanPricing = {
  /** One topchan seats up to this many guests; bigger parties take several. */
  capacity: 8,
  /** How many exist on the property. Internal — see the note above. */
  inventory: 30,
  /**
   * The day-visit window from the operator's poster. Distinct from the pool
   * (08:00–20:00) and from reception, which is staffed round the clock.
   * ASSUMPTION worth re-confirming: the poster predates the pool's later hours.
   */
  hours: "08:00–18:00",
  rent: { weekday: 150_000, weekend: 300_000 },
};

/**
 * Tubing hill — priced by rides, not by time or by day of week.
 *
 * The operator gave two packages and no weekday/weekend split, so there is no
 * tariff band here: a Saturday ride costs the same as a Tuesday one. Order
 * matters — the form renders these in sequence and the server trusts the index.
 */
export const tubingPricing = {
  packages: [
    { rides: 2, price: 50_000 },
    { rides: 4, price: 100_000 },
  ],
  /**
   * ALL-SEASON, not a winter product. An earlier revision here promised only
   * "runs on snow, dates confirmed by the administrator" — the operator has
   * since confirmed the track works year-round, which is the whole point of
   * building it with a powered lift rather than relying on a slope.
   */
  allSeason: true,
  /** Track dimensions, metres. */
  length: 150,
  width: 6,
  /** How many can descend at once. */
  simultaneous: 5,
};

/**
 * The pool complex.
 *
 * NOTE the area: the operator first said 680 m² and corrected it to 380 m²
 * within the hour. 380 is the later figure and the one used everywhere; worth
 * one confirmation before it goes into an advert.
 */
export const poolFacts = {
  areaSqm: 380,
  /** 8 small (up to 4 people) and 4 large (up to 10) — see poolPricing.extras. */
  bungalows: { small: { count: 8, capacity: 4 }, large: { count: 4, capacity: 10 } },
};

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
