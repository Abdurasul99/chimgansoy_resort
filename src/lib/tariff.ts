/**
 * Day-band arithmetic shared by the request forms and the server actions.
 *
 * Deliberately free of server-only imports so a client component can use it:
 * the running total a guest watches and the total the operator is sent have to
 * come out of the same rule, or the form quotes one price and the Telegram
 * message another.
 */

/**
 * Friday, Saturday and Sunday carry the weekend tariff — the operator's posters
 * read ПЯТНИЦА–ВОСКРЕСЕНЬЕ for both the pool and the topchan.
 *
 * Public holidays are weekend-priced too, but there is no holiday calendar in
 * the codebase, so a weekday holiday quotes low and the administrator corrects
 * it when confirming.
 */
export function isWeekendISO(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
  return day === 0 || day === 5 || day === 6;
}

/** 150000 -> "150 000" */
export function money(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
