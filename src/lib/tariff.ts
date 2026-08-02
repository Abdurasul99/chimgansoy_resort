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

/**
 * 150000 -> "150 000", with a NON-BREAKING space between the groups.
 *
 * A plain space is a line-break opportunity, and the price columns in the
 * tariff tables are narrow enough on a phone that the browser takes it: at
 * 320–412 px the figures wrapped as "100" / "000", so a guest read the weekend
 * entry fee as 100 and the topchan as 300. The tables are overflow-hidden, so
 * there was not even a scrollbar to hint otherwise.
 */
export function money(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
