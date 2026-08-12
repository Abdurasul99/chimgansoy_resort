import { cache } from "react";
import { services, type Service } from "@/content/services";
import { readOverrides } from "@/lib/site-overrides";
import type { FormField, OverrideData, ServiceCategory } from "@/lib/site-overrides";

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
  custom?: {
    title: string;
    description: string;
    shortDescription?: string;
    image?: string;
    category?: ServiceCategory;
    /** Поля формы заявки, если оператор её собрал. */
    formFields?: FormField[];
  };
  priceNote?: string;
  hidden: boolean;
  /** Показывать ли карточку на главной. */
  showOnHome: boolean;
  /** Место в общем порядке: чем меньше, тем выше. */
  order: number;
  /** true for a service the operator created, false for one in the repo. */
  isCustom: boolean;
};

/** Everything, hidden included — what the admin screen lists. */
export function resolveServices(data: OverrideData): LiveService[] {
  const fromCode: LiveService[] = services.map((s, i) => ({
    slug: s.slug,
    base: s,
    priceNote: data.services[s.slug]?.priceNote || undefined,
    hidden: Boolean(data.services[s.slug]?.hidden),
    // Услуга из кода по умолчанию претендует на главную: так было до того, как
    // переключатель появился, и молча снимать её оттуда деплой не должен.
    showOnHome: data.services[s.slug]?.showOnHome ?? true,
    order: data.services[s.slug]?.order ?? i,
    isCustom: false,
  }));

  const fromOperator: LiveService[] = data.customServices
    // A custom service that collides with a code slug would make the grid
    // render two cards under one URL. The code wins; the admin refuses to
    // create the collision in the first place, this is the second line.
    .filter((c) => !services.some((s) => s.slug === c.slug))
    .map((c, i) => ({
      slug: c.slug,
      custom: {
        title: c.title,
        description: c.description,
        shortDescription: c.shortDescription,
        image: c.image,
        category: c.category,
        formFields: c.formFields,
      },
      priceNote: c.priceNote || undefined,
      hidden: Boolean(c.hidden),
      // Своя услуга по умолчанию идёт в каталог, но не на главную: там три
      // места, и занимать одно из них без спроса оператора нельзя.
      showOnHome: c.showOnHome ?? false,
      order: c.order ?? services.length + i,
      isCustom: true,
    }));

  /**
   * Номер, введённый оператором, при совпадении бьёт порядок из кода.
   *
   * Без этого «поставить 0, чтобы услуга была первой» не работало: ноль сходился
   * с местом первой услуги в коде, и та оставалась впереди — оператор набирал
   * номер, сохранял и не видел никакой разницы. При равных номерах внутри одной
   * группы порядок остаётся тем, в котором услуги перечислены в коде.
   */
  const explicit = (s: LiveService) =>
    s.isCustom
      ? data.customServices.find((c) => c.slug === s.slug)?.order !== undefined
      : data.services[s.slug]?.order !== undefined;

  return [...fromCode, ...fromOperator]
    .map((s, i) => ({ s, i, first: explicit(s) ? 0 : 1 }))
    .sort((a, b) => a.s.order - b.s.order || a.first - b.first || a.i - b.i)
    .map(({ s }) => s);
}

/** What a guest sees: hidden ones dropped. */
export function visibleServices(data: OverrideData): LiveService[] {
  return resolveServices(data).filter((s) => !s.hidden);
}

/** Request-scoped, cached: the public grid and a service page share one read. */
export const getServices = cache(async (): Promise<LiveService[]> => {
  return visibleServices(await readOverrides());
});

/**
 * Slugs the operator switched off.
 *
 * For grids that render from the code's `services` list rather than from
 * `getServices()` — they need to know what to drop, and `getServices()` cannot
 * tell them: it has already dropped it.
 */
export const hiddenServiceSlugs = cache(async (): Promise<string[]> => {
  return resolveServices(await readOverrides())
    .filter((s) => s.hidden)
    .map((s) => s.slug);
});

/** One service by slug, or null when it does not exist or is switched off. */
export const getService = cache(async (slug: string): Promise<LiveService | null> => {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
});
