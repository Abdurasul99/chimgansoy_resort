"use client";

import { useMemo, useState } from "react";
import { resortImages } from "@/content/images";
import { serviceCategories, services } from "@/content/services";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";

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

      {/* Editorial photo cards — full-bleed real photography, the whole card
          is the link. First card spans 2 columns for an asymmetric rhythm. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleServices.map((service, index) => {
          const image = resortImages[service.image];
          const isFeature = index === 0;

          return (
            <a
              key={service.slug}
              href={localizePath(locale, `/services/${service.slug}`)}
              className={`service-card group motion-reveal ${
                isFeature ? "sm:col-span-2 lg:row-span-2" : ""
              } ${isFeature ? "aspect-[3/2] sm:aspect-auto sm:min-h-[480px]" : "aspect-[4/5] sm:aspect-[3/4]"}`}
              data-delay={String((index % 3) * 80)}
              aria-label={text(service.title, locale)}
            >
              {/* Photo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]"
                style={imageStyle(image)}
                role="img"
                aria-label={text(image.alt, locale)}
              />
              {/* Cinematic gradient */}
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.88)_0%,rgba(12,18,14,0.32)_45%,rgba(12,18,14,0.04)_75%)] transition-opacity duration-500 group-hover:opacity-90" />

              {/* Big editorial index number */}
              <span
                aria-hidden="true"
                className="absolute right-5 top-3 font-serif text-[clamp(2.6rem,5vw,4rem)] font-bold leading-none text-white/14 transition-colors duration-500 group-hover:text-white/30"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Category badge */}
              <span className="absolute left-4 top-4 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white/75 backdrop-blur-sm">
                {text(service.bestFor, locale)}
              </span>

              {/* Bottom copy block */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h3 className={`font-serif font-bold leading-tight text-white ${isFeature ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
                  {text(service.title, locale)}
                </h3>
                {/* Description slides up on hover; always visible on touch */}
                <p className="service-card__desc mt-2 max-w-md text-sm leading-6 text-white/75">
                  {text(service.shortDescription, locale)}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sun)]">
                  {dict.details}
                  <svg
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
