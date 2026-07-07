"use client";

import { useMemo, useState } from "react";
import { resortImages } from "@/content/images";
import { roomCategories, rooms, EXELY_ROOM_TYPE, type RoomCategory } from "@/content/rooms";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { list, text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

type RoomCatalogProps = {
  locale: Locale;
  limit?: number;
};

type Filter = "all" | RoomCategory;

export function RoomCatalog({ locale, limit }: RoomCatalogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const dict = dictionaries[locale];
  const visibleRooms = useMemo(() => {
    const filtered = filter === "all" ? rooms : rooms.filter((room) => room.category === filter);
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [filter, limit]);

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-5 sm:mb-8 flex flex-wrap gap-1.5 sm:gap-2">
        {roomCategories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={`btn-press relative rounded-full border px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ${
              filter === category.id
                ? "border-[var(--mountain)] bg-[var(--mountain)] text-white"
                : "border-[color:var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--mountain)]/40 hover:text-[var(--ink)]"
            }`}
            onClick={() => setFilter(category.id as Filter)}
          >
            {text(category.label, locale)}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-2">
        {visibleRooms.map((room) => {
          const image = resortImages[room.image];

          return (
            <article
              key={room.slug}
              className="editorial-card group relative overflow-hidden rounded-3xl bg-[var(--ink)] shadow-[var(--shadow-card)]"
            >
              {/* Full-bleed image with paper-overlay reveal */}
              <div
                className="img-reveal-wrapper relative h-[65vw] max-h-[500px] min-h-[260px] sm:min-h-[320px] bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                style={imageStyle(image)}
                role="img"
                aria-label={text(image.alt, locale)}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,1.0)_0%,rgba(12,18,14,0.55)_45%,rgba(12,18,14,0.08)_100%)]" />

                {/* Floating price badge */}
                <div className="glass-badge absolute right-5 top-5 rounded-full px-4 py-1.5 backdrop-blur-sm">
                  <p className="text-xs font-bold text-white/80">{text(room.priceFrom, locale)}</p>
                </div>

                {/* Room title overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{text(room.eyebrow, locale)}</p>
                  <h3 className="mt-2 font-serif text-4xl font-bold leading-tight sm:text-5xl">{text(room.title, locale)}</h3>
                </div>
              </div>

              {/* Info block */}
              <div className="room-info-block bg-[var(--paper)] px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                <p className="text-sm leading-7 text-[var(--muted)]">{text(room.shortDescription, locale)}</p>

                {/* Capacity + size pills */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--mist)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
                    {text(room.capacity, locale)}
                  </span>
                  <span className="rounded-full bg-[var(--mist)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
                    {text(room.size, locale)}
                  </span>
                </div>

                {/* Amenities */}
                <ul className="mt-5 grid gap-1.5 text-sm text-[var(--muted)] sm:grid-cols-2">
                  {list(room.amenities, locale).slice(0, 4).map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-[var(--green)]" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTAs */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={localizePath(locale, `/nomera/${room.slug}`)} variant="secondary" className="btn-press">
                    {dict.details}
                  </ButtonLink>
                  <ButtonLink
                    href={localizePath(locale, `/bron?room-type=${EXELY_ROOM_TYPE[room.slug] ?? ""}`)}
                    variant="ghost"
                    reload
                    className="btn-press"
                  >
                    {dict.book}
                  </ButtonLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
