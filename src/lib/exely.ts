/**
 * Live availability + prices from the Exely booking engine (hotel 514200).
 *
 * Exely does not expose an official API — it only ships an embeddable widget.
 * This calls the same public JSON endpoint the widget itself uses
 * (uz-ibe.hopenapi.com), server-side, to read live rooms + rates for given
 * dates. It's an unofficial integration: if Exely changes their widget's
 * backend, the shape here may need updating.
 */

const AVAIL_URL =
  "https://uz-ibe.hopenapi.com/ApiWebDistribution/BookingForm/hotel_availability";
const HOTEL_CODE = "514200";

// Exely room-type code -> human name (matches the site's rooms).
const ROOM_NAMES: Record<string, string> = {
  "5075760": "Глэмпинг A-frame",
  "5075761": "Шале",
  "5075762": "Топчан (дневной отдых)",
  "5076232": "Бассейн",
};

export type AvailOption = { name: string; price: number; freeCancellation: boolean };
export type AvailResult =
  | { ok: true; checkin: string; checkout: string; adults: number; currency: "UZS"; options: AvailOption[] }
  | { ok: false; error: "bad_dates" | "exely_failed" };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function addOneDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function checkAvailability(input: {
  checkin?: string;
  checkout?: string;
  adults?: number;
}): Promise<AvailResult> {
  const checkin = (input.checkin ?? "").trim();
  if (!ISO.test(checkin)) return { ok: false, error: "bad_dates" };
  const checkout = ISO.test(input.checkout ?? "") ? (input.checkout as string) : addOneDay(checkin);
  const adults = Math.min(Math.max(Math.round(input.adults ?? 2) || 2, 1), 8);

  const p = new URLSearchParams();
  p.set("currency", "UZS");
  p.set("include_all_placements", "false");
  p.set("include_promo_restricted", "true");
  p.set("include_rates", "true");
  p.set("include_transfers", "false");
  p.set("language", "ru-ru");
  p.set("criterions[0].adults", String(adults));
  p.set("criterions[0].dates", `${checkin};${checkout}`);
  p.set("criterions[0].hotels[0].code", HOTEL_CODE);

  try {
    const res = await fetch(`${AVAIL_URL}?${p.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { ok: false, error: "exely_failed" };
    const data = (await res.json()) as { room_stays?: unknown };
    const stays = Array.isArray(data.room_stays) ? data.room_stays : [];

    // Collapse to one entry per room type, keeping the cheapest rate.
    const byName = new Map<string, AvailOption>();
    for (const rs of stays as Array<Record<string, unknown>>) {
      const roomTypes = (rs.room_types as Array<Record<string, unknown>> | undefined) ?? [];
      const code = roomTypes[0]?.code as string | undefined;
      if (!code) continue;
      const name = ROOM_NAMES[code] ?? "Номер";
      const placements = (roomTypes[0]?.placements as Array<{ price_after_tax?: number }> | undefined) ?? [];
      const price = placements.reduce((s, pl) => s + (pl.price_after_tax || 0), 0);
      if (price <= 0) continue;
      const ratePlans = (rs.rate_plans as Array<Record<string, unknown>> | undefined) ?? [];
      const cpg = ratePlans[0]?.cancel_penalty_group as { free_cancellation?: boolean } | undefined;
      const freeCancellation = !!cpg?.free_cancellation;
      const prev = byName.get(name);
      if (!prev || price < prev.price) byName.set(name, { name, price, freeCancellation });
    }

    return { ok: true, checkin, checkout, adults, currency: "UZS", options: [...byName.values()] };
  } catch {
    return { ok: false, error: "exely_failed" };
  }
}
