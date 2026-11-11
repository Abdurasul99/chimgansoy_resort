import { describe, expect, it } from "vitest";
import { fmtRomi, fmtUzs, portalCalc, scenarioValue } from "../portal-calc";
import {
  BASE_ANNUAL_TRAFFIC,
  PARTNER_CLUSTERS,
  PARTNER_TIERS,
  RESERVATION_SLOTS,
  RESORT_ZONES,
  TIER_CORRIDORS,
  ZONE_PHOTOS,
} from "@/content/partners-portal";
import { resortImages } from "@/content/images";

describe("калькулятор портала — формулы владельца", () => {
  it("скриншот: титульный, экосистемы и связь, Median — те же цифры", () => {
    const telecom = PARTNER_CLUSTERS[0];
    const r = portalCalc({
      traffic: BASE_ANNUAL_TRAFFIC,
      tierPrice: 2_000_000_000,
      budget: 550_000_000,
      contactRate: 82,
      er: telecom.er,
      cr: telecom.cr,
      ugc: telecom.ugc,
      ltv: telecom.ltv,
    });
    // На скриншоте: 205 000 / 1 353 000 / 24 600 / 5 412, CPA 471 175, только права 369 549, ROMI −0.1x.
    expect(r).toMatchObject({ offlineContacts: 205_000, ugcViews: 1_353_000, engagements: 24_600, targetActions: 5_412, cpa: 471_175, cpaRightsOnly: 369_549 });
    expect(fmtRomi(r.romi)).toBe("-0.1x");
    expect(r.cpv).toBe(12_439);
    expect(r.cpe).toBe(103_659);
  });

  it("ноль контактов — метрики «—», а не деление на ноль", () => {
    const r = portalCalc({ traffic: 0, tierPrice: 1, budget: 1, contactRate: 50, er: 10, cr: 10, ugc: 10, ltv: 0 });
    expect(r).toMatchObject({ cpv: 0, cpm: 0, cpa: 0, breakEven: 0, romi: null });
  });

  it("сценарий прижимается к коридору ползунка", () => {
    expect(scenarioValue(82, 1.2, 20, 92)).toBe(92);
    expect(scenarioValue(12, 0.75, 1, 50)).toBe(9);
    expect(scenarioValue(5, 0.1, 3, 50)).toBe(3);
  });

  it("форматы", () => {
    expect(fmtUzs(2_550_000_000)).toBe("2 550 000 000 сум");
    expect(fmtRomi(4.39)).toBe("+4.4x");
  });
});

describe("данные портала согласованы", () => {
  it("у каждого уровня есть коридор, значения по умолчанию внутри него", () => {
    for (const t of PARTNER_TIERS) {
      const c = TIER_CORRIDORS[t.id];
      expect(c, t.id).toBeDefined();
      expect(t.defaults.budget).toBeGreaterThanOrEqual(c.budget[0]);
      expect(t.defaults.budget).toBeLessThanOrEqual(c.budget[2]);
      expect(t.defaults.contactRate).toBeLessThanOrEqual(c.contactLimit);
    }
  });

  it("зоны на карте уровня существуют (1–7)", () => {
    for (const t of PARTNER_TIERS) for (const z of t.activeMapZones) expect(z >= 1 && z <= RESORT_ZONES.length).toBe(true);
  });

  it("фото зон — из реестра реальных снимков", () => {
    for (const [zone, key] of Object.entries(ZONE_PHOTOS)) {
      expect(RESORT_ZONES.some((z) => z.id === zone), zone).toBe(true);
      if (key) expect(resortImages[key], key).toBeDefined();
    }
  });

  it("слоты: у свободного нет претендента, у занятого есть", () => {
    for (const s of RESERVATION_SLOTS) expect(s.available ? /Открыто/.test(s.applicant) : s.applicant.length > 0).toBe(true);
  });
});
