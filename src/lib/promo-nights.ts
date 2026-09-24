import { promotions } from "@/content/promotions";

/**
 * Акция «2+1» на конкретных датах: три ночи по цене двух.
 *
 * Условия оператора (24.09.2026): заезд в воскресенье, понедельник или
 * вторник, ровно три ночи, выезд не позже пятницы, действует до конца сентября
 * 2026. Все три схемы ложатся на ночи с воскресенья по четверг — те, что
 * в прайсе стоят по будничной цене, — поэтому расчёт акции от заезда не
 * зависит.
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
  return shiftDays(iso, 1);
}

function shiftDays(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Схемы акции: день недели заезда → день недели выезда, ровно три ночи.
 *
 * - Воскресенье → Среда (добавлено 24.09.2026)
 * - Понедельник → Четверг
 * - Вторник → Пятница
 */
const VALID_PAIRS = new Set([
  "0-3", // Вс → Ср
  "1-4", // Пн → Чт
  "2-5", // Вт → Пт
]);

/** Дни недели, в которые можно заехать по акции (0 = вс). */
const ARRIVAL_DAYS = new Set([...VALID_PAIRS].map((pair) => Number(pair.split("-")[0])));

/** Даты складываются в одну из схем — без учёта срока акции. */
function matchesPattern(checkin: string, checkout: string): boolean {
  return nightsBetween(checkin, checkout) === 3 && VALID_PAIRS.has(`${day(checkin)}-${day(checkout)}`);
}

/**
 * Последний день заезда по акции.
 *
 * «До 30 сентября» — это последняя НОЧЬ, а не день выезда. До 24.09.2026 здесь
 * требовалось, чтобы и выезд был не позже 30-го, — и форма отказывала в
 * Пн 28.09 → Чт 01.10, хотя все три ночи в сентябре, а Exely эти даты по
 * тарифу «2+1» продаёт. Гость видел «не подходит» на то, что движок брони ему
 * тут же и оформил бы.
 *
 * Три ночи от заезда d кончаются ночью d+2, значит заезд — не позже срока
 * минус два дня и в один из дней схемы.
 */
export function promoLastCheckin(): string {
  const last = promoLastDay();
  if (!last) return "";
  let d = shiftDays(last, -2);
  for (let i = 0; i < 7; i += 1, d = shiftDays(d, -1)) {
    if (ARRIVAL_DAYS.has(day(d))) return d;
  }
  return "";
}

/**
 * Акцию ещё можно забронировать: впереди остался хотя бы один заезд.
 *
 * Не то же, что promoActive. До 30.09 акция формально действует, но с
 * 29-го под неё не подходит ни одна дата — и карточка на первом экране
 * рекламировала бы то, что форма ниже не даст выбрать.
 */
export function promoBookable(today = todayTashkent()): boolean {
  const last = promoLastCheckin();
  return Boolean(last) && today <= last;
}

/**
 * Попадает ли отрезок под условия акции: одна из схем и последняя ночь — в
 * пределах срока.
 */
export function rangeQualifies(checkin: string, checkout: string, today = todayTashkent()): boolean {
  if (!promoActive(today)) return false;
  if (!checkin || !checkout) return false;
  // Последняя ночь — ночь перед выездом.
  if (shiftDays(checkout, -1) > promoLastDay()) return false;
  return matchesPattern(checkin, checkout);
}

export type PromoHint =
  /** Выбрано две ночи, третья попадает под акцию — предлагаем продлить. */
  | { kind: "offer-third"; extendTo: string }
  /** Выбрано три ночи по акции — третья бесплатно. */
  | { kind: "third-free" }
  /**
   * Дни недели те, что нужно, но даты выходят за срок акции.
   *
   * Отдельно от «explain»: там объясняются схемы, а гость, выбравший ровно
   * Пн→Чт в последнюю неделю, увидел бы список схем с Пн→Чт внутри и не понял
   * бы, почему ему отказали. Причина — срок, и назвать нужно именно его.
   */
  | { kind: "too-late"; lastCheckin: string; until: string }
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
  // Заезд уже после конца акции — объяснять её схемы значит звать гостя
  // подгонять октябрьские даты под предложение, которого в октябре нет.
  if (checkin > promoLastDay()) return null;
  // Заезд позже последнего возможного (29–30.09) — никакая схема уже не
  // сработает, и список схем гостю ничего не даст: причина в сроке.
  if (checkin > promoLastCheckin()) {
    return { kind: "too-late", lastCheckin: promoLastCheckin(), until: promoLastDay() };
  }
  if (nights === 3 && rangeQualifies(checkin, checkout, today)) return { kind: "third-free" };
  if (nights === 2) {
    const extended = nextDay(checkout);
    if (rangeQualifies(checkin, extended, today)) return { kind: "offer-third", extendTo: extended };
  }
  // Схема верная, подвёл только срок — так и говорим.
  const asThree = nights === 2 ? nextDay(checkout) : nights === 3 ? checkout : "";
  if (asThree && matchesPattern(checkin, asThree)) {
    return { kind: "too-late", lastCheckin: promoLastCheckin(), until: promoLastDay() };
  }
  // Одна-три ночи выбраны, но условия не сошлись — объясняем какие нужны.
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
