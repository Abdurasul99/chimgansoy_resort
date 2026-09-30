import { describe, expect, it, vi } from "vitest";

/**
 * Акция «2+1» БЕЗ срока — как если оператор снова запустит её до отмены.
 *
 * Сейчас у «2+1» срок есть (конец сентября 2026), но ветка «срока нет» в
 * lib/promo-nights.ts живая: until необязателен. Здесь срок снят, чтобы она не
 * осталась без проверки.
 */
vi.mock("@/content/promotions", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/content/promotions")>();
  return {
    ...mod,
    promotions: mod.promotions.map((p) => (p.slug === "2plus1" ? { ...p, until: undefined } : p)),
  };
});

const { promoActive, promoBookable, promoHint, promoLastCheckin, rangeQualifies } = await import("@/lib/promo-nights");

describe("«2+1» без срока", () => {
  it("действует и в октябре, последнего заезда нет", () => {
    expect(promoActive("2026-10-01")).toBe(true);
    expect(promoBookable("2026-10-01")).toBe(true);
    expect(promoLastCheckin()).toBe("");
  });

  it("схемы работают как обычно", () => {
    // 04.10.2026 — воскресенье, 05.10 — понедельник.
    expect(rangeQualifies("2026-10-04", "2026-10-07", "2026-10-01")).toBe(true);
    expect(promoHint("2026-10-05", "2026-10-07", "2026-10-01")).toEqual({ kind: "offer-third", extendTo: "2026-10-08" });
    // Из среды три ночи уходят в субботу — не подходит и без срока.
    expect(rangeQualifies("2026-10-07", "2026-10-10", "2026-10-01")).toBe(false);
  });

  it("подсказка не пугает сроком, которого нет", () => {
    expect(promoHint("2026-10-13", "2026-10-16", "2026-10-01")).toEqual({ kind: "third-free" });
  });
});
