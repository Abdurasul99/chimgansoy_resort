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
    title: { ru: "Парковочное место", uz: "Parkovka joyi", en: "Parking space" },
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
 * The area bounced between 680 and 380 m² while the operator was compiling the
 * specs; they confirmed 680 on 2026-08-02 and that is what the site states.
 */
export const poolFacts = {
  areaSqm: 680,
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
 * Parking for one car — charged to TUBING visitors only.
 *
 * Entry to the grounds is free for everyone, and parking is free for staying
 * guests, for pool bookings and for topchan visitors. This briefly appeared on
 * the pool and topchan forms and overstated both totals by the day band; those
 * forms have no car field now, and only TubingRequestForm reads this.
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

/**
 * How many guests a cabin's rate covers, and how many it can hold at all.
 *
 * Operator, 2026-08-05: "Глемпинг стандарт - 2 человека. Максимум +1. Шале
 * стандарт 4 человека. Максимум +2."
 *
 * The site said only "до 3 гостей" and "до 6 гостей" before this, which is the
 * MAXIMUM and says nothing about what the price covers. That gap had already
 * produced a wrong answer in production: asked about four adults and a
 * six-year-old in a chalet, the concierge replied "5 человек — дополнительная
 * плата не требуется", because six was the only number it knew. Under the base
 * of four that party owes one adult place and one child place.
 *
 * `base` is what the nightly rate includes; every guest beyond it is charged
 * per extraGuestPricing. `max` is a hard limit — beds, not money — so a party
 * over it needs a second cabin, not a bigger surcharge.
 */
export const cabinOccupancy = {
  glamping: { base: 2, max: 3 },
  cottage: { base: 4, max: 6 },
} as const;

/**
 * The extra-person charge on top of a cabin's rate.
 *
 * These figures took three passes to settle, so the trail is worth keeping:
 *
 *   1. The operator's shorthand "400 глемпинг / 400 шале" was read as 400 000
 *      per cabin type, flagged at the time as an inference about the magnitude.
 *   2. A "Прочее" list arrived quoting 1 000 000 adult / 500 000 child /
 *      500 000 guest visit, which looked like a correction and was applied.
 *   3. Роман (CMO/CEO) settled it on 2026-08-05: "Взрослый - 400 000 /
 *      Детский 4 - 12 лет - 300 000 / Дети до 3 лет - бесплатно", confirmed as
 *      covering both cabin types — "это шале и глемпинг? — да, универсальный
 *      ценник" — plus "услуга гостевого визита в Шале – 300.000 сум."
 *
 * So the 1 000 000 / 500 000 pair in step 2 was never live long enough to be
 * quoted to a guest, and the numbers below are the ones the commercial lead
 * signed off. What step 2 DID get right, and what stands, is the shape: the
 * charge varies by the guest's age, not by which cabin they sleep in. Hence one
 * `adult` figure rather than a glamping/cottage pair.
 *
 * `guestVisitCottage` is a different product entirely: a visitor who comes to
 * someone else's chalet for the day and does not sleep there.
 *
 * Ages: 0–3 free, 4–12 at the child rate, 13+ at the adult rate.
 * `freeThroughAge` is inclusive — a three-year-old is free — which is why it is
 * not named `freeUnderAge` any more.
 *
 * Distinct from poolPricing.freeChildUnder, which is 5: that is a day ticket to
 * the water, this is a bed. Do not merge them.
 */
export const extraGuestPricing = {
  /** An additional adult (13+), per night, in sum. Same in both cabin types. */
  adult: 400_000,
  /** An additional child aged childFrom..childTo, per night, in sum. */
  child: 300_000,
  childFrom: 4,
  childTo: 12,
  /** Children of this age and younger are not charged an extra place at all. */
  freeThroughAge: 3,
  /** A day visitor to a chalet who does not stay the night. Per visit. */
  guestVisitCottage: 300_000,
} as const;

/**
 * The stay terms a guest needs before booking, not at the door.
 *
 * Every figure here comes from the operator's signed documents of 5 August 2026
 * — Публичная оферта and Политика возврата и отмены, Редакция № 1 — which are
 * reproduced verbatim on /legal/* from those same .docx files (see
 * scripts/build-legal.js). Where an informal message from the operator and the
 * document disagree, the document wins: it is what the guest accepts at
 * booking and what a dispute is decided on.
 *
 * Two figures were changed BACK on 2026-08-06 because of exactly that:
 *
 *  • checkIn was moved to 15:00 on 2026-08-05 from a "Прочее" list. The offer
 *    says 14:00 in four separate clauses (1 «Заезд/Выезд», 2.5, 4.2 and
 *    Правила пребывания 4.1), and prices early arrival relative to 14:00 in
 *    5.2.1. The same "Прочее" list had already been wrong once about the
 *    extra-guest rate.
 *
 *  • The prepayment was described as flatly non-refundable. The signed policy
 *    grants a FULL refund five days out and half of it up to 48 hours — see
 *    `accommodationCancellation`. The site was refusing refunds the contract
 *    gives, which is the worse direction of the two to be wrong in.
 */
export const stayRules = {
  /** Оферта, п. 4.2: расчётное время заезда. */
  checkIn: "14:00",
  /** Оферта, п. 4.2: расчётный час. */
  checkOut: "12:00",
  /** Правила пребывания, п. 1.9 — тишина на территории. */
  quietFrom: "23:00",
  quietTo: "08:00",
} as const;

/**
 * Туристский (гостиничный) сбор — per person, per night, on top of the rate.
 *
 * Оферта, п. 5.1.5: charged separately at check-in for every night, from
 * Uzbek citizens and foreigners alike. The two rates are set by law and differ
 * by an order of magnitude, which is precisely why the site must not quote "a
 * tourist levy" without saying which one applies to the reader.
 *
 * Figures from the operator, 2026-08-06.
 */
export const touristTax = {
  /** Граждане и резиденты Республики Узбекистан. */
  resident: 1_692,
  /** Иностранные граждане (нерезиденты). */
  nonResident: 61_800,
} as const;

/**
 * Ранний заезд и поздний выезд — оферта, пп. 5.2.1–5.2.3.
 *
 * Priced as a share of one night rather than a flat sum, so there is nothing to
 * keep in sync with the nightly rate. Subject to availability and prior
 * agreement in every case — the share is what it costs when granted, not a
 * promise that it will be.
 */
export const earlyLateCheck = {
  /** Заезд 06:00–14:00 — доля стоимости суток. */
  earlyShare: 0.5,
  /** Выезд 12:00–18:00 — доля стоимости суток. */
  lateShare: 0.5,
  /** После 18:00 выезд оплачивается как полные сутки. */
  lateFullAfter: "18:00",
  /**
   * Заезд 00:00–06:00 оплачивается как 22 часа проживания, и плата за ранний
   * заезд сверх этого НЕ взимается (п. 5.2.3). Ночной приезд дешевле утреннего
   * — контринтуитивно, и поэтому стоит отдельного упоминания.
   */
  nightArrivalHours: 22,
} as const;

/**
 * Отмена бронирования ПРОЖИВАНИЯ — оферта п. 6.4 и Политика возврата п. 2.1.
 *
 * A ladder, not a blanket rule. Stated here as data so the room pages, the FAQ
 * and both AI briefings quote one set of numbers.
 *
 * Day-use services (бассейн, топчан, тюбинг) are NOT on this ladder: they are
 * non-refundable and non-transferable outright — оферта п. 6.5. The only
 * exceptions to either rule are force majeure/weather (п. 6.12–6.13) and the
 * resort's own fault (п. 6.11).
 */
export const accommodationCancellation = {
  /** Не позднее этого срока до заезда — возврат 100 %. */
  fullRefundDays: 5,
  /** От 5 суток до этого срока — удерживается 50 %. */
  halfRefundHours: 48,
  halfRefundShare: 0.5,
  /** Позже — удерживается всё. */
} as const;

/**
 * Перенос дат — оферта п. 6.8, Политика возврата раздел 4.
 *
 * Not a right: granted by agreement, subject to availability, and blocked
 * entirely on peak days in BOTH directions — a booking that falls on Fri/Sat/Sun
 * or a public holiday cannot be moved, and nothing can be moved onto one.
 */
export const dateTransfer = {
  maxTimes: 1,
  withinMonths: 3,
  /** Пятница, суббота, воскресенье — выходные для целей переноса. */
  blockedWeekdays: [5, 6, 0] as const,
  /** Ваучер на разницу, если новые даты дешевле. */
  voucherMonths: 6,
} as const;
