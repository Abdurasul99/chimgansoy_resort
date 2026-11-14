/**
 * Экономика партнёрского калькулятора (/partners/detail) — модель v2.0.
 *
 * Источник формул — «Модель экономики калькулятора Chimgan Darbaza, техническая
 * спецификация v2.0» от 14.11.2026 (проверка Qwen): блоки A–F, golden-тесты
 * A–D и инварианты I-01…I-10 живут в __tests__/economics.test.ts. Отличие от
 * спецификации одно, по решению владельца 14.11.2026: годовой поток и время
 * визита — не точки (250 000 и 4.8 ч), а диапазоны 200–250 тыс. гостей и
 * 5,5–7 ч. Оба — входы модели; по умолчанию берётся нижняя граница
 * (консервативно). Golden-тесты передают 250 000 и 4.8 явно и сходятся со
 * спецификацией до 1e-6.
 *
 * Чистые функции, без React и без обращений к сети: один и тот же расчёт
 * видят калькулятор, меморандум и тесты. Деньги считаются на неокруглённых
 * значениях, округляет только отображение.
 *
 * Правила (спецификация §3.2):
 *  1. Одна кампания = один пакет; охваты разных пакетов не складываются.
 *  2. Охват сезонной зоны — от базы её окна работы, не от года.
 *  3. Экспозиция меняет только часы погружения, не охват людей.
 *  4. Телеком: семья внутри LTV, действия на неё не умножаются.
 *  5. ROMI_core — основной показатель; ROMI с EMV — справочно.
 *  6. EMV = offline + UGC, без повторного учёта UGC.
 *  8. Бюджет — из прайса; вручную задаётся только проектное участие.
 */

/* ───────────────────────── Трафик ───────────────────────── */

export const SEASONS = ["winter", "spring", "summer", "autumn"] as const;
export type Season = (typeof SEASONS)[number];

/** Доли сезонов в годовом потоке, целые проценты (сумма — 100). OPERATIONAL-ESTIMATE. */
export const SEASON_PCT: Record<Season, number> = { winter: 46, spring: 14, summer: 30, autumn: 10 };

export const SEASON_LABEL: Record<Season, { name: string; months: string }> = {
  winter: { name: "Зима", months: "ноябрь – февраль" },
  spring: { name: "Весна", months: "март – май" },
  summer: { name: "Лето", months: "июнь – август" },
  autumn: { name: "Осень", months: "сентябрь – октябрь" },
};

/** Диапазоны владельца (14.11.2026). По умолчанию — нижняя граница. */
export const TRAFFIC = {
  guestsYear: { min: 200_000, max: 250_000, step: 5_000, default: 200_000 },
  visitHours: { min: 5.5, max: 7, step: 0.1, default: 5.5 },
} as const;

/**
 * Контекст площадки: в формулах калькулятора не участвует (спецификация §1.7),
 * но показывается на лендинге и в меморандуме — поэтому число живёт здесь,
 * а не текстом в нескольких местах. OPERATIONAL-ESTIMATE.
 */
export const VENUE_CONTEXT = {
  avgCheck: 200_000, // средний чек гостя, сум
  guestPaymentsPerVisit: 7,
  partnerTranches: 7,
} as const;

/** Карта гостя: тираж × цена экземпляра = цена прав (240 млн). */
export const GUEST_MAP_PRINT = { copies: 20_000, unitPrice: 12_000 } as const;

/** Гости сезона: проценты целые, поэтому 250 000 × 46 / 100 — ровно 115 000. */
export function seasonGuests(guestsYear: number): Record<Season, number> {
  return {
    winter: (guestsYear * SEASON_PCT.winter) / 100,
    spring: (guestsYear * SEASON_PCT.spring) / 100,
    summer: (guestsYear * SEASON_PCT.summer) / 100,
    autumn: (guestsYear * SEASON_PCT.autumn) / 100,
  };
}

/** Какая доля каждого сезона попадает в окно работы носителя (0…1). */
export type SeasonWindow = Record<Season, number>;

const ALL_YEAR: SeasonWindow = { winter: 1, spring: 1, summer: 1, autumn: 1 };

/** F-A01: База окна = Σ(гости сезона × доля покрытия сезона). */
export function windowBase(window: SeasonWindow, guestsYear: number = TRAFFIC.guestsYear.default): number {
  const g = seasonGuests(guestsYear);
  return SEASONS.reduce((sum, s) => sum + g[s] * window[s], 0);
}

/* ───────────────────────── Пакеты и прайс ───────────────────────── */

export const PACKAGE_KEYS = ["title", "z4", "z6", "z5", "map", "contour", "project"] as const;
export type PackageKey = (typeof PACKAGE_KEYS)[number];

export type PackageDef = {
  label: string;
  /** Цена прав, сум без НДС. null — задаёт пользователь (проектное участие). */
  price: number | null;
  period: "год" | "сезон" | "проект";
  window: SeasonWindow;
  /** Окно работы словами — то же, что в window, для прайса и паспортов. */
  windowLabel: string;
  /** Доля гостей окна, вошедших в зону носителя (дефолт, ASSUMPTION). */
  contactShare: number;
  /** Неэксклюзивный формат: охват делится на долю голоса бренда (SOV). */
  nonExclusive?: boolean;
  custom?: boolean;
};

/** Проектное участие: диапазон цены прав, сум. */
export const PROJECT_RIGHTS = { min: 20_000_000, max: 150_000_000, step: 5_000_000, default: 20_000_000 } as const;

export const PACKAGES: Record<PackageKey, PackageDef> = {
  title: {
    label: "Титульный пакет (зоны 1+2+3+7)",
    price: 1_037_500_000,
    period: "год",
    window: ALL_YEAR,
    windowLabel: "круглый год",
    contactShare: 0.9,
  },
  z4: {
    label: "Зона 4 • Топчаны",
    price: 364_100_000,
    period: "сезон",
    // апрель – сентябрь: весна — апрель и май (2/3), лето целиком, осень — сентябрь (1/2).
    window: { winter: 0, spring: 2 / 3, summer: 1, autumn: 1 / 2 },
    windowLabel: "апрель – сентябрь",
    contactShare: 0.45,
  },
  z6: {
    label: "Зона 6 • Аквазона",
    price: 185_500_000,
    period: "сезон",
    // май – середина сентября: весна — май (1/3), лето целиком, осень — полмесяца из двух (1/4).
    window: { winter: 0, spring: 1 / 3, summer: 1, autumn: 1 / 4 },
    windowLabel: "май – середина сентября",
    contactShare: 0.3,
  },
  z5: {
    label: "Зона 5 • Магазин и корнер",
    price: 187_700_000,
    period: "год",
    window: ALL_YEAR,
    windowLabel: "круглый год",
    contactShare: 0.55,
  },
  map: {
    label: "Брендированная карта гостя",
    price: 240_000_000,
    period: "год",
    window: ALL_YEAR,
    windowLabel: "круглый год",
    contactShare: 0.65,
  },
  contour: {
    label: "Платёжный контур",
    price: 60_000_000,
    period: "год",
    window: ALL_YEAR,
    windowLabel: "круглый год",
    contactShare: 0.8,
    nonExclusive: true,
  },
  project: {
    label: "Проектное участие",
    price: null,
    period: "проект",
    window: ALL_YEAR,
    windowLabel: "по ТЗ",
    contactShare: 0.5,
    custom: true,
  },
};

/* ───────────────────────── Бюджет, внимание, UGC ───────────────────────── */

export const BUDGET = {
  vat: 0.12, // FACT: НДС Узбекистана
  btl: { min: 0.2, max: 0.5, step: 0.01, default: 0.35 }, // ASSUMPTION
} as const;

export const ATTENTION = {
  exposure: { min: 0.15, max: 1, step: 0.01, default: 0.3 }, // ASSUMPTION
  doohCpt: 15_000, // BENCHMARK: сум за 1000 показов городского DOOH
  glanceSec: 2.5, // BENCHMARK: секунд взгляда на городской экран
} as const;

export const UGC = {
  cpmInstagram: 17_000, // BENCHMARK
  cpmTelegram: 26_500, // BENCHMARK
  shareInstagram: 0.7, // ASSUMPTION
  shareTelegram: 0.3, // ASSUMPTION
  postingRate: { min: 0.005, max: 0.1, step: 0.005, default: 0.03 }, // ASSUMPTION
  avgPostReach: { min: 100, max: 3000, step: 50, default: 900 }, // ASSUMPTION
} as const;

/** F-F02: взвешенный CPM UGC = 17 000 × 0.7 + 26 500 × 0.3 = 19 850. */
export const UGC_CPM_BLEND = UGC.cpmInstagram * UGC.shareInstagram + UGC.cpmTelegram * UGC.shareTelegram;

/** F-E03: цена часа внимания городского DOOH = (CPT / 1000) × 3600 / взгляд = 21 600 сум/час. */
export const DOOH_HOUR = ((ATTENTION.doohCpt / 1000) * 3600) / ATTENTION.glanceSec;

/* ───────────────────────── Отрасли ───────────────────────── */

export const INDUSTRY_KEYS = ["bank", "telecom", "auto", "fmcg", "retail"] as const;
export type IndustryKey = (typeof INDUSTRY_KEYS)[number];

type IndustryBase = { label: string; er: number; cr: number; margin: number };
export type IndustryDef =
  | (IndustryBase & { kind: "ltv"; ltv: number })
  | (IndustryBase & { kind: "household"; arpu: number; months: number; household: number });

/** Дефолты воронки — ASSUMPTION, требуют калибровки на пилотах (спецификация §5). */
export const INDUSTRIES: Record<IndustryKey, IndustryDef> = {
  bank: { label: "Банк", kind: "ltv", er: 0.12, cr: 0.02, ltv: 3_600_000, margin: 0.45 },
  telecom: { label: "Телеком", kind: "household", er: 0.2, cr: 0.025, arpu: 25_000, months: 24, household: 4.2, margin: 0.38 },
  auto: { label: "Авто", kind: "ltv", er: 0.08, cr: 0.012, ltv: 58_000_000, margin: 0.12 },
  fmcg: { label: "FMCG", kind: "ltv", er: 0.25, cr: 0.04, ltv: 4_500_000, margin: 0.18 },
  retail: { label: "Ритейл", kind: "ltv", er: 0.22, cr: 0.035, ltv: 5_200_000, margin: 0.2 },
};

export const HOUSEHOLD = { min: 1, max: 6, step: 0.1 } as const;

/** Ключ отрасли из адреса: принимает и старое «fm» из спецификации. */
export function normalizeIndustry(raw: string | null | undefined): IndustryKey | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "fm") return "fmcg";
  return (INDUSTRY_KEYS as readonly string[]).includes(v) ? (v as IndustryKey) : null;
}

export function isPackageKey(raw: string | null | undefined): raw is PackageKey {
  return (PACKAGE_KEYS as readonly string[]).includes(raw ?? "");
}

/* ───────────────────────── Расчёт ───────────────────────── */

export type ModelInput = {
  pkg: PackageKey;
  industry: IndustryKey | "fm";
  guestsYear?: number;
  visitHours?: number;
  contactShare?: number;
  /** Доля голоса бренда для неэксклюзивного формата (0…1). */
  sov?: number;
  er?: number;
  cr?: number;
  /** LTV клиента за 3 года — для всех, кроме телекома. */
  ltvUnit?: number;
  arpu?: number;
  household?: number;
  margin?: number;
  exposure?: number;
  btlCoef?: number;
  vatRecoverable?: boolean;
  /** Цена прав вместо прайса: проектное участие, персональное предложение. */
  rightsOverride?: number;
  /** Показы UGC на одно вовлечение; иначе postingRate × avgPostReach. */
  ugcMultiplier?: number;
  postingRate?: number;
  avgPostReach?: number;
};

export type ModelResult = {
  guestsYear: number;
  visitHours: number;
  base: number;
  rights: number;
  btl: number;
  subtotal: number;
  vat: number;
  total: number;
  budget: number;
  reach: number;
  engaged: number;
  actions: number;
  ltvUnit: number;
  margin: number;
  cohort: number;
  contribution: number;
  multiple: number;
  romiCore: number;
  hours: number;
  cphi: number | null;
  doohHour: number;
  advantage: number | null;
  cityEq: number;
  ugcMultiplier: number;
  ugcImpressions: number;
  emvOffline: number;
  emvUgc: number;
  emv: number;
  net: number;
  romiEmv: number;
  cpa: number | null;
  cpe: number | null;
  cpm: number | null;
  emvShare: number;
};

export function computeModel(input: ModelInput): ModelResult {
  const pkg = PACKAGES[input.pkg];
  const industryKey = normalizeIndustry(input.industry) ?? "bank";
  const ind = INDUSTRIES[industryKey];

  // Блок A: база окна
  const guestsYear = input.guestsYear ?? TRAFFIC.guestsYear.default;
  const visitHours = input.visitHours ?? TRAFFIC.visitHours.default;
  const base = windowBase(pkg.window, guestsYear);

  // Блок B: бюджет (F-B01…B06)
  const rights = input.rightsOverride ?? pkg.price ?? PROJECT_RIGHTS.default;
  const btl = rights * (input.btlCoef ?? BUDGET.btl.default);
  const subtotal = rights + btl;
  const vat = subtotal * BUDGET.vat;
  const total = subtotal + vat;
  const budget = input.vatRecoverable ? subtotal : total;

  // Блок C: воронка (F-C01…C05). Экспозиции здесь нет — правило 3.
  const sov = pkg.nonExclusive ? (input.sov ?? 1) : 1;
  const reach = base * (input.contactShare ?? pkg.contactShare) * sov;
  const engaged = reach * (input.er ?? ind.er);
  const actions = engaged * (input.cr ?? ind.cr);

  // Блок D: экономика (F-D01…D10). Семья телекома — только внутри LTV, правило 4.
  const ltvUnit =
    ind.kind === "household"
      ? (input.arpu ?? ind.arpu) * ind.months * (input.household ?? ind.household)
      : (input.ltvUnit ?? ind.ltv);
  const margin = input.margin ?? ind.margin;
  const cohort = actions * ltvUnit;
  const contribution = cohort * margin;
  const multiple = cohort / budget;
  const romiCore = (contribution - budget) / budget;

  // Блок E: экономика внимания (F-E01…E05)
  const exposure = input.exposure ?? ATTENTION.exposure.default;
  const hours = reach * visitHours * exposure;
  const cphi = hours > 0 ? budget / hours : null;
  const doohHour = DOOH_HOUR;
  const advantage = cphi ? doohHour / cphi : null;
  const cityEq = (hours * 3600) / ATTENTION.glanceSec;

  // Блок F: EMV (F-F01…F04) — UGC учитывается один раз, правило 6.
  const ugcMultiplier =
    input.ugcMultiplier ??
    (input.postingRate ?? UGC.postingRate.default) * (input.avgPostReach ?? UGC.avgPostReach.default);
  const ugcImpressions = engaged * ugcMultiplier;
  const emvOffline = (reach / 1000) * ATTENTION.doohCpt;
  const emvUgc = (ugcImpressions / 1000) * UGC_CPM_BLEND;
  const emv = emvOffline + emvUgc;

  const net = contribution + emv - budget;
  const romiEmv = net / budget;
  const cpa = actions > 0 ? budget / actions : null;
  const cpe = engaged > 0 ? budget / engaged : null;
  const blended = reach + ugcImpressions;
  const cpm = blended > 0 ? (budget / blended) * 1000 : null;
  const emvShare = emv / budget;

  return {
    guestsYear,
    visitHours,
    base,
    rights,
    btl,
    subtotal,
    vat,
    total,
    budget,
    reach,
    engaged,
    actions,
    ltvUnit,
    margin,
    cohort,
    contribution,
    multiple,
    romiCore,
    hours,
    cphi,
    doohHour,
    advantage,
    cityEq,
    ugcMultiplier,
    ugcImpressions,
    emvOffline,
    emvUgc,
    emv,
    net,
    romiEmv,
    cpa,
    cpe,
    cpm,
    emvShare,
  };
}

/* ───────────────────────── Квалификация партнёра ───────────────────────── */

/**
 * 7 Qadam (Lokals Marketing, 2026) — ступени по обороту и маркетинговому
 * бюджету в долларах. Применяется к авто, FMCG и ритейлу; банки
 * квалифицируются по чистой прибыли (спецификация §5.1, §5.3). В ROMI не
 * входит: это проверка «помещается ли пакет в бюджет компании», по нижней
 * границе — консервативно.
 */
export const QADAM: Record<3 | 4 | 5 | 6 | 7, { turnover: string; budgetUsd: [number, number] }> = {
  3: { turnover: "$1–5 млн", budgetUsd: [30_000, 100_000] },
  4: { turnover: "$5–10 млн", budgetUsd: [100_000, 300_000] },
  5: { turnover: "$10–50 млн", budgetUsd: [300_000, 1_000_000] },
  6: { turnover: "$50–100 млн", budgetUsd: [1_000_000, 3_000_000] },
  7: { turnover: "$100 млн+", budgetUsd: [3_000_000, 10_000_000] },
};
export type QadamStep = keyof typeof QADAM;

/** Курс USD/UZS по умолчанию (ЦБ РУз), редактируемый. */
export const FX_DEFAULT = 11_974;

export type Qualification =
  | { kind: "qadam"; step: QadamStep; budgetFloorUzs: number; share: number }
  | { kind: "bank"; netProfitUzs: number | null; share: number | null };

export function qualify(args: {
  industry: IndustryKey;
  budget: number;
  qadamStep: QadamStep;
  fx: number;
  /** Чистая прибыль банка, сум/год; null — не введена. */
  bankNetProfit: number | null;
}): Qualification {
  if (args.industry === "bank") {
    const p = args.bankNetProfit && args.bankNetProfit > 0 ? args.bankNetProfit : null;
    return { kind: "bank", netProfitUzs: p, share: p ? args.budget / p : null };
  }
  const floor = QADAM[args.qadamStep].budgetUsd[0] * args.fx;
  return { kind: "qadam", step: args.qadamStep, budgetFloorUzs: floor, share: args.budget / floor };
}
