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

      {/* Brand-styled cream cards — image on top, cream info block with a gold
          category chip and a forest-green link. Matches LeisureShowcase / rooms. */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleServices.map((service, index) => {
          const image = resortImages[service.image];
          const catLabel = serviceCategories.find((c) => c.id === service.category)?.label;

          return (
            <a
              key={service.slug}
              href={localizePath(locale, `/services/${service.slug}`)}
              className="motion-reveal group flex flex-col overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              data-delay={String((index % 3) * 80)}
              aria-label={text(service.title, locale)}
            >
              {/* Photo + gold category chip */}
              <div className="relative h-56 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.3s] ease-out group-hover:scale-[1.05]"
                  style={imageStyle(image)}
                  role="img"
                  aria-label={text(image.alt, locale)}
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(31,42,51,0.30)_0%,transparent_55%)]" />
                {catLabel ? (
                  <span className="absolute left-4 top-4 rounded-full bg-[var(--sun)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--on-accent)] shadow-[var(--shadow-float)]">
                    {text(catLabel, locale)}
                  </span>
                ) : null}
              </div>

              {/* Cream info block */}
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="font-serif text-2xl font-bold leading-tight text-[var(--ink)]">{text(service.title, locale)}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{text(service.shortDescription, locale)}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--forest-dark)] transition-colors group-hover:text-[var(--accent-strong)]">
                  {dict.details}
                  <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
