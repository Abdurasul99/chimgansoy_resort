/**
 * Математика партнёрского калькулятора — по спецификации v2.0 (14.11.2026).
 *
 * §7 golden-тесты A–D, §8 инварианты I-01…I-10 и 1000 случайных входов.
 * Спецификация считала по точкам 250 000 гостей и 4.8 ч; владелец в тот же
 * день заменил их диапазонами (200–250 тыс., 5,5–7 ч). Формулы не менялись,
 * поэтому golden-тесты передают 250 000 и 4.8 явно — и должны сходиться со
 * спецификацией с точностью 1e-6. Если какой-то из них покраснел, сломана
 * формула, а не «поменялись цифры».
 */
import { describe, expect, it } from "vitest";
import {
  BUDGET,
  DOOH_HOUR,
  INDUSTRIES,
  PACKAGES,
  PACKAGE_KEYS,
  SEASONS,
  SEASON_PCT,
  TRAFFIC,
  UGC_CPM_BLEND,
  computeModel,
  normalizeIndustry,
  qualify,
  seasonGuests,
  windowBase,
  type IndustryKey,
  type ModelInput,
  type ModelResult,
  type PackageKey,
} from "../economics";

/** Точки, на которых считала спецификация v2.0. */
const SPEC = { guestsYear: 250_000, visitHours: 4.8 } as const;

function expectClose(actual: number | null, expected: number, key: string, rel = 1e-6) {
  expect(actual, key).not.toBeNull();
  const a = actual as number;
  const err = Math.abs(a - expected) / Math.max(Math.abs(expected), 1);
  expect(err, `${key}: ожидалось ${expected}, получено ${a}`).toBeLessThanOrEqual(rel);
}

function checkGolden(input: ModelInput, expected: Partial<Record<keyof ModelResult, number>>, loose: Partial<Record<keyof ModelResult, number>> = {}) {
  const r = computeModel({ ...SPEC, ...input });
  for (const [key, value] of Object.entries(expected)) {
    expectClose(r[key as keyof ModelResult] as number | null, value as number, key, loose[key as keyof ModelResult] ?? 1e-6);
  }
  return r;
}

describe("константы модели", () => {
  it("доли сезонов в сумме 100 %, гости сезонов складываются в год (I-01)", () => {
    expect(SEASONS.reduce((s, k) => s + SEASON_PCT[k], 0)).toBe(100);
    for (const g of [TRAFFIC.guestsYear.min, TRAFFIC.guestsYear.max, 225_000]) {
      const seasons = seasonGuests(g);
      expect(SEASONS.reduce((s, k) => s + seasons[k], 0)).toBe(g);
    }
    expect(seasonGuests(250_000)).toEqual({ winter: 115_000, spring: 35_000, summer: 75_000, autumn: 25_000 });
  });

  it("диапазоны владельца: 200–250 тыс. гостей, 5,5–7 ч; по умолчанию — нижняя граница", () => {
    expect(TRAFFIC.guestsYear).toMatchObject({ min: 200_000, max: 250_000, default: 200_000 });
    expect(TRAFFIC.visitHours).toMatchObject({ min: 5.5, max: 7, default: 5.5 });
    const r = computeModel({ pkg: "title", industry: "bank" });
    expect(r.guestsYear).toBe(200_000);
    expect(r.visitHours).toBe(5.5);
  });

  it("базы окон сезонных зон — как в спецификации (Блок A)", () => {
    expectClose(windowBase(PACKAGES.z4.window, 250_000), 110_833.333333, "z4");
    expectClose(windowBase(PACKAGES.z6.window, 250_000), 92_916.666667, "z6");
    for (const k of ["title", "z5", "map", "contour", "project"] as PackageKey[]) {
      expect(windowBase(PACKAGES[k].window, 250_000), k).toBe(250_000);
    }
  });

  it("бенчмарки: DOOH 21 600 сум/час, взвешенный CPM UGC 19 850, НДС 12 %", () => {
    expect(DOOH_HOUR).toBe(21_600);
    expect(UGC_CPM_BLEND).toBeCloseTo(19_850, 9);
    expect(BUDGET.vat).toBe(0.12);
  });

  it("прайс — опубликованные цифры, контур от 60 млн", () => {
    expect(PACKAGES.title.price).toBe(1_037_500_000);
    expect(PACKAGES.z4.price).toBe(364_100_000);
    expect(PACKAGES.z6.price).toBe(185_500_000);
    expect(PACKAGES.z5.price).toBe(187_700_000);
    expect(PACKAGES.map.price).toBe(240_000_000);
    expect(PACKAGES.contour.price).toBe(60_000_000);
    expect(PACKAGES.project.price).toBeNull();
    expect(PACKAGES.contour.nonExclusive).toBe(true);
  });

  it("телеком: LTV домохозяйства = 25 000 × 24 × 4.2 = 2 520 000", () => {
    expect(computeModel({ pkg: "map", industry: "telecom" }).ltvUnit).toBeCloseTo(2_520_000, 6);
  });

  it("ключ отрасли «fm» из спецификации читается как fmcg; мусор — null", () => {
    expect(normalizeIndustry("fm")).toBe("fmcg");
    expect(normalizeIndustry("FMCG")).toBe("fmcg");
    expect(normalizeIndustry("telecom")).toBe("telecom");
    expect(normalizeIndustry("<script>")).toBeNull();
    expect(normalizeIndustry(null)).toBeNull();
  });
});

describe("golden-тесты спецификации v2.0 (§7)", () => {
  it("A: телеком, карта гостя, права 100 млн", () => {
    const r = checkGolden(
      {
        pkg: "map", industry: "telecom", contactShare: 0.8, er: 0.2, cr: 0.025, household: 4.2, margin: 0.38,
        exposure: 0.3, btlCoef: 0.35, vatRecoverable: false, rightsOverride: 100_000_000, ugcMultiplier: 27,
      },
      {
        base: 250000, rights: 100000000, btl: 35000000, subtotal: 135000000, vat: 16200000, total: 151200000,
        budget: 151200000, reach: 200000, engaged: 40000, actions: 1000, ltvUnit: 2520000, cohort: 2520000000,
        contribution: 957600000, multiple: 16.6666666667, romiCore: 5.3333333333, hours: 288000, cphi: 525,
        doohHour: 21600, advantage: 41.1428571429, cityEq: 414720000, ugcImpressions: 1080000, emvOffline: 3000000,
        emvUgc: 21438000, emv: 24438000, net: 830838000, romiEmv: 5.4949603175, cpa: 151200, cpe: 3780,
        cpm: 118125, emvShare: 0.1616269841,
      },
    );
    // Критические проверки спецификации
    expect(r.actions).toBeCloseTo(1000, 9); // не 4200: семья не умножается повторно
    expect(r.romiCore).not.toBe(r.romiEmv);
    expect(r.emv).toBeCloseTo(r.emvOffline + r.emvUgc, 6);
  });

  it("B: банк, титульный пакет", () => {
    const r = checkGolden(
      { pkg: "title", industry: "bank", contactShare: 0.9, er: 0.12, cr: 0.02, ltvUnit: 3_600_000, margin: 0.45, exposure: 0.3, btlCoef: 0.35, vatRecoverable: false },
      {
        base: 250000, rights: 1037500000, btl: 363125000, subtotal: 1400625000, vat: 168075000, total: 1568700000,
        budget: 1568700000, reach: 225000, engaged: 27000, actions: 540, ltvUnit: 3600000, cohort: 1944000000,
        contribution: 874800000, multiple: 1.239242685, romiCore: -0.4423407917, hours: 324000, cphi: 4841.6666667,
        advantage: 4.4612737, cityEq: 466560000, ugcImpressions: 729000, emvOffline: 3375000, emvUgc: 14470650,
        emv: 17845650, net: -676054350, romiEmv: -0.4309647, cpa: 2905000, cpe: 58100, cpm: 1644339.6226,
        emvShare: 0.011376,
      },
      // В спецификации emvShare округлён до 0.0113760 (точно 0.01137608…).
      { emvShare: 1e-5 },
    );
    expect(r.romiCore).toBeLessThan(0); // модель не подогнана под «всегда в плюсе»
    expect(r.multiple).toBeGreaterThan(1); // Multiple ≠ ROMI
  });

  it("C: FMCG, аквазона — сезонное окно", () => {
    const r = checkGolden(
      { pkg: "z6", industry: "fm", contactShare: 0.3, er: 0.25, cr: 0.04, ltvUnit: 4_500_000, margin: 0.18, exposure: 0.3, btlCoef: 0.35, vatRecoverable: false },
      {
        base: 92916.6666667, reach: 27875, rights: 185500000, total: 280476000, budget: 280476000, engaged: 6968.75,
        actions: 278.75, cohort: 1254375000, contribution: 225787500, multiple: 4.4723078, romiCore: -0.1949846,
        hours: 40140, cphi: 6987.4439462,
      },
    );
    expect(r.base).toBeLessThan(250_000);
    expect(r.reach).toBeCloseTo(r.base * 0.3, 6);
  });

  it("D: возмещение НДС убирает НДС из знаменателя", () => {
    const r = checkGolden(
      {
        pkg: "map", industry: "telecom", contactShare: 0.8, er: 0.2, cr: 0.025, household: 4.2, margin: 0.38,
        exposure: 0.3, btlCoef: 0.35, vatRecoverable: true, rightsOverride: 100_000_000, ugcMultiplier: 27,
      },
      { budget: 135000000, multiple: 18.6666666667, romiCore: 6.0933333333, cphi: 468.75 },
    );
    expect(r.budget).toBe(r.subtotal);
  });
});

/* ── Инварианты (§8) ── */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20261114);
const rand = (min: number, max: number) => min + (max - min) * rnd();
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];

function randomInput(): ModelInput {
  const pkg = pick(PACKAGE_KEYS);
  return {
    pkg,
    industry: pick(["bank", "telecom", "auto", "fmcg", "retail", "fm"] as const),
    guestsYear: rand(TRAFFIC.guestsYear.min, TRAFFIC.guestsYear.max),
    visitHours: rand(TRAFFIC.visitHours.min, TRAFFIC.visitHours.max),
    contactShare: rand(0.05, 1),
    sov: rand(0.1, 1),
    er: rand(0.01, 0.6),
    cr: rand(0.001, 0.15),
    household: rand(1, 6),
    ltvUnit: rand(500_000, 80_000_000),
    margin: rand(0.05, 1),
    exposure: rand(0.15, 1),
    btlCoef: rand(0.2, 0.5),
    vatRecoverable: rnd() < 0.5,
    ugcMultiplier: rand(1, 100),
    ...(pkg === "project" ? { rightsOverride: rand(20_000_000, 150_000_000) } : {}),
  };
}

function checkInvariants(r: ModelResult, input: ModelInput) {
  const tag = JSON.stringify(input);
  // I-02: ROMI_core = Multiple × маржа − 1
  expect(Math.abs(r.romiCore - (r.multiple * r.margin - 1)), `I-02 ${tag}`).toBeLessThan(1e-9);
  // I-03: ROMI_with_EMV − ROMI_core = EMV / бюджет
  expect(Math.abs(r.romiEmv - r.romiCore - r.emvShare), `I-03 ${tag}`).toBeLessThan(1e-9);
  // I-04: CPHI × часы = бюджет
  expect(Math.abs((r.cphi as number) * r.hours - r.budget) / r.budget, `I-04 ${tag}`).toBeLessThan(1e-9);
  // I-05: выгода × CPHI = DOOH-бенчмарк
  expect(Math.abs((r.advantage as number) * (r.cphi as number) - r.doohHour), `I-05 ${tag}`).toBeLessThan(1e-6);
  // I-06: EMV = offline + UGC
  expect(Math.abs(r.emv - r.emvOffline - r.emvUgc) / Math.max(r.emv, 1), `I-06 ${tag}`).toBeLessThan(1e-12);
  // I-09: нет NaN/Infinity
  for (const [k, v] of Object.entries(r)) expect(v === null || Number.isFinite(v), `I-09 ${k} ${tag}`).toBe(true);
  // I-10: бюджет > 0
  expect(r.budget, `I-10 ${tag}`).toBeGreaterThan(0);
  // Бюджет = права × (1 + BTL) × (1 + НДС, если не возмещается)
  const expectedBudget = r.rights * (1 + (input.btlCoef ?? BUDGET.btl.default)) * (input.vatRecoverable ? 1 : 1 + BUDGET.vat);
  expect(Math.abs(r.budget - expectedBudget) / expectedBudget, `бюджет ${tag}`).toBeLessThan(1e-12);
}

describe("инварианты I-01…I-10 и 1000 случайных входов (§8)", () => {
  it("I-07: экспозиция меняет только часы и CPHI, не охват и не деньги", () => {
    const input: ModelInput = { pkg: "title", industry: "retail" };
    const r1 = computeModel({ ...input, exposure: 0.15 });
    const r2 = computeModel({ ...input, exposure: 1 });
    expect(r1.reach).toBe(r2.reach);
    expect(r1.actions).toBe(r2.actions);
    expect(r1.contribution).toBe(r2.contribution);
    expect(r1.romiCore).toBe(r2.romiCore);
    expect(r1.cphi!).toBeGreaterThan(r2.cphi!);
  });

  it("I-08: семья телекома меняет LTV, но не число действий", () => {
    const t1 = computeModel({ pkg: "map", industry: "telecom", household: 1 });
    const t2 = computeModel({ pkg: "map", industry: "telecom", household: 6 });
    expect(t1.actions).toBe(t2.actions);
    expect(t2.ltvUnit).toBeCloseTo(t1.ltvUnit * 6, 6);
    expect(t2.cohort).toBeCloseTo(t1.cohort * 6, 3);
  });

  it("семья не влияет на отрасли, кроме телекома", () => {
    for (const ind of ["bank", "auto", "fmcg", "retail"] as IndustryKey[]) {
      const a = computeModel({ pkg: "z5", industry: ind, household: 1 });
      const b = computeModel({ pkg: "z5", industry: ind, household: 6 });
      expect(a.contribution, ind).toBe(b.contribution);
    }
  });

  it("неэксклюзивная доля голоса (SOV) действует только на платёжный контур", () => {
    expect(computeModel({ pkg: "title", industry: "bank", sov: 0.2 }).reach).toBe(computeModel({ pkg: "title", industry: "bank" }).reach);
    const full = computeModel({ pkg: "contour", industry: "bank", sov: 1 });
    const half = computeModel({ pkg: "contour", industry: "bank", sov: 0.5 });
    expect(half.reach).toBeCloseTo(full.reach / 2, 9);
  });

  it("дефолты всех пакетов и отраслей проходят инварианты", () => {
    for (const pkg of PACKAGE_KEYS) {
      for (const industry of Object.keys(INDUSTRIES) as IndustryKey[]) {
        const input = { pkg, industry };
        checkInvariants(computeModel(input), input);
      }
    }
  });

  it("1000 случайных входов: инварианты и монотонность", () => {
    for (let i = 0; i < 1000; i++) {
      const input = randomInput();
      const r = computeModel(input);
      checkInvariants(r, input);

      const moreEr = computeModel({ ...input, er: (input.er as number) * 1.1 });
      expect(moreEr.actions).toBeGreaterThanOrEqual(r.actions);
      expect(moreEr.contribution).toBeGreaterThanOrEqual(r.contribution);
      expect(moreEr.cpa!).toBeLessThanOrEqual(r.cpa! * (1 + 1e-12));

      const moreBtl = computeModel({ ...input, btlCoef: Math.min((input.btlCoef as number) + 0.1, 0.5) });
      expect(moreBtl.budget).toBeGreaterThanOrEqual(r.budget);
      expect(moreBtl.multiple).toBeLessThanOrEqual(r.multiple * (1 + 1e-12));
      expect(moreBtl.romiCore).toBeLessThanOrEqual(r.romiCore + 1e-12);

      // Больше гостей — линейно больше охвата; ROMI растёт или стоит.
      const moreGuests = computeModel({ ...input, guestsYear: (input.guestsYear as number) * 1.1 });
      expect(moreGuests.reach).toBeCloseTo(r.reach * 1.1, 4);
      expect(moreGuests.romiCore).toBeGreaterThanOrEqual(r.romiCore - 1e-12);

      // Время визита — только часы погружения.
      const longer = computeModel({ ...input, visitHours: (input.visitHours as number) + 1 });
      expect(longer.reach).toBe(r.reach);
      expect(longer.romiCore).toBe(r.romiCore);
      expect(longer.hours).toBeGreaterThan(r.hours);
    }
  });
});

describe("квалификация партнёра", () => {
  it("7 Qadam: доля пакета в маркетинговом бюджете по нижней границе", () => {
    const q = qualify({ industry: "auto", budget: 1_197_400_000, qadamStep: 5, fx: 11_974, bankNetProfit: null });
    expect(q.kind).toBe("qadam");
    if (q.kind === "qadam") {
      expect(q.budgetFloorUzs).toBe(300_000 * 11_974);
      expect(q.share).toBeCloseTo(1_197_400_000 / (300_000 * 11_974), 12);
    }
  });

  it("банк квалифицируется по чистой прибыли, не по 7 Qadam; без прибыли — без доли", () => {
    const none = qualify({ industry: "bank", budget: 1e9, qadamStep: 5, fx: 11_974, bankNetProfit: null });
    expect(none).toEqual({ kind: "bank", netProfitUzs: null, share: null });
    const q = qualify({ industry: "bank", budget: 1e9, qadamStep: 5, fx: 11_974, bankNetProfit: 500e9 });
    expect(q).toEqual({ kind: "bank", netProfitUzs: 500e9, share: 0.002 });
  });
});
