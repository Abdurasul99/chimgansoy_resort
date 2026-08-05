import { unstable_cache } from "next/cache";
import { checkAvailability } from "@/lib/exely";

/**
 * The "от …" price on a room card, read live from the booking engine.
 *
 * The operator asked for a price on the cards. It is deliberately NOT written
 * into content/rooms.ts: the number lives in Exely, the operator changes it
 * there, and a copy in this repo would be a second source of truth that goes
 * quietly wrong the first time they raise a rate. rooms.ts keeps
 * "Цена при бронировании" as the fallback for exactly the case where the engine
 * cannot be reached.
 *
 * Probing several dates is not optional. Measured on 2026-08-05, the next ten
 * days came back with NO offers at all — sold out or not yet loaded — and a
 * single probe would have concluded there is no price. Three dates spread over
 * a month find one. (The tariff itself turned out to be flat: 1 500 000 for the
 * A-frame and 3 000 000 for the chalet on every date that had availability, with
 * no weekday/weekend split. That is a fact about today's rate plan, not
 * something to rely on — hence still a minimum over several probes.)
 */

/** Exely's room-type names, as returned by checkAvailability, mapped to slugs. */
const SLUG_BY_EXELY_NAME: Record<string, string> = {
  "Глэмпинг A-frame": "glamping",
  Шале: "cottage",
};

/** Days ahead to probe. Spread so a booked-out fortnight cannot hide the rate. */
const PROBE_OFFSETS = [14, 30, 60];

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function fetchPrices(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};

  const results = await Promise.all(
    PROBE_OFFSETS.map((off) =>
      checkAvailability({ checkin: isoPlusDays(off), adults: 2 }).catch(() => ({ ok: false as const, error: "exely_failed" as const })),
    ),
  );

  for (const r of results) {
    if (!r.ok) continue;
    for (const option of r.options) {
      const slug = SLUG_BY_EXELY_NAME[option.name];
      if (!slug || !(option.price > 0)) continue;
      if (out[slug] === undefined || option.price < out[slug]) out[slug] = option.price;
    }
  }

  return out;
}

/**
 * Cached for six hours.
 *
 * Three outbound requests are far too many to make while a guest waits for the
 * homepage, and a nightly rate does not move on a scale where six hours matters.
 * This is `unstable_cache` rather than a route-segment `revalidate`, because the
 * latter would flip all 70-odd prerendered pages from static to ISR — a large
 * change to the whole site to put one chip on two cards.
 */
export const getRoomPrices = unstable_cache(fetchPrices, ["room-prices-v1"], {
  revalidate: 60 * 60 * 6,
  tags: ["room-prices"],
});

/** 1500000 -> "1 500 000" with non-breaking spaces, matching lib/tariff money(). */
function group(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * The chip text, or null when the engine gave nothing — in which case the
 * caller falls back to room.priceFrom rather than showing an empty chip.
 *
 * "за ночь" is not decoration: the figure is a one-night rate for two adults,
 * and a bare "от 1 500 000 сум" beside the capacity chip reads as the price of
 * the whole stay. Two adults is also exactly the glamping base occupancy, so
 * the chip and the engine now describe the same party.
 */
export function priceChip(price: number | undefined, locale: string): string | null {
  if (!price || price <= 0) return null;
  const n = group(price);
  if (locale === "uz") return `${n} so'mdan / kecha`;
  if (locale === "en") return `from ${n} UZS / night`;
  return `от ${n} сум / ночь`;
}
