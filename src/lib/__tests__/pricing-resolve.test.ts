import { describe, expect, it } from "vitest";
import { isWeekendBand, resolvePricing } from "@/lib/pricing-resolve";
import { fields } from "@/lib/price-catalog";
import {
  dayUse,
  parkingPricing,
  poolPricing,
  priceList,
  topchanPricing,
  touristTax,
  tubingPricing,
} from "@/content/pricing";

/**
 * The admin price editor wrote to Blob and nothing read it back until
 * 2026-08-06: every public surface imported the constants directly, so the
 * operator could change a price, see the admin confirm it, and find the site
 * still quoting the old one.
 *
 * These tests pin the two halves of the contract that broke: every key the
 * admin offers must actually resolve to something, and an absent or nonsense
 * patch must leave the site exactly as it shipped.
 */

describe("resolvePricing — без правок", () => {
  it("возвращает ровно константы кода", () => {
    const p = resolvePricing();
    expect(p.pool.adult).toEqual(poolPricing.adult);
    expect(p.pool.child).toEqual(poolPricing.child);
    expect(p.topchan).toEqual(topchanPricing.rent);
    // У парковки одна ставка на всю неделю — тарифных полос нет.
    expect(p.parking).toBe(parkingPricing.flat);
    expect(p.touristTax).toEqual({ resident: touristTax.resident, nonResident: touristTax.nonResident });
    expect(p.tubing.packages).toEqual(tubingPricing.packages.map((x) => ({ rides: x.rides, price: x.price })));
    expect(p.dayUse.map((i) => i.key)).toEqual(dayUse.map((i) => i.key));
    expect(p.extras.map((i) => i.key)).toEqual(priceList.map((i) => i.key));
  });

  it("пустой патч и отсутствующий патч дают одно и то же", () => {
    expect(resolvePricing({})).toEqual(resolvePricing());
  });
});

describe("resolvePricing — правки оператора", () => {
  it("подменяет ровно ту позицию, которую тронули", () => {
    const p = resolvePricing({ "topchan.rent.weekend": 999_000 });
    expect(p.topchan.weekend).toBe(999_000);
    // ...and nothing else moves with it.
    expect(p.topchan.weekday).toBe(topchanPricing.rent.weekday);
    expect(p.pool.adult.weekend).toBe(poolPricing.adult.weekend);
  });

  it("держит цену пакета тюбинга, но не трогает список пакетов", () => {
    const p = resolvePricing({ "tubing.package.2": 1 });
    expect(p.tubing.packages.map((x) => x.rides)).toEqual(tubingPricing.packages.map((x) => x.rides));
    expect(p.tubing.packages.find((x) => x.rides === 2)!.price).toBe(1);
  });

  it("допускает ноль — бесплатная услуга это законная цена", () => {
    expect(resolvePricing({ "parking.flat": 0 }).parking).toBe(0);
  });
});

describe("resolvePricing — мусор в сторе не должен ломать сайт", () => {
  const GARBAGE: [string, unknown][] = [
    ["отрицательное", -100],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["строка", "300000"],
    ["null", null],
    ["объект", { weekday: 1 }],
    ["массив", [1, 2]],
  ];

  for (const [name, value] of GARBAGE) {
    it(`${name} игнорируется, остаётся цена из кода`, () => {
      const p = resolvePricing({ "pool.adult.weekday": value as number });
      expect(p.pool.adult.weekday).toBe(poolPricing.adult.weekday);
    });
  }

  it("незнакомый ключ ничего не ломает", () => {
    expect(resolvePricing({ "какой.то.мусор": 5 })).toEqual(resolvePricing());
  });
});

describe("каталог админки и резолвер описывают одно и то же", () => {
  it("каждый ключ из админки действительно что-то меняет", () => {
    // The contract that quietly broke before: a key the admin offers but the
    // resolver ignores is an edit that silently does nothing.
    const base = resolvePricing();
    const dead: string[] = [];

    for (const field of fields()) {
      // A value no default can accidentally equal.
      const patched = resolvePricing({ [field.key]: 424_242 });
      if (JSON.stringify(patched) === JSON.stringify(base)) dead.push(field.key);
    }

    expect(dead, `ключи админки, которые ни на что не влияют: ${dead.join(", ")}`).toEqual([]);
  });

  it("операторские позиции, которые он просил, есть в каталоге", () => {
    const keys = fields().map((f) => f.key);
    for (const key of [
      "topchan.rent.weekday",
      "topchan.rent.weekend",
      "parking.flat",
      "pool.adult.weekday",
      "pool.extra.towel",
      "touristTax.resident",
      "touristTax.nonResident",
    ]) {
      expect(keys, `нет в админке: ${key}`).toContain(key);
    }
  });

  it("в каталоге нет дублирующихся ключей", () => {
    const keys = fields().map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("isWeekendBand", () => {
  it("пятница считается выходным тарифом", () => {
    // 2026-08-07 is a Friday — the band the operator's poster uses.
    expect(isWeekendBand("2026-08-07")).toBe(true);
    expect(isWeekendBand("2026-08-08")).toBe(true); // суббота
    expect(isWeekendBand("2026-08-09")).toBe(true); // воскресенье
    expect(isWeekendBand("2026-08-06")).toBe(false); // четверг
    expect(isWeekendBand("2026-08-10")).toBe(false); // понедельник
  });
});
