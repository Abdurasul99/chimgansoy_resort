import { cache } from "react";
import { services, type Service } from "@/content/services";
import { readOverrides } from "@/lib/site-overrides";
import type { OverrideData } from "@/lib/site-overrides";

/**
 * The service list the site shows, with the operator's edits applied.
 *
 * Three things the operator can do, and the reason each is shaped this way:
 *
 *  • HIDE a service that ships in the code. Not delete — the copy, photographs
 *    and page stay in the repo, so a service that comes back in spring is one
 *    switch, not a rewrite. A hidden service disappears from the grid AND its
 *    own page 404s, because a card that vanishes while its URL still sells the
 *    thing is worse than either state alone.
 *
 *  • ADD a service of their own. Kept in a separate array rather than merged
 *    into the code's list so that `services.ts` remains readable as "what we
 *    built" and the store remains readable as "what the operator added".
 *    A custom service has no photo set and no localisation: the operator types
 *    one title and one description, and they render on all three locales.
 *    Pretending otherwise would mean asking them to write everything three
 *    times, which nobody does — they would paste Russian into all three.
 *
 *  • Attach a PRICE NOTE to any card, their own or the code's. This is a free
 *    line of text, not a number in the price catalogue: "от 150 000 сум",
 *    "по запросу", "включено в проживание" are all things they need to be able
 *    to write, and none of them is arithmetic.
 */

export type LiveService = {
  slug: string;
  /** Present for services that ship in the code; absent for operator ones. */
  base?: Service;
  /** Operator's own copy — only set for custom services. */
  custom?: { title: string; description: string; image?: string };
  priceNote?: string;
  hidden: boolean;
  /** true for a service the operator created, false for one in the repo. */
  isCustom: boolean;
};

/** Everything, hidden included — what the admin screen lists. */
export function resolveServices(data: OverrideData): LiveService[] {
  const fromCode: LiveService[] = services.map((s) => ({
    slug: s.slug,
    base: s,
    priceNote: data.services[s.slug]?.priceNote || undefined,
    hidden: Boolean(data.services[s.slug]?.hidden),
    isCustom: false,
  }));

  const fromOperator: LiveService[] = data.customServices
    // A custom service that collides with a code slug would make the grid
    // render two cards under one URL. The code wins; the admin refuses to
    // create the collision in the first place, this is the second line.
    .filter((c) => !services.some((s) => s.slug === c.slug))
    .map((c) => ({
      slug: c.slug,
      custom: { title: c.title, description: c.description, image: c.image },
      priceNote: c.priceNote || undefined,
      hidden: Boolean(c.hidden),
      isCustom: true,
    }));

  return [...fromCode, ...fromOperator];
}

/** What a guest sees: hidden ones dropped. */
export function visibleServices(data: OverrideData): LiveService[] {
  return resolveServices(data).filter((s) => !s.hidden);
}

/** Request-scoped, cached: the public grid and a service page share one read. */
export const getServices = cache(async (): Promise<LiveService[]> => {
  return visibleServices(await readOverrides());
});

/** One service by slug, or null when it does not exist or is switched off. */
export const getService = cache(async (slug: string): Promise<LiveService | null> => {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
});
