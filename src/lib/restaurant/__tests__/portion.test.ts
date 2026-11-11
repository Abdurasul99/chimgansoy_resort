import { describe, expect, it } from "vitest";
import { localizePortion } from "../portion";

describe("порция на языке страницы", () => {
  it.each([
    ["0,5 порции", "0,5 porsiya", "0,5 portion"],
    ["1 порция", "1 porsiya", "1 portion"],
    ["300 г", "300 g", "300 g"],
    ["1 кг", "1 kg", "1 kg"],
    ["2 шт.", "2 dona", "2 pcs"],
    ["6 персон", "6 kishilik", "for 6"],
    ["на 4 персоны", "4 kishi uchun", "for 4"],
    ["за час", "soatiga", "per hour"],
    ["250 мл", "250 ml", "250 ml"],
  ])("%s → %s / %s", (ru, uz, en) => {
    expect(localizePortion(ru, "uz")).toBe(uz);
    expect(localizePortion(ru, "en")).toBe(en);
    expect(localizePortion(ru, "ru")).toBe(ru);
  });

  it("незнакомое и пустое — как есть", () => {
    expect(localizePortion("большая", "uz")).toBe("большая");
    expect(localizePortion("", "uz")).toBe("");
    expect(localizePortion("1 kg", "uz")).toBe("1 kg");
  });
});
