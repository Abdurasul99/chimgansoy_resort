import { INDUSTRIES, PACKAGES, QADAM, type ModelResult, type Qualification } from "@/lib/partners/economics";
import { fmtBig, fmtInt, fmtNum, fmtPct, fmtSum, fmtX } from "@/lib/partners/format";
import type { CalcState } from "./Workbench";

/**
 * Строки результата — одни и те же для калькулятора, меморандума и заявки.
 * Если показатель есть в калькуляторе, он есть и в документе для руководства.
 */

export type Row = { label: string; value: string; hint?: string; strong?: boolean };
export type Group = { title: string; rows: Row[] };

export function paramRows(s: CalcState, r: ModelResult): Row[] {
  const ind = INDUSTRIES[s.industry];
  const pkg = PACKAGES[s.pkg];
  const rows: Row[] = [
    { label: "Отрасль", value: ind.label },
    { label: "Пакет", value: pkg.label },
    { label: "Окно работы", value: pkg.windowLabel },
    { label: "Гостей в год (база)", value: fmtInt(s.guestsYear) },
    { label: "База окна пакета", value: `${fmtInt(r.base)} гостей` },
    { label: "Время визита", value: `${fmtNum(s.visitHours)} ч` },
    { label: "Доля контакта с зоной", value: fmtPct(s.contactShare) },
  ];
  if (pkg.nonExclusive) rows.push({ label: "Доля голоса бренда (SOV)", value: fmtPct(s.sov) });
  rows.push({ label: "Вовлечение ER", value: fmtPct(s.er, 1) }, { label: "Конверсия CR", value: fmtPct(s.cr, 1) });
  if (ind.kind === "household") {
    rows.push(
      { label: "ARPU", value: `${fmtInt(s.arpu)} сум/мес` },
      { label: "Размер семьи", value: `${fmtNum(s.household)} чел.` },
    );
  }
  rows.push(
    { label: ind.kind === "household" ? "LTV домохозяйства (24 мес)" : "LTV клиента (3 года)", value: fmtSum(r.ltvUnit) },
    { label: "Маржа", value: fmtPct(s.margin) },
    { label: "Экспозиция", value: fmtPct(s.exposure) },
    { label: "BTL", value: fmtPct(s.btlCoef) },
    { label: "НДС", value: s.vatRecoverable ? "возмещается — метрики без НДС" : "в бюджете метрик" },
    { label: "UGC: публикуют / показов на пост", value: `${fmtPct(s.postingRate, 1)} / ${fmtInt(s.avgPostReach)}` },
  );
  return rows;
}

export function resultGroups(r: ModelResult, s: CalcState, q: Qualification): Group[] {
  const groups: Group[] = [
    {
      title: "Бюджет",
      rows: [
        { label: "Права (прайс)", value: fmtSum(r.rights) },
        { label: "BTL — продакшн и промо", value: fmtSum(r.btl) },
        { label: "НДС 12 %", value: fmtSum(r.vat) },
        { label: "Итого с НДС", value: fmtSum(r.total), strong: true },
        ...(s.vatRecoverable ? [{ label: "Бюджет для метрик (без НДС)", value: fmtSum(r.budget), strong: true }] : []),
      ],
    },
    {
      title: "Воронка",
      rows: [
        { label: "Охват", value: `${fmtInt(r.reach)} гостей` },
        { label: "Вовлечения", value: fmtInt(r.engaged) },
        { label: "Целевые действия", value: fmtInt(r.actions) },
      ],
    },
    {
      title: "Экономика",
      rows: [
        { label: "LTV когорты", value: fmtSum(r.cohort) },
        { label: "Contribution (LTV × маржа)", value: fmtSum(r.contribution) },
        { label: "Multiple (покрытие LTV)", value: fmtX(r.multiple) },
        { label: "ROMI — основной", value: fmtPct(r.romiCore), strong: true },
        { label: "CPA (полная воронка)", value: fmtSum(r.cpa) },
        { label: "CPE (за вовлечение)", value: fmtSum(r.cpe) },
        { label: "Blended CPM", value: r.cpm === null ? "—" : `${fmtInt(r.cpm)} сум / 1000` },
      ],
    },
    {
      title: "Внимание",
      rows: [
        { label: "Часы погружения", value: `${fmtInt(r.hours)} госте-часов` },
        { label: "CPHI — цена часа погружения", value: r.cphi === null ? "—" : `${fmtSum(r.cphi)} / час` },
        { label: "Ориентир городского DOOH", value: `${fmtInt(r.doohHour)} сум / час` },
        { label: "Выгода против DOOH", value: fmtX(r.advantage, 1) },
        { label: "Эквивалент городских контактов", value: fmtBig(r.cityEq) },
      ],
    },
    {
      title: "EMV — справочно",
      rows: [
        { label: "EMV офлайн", value: fmtSum(r.emvOffline) },
        { label: "Показы UGC", value: fmtBig(r.ugcImpressions) },
        { label: "EMV UGC", value: fmtSum(r.emvUgc) },
        { label: "EMV всего", value: fmtSum(r.emv) },
        { label: "EMV / бюджет", value: fmtPct(r.emvShare, 1) },
        { label: "Чистый эффект с EMV", value: fmtSum(r.net) },
        { label: "ROMI с учётом EMV", value: fmtPct(r.romiEmv), hint: "Не для согласования окупаемости" },
      ],
    },
  ];

  if (q.kind === "qadam") {
    groups.push({
      title: "Квалификация · 7 Qadam",
      rows: [
        { label: "Ступень", value: `${q.step} из 7 · оборот ${QADAM[q.step].turnover}` },
        { label: "Маркетинговый бюджет, нижняя граница", value: `$${fmtInt(QADAM[q.step].budgetUsd[0])} ≈ ${fmtSum(q.budgetFloorUzs)}` },
        { label: "Курс USD/UZS", value: fmtInt(s.fx) },
        { label: "Доля пакета в бюджете", value: fmtPct(q.share), strong: true },
      ],
    });
  } else {
    groups.push({
      title: "Квалификация · чистая прибыль банка",
      rows: [
        { label: "Чистая прибыль", value: q.netProfitUzs ? fmtSum(q.netProfitUzs) : "не указана" },
        { label: "Доля бюджета в прибыли", value: q.share === null ? "—" : fmtPct(q.share, 2), strong: true },
      ],
    });
  }
  return groups;
}

/** Короткая сводка для заявки: менеджер видит, что партнёр уже посчитал. */
export function summaryText(s: CalcState, r: ModelResult): string {
  return [
    `Отрасль: ${INDUSTRIES[s.industry].label}`,
    `Пакет: ${PACKAGES[s.pkg].label}`,
    `Бюджет: ${fmtSum(r.budget)}${s.vatRecoverable ? " (без НДС)" : " (с НДС)"}`,
    `ROMI: ${fmtPct(r.romiCore)} · Multiple ${fmtX(r.multiple)}`,
    `CPHI: ${r.cphi === null ? "—" : fmtSum(r.cphi)}/ч`,
    `База: ${fmtInt(s.guestsYear)} гостей, ${fmtNum(s.visitHours)} ч`,
  ].join("; ");
}
