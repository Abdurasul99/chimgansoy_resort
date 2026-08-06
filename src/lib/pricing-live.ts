import { cache } from "react";
import { resolvePricing, type LivePricing } from "@/lib/pricing-resolve";
import { readOverrides, type OverrideData } from "@/lib/site-overrides";

export type { LivePricing } from "@/lib/pricing-resolve";
export { resolvePricing, isWeekendBand } from "@/lib/pricing-resolve";

/**
 * Resolved pricing for this request.
 *
 * Split from pricing-resolve.ts because THIS half reaches Blob: the request
 * forms are client components and must import the pure resolver, or the whole
 * @vercel/blob client ends up in the browser bundle.
 *
 * cache() deduplicates within one render — a page that shows the tariff in
 * three places reads Blob once. Across requests readOverrides() has its own
 * tagged cache, invalidated when the operator saves.
 */
export const getPricing = cache(async (): Promise<LivePricing> => {
  const overrides: OverrideData = await readOverrides();
  return resolvePricing(overrides.prices);
});
