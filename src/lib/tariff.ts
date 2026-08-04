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

/**
 * "спуск / спуска / спусков" for a tubing package of n rides.
 *
 * The operator corrected the wording on 2026-08-04: a run down the tubing hill
 * is a "спуск", not a "прокатка". The count is interpolated in half a dozen
 * places — the room cards, the hero, the request form, the Telegram message,
 * the e-mail copy and both AI briefings — so the form is computed rather than
 * written out. Today every package is 2 or 4 and a hardcoded "спуска" would
 * read correctly; the day someone adds a 5-ride package it would read
 * "5 спуска", which is exactly the kind of thing that gets reported back.
 *
 * Standard Russian rule, including the 11–14 exception that catches naive
 * implementations: 11 is "спусков", not "спуск".
 */
export function ridesRu(n: number): string {
  const abs = Math.abs(n) % 100;
  if (abs >= 11 && abs <= 14) return "спусков";
  switch (abs % 10) {
    case 1:
      return "спуск";
    case 2:
    case 3:
    case 4:
      return "спуска";
    default:
      return "спусков";
  }
}
