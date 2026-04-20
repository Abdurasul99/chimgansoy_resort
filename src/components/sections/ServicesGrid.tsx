"use client";

import { useMemo, useState } from "react";
import { resortImages } from "@/content/images";
import { serviceCategories, services } from "@/content/services";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";

type ServicesGridProps = {
  locale: Locale;
  limit?: number;
  showFilters?: boolean;
  slugs?: string[];
};

export function ServicesGrid({ locale, limit, showFilters = true, slugs }: ServicesGridProps) {
  const [filter, setFilter] = useState("all");
  const dict = dictionaries[locale];
  const visibleServices = useMemo(() => {
    const source = slugs ? services.filter((service) => slugs.includes(service.slug)) : services;
    const filtered = filter === "all" ? source : source.filter((service) => service.category === filter);
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [filter, limit, slugs]);

  return (
    <div>
      {showFilters ? (
        <div className="mb-7 flex flex-wrap gap-2">
          {serviceCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`rounded-[6px] border px-4 py-2 text-sm font-semibold transition ${
                filter === category.id
                  ? "border-[var(--green)] bg-[var(--green)] text-white"
                  : "border-[color:var(--line)] bg-white text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
              }`}
              onClick={() => setFilter(category.id)}
            >
              {text(category.label, locale)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleServices.map((service) => {
          const image = resortImages[service.image];

          return (
            <article key={service.slug} className="group overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-white shadow-[0_14px_54px_rgba(21,29,24,0.07)]">
              <div
                className="relative aspect-[5/4] overflow-hidden bg-cover transition duration-700 group-hover:scale-[1.02]"
                style={imageStyle(image)}
                role="img"
                aria-label={text(image.alt, locale)}
              >
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.66),rgba(12,18,14,0.02)_62%)]" />
                <p className="absolute bottom-4 left-4 right-4 rounded-[6px] border border-white/16 bg-white/12 px-3 py-2 text-xs font-bold uppercase text-white/78 backdrop-blur">
                  {text(service.bestFor, locale)}
                </p>
              </div>
              <div className="p-5">
                <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)]">{text(service.title, locale)}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text(service.shortDescription, locale)}</p>
                <ButtonLink href={localizePath(locale, `/services/${service.slug}`)} variant="ghost" className="mt-5">
                  {dict.details}
                </ButtonLink>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
