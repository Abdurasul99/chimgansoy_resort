import { describe, it, expect } from "vitest";
import {
  formatTemp,
  moonPhase,
  aqiLabel,
  bestDayIdx,
  activity,
  getIsoDateMeta,
  getResortTodayMeta,
  type DayW,
} from "../weather";

/* ── formatTemp ───────────────────────────────────────────── */
describe("formatTemp", () => {
  it("adds + prefix for positive temperatures", () => {
    expect(formatTemp(25)).toBe("+25°");
  });
  it("adds + prefix for +1", () => {
    expect(formatTemp(1)).toBe("+1°");
  });
  it("no prefix for zero (avoids +0°)", () => {
    expect(formatTemp(0)).toBe("0°");
  });
  it("no + prefix for negative (winter mountain temps)", () => {
    expect(formatTemp(-5)).toBe("-5°");
  });
  it("handles -15 (deep winter)", () => {
    expect(formatTemp(-15)).toBe("-15°");
  });
});

/* ── moonPhase ────────────────────────────────────────────── */
describe("moonPhase", () => {
  it("returns New Moon for the reference date Jan 6 2000", () => {
    const result = moonPhase(new Date(2000, 0, 6));
    expect(result.icon).toBe("🌑");
    expect(result.en).toBe("New Moon");
    expect(result.stargazing).toBe(false);
  });

  it("returns Full Moon ~14.75 days after new moon and stargazing=true", () => {
    // Jan 6 + 14.77 days = ~Jan 21 2000
    const fullMoonDate = new Date(2000, 0, 21);
    const result = moonPhase(fullMoonDate);
    expect(result.icon).toBe("🌕");
    expect(result.en).toBe("Full Moon");
    expect(result.stargazing).toBe(true);
  });

  it("returns Waxing Crescent a few days after new moon", () => {
    const date = new Date(2000, 0, 10); // ~4 days after new moon
    const result = moonPhase(date);
    expect(result.icon).toBe("🌒");
    expect(result.en).toBe("Waxing Crescent");
  });

  it("cycles through all phases over 29.5 days from reference", () => {
    // Day 0 = new moon (reference), day ~7 = waxing crescent/first quarter,
    // day ~14.8 = full moon, day ~22 = waning gibbous
    const ref = new Date(2000, 0, 6);
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
    expect(moonPhase(addDays(ref, 0)).icon).toBe("🌑");  // new moon
    expect(moonPhase(addDays(ref, 4)).icon).toBe("🌒");  // waxing crescent
    expect(moonPhase(addDays(ref, 15)).icon).toBe("🌕"); // full moon
    expect(moonPhase(addDays(ref, 20)).icon).toBe("🌖"); // waning gibbous
    expect(moonPhase(addDays(ref, 28)).icon).toBe("🌘"); // waning crescent
  });

  it("all phases have en, ru, uz strings", () => {
    for (let day = 0; day < 30; day++) {
      const d = new Date(2000, 0, 6 + day);
      const r = moonPhase(d);
      expect(r.en.length).toBeGreaterThan(0);
      expect(r.ru.length).toBeGreaterThan(0);
      expect(r.uz.length).toBeGreaterThan(0);
    }
  });
});

/* ── aqiLabel ─────────────────────────────────────────────── */
describe("aqiLabel", () => {
  it("≤20 is Excellent/Отлично/A'lo", () => {
    expect(aqiLabel(10, "en").text).toBe("Excellent");
    expect(aqiLabel(20, "ru").text).toBe("Отлично");
    expect(aqiLabel(1, "uz").text).toBe("A'lo");
  });
  it("≤40 is Good/Хорошо/Yaxshi", () => {
    expect(aqiLabel(21, "en").text).toBe("Good");
    expect(aqiLabel(40, "ru").text).toBe("Хорошо");
    expect(aqiLabel(35, "uz").text).toBe("Yaxshi");
  });
  it("≤60 is Moderate/Умеренно/O'rtacha", () => {
    expect(aqiLabel(41, "en").text).toBe("Moderate");
    expect(aqiLabel(60, "ru").text).toBe("Умеренно");
    expect(aqiLabel(55, "uz").text).toBe("O'rtacha");
  });
  it(">60 is Poor/Плохо/Yomon", () => {
    expect(aqiLabel(61, "en").text).toBe("Poor");
    expect(aqiLabel(100, "ru").text).toBe("Плохо");
    expect(aqiLabel(80, "uz").text).toBe("Yomon");
  });
  it("returns correct color codes", () => {
    expect(aqiLabel(10, "en").color).toBe("#22c55e");
    expect(aqiLabel(30, "en").color).toBe("#84cc16");
    expect(aqiLabel(50, "en").color).toBe("#eab308");
    expect(aqiLabel(70, "en").color).toBe("#f97316");
  });
  it("falls back to ru for unknown locale", () => {
    expect(aqiLabel(10, "fr").text).toBe("Excellent"); // neither ru nor uz → en branch
  });
});

/* ── bestDayIdx ───────────────────────────────────────────── */
describe("bestDayIdx", () => {
  const makeDay = (code: number, max: number, date = "2024-01-01"): DayW => ({
    date,
    code,
    max,
    min: max - 5,
    sunrise: "06:00",
    sunset: "18:00",
  });

  it("picks clear day (code 0) over overcast (code 3)", () => {
    const days: DayW[] = [makeDay(3, 25, "2024-01-01"), makeDay(0, 20, "2024-01-02")];
    expect(bestDayIdx(days)).toBe(1);
  });

  it("picks warmer clear day when codes are equal", () => {
    const days: DayW[] = [makeDay(0, 18, "2024-01-01"), makeDay(0, 26, "2024-01-02")];
    expect(bestDayIdx(days)).toBe(1);
  });

  it("prefers partly cloudy (code 2) over rainy (code 61)", () => {
    const days: DayW[] = [makeDay(61, 30, "2024-01-01"), makeDay(2, 15, "2024-01-02")];
    expect(bestDayIdx(days)).toBe(1);
  });

  it("returns 0 for a single-day forecast", () => {
    expect(bestDayIdx([makeDay(0, 25)])).toBe(0);
  });

  it("caps temperature bonus at max=28 (28°C is ideal)", () => {
    // Both clear, one at 28 and one at 35 — score should be same for temps above 28
    const days: DayW[] = [makeDay(0, 28, "2024-01-01"), makeDay(0, 35, "2024-01-02")];
    // day[0] wins by index (reduce keeps first on tie)
    expect(bestDayIdx(days)).toBe(0);
  });
});

/* ── activity ─────────────────────────────────────────────── */
describe("activity", () => {
  it("code=0 + temp≥22 → pool", () => {
    expect(activity(0, 25, "en")).toBe("pool & loungers");
    expect(activity(0, 22, "ru")).toBe("отдыха у бассейна");
  });
  it("code=0 + temp<22 → glamping/stargazing", () => {
    expect(activity(0, 15, "en")).toBe("stargazing from glamping");
    expect(activity(0, 21, "ru")).toBe("наблюдения звёзд с глэмпинга");
  });
  it("code≤2 + temp≥16 → hike", () => {
    expect(activity(2, 20, "en")).toBe("mountain hikes");
    expect(activity(1, 16, "uz")).toBe("tog' yo'llarida sayr");
  });
  it("code≤2 + temp<16 → bbq", () => {
    expect(activity(1, 10, "en")).toBe("outdoor barbecue");
    expect(activity(2, 15, "ru")).toBe("барбекю на свежем воздухе");
  });
  it("code=3 → sport", () => {
    expect(activity(3, 20, "en")).toBe("padel & sports");
    expect(activity(3, 5, "ru")).toBe("паделя и активного спорта");
  });
  it("rainy/stormy code → indoor restaurant", () => {
    expect(activity(61, 20, "en")).toBe("restaurant dinner");
    expect(activity(95, 30, "ru")).toBe("ужина в ресторане");
    expect(activity(80, 10, "uz")).toBe("restoranda kechki ovqat");
  });
  it("falls back to ru for unknown locale", () => {
    expect(activity(0, 25, "fr")).toBe("отдыха у бассейна");
  });
});

/* ── getIsoDateMeta ───────────────────────────────────────── */
describe("getIsoDateMeta", () => {
  it("parses year, month (0-indexed), and day correctly", () => {
    const meta = getIsoDateMeta("2024-04-15");
    expect(meta.year).toBe(2024);
    expect(meta.monthIndex).toBe(3); // April = index 3
    expect(meta.day).toBe(15);
    expect(meta.isoDate).toBe("2024-04-15");
  });

  it("dayIndex is a valid weekday 0-6", () => {
    const meta = getIsoDateMeta("2024-01-01"); // Monday
    expect(meta.dayIndex).toBeGreaterThanOrEqual(0);
    expect(meta.dayIndex).toBeLessThanOrEqual(6);
    expect(meta.dayIndex).toBe(1); // Monday = 1
  });

  it("parses January (month=01) as monthIndex=0", () => {
    const meta = getIsoDateMeta("2024-01-01");
    expect(meta.monthIndex).toBe(0);
  });

  it("parses December (month=12) as monthIndex=11", () => {
    const meta = getIsoDateMeta("2024-12-31");
    expect(meta.monthIndex).toBe(11);
    expect(meta.day).toBe(31);
  });
});

/* ── getResortTodayMeta ───────────────────────────────────── */
describe("getResortTodayMeta", () => {
  it("returns valid date meta for now", () => {
    const meta = getResortTodayMeta();
    expect(meta.year).toBeGreaterThan(2023);
    expect(meta.monthIndex).toBeGreaterThanOrEqual(0);
    expect(meta.monthIndex).toBeLessThanOrEqual(11);
    expect(meta.day).toBeGreaterThanOrEqual(1);
    expect(meta.day).toBeLessThanOrEqual(31);
    expect(meta.dayIndex).toBeGreaterThanOrEqual(0);
    expect(meta.dayIndex).toBeLessThanOrEqual(6);
  });

  it("accepts an explicit date", () => {
    // April 24 2026 in UTC → should still be April 24 in Tashkent (UTC+5)
    const date = new Date("2026-04-24T10:00:00Z");
    const meta = getResortTodayMeta(date);
    expect(meta.year).toBe(2026);
    expect(meta.monthIndex).toBe(3); // April
    expect(meta.day).toBe(24);
  });

  it("isoDate has YYYY-MM-DD format", () => {
    const meta = getResortTodayMeta();
    expect(meta.isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
