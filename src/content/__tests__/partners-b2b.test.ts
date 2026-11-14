/**
 * Партнёрские лендинг и панель: правила содержания (шапка partners-b2b.ts).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as B2B from "../partners-b2b";
import { PACKAGES, PACKAGE_KEYS, TRAFFIC } from "@/lib/partners/economics";

/** Все файлы, из которых собираются две страницы. */
function sources(): string[] {
  const files = ["src/content/partners-b2b.ts", "src/lib/partners/economics.ts", "src/lib/partners/format.ts"];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(name)) files.push(p);
    }
  };
  walk("src/components/partners");
  files.push("src/app/[locale]/partners/page.tsx", "src/app/[locale]/partners/detail/page.tsx");
  return files;
}

describe("партнёрские страницы — содержание", () => {
  it("конкурентов по имени нет ни в текстах, ни в коде страниц", () => {
    for (const f of sources()) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/amirsoy|амирсо|amirsay/i);
    }
  });

  it("нет старых точечных цифр: 220 000, 250 000 за сезон, 4.8 ч, «в 10 раз дольше», −15 %", () => {
    const text = JSON.stringify(B2B);
    expect(text).not.toMatch(/220\s?000|4[.,]8\s?ч|в 10 раз|−15|-15\s?%/);
  });

  it("диапазоны владельца: 200–250 тыс. гостей и 5,5–7 часов", () => {
    expect(B2B.GUESTS_RANGE).toBe("200–250 тыс.");
    expect(B2B.HOURS_RANGE).toBe("5,5–7");
    expect(B2B.SECONDS_RANGE).toBe("19 800–25 200");
    expect(TRAFFIC.guestsYear.min).toBe(200_000);
  });

  it("прайс показывает каждый пакет модели ровно один раз, с ценой из модели", () => {
    const rows = B2B.priceBlock.rows;
    expect(rows.map((r) => r.pkg).sort()).toEqual([...PACKAGE_KEYS].sort());
    const byPkg = Object.fromEntries(rows.map((r) => [r.pkg, r.price]));
    expect(byPkg.title).toBe("1 037,5 млн сум / год");
    expect(byPkg.z4).toBe("364,1 млн сум / сезон");
    expect(byPkg.z6).toBe("185,5 млн сум / сезон");
    expect(byPkg.z5).toBe("187,7 млн сум / год");
    expect(byPkg.map).toBe("240 млн сум / год");
    expect(byPkg.contour).toBe("от 60 млн сум / год");
  });

  it("титул = розница зон × 0,9 (с точностью до 0,1 млн)", () => {
    expect(Math.abs(B2B.TITLE_RETAIL_SUM * 0.9 - (PACKAGES.title.price as number))).toBeLessThan(100_000);
  });

  it("каждая зона карты ведёт в существующий пакет; номера зон 1–7 без пропусков", () => {
    expect(B2B.zones.map((z) => z.id).sort()).toEqual(["z1", "z2", "z3", "z4", "z5", "z6", "z7"]);
    for (const z of B2B.zones) expect(PACKAGES[z.pkg], z.id).toBeDefined();
    // Летние зоны на карте совпадают с сезонными пакетами модели.
    for (const z of B2B.zones) expect(z.season === "summer", z.id).toBe(PACKAGES[z.pkg].period === "сезон");
  });

  it("сценарий каждой отрасли открывает существующий пакет", () => {
    for (const [k, card] of Object.entries(B2B.industries.items)) expect(PACKAGES[card.pkg], k).toBeDefined();
  });

  it("«7» не путается: платежи — у гостя, транши — у партнёра", () => {
    const text = JSON.stringify(B2B);
    expect(text).not.toMatch(/7 платежей за сезон/);
    expect(text).toMatch(/7 траншей/);
  });
});
