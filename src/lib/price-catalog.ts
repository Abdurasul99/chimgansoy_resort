import { dayUse, poolPricing, priceList, tubingPricing } from "@/content/pricing";
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
