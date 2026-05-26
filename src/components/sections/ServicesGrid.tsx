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
        <div className="mb-5 sm:mb-8 flex flex-wrap gap-1.5 sm:gap-2">
          {serviceCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`btn-press rounded-full border px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                filter === category.id
                  ? "border-[var(--mountain)] bg-[var(--mountain)] text-white"
                  : "border-[color:var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--mountain)]/40 hover:text-[var(--ink)]"
              }`}
              onClick={() => setFilter(category.id)}
            >
              {text(category.label, locale)}
            </button>
          ))}
        </div>
      ) : null}

      {/* Editorial grid: every 3rd card is wide */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleServices.map((service, index) => {
          const image = resortImages[service.image];
          const isWide = (index + 1) % 3 === 0;

          return (
            <article
              key={service.slug}
              className={`group relative overflow-hidden rounded-3xl bg-[var(--ink)] motion-reveal ${
                isWide ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
              data-delay={String((index % 3) * 80)}
            >
              {/* Image */}
              <div
                className={`relative overflow-hidden bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05] ${
                  isWide ? "aspect-[3/2]" : "aspect-[4/3]"
                }`}
                style={imageStyle(image)}
                role="img"
                aria-label={text(image.alt, locale)}
              >
                {/* Gradient */}
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.92)_0%,rgba(12,18,14,0.30)_55%,rgba(12,18,14,0)_100%)]" />

                {/* Category badge */}
                <div className="absolute left-4 top-4">
                  <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-sm">
                    {text(service.bestFor, locale)}
                  </span>
                </div>

                {/* Hover overlay CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="rounded-full border border-white/30 bg-white/14 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                    {dict.details}
                  </span>
                </div>

                {/* Title at bottom */}
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-serif text-2xl font-bold leading-tight text-white">
                    {text(service.title, locale)}
                  </h3>
                </div>
              </div>

              {/* Info */}
              <div className="bg-[var(--paper)] px-5 py-4">
                <p className="text-sm leading-6 text-[var(--muted)]">{text(service.shortDescription, locale)}</p>
                <ButtonLink
                  href={localizePath(locale, `/services/${service.slug}`)}
                  variant="ghost"
                  className="btn-press mt-4"
                >
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
