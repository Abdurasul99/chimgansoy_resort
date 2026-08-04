/**
 * ridesRu — the word that goes after a tubing ride count.
 *
 * Worth its own test because it is a rule nobody checks by eye: the packages
 * sold today are 2 and 4, both of which take the same form, so a broken
 * implementation would look perfectly correct on the live site right up until
 * someone adds a 1-ride or 5-ride package.
 */
import { describe, expect, it } from "vitest";
import { ridesRu } from "../tariff";
import { tubingPricing } from "@/content/pricing";

describe("ridesRu", () => {
  it("handles the packages actually sold", () => {
    for (const p of tubingPricing.packages) {
      expect(`${p.rides} ${ridesRu(p.rides)}`).toMatch(/^\d+ спуск(а|ов)?$/);
    }
    // The two on sale today, spelled out, so a regression is obvious in the diff.
    expect(`2 ${ridesRu(2)}`).toBe("2 спуска");
    expect(`4 ${ridesRu(4)}`).toBe("4 спуска");
  });

  it("follows the Russian rule for counts we do not sell yet", () => {
    const cases: [number, string][] = [
      [1, "спуск"],
      [2, "спуска"],
      [3, "спуска"],
      [4, "спуска"],
      [5, "спусков"],
      [9, "спусков"],
      [10, "спусков"],
      // The 11–14 exception: naive `% 10` implementations return "спуск" here.
      [11, "спусков"],
      [12, "спусков"],
      [13, "спусков"],
      [14, "спусков"],
      [15, "спусков"],
      [21, "спуск"],
      [22, "спуска"],
      [25, "спусков"],
      [101, "спуск"],
      [111, "спусков"],
      [0, "спусков"],
    ];
    for (const [n, want] of cases) {
      expect(`${n} -> ${ridesRu(n)}`).toBe(`${n} -> ${want}`);
    }
  });

  it("never says прокатка again", () => {
    for (let n = 0; n <= 130; n++) expect(ridesRu(n)).not.toMatch(/прокат/);
  });
});
