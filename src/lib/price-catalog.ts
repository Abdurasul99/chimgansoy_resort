import {
  dayUse,
  extraGuestPricing,
  parkingPricing,
  poolPricing,
  priceList,
  topchanPricing,
  touristTax,
  tubingPricing,
} from "@/content/pricing";
import type { OverrideData } from "@/lib/site-overrides";

/**
 * The flat list of every number the operator is allowed to change.
 *
 * Each entry has a dotted key that is the ONLY contract between the admin form
 * and the store. The key must never be renamed once shipped: the stored patch
 * is keyed by it, and a rename silently orphans the operator's edit — the price
 * would quietly revert to the code value with nothing to indicate why.
 *
 * What is deliberately NOT here
 * -----------------------------
 * • topchanPricing.capacity — it is a divisor in src/app/actions/topchan.ts,
 *   so a zero would produce Infinity topchans and an Infinity total. It is a
 *   fact about furniture, not a price.
 * • the number of tubing packages — the request form renders them by index and
 *   the server trusts that index (src/content/pricing.ts, src/app/actions/
 *   tubing.ts). Prices are editable; the shape of the list is not.
 * • accommodation rates — they live in Exely, which is where the operator
 *   already changes them. Two sources for one number is how they drift.
 *
 * The one rename made on purpose
 * ------------------------------
 * extraGuest.glamping / extraGuest.cottage became extraGuest.adult / .child /
 * .guestVisitCottage on 2026-08-05. That breaks the never-rename rule knowingly:
 * the old keys did not just hold a wrong number, they held the wrong QUESTION —
 * the charge turned out to vary by the guest's age, not by which cabin they
 * sleep in, so there is no honest value to migrate into. The old pair was live
 * for a few hours on the day it shipped, which is the whole window in which an
 * override could have been saved against them; a stale patch under those keys
 * is now simply ignored.
 */

export type PriceField = {
  key: string;
  group: string;
  label: string;
  hint?: string;
  value: number;
};

/** Ruble-style grouping used for display in the admin only. */
export function fields(): PriceField[] {
  const out: PriceField[] = [];

  out.push(
    {
      key: "pool.adult.weekday",
      group: "Бассейн",
      label: "Взрослый, Пн–Чт",
      value: poolPricing.adult.weekday,
    },
    {
      key: "pool.adult.weekend",
      group: "Бассейн",
      label: "Взрослый, Пт–Вс",
      hint: "пятница считается выходным",
      value: poolPricing.adult.weekend,
    },
    {
      key: "pool.child.weekday",
      group: "Бассейн",
      label: "Ребёнок 5–15, Пн–Чт",
      value: poolPricing.child.weekday,
    },
    {
      key: "pool.child.weekend",
      group: "Бассейн",
      label: "Ребёнок 5–15, Пт–Вс",
      value: poolPricing.child.weekend,
    },
  );

  out.push(
    {
      key: "pool.extra.towel",
      group: "Бассейн",
      label: "Аренда полотенца",
      hint: "одна цена всю неделю",
      value: poolPricing.extras.towel,
    },
    {
      key: "pool.extra.bungalow4",
      group: "Бассейн",
      label: "Бунгало на 4 гостей",
      hint: "входные билеты не включены",
      value: poolPricing.extras.bungalow4,
    },
    {
      key: "pool.extra.bungalow10",
      group: "Бассейн",
      label: "Бунгало на 10 гостей",
      hint: "входные билеты не включены",
      value: poolPricing.extras.bungalow10,
    },
    {
      key: "topchan.rent.weekday",
      group: "Топчан",
      label: "Аренда топчана, Пн–Чт",
      hint: `за топчан целиком, до ${topchanPricing.capacity} гостей`,
      value: topchanPricing.rent.weekday,
    },
    {
      key: "topchan.rent.weekend",
      group: "Топчан",
      label: "Аренда топчана, Пт–Вс",
      hint: "пятница считается выходным",
      value: topchanPricing.rent.weekend,
    },
    {
      key: "parking.weekday",
      group: "Парковка",
      label: "Парковка, Пн–Чт",
      hint: "только для гостей тюбинга; остальным бесплатно",
      value: parkingPricing.weekday,
    },
    {
      key: "parking.weekend",
      group: "Парковка",
      label: "Парковка, Пт–Вс",
      hint: "за автомобиль",
      value: parkingPricing.weekend,
    },
    {
      key: "touristTax.resident",
      group: "Туристский сбор",
      label: "Граждане и резиденты Узбекистана",
      hint: "за ночь с человека, платится при заселении",
      value: touristTax.resident,
    },
    {
      key: "touristTax.nonResident",
      group: "Туристский сбор",
      label: "Иностранные граждане",
      hint: "за ночь с человека; ставка установлена законодательством",
      value: touristTax.nonResident,
    },
  );

  out.push(
    {
      key: "extraGuest.adult",
      group: "Доплата за человека",
      label: "Взрослый — дополнительное место",
      hint: `за ночь, одинаково в глэмпинге и шале; дети до ${extraGuestPricing.freeThroughAge} лет включительно бесплатно`,
      value: extraGuestPricing.adult,
    },
    {
      key: "extraGuest.child",
      group: "Доплата за человека",
      label: `Ребёнок ${extraGuestPricing.childFrom}–${extraGuestPricing.childTo} лет — дополнительное место`,
      hint: "за ночь",
      value: extraGuestPricing.child,
    },
    {
      key: "extraGuest.guestVisitCottage",
      group: "Доплата за человека",
      label: "Гостевой визит в шале",
      hint: "за визит, без ночёвки",
      value: extraGuestPricing.guestVisitCottage,
    },
  );

  for (const p of tubingPricing.packages) {
    out.push({
      key: `tubing.package.${p.rides}`,
      group: "Тюбинг",
      label: `Пакет ${p.rides} спуска`,
      hint: "одна цена всю неделю",
      value: p.price,
    });
  }

  for (const item of dayUse) {
    out.push(
      {
        key: `dayUse.${item.key}.weekday`,
        group: "Дневной отдых",
        label: `${item.title.ru}, Пн–Чт`,
        value: item.weekday,
      },
      {
        key: `dayUse.${item.key}.weekend`,
        group: "Дневной отдых",
        label: `${item.title.ru}, Пт–Вс`,
        value: item.weekend,
      },
    );
  }

  for (const item of priceList) {
    out.push(
      {
        key: `extra.${item.key}.weekday`,
        group: "Аренда и расходники",
        label: `${item.title.ru}, Пн–Чт`,
        hint: item.subtitle?.ru,
        value: item.weekday,
      },
      {
        key: `extra.${item.key}.weekend`,
        group: "Аренда и расходники",
        label: `${item.title.ru}, Пт–Вс`,
        value: item.weekend,
      },
    );
  }

  return out;
}

/** The effective value of one key: the operator's number, or the code's. */
export function effective(key: string, overrides: OverrideData, fallback: number): number {
  const v = overrides.prices[key];
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
}

/**
 * Every field with the operator's value applied — what the admin screen shows,
 * and what a public surface would read if it consumed this catalogue.
 */
export function effectiveFields(overrides: OverrideData): (PriceField & { overridden: boolean })[] {
  return fields().map((f) => {
    const v = overrides.prices[f.key];
    const overridden = typeof v === "number" && Number.isFinite(v) && v >= 0 && v !== f.value;
    return { ...f, value: overridden ? v : f.value, overridden };
  });
}
