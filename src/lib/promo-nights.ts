import { promotions } from "@/content/promotions";

/**
 * Акция «2+1» на конкретных датах: три ночи по цене двух.
 *
 * Условия оператора: заезд с понедельника по четверг, выезд не позже пятницы,
 * действует до конца сентября 2026. Из них следует главное — акция работает
 * только внутри рабочей недели, поэтому больше трёх ночей под неё не попадает.
 *
 * Живёт отдельным модулем, а не внутри формы, потому что то же правило нужно
 * трём местам сразу: форме заявки, секции акций и карточке первого экрана.
 * Форма — самое важное из них: гость выбирает даты именно там, и подсказка
 * «добавьте третью ночь, она бесплатно» стоит ровно в тот момент, когда он ещё
 * может передумать.
 */

/** Asia/Tashkent — UTC+5 круглый год, без перехода на летнее время. */
export function todayTashkent(): string {
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

const promo = promotions.find((p) => p.slug === "2plus1");

/** Последний день действия акции включительно, из данных акции. */
export function promoLastDay(): string {
  return promo?.until ?? "";
}

/** Акция ещё действует на указанную дату (по умолчанию — сегодня). */
export function promoActive(today = todayTashkent()): boolean {
  const last = promoLastDay();
  return Boolean(last) && today <= last;
}

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay(); // 0=вс … 6=сб

/** Ночей между датами; 0, если даты пустые или порядок неверный. */
export function nightsBetween(checkin: string, checkout: string): number {
  if (!checkin || !checkout) return 0;
  const ms = Date.parse(`${checkout}T12:00:00Z`) - Date.parse(`${checkin}T12:00:00Z`);
  const n = Math.round(ms / 86_400_000);
  return n > 0 ? n : 0;
}

/** Дата через сутки после указанной. */
export function nextDay(iso: string): string {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

/**
 * Попадает ли отрезок под условия акции.
 *
 * Проверяем именно выезд, а не только длину: заезд в четверг на три ночи даёт
 * выезд в воскресенье — это уже выходные, и акция не действует, хотя ночей
 * ровно три.
 */
export function rangeQualifies(checkin: string, checkout: string, today = todayTashkent()): boolean {
  if (!promoActive(today)) return false;
  if (!checkin || !checkout) return false;
  if (checkout > promoLastDay()) return false;
  const inDay = day(checkin);
  const outDay = day(checkout);
  if (inDay < 1 || inDay > 4) return false; // заезд Пн–Чт
  if (outDay < 2 || outDay > 5) return false; // выезд Вт–Пт
  return true;
}

export type PromoHint =
  /** Выбрано две ночи, третья попадает под акцию — предлагаем продлить. */
  | { kind: "offer-third"; extendTo: string }
  /** Выбрано три ночи по акции — третья бесплатно. */
  | { kind: "third-free" }
  /**
   * Даты короткие, но под акцию не подходят — объясняем, какие подойдут.
   *
   * Молчать здесь нельзя: гость выбрал среду и пятницу, увидел пустоту и решил,
   * что акции нет вовсе. Третья ночь у него ушла бы на субботу, а по условиям
   * выезд не позже пятницы — это надо сказать словами, чтобы он мог сдвинуть
   * даты, а не гадать.
   */
  | { kind: "explain" }
  | null;

/** Что показать под выбранными датами. */
export function promoHint(checkin: string, checkout: string, today = todayTashkent()): PromoHint {
  if (!promoActive(today)) return null;
  const nights = nightsBetween(checkin, checkout);
  if (!nights) return null;
  if (nights === 3 && rangeQualifies(checkin, checkout, today)) return { kind: "third-free" };
  if (nights === 2) {
    const extended = nextDay(checkout);
    if (rangeQualifies(checkin, extended, today)) return { kind: "offer-third", extendTo: extended };
  }
  // Две-три ночи выбраны, но условия не сошлись — объясняем какие нужны.
  if (nights <= 3) return { kind: "explain" };
  return null;
}

/**
 * Расчёт «2+1» по каждому домику — то, что оператор объясняет гостям словами:
 * «1 ночь = 1 500 000, 3 ночи = 3 000 000, значит ночь выходит 1 000 000».
 *
 * Считается из суммы выгоды в promotions.ts: выгода и есть цена одной ночи,
 * потому что бесплатной становится ровно одна. Цифр в тексте нет — поменяется
 * тариф, поменяется и расчёт.
 */
export type PromoRow = {
  label: { ru: string; uz: string; en: string };
  /** Цена одной ночи в будни. */
  night: number;
  /** Сколько платит гость за три ночи по акции. */
  total: number;
  /** Сколько выходит за ночь, если разделить на три. */
  perNight: number;
};

export function promoBreakdown(): PromoRow[] {
  return (promo?.savings ?? []).map((s) => ({
    label: s.label,
    night: s.amount,
    total: s.amount * 2,
    // Округляем до тысячи: 3 000 000 / 3 делится ровно, но тариф может
    // смениться на число, которое не делится.
    perNight: Math.round((s.amount * 2) / 3 / 1000) * 1000,
  }));
}

/** Самая низкая цена ночи по акции — крючок для первого экрана. */
export function promoCheapestNight(): number {
  const rows = promoBreakdown();
  return rows.length ? Math.min(...rows.map((r) => r.perNight)) : 0;
}
