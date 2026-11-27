import { describe, expect, it } from "vitest";
import {
  NEW_YEAR_MIDNIGHT,
  countdownParts,
  newYearButtonOn,
  newYearCopy,
  newYearSeo,
  tashkentDay,
  unitLabel,
} from "../new-year";

describe("новогодний экран: даты по Ташкенту", () => {
  it("полночь 1 января 2027 по Ташкенту — 19:00 UTC 31 декабря", () => {
    expect(new Date(NEW_YEAR_MIDNIGHT).toISOString()).toBe("2026-12-31T19:00:00.000Z");
    expect(tashkentDay(NEW_YEAR_MIDNIGHT)).toBe("2027-01-01");
    expect(tashkentDay(NEW_YEAR_MIDNIGHT - 1)).toBe("2026-12-31");
  });

  it("кнопка в шапке видна по 10 января включительно", () => {
    expect(newYearButtonOn(Date.parse("2026-11-27T05:00:00Z"))).toBe(true);
    // 23:59 10 января в Ташкенте = 18:59 UTC
    expect(newYearButtonOn(Date.parse("2027-01-10T18:59:00Z"))).toBe(true);
    expect(newYearButtonOn(Date.parse("2027-01-10T19:00:00Z"))).toBe(false);
  });

  it("отсчёт: дни, часы, минуты, секунды; в полночь — null", () => {
    const left = ((34 * 24 + 13) * 60 + 42) * 60 + 5;
    expect(countdownParts(NEW_YEAR_MIDNIGHT - left * 1000)).toEqual({ d: 34, h: 13, m: 42, s: 5 });
    expect(countdownParts(NEW_YEAR_MIDNIGHT - 1000)).toEqual({ d: 0, h: 0, m: 0, s: 1 });
    expect(countdownParts(NEW_YEAR_MIDNIGHT)).toBeNull();
    expect(countdownParts(NEW_YEAR_MIDNIGHT + 60_000)).toBeNull();
  });
});

describe("новогодний экран: подписи к цифрам", () => {
  it("русские окончания", () => {
    const d = (n: number) => `${n} ${unitLabel("ru", "d", n)}`;
    expect([1, 2, 5, 11, 12, 14, 21, 22, 25, 34, 111, 112].map(d)).toEqual([
      "1 день", "2 дня", "5 дней", "11 дней", "12 дней", "14 дней",
      "21 день", "22 дня", "25 дней", "34 дня", "111 дней", "112 дней",
    ]);
    expect(unitLabel("ru", "s", 0)).toBe("секунд");
    expect(unitLabel("ru", "m", 1)).toBe("минута");
    expect(unitLabel("ru", "h", 3)).toBe("часа");
  });

  it("английский — единственное и множественное, узбекский — без изменения", () => {
    expect(unitLabel("en", "d", 1)).toBe("day");
    expect(unitLabel("en", "d", 0)).toBe("days");
    expect(unitLabel("en", "s", 34)).toBe("seconds");
    expect(unitLabel("uz", "d", 1)).toBe("kun");
    expect(unitLabel("uz", "d", 34)).toBe("kun");
  });
});

describe("новогодний экран: тексты", () => {
  it("каждая строка есть на трёх языках", () => {
    const walk = (v: unknown, path: string): string[] => {
      if (v && typeof v === "object" && "ru" in v) {
        const s = v as Record<string, string>;
        return ["ru", "uz", "en"].filter((l) => !s[l]?.trim()).map((l) => `${path}.${l}`);
      }
      if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => walk(x, `${path}.${k}`));
      return [];
    };
    expect(walk(newYearCopy, "copy")).toEqual([]);
    expect(walk(newYearSeo, "seo")).toEqual([]);
  });

  it("цен и праздничных пакетов на экране нет — их считает Exely", () => {
    const all = JSON.stringify(newYearCopy);
    expect(all).not.toMatch(/сум|so'm|UZS|\d{3}\s?\d{3}/);
  });
});
