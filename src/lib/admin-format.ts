import type { RequestService } from "@/lib/requests-store";

/**
 * Formatting shared by every admin screen.
 *
 * Russian only, and deliberately so: /admin has one user and the public site's
 * three-locale machinery would be ceremony with nobody to serve.
 */

/** 1500000 -> "1 500 000", non-breaking, matching the public site. */
export function money(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export const SERVICE_LABEL: Record<RequestService, string> = {
  pool: "Бассейн",
  topchan: "Топчан",
  tubing: "Тюбинг",
  booking: "Проживание",
  inquiry: "Вопрос",
};

/**
 * Why a service shows no money.
 *
 * Accommodation is priced by the PMS after the operator confirms, and an
 * inquiry has no product at all — so a zero in their revenue column is correct
 * and permanent, not a gap waiting to be filled. Saying so on the screen stops
 * the obvious wrong conclusion, which is that the tubing hill outsells the
 * chalets.
 */
export const NO_REVENUE_REASON: Partial<Record<RequestService, string>> = {
  booking: "цену выставляет система бронирования после подтверждения",
  inquiry: "это вопрос, а не заказ",
};

/** Asia/Tashkent is UTC+5 year-round. */
export function todayTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

export function isoPlusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-08-05" -> "5 августа" (year appended only when it is not this one). */
export function humanDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  const thisYear = todayTashkent().slice(0, 4);
  const tail = String(y) === thisYear ? "" : ` ${y}`;
  return `${d} ${months[m - 1]}${tail}`;
}

/** ISO with an offset -> "5 авг, 14:32". */
export function humanDateTime(iso: string): string {
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  return `${humanDate(date)}, ${time}`;
}

/** How many people the request is for, as a single readable phrase. */
export function guestsPhrase(r: { adults?: number; kids?: number; toddlers?: number }): string {
  const bits: string[] = [];
  if (r.adults) bits.push(`${r.adults} взр`);
  if (r.kids) bits.push(`${r.kids} дет`);
  if (r.toddlers) bits.push(`${r.toddlers} малыш`);
  return bits.join(" · ") || "—";
}
