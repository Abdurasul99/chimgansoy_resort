/**
 * Форматирование чисел партнёрских страниц: один вид денег на лендинге, в
 * прайсе, калькуляторе и меморандуме. Только отображение — в расчёт идут
 * неокруглённые значения (economics.ts, правило 7).
 */

const NBSP = " ";

function grouped(n: number, digits = 0): string {
  const fixed = Math.abs(n).toFixed(digits);
  const [int, frac] = fixed.split(".");
  const body = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return (n < 0 ? "−" : "") + body + (frac ? "," + frac : "");
}

/** 151 200 · 1 080 000 */
export function fmtInt(n: number): string {
  return grouped(Math.round(n));
}

/** 1,04 млрд сум · 364,1 млн сум · 3 780 сум */
export function fmtSum(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `${grouped(n / 1e9, 2)}${NBSP}млрд сум`;
  if (a >= 1e6) return `${grouped(n / 1e6, 1)}${NBSP}млн сум`;
  return `${grouped(Math.round(n))}${NBSP}сум`;
}

/** Цена прайса в миллионах: 1 037,5 млн сум */
export function fmtMln(n: number): string {
  const m = n / 1e6;
  return `${grouped(m, Number.isInteger(m) ? 0 : 1)}${NBSP}млн сум`;
}

/** −44 % · 533 % (доля → проценты) */
export function fmtPct(share: number | null, digits = 0): string {
  if (share === null || !Number.isFinite(share)) return "—";
  return `${grouped(share * 100, digits)}${NBSP}%`;
}

/** ×1,24 */
export function fmtX(n: number | null, digits = 2): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `×${grouped(n, digits)}`;
}

/** 1 080 тыс · 2,1 млн — для показов и контактов */
export function fmtBig(n: number): string {
  if (n >= 1e6) return `${grouped(n / 1e6, 1)}${NBSP}млн`;
  if (n >= 1e4) return `${grouped(n / 1e3, 0)}${NBSP}тыс`;
  return fmtInt(n);
}

/** 200–250 тыс. */
export function fmtThousandsRange(min: number, max: number): string {
  return `${Math.round(min / 1000)}–${Math.round(max / 1000)}${NBSP}тыс.`;
}

/** Дробное число с запятой: 5,5 */
export function fmtNum(n: number, digits = 1): string {
  return grouped(n, digits);
}
