import {
  dayUse,
  depositPricing,
  extraGuestPricing,
  parkingPricing,
  poolPricing,
  priceList,
  topchanPricing,
  touristTax,
  tubingPricing,
} from "@/content/pricing";

/**
 * The prices the site actually shows, with the operator's edits applied.
 *
 * Until 2026-08-06 the admin price editor wrote to Blob and nothing read it
 * back: every public surface imported the constants from content/pricing.ts
 * directly, so an operator could change the topchan rate, watch the admin page
 * confirm the new number, and find the homepage still quoting the old one. The
 * editor was a mirror.
 *
 * This module is the missing half. `resolvePricing` is a pure function of
 * (defaults, patch) so it can be unit-tested without Blob, and `getPricing` is
 * the request-scoped async wrapper the pages call.
 *
 * WHAT IS NOT HERE, ON PURPOSE
 * ----------------------------
 * Accommodation rates (глэмпинг, шале). They live in Exely, the operator edits
 * them there, and the site reads them live through lib/room-price.ts. Copying
 * them into this store would create a second source of truth for the same
 * number — which is the exact failure this module exists to fix, just pointed
 * the other way. The admin price page says so in as many words.
 */

export type LivePricing = {
  pool: {
    adult: { weekday: number; weekend: number };
    child: { weekday: number; weekend: number };
    extras: { towel: number; bungalow4: number; bungalow10: number };
  };
  topchan: { weekday: number; weekend: number };
  /** Одна ставка всю неделю — у парковки нет тарифных полос. */
  parking: number;
  tubing: { packages: { rides: number; price: number }[] };
  dayUse: { key: string; weekday: number; weekend: number }[];
  extras: { key: string; weekday: number; weekend: number }[];
  extraGuest: { adult: number; child: number; guestVisitCottage: number };
  touristTax: { resident: number; nonResident: number };
  deposit: number;
};

/** A patched value, or the code's own — anything invalid falls back silently. */
function pick(patch: Record<string, number>, key: string, fallback: number): number {
  const v = patch[key];
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
}

/**
 * Layer a sparse patch over the code's defaults.
 *
 * Pure and total: an empty patch returns exactly the constants, and a patch
 * full of nonsense returns exactly the constants. Nothing here can throw, so a
 * bad document in Blob degrades to "the site renders what it shipped with".
 */
export function resolvePricing(patch: Record<string, number> = {}): LivePricing {
  return {
    pool: {
      adult: {
        weekday: pick(patch, "pool.adult.weekday", poolPricing.adult.weekday),
        weekend: pick(patch, "pool.adult.weekend", poolPricing.adult.weekend),
      },
      child: {
        weekday: pick(patch, "pool.child.weekday", poolPricing.child.weekday),
        weekend: pick(patch, "pool.child.weekend", poolPricing.child.weekend),
      },
      extras: {
        towel: pick(patch, "pool.extra.towel", poolPricing.extras.towel),
        bungalow4: pick(patch, "pool.extra.bungalow4", poolPricing.extras.bungalow4),
        bungalow10: pick(patch, "pool.extra.bungalow10", poolPricing.extras.bungalow10),
      },
    },
    topchan: {
      weekday: pick(patch, "topchan.rent.weekday", topchanPricing.rent.weekday),
      weekend: pick(patch, "topchan.rent.weekend", topchanPricing.rent.weekend),
    },
    parking: pick(patch, "parking.flat", parkingPricing.flat),
    // The LIST of packages is code, only the price is editable — the request
    // form renders packages by index and the server action trusts that index.
    tubing: {
      packages: tubingPricing.packages.map((p) => ({
        rides: p.rides,
        price: pick(patch, `tubing.package.${p.rides}`, p.price),
      })),
    },
    dayUse: dayUse.map((i) => ({
      key: i.key,
      weekday: pick(patch, `dayUse.${i.key}.weekday`, i.weekday),
      weekend: pick(patch, `dayUse.${i.key}.weekend`, i.weekend),
    })),
    extras: priceList.map((i) => ({
      key: i.key,
      weekday: pick(patch, `extra.${i.key}.weekday`, i.weekday),
      weekend: pick(patch, `extra.${i.key}.weekend`, i.weekend),
    })),
    extraGuest: {
      adult: pick(patch, "extraGuest.adult", extraGuestPricing.adult),
      child: pick(patch, "extraGuest.child", extraGuestPricing.child),
      guestVisitCottage: pick(
        patch,
        "extraGuest.guestVisitCottage",
        extraGuestPricing.guestVisitCottage,
      ),
    },
    touristTax: {
      resident: pick(patch, "touristTax.resident", touristTax.resident),
      nonResident: pick(patch, "touristTax.nonResident", touristTax.nonResident),
    },
    deposit: pick(patch, "deposit.perCabin", depositPricing.perCabin),
  };
}

/** Weekend banding, shared by every day product: Friday counts as a weekend. */
export function isWeekendBand(iso: string): boolean {
  const day = new Date(iso + "T00:00:00Z").getUTCDay();
  return day === 5 || day === 6 || day === 0;
}
