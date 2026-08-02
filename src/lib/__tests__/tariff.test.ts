import { describe, expect, it } from "vitest";
import { isWeekendISO, money } from "../tariff";
import { parkingPricing, poolPricing, priceList, topchanPricing, tubingPricing } from "@/content/pricing";

/**
 * These pin the two rules that cost real money if they drift.
 *
 * Friday is a WEEKEND day on the operator's posters — an earlier revision had
 * it as a weekday on a verbal correction, and it took a poster to settle. And a
 * topchan is charged per platform, not per head, which is the one thing the
 * booking form must never get backwards.
 */

describe("isWeekendISO", () => {
  it("treats Friday, Saturday and Sunday as the weekend band", () => {
    // 2026-08-03 is a Monday, so this walks a full week from Mon to Sun.
    const week = [
      ["2026-08-03", false], // Mon
      ["2026-08-04", false], // Tue
      ["2026-08-05", false], // Wed
      ["2026-08-06", false], // Thu
      ["2026-08-07", true], // Fri — the one that keeps getting this wrong
      ["2026-08-08", true], // Sat
      ["2026-08-09", true], // Sun
    ] as const;
    for (const [iso, expected] of week) {
      expect(isWeekendISO(iso), iso).toBe(expected);
    }
  });

  it("refuses anything that is not an ISO date rather than guessing", () => {
    for (const bad of ["", "9 августа", "2026-8-9", "not-a-date", "2026/08/09"]) {
      expect(isWeekendISO(bad), bad).toBe(false);
    }
  });
});

describe("money", () => {
  it("groups thousands with a space, as every price on the site does", () => {
    expect(money(50_000)).toBe("50 000");
    expect(money(150_000)).toBe("150 000");
    expect(money(1_400_000)).toBe("1 400 000");
    expect(money(0)).toBe("0");
  });
});

describe("day-product tariffs match the operator's posters", () => {
  it("topchan: 150 000 / 300 000, up to 8 guests, 30 on site", () => {
    expect(topchanPricing.rent).toEqual({ weekday: 150_000, weekend: 300_000 });
    expect(topchanPricing.capacity).toBe(8);
    expect(topchanPricing.inventory).toBe(30);
  });

  it("entry: 50 000 / 100 000 per car", () => {
    expect(parkingPricing).toEqual({ weekday: 50_000, weekend: 100_000 });
  });

  it("tubing: 2 rides 50 000, 4 rides 100 000, one price all week", () => {
    expect(tubingPricing.packages).toEqual([
      { rides: 2, price: 50_000 },
      { rides: 4, price: 100_000 },
    ]);
  });

  it("pool: two age bands, two day bands, towel and bungalows", () => {
    expect(poolPricing.adult).toEqual({ weekday: 100_000, weekend: 200_000 });
    expect(poolPricing.child).toEqual({ weekday: 50_000, weekend: 100_000 });
    expect(poolPricing.freeChildUnder).toBe(5);
    expect(poolPricing.extras).toEqual({ towel: 30_000, bungalow4: 300_000, bungalow10: 500_000 });
  });

  it("rentals: only the kazan doubles at the weekend", () => {
    const rate = (key: string) => priceList.find((p) => p.key === key);
    expect(rate("kazan")).toMatchObject({ weekday: 50_000, weekend: 100_000 });
    expect(rate("mangal")).toMatchObject({ weekday: 50_000, weekend: 50_000 });
    expect(rate("firewood")).toMatchObject({ weekday: 50_000, weekend: 50_000 });
    expect(rate("charcoal")).toMatchObject({ weekday: 30_000, weekend: 30_000 });
  });
});

describe("topchan count", () => {
  // The same derivation the form and the server action both use. A party is
  // never told to book twice; it quietly takes the platforms it needs.
  const topchansFor = (guests: number) =>
    Math.max(Math.ceil(Math.max(guests, 1) / topchanPricing.capacity), 1);

  it("gives one topchan up to eight guests and adds one at nine", () => {
    expect(topchansFor(1)).toBe(1);
    expect(topchansFor(8)).toBe(1);
    expect(topchansFor(9)).toBe(2);
    expect(topchansFor(16)).toBe(2);
    expect(topchansFor(17)).toBe(3);
  });

  it("never returns zero, even for nonsense input", () => {
    expect(topchansFor(0)).toBe(1);
    expect(topchansFor(-5)).toBe(1);
  });

  it("prices per topchan, not per guest", () => {
    // Nine guests on a Friday: two platforms at the weekend rate, NOT nine
    // people paying anything.
    const total = topchansFor(9) * topchanPricing.rent.weekend;
    expect(total).toBe(600_000);
    expect(total).not.toBe(9 * topchanPricing.rent.weekend);
  });
});
