/**
 * Калькулятор медиа-ценности партнёрского портала.
 *
 * Формулы — из кода владельца (chimgan_darbaza_b2b_partner_portal (2).tsx,
 * «STRICT MEDIA EFFICIENCY CALCULATIONS»), дополнены тем, что видно на
 * скриншотах улучшенной версии: ROMI и сравнение с цифровым CAC Ташкента.
 *
 *   контакты     = годовой поток × доля гостей в зоне
 *   вовлечения   = контакты × ER
 *   действия     = вовлечения × CR
 *   UGC-показы   = вовлечения × UGC-множитель
 *   вложения     = цена уровня + бюджет BTL
 *   CPV / CPM / CPE / CPA = вложения ÷ (контакты / тысяча касаний / вовлечения / действия)
 *   безубыточность = вложения ÷ LTV (в действиях)
 *   ROMI         = (действия × LTV − вложения) ÷ вложения
 */

export type PortalInputs = {
  traffic: number;
  tierPrice: number;
  budget: number;
  /** % гостей в зрительном контакте с зоной */
  contactRate: number;
  /** % вовлечения от видевших */
  er: number;
  /** % целевого действия от вовлечённых */
  cr: number;
  /** просмотров в соцсетях на одно вовлечение */
  ugc: number;
  /** ценность одного целевого действия (LTV), сум */
  ltv: number;
};

export type PortalResult = {
  offlineContacts: number;
  engagements: number;
  targetActions: number;
  ugcViews: number;
  grossTouchpoints: number;
  investment: number;
  cpv: number;
  cpm: number;
  cpe: number;
  cpa: number;
  /** Сколько действий нужно, чтобы вложения окупились; 0 — LTV не задан. */
  breakEven: number;
  /** null — LTV не задан. */
  romi: number | null;
  /** Стоимость одного действия только за права (без BTL). */
  cpaRightsOnly: number;
};

const per = (cost: number, n: number) => (n > 0 ? Math.round(cost / n) : 0);

export function portalCalc(i: PortalInputs): PortalResult {
  const offlineContacts = Math.round(i.traffic * (i.contactRate / 100));
  const engagements = Math.round(offlineContacts * (i.er / 100));
  const targetActions = Math.round(engagements * (i.cr / 100));
  const ugcViews = Math.round(engagements * i.ugc);
  const grossTouchpoints = offlineContacts + ugcViews;
  const investment = i.tierPrice + i.budget;
  return {
    offlineContacts,
    engagements,
    targetActions,
    ugcViews,
    grossTouchpoints,
    investment,
    cpv: per(investment, offlineContacts),
    cpm: grossTouchpoints > 0 ? Math.round((investment / grossTouchpoints) * 1000) : 0,
    cpe: per(investment, engagements),
    cpa: per(investment, targetActions),
    breakEven: i.ltv > 0 ? Math.ceil(investment / i.ltv) : 0,
    romi: i.ltv > 0 && investment > 0 ? (targetActions * i.ltv - investment) / investment : null,
    cpaRightsOnly: per(i.tierPrice, targetActions),
  };
}

/** Значение сценария, прижатое к коридору ползунка. */
export function scenarioValue(base: number, factor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(base * factor)));
}

/** «205 000», «2 550 000 000 сум». */
export const fmtNum = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n)).replace(/ /g, " ");
export const fmtUzs = (n: number) => `${fmtNum(n)} сум`;
export const fmtRomi = (r: number | null) => (r === null ? "—" : `${r >= 0 ? "+" : ""}${r.toFixed(1)}x`);
